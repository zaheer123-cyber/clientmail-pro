import crypto from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { encryptSecret } from '@/lib/encryption'
import type { EmailProvider } from '@prisma/client'

export async function getWorkspaceForUser(userId: string) {
  return prisma.workspace.findUnique({ where: { userId } })
}

export function publicEmailAccount(account: {
  id: string
  provider: EmailProvider
  email: string
  name: string | null
  status: string
  isDefault: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return account
}

export async function setDefaultAccount(workspaceId: string, accountId: string) {
  return prisma.$transaction(async transaction => {
    const account = await transaction.emailAccount.findFirst({ where: { id: accountId, workspaceId } })
    if (!account) return null
    await transaction.emailAccount.updateMany({ where: { workspaceId }, data: { isDefault: false } })
    return transaction.emailAccount.update({ where: { id: accountId }, data: { isDefault: true, isActive: true } })
  })
}

export function createOAuthState(provider: 'gmail' | 'outlook', userId: string) {
  const payload = JSON.stringify({ provider, userId, nonce: crypto.randomUUID(), exp: Date.now() + 10 * 60 * 1000 })
  const encoded = Buffer.from(payload).toString('base64url')
  const signature = crypto.createHmac('sha256', getAuthSecret()).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

export function verifyOAuthState(value: string, provider: 'gmail' | 'outlook', userId: string) {
  try {
    const [encoded, signature] = value.split('.')
    if (!encoded || !signature) return false
    const expected = crypto.createHmac('sha256', getAuthSecret()).update(encoded).digest('base64url')
    if (signature.length !== expected.length) return false
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as { provider: string; userId: string; exp: number }
    return payload.provider === provider && payload.userId === userId && payload.exp > Date.now()
  } catch {
    return false
  }
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not configured')
  return secret
}

export async function saveOAuthAccount(input: {
  workspaceId: string
  userId: string
  provider: EmailProvider
  email: string
  name?: string | null
  accessToken: string
  refreshToken?: string | null
  expiresAt?: Date | null
}) {
  const encryptedAccessToken = encryptSecret(input.accessToken)
  const encryptedRefreshToken = input.refreshToken ? encryptSecret(input.refreshToken) : null
  return prisma.$transaction(async transaction => {
    const existing = await transaction.emailAccount.findUnique({
      where: { workspaceId_email: { workspaceId: input.workspaceId, email: input.email } },
    })
    const isDefault = existing?.isDefault ?? !(await transaction.emailAccount.count({ where: { workspaceId: input.workspaceId } }))
    return transaction.emailAccount.upsert({
      where: { workspaceId_email: { workspaceId: input.workspaceId, email: input.email } },
      create: {
        workspaceId: input.workspaceId, userId: input.userId, provider: input.provider,
        email: input.email, name: input.name, status: 'CONNECTED', isActive: true, isDefault,
        encryptedAccessToken, encryptedRefreshToken, expiresAt: input.expiresAt,
      },
      update: {
        userId: input.userId, provider: input.provider, name: input.name, status: 'CONNECTED', isActive: true,
        encryptedAccessToken, ...(encryptedRefreshToken ? { encryptedRefreshToken } : {}), expiresAt: input.expiresAt,
      },
    })
  })
}