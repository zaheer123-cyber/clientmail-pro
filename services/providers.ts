import nodemailer from 'nodemailer'
import { decryptSecret } from '@/lib/encryption'
import { prisma } from '@/lib/prisma'

type SmtpConfig = { smtpHost: string; smtpPort: number; smtpUser: string; smtpPassword: string; smtpSecurity: 'SSL' | 'STARTTLS' | 'NONE' }

export async function testSmtpConnection(config: SmtpConfig) {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecurity === 'SSL',
    requireTLS: config.smtpSecurity === 'STARTTLS',
    ...(config.smtpSecurity === 'NONE' ? { tls: { rejectUnauthorized: false } } : {}),
    auth: { user: config.smtpUser, pass: config.smtpPassword },
  })
  try {
    await transporter.verify()
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'SMTP connection failed' }
  } finally {
    transporter.close()
  }
}

export async function getDecryptedAccount(workspaceId: string, accountId: string) {
  const account = await prisma.emailAccount.findFirst({ where: { id: accountId, workspaceId, isActive: true, status: 'CONNECTED' } })
  if (!account) return null
  return {
    ...account,
    accessToken: account.encryptedAccessToken ? decryptSecret(account.encryptedAccessToken) : null,
    refreshToken: account.encryptedRefreshToken ? decryptSecret(account.encryptedRefreshToken) : null,
    smtpPassword: account.encryptedSmtpPassword ? decryptSecret(account.encryptedSmtpPassword) : null,
  }
}
