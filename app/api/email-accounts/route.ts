import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function getWorkspaceId(userId: string) {
  const ws = await prisma.workspace.findUnique({ where: { userId } })
  return ws?.id ?? null
}

// GET /api/email-accounts
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getWorkspaceId(session.user.id)
  if (!workspaceId) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const accounts = await prisma.emailAccount.findMany({
    where: { workspaceId },
    select: {
      id: true, provider: true, email: true, name: true,
      isDefault: true, isActive: true, createdAt: true, updatedAt: true,
    },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ accounts })
}

const accountSchema = z.object({
  provider: z.enum(['GMAIL', 'OUTLOOK', 'SMTP']),
  email: z.string().email(),
  name: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  isDefault: z.boolean().optional(),
})

// POST /api/email-accounts
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getWorkspaceId(session.user.id)
  if (!workspaceId) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = accountSchema.parse(body)

    if (data.isDefault) {
      await prisma.emailAccount.updateMany({
        where: { workspaceId },
        data: { isDefault: false },
      })
    }

    const account = await prisma.emailAccount.create({
      data: { ...data, workspaceId },
      select: {
        id: true, provider: true, email: true, name: true,
        isDefault: true, isActive: true, createdAt: true, updatedAt: true,
      },
    })

    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 422 })
    return NextResponse.json({ error: 'Failed to add account' }, { status: 500 })
  }
}
