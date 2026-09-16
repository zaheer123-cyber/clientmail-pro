import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptSecret, encryptSecret } from '@/lib/encryption'
import { getWorkspaceForUser, publicEmailAccount, setDefaultAccount } from '@/lib/email-accounts'
import { testSmtpConnection } from '@/services/providers'

const accountSelect = { id: true, provider: true, email: true, name: true, status: true, isDefault: true, isActive: true, createdAt: true, updatedAt: true } as const
const smtpSchema = z.object({
  provider: z.literal('SMTP'), email: z.string().email(), name: z.string().trim().min(1).max(120),
  smtpHost: z.string().trim().min(1).max(255), smtpPort: z.number().int().min(1).max(65535),
  smtpUser: z.string().trim().min(1).max(255), smtpPassword: z.string().min(1).max(500),
  smtpSecurity: z.enum(['SSL', 'STARTTLS', 'NONE']).default('STARTTLS'), isDefault: z.boolean().default(false),
})

async function workspaceFromSession() {
  const session = await auth()
  if (!session?.user?.id) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const workspace = await getWorkspaceForUser(session.user.id)
  if (!workspace) return { response: NextResponse.json({ error: 'Workspace not found' }, { status: 404 }) }
  return { session, userId: session.user.id, workspace }
}

export async function GET() {
  const result = await workspaceFromSession()
  if ('response' in result) return result.response
  const accounts = await prisma.emailAccount.findMany({ where: { workspaceId: result.workspace.id }, select: accountSelect, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] })
  return NextResponse.json({ accounts: accounts.map(publicEmailAccount) })
}

export async function POST(request: NextRequest) {
  const result = await workspaceFromSession()
  if ('response' in result) return result.response
  try {
    const data = smtpSchema.parse(await request.json())
    const connection = await testSmtpConnection(data)
    if (!connection.success) return NextResponse.json({ error: connection.error || 'SMTP connection failed' }, { status: 422 })
    const account = await prisma.$transaction(async transaction => {
      const isDefault = data.isDefault || !(await transaction.emailAccount.count({ where: { workspaceId: result.workspace.id } }))
      if (isDefault) await transaction.emailAccount.updateMany({ where: { workspaceId: result.workspace.id }, data: { isDefault: false } })
      return transaction.emailAccount.create({ data: {
        workspaceId: result.workspace.id, userId: result.userId, provider: 'SMTP', email: data.email, name: data.name,
        smtpHost: data.smtpHost, smtpPort: data.smtpPort, smtpUser: data.smtpUser, smtpSecurity: data.smtpSecurity,
        encryptedSmtpPassword: encryptSecret(data.smtpPassword), status: 'CONNECTED', isActive: true, isDefault,
      }, select: accountSelect })
    })
    return NextResponse.json({ account: publicEmailAccount(account) }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 422 })
    if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) return NextResponse.json({ error: 'Server encryption is not configured' }, { status: 503 })
    return NextResponse.json({ error: 'Failed to add SMTP account' }, { status: 500 })
  }
}

const updateSchema = z.object({ id: z.string().min(1), action: z.enum(['default', 'disconnect', 'reconnect']), name: z.string().trim().min(1).max(120).optional() })

export async function PATCH(request: NextRequest) {
  const result = await workspaceFromSession()
  if ('response' in result) return result.response
  try {
    const data = updateSchema.parse(await request.json())
    const account = await prisma.emailAccount.findFirst({ where: { id: data.id, workspaceId: result.workspace.id } })
    if (!account) return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
    if (data.action === 'default') {
      const updated = await setDefaultAccount(result.workspace.id, data.id)
      return NextResponse.json({ account: updated && publicEmailAccount(updated) })
    }
    if (data.action === 'reconnect' && account.provider !== 'SMTP') return NextResponse.json({ error: 'Reconnect this account through its OAuth provider button' }, { status: 422 })
    if (data.action === 'reconnect' && account.provider === 'SMTP') {
      if (!account.encryptedSmtpPassword || !account.smtpHost || !account.smtpPort || !account.smtpUser) return NextResponse.json({ error: 'SMTP configuration is incomplete' }, { status: 422 })
      const connection = await testSmtpConnection({ smtpHost: account.smtpHost, smtpPort: account.smtpPort, smtpUser: account.smtpUser, smtpPassword: decryptSecret(account.encryptedSmtpPassword), smtpSecurity: (account.smtpSecurity as 'SSL' | 'STARTTLS' | 'NONE') || 'STARTTLS' })
      if (!connection.success) return NextResponse.json({ error: connection.error || 'SMTP connection failed' }, { status: 422 })
    }
    const updated = await prisma.emailAccount.update({ where: { id: data.id }, data: data.action === 'disconnect' ? { status: 'DISCONNECTED', isActive: false, isDefault: false } : { status: 'CONNECTED', isActive: true, ...(data.name ? { name: data.name } : {}) }, select: accountSelect })
    if (data.action === 'disconnect' && account.isDefault) {
      const replacement = await prisma.emailAccount.findFirst({ where: { workspaceId: result.workspace.id, isActive: true, id: { not: account.id } }, orderBy: { createdAt: 'asc' } })
      if (replacement) await setDefaultAccount(result.workspace.id, replacement.id)
    }
    return NextResponse.json({ account: publicEmailAccount(updated) })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 422 })
    return NextResponse.json({ error: 'Failed to update email account' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const result = await workspaceFromSession()
  if ('response' in result) return result.response
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Account id is required' }, { status: 422 })
  const account = await prisma.emailAccount.findFirst({ where: { id, workspaceId: result.workspace.id } })
  if (!account) return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
  await prisma.emailAccount.delete({ where: { id: account.id } })
  if (account.isDefault) {
    const replacement = await prisma.emailAccount.findFirst({ where: { workspaceId: result.workspace.id, isActive: true }, orderBy: { createdAt: 'asc' } })
    if (replacement) await setDefaultAccount(result.workspace.id, replacement.id)
  }
  return NextResponse.json({ success: true })
}
