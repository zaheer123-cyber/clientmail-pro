import nodemailer from 'nodemailer'
import type { EmailAccount } from '@/types'

interface SendEmailOptions {
  to: string
  toName?: string
  subject: string
  html: string
  from?: string
  fromName?: string
  attachments?: Array<{
    filename: string
    path: string
    contentType?: string
  }>
}

export async function sendEmailViaAccount(
  account: EmailAccount & {
    smtpHost?: string | null
    smtpPort?: number | null
    smtpUser?: string | null
    smtpPassword?: string | null
    accessToken?: string | null
  },
  options: SendEmailOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    if (account.provider === 'SMTP') {
      return sendViaSMTP(account, options)
    } else if (account.provider === 'GMAIL') {
      return sendViaGmail(account, options)
    } else if (account.provider === 'OUTLOOK') {
      return sendViaOutlook(account, options)
    }
    throw new Error('Unsupported email provider')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
}

async function sendViaSMTP(
  account: {
    email: string
    smtpHost?: string | null
    smtpPort?: number | null
    smtpUser?: string | null
    smtpPassword?: string | null
  },
  options: SendEmailOptions
): Promise<{ success: boolean; error?: string }> {
  if (!account.smtpHost || !account.smtpUser || !account.smtpPassword) {
    return { success: false, error: 'SMTP configuration is incomplete' }
  }

  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort || 587,
    secure: (account.smtpPort || 587) === 465,
    auth: {
      user: account.smtpUser,
      pass: account.smtpPassword,
    },
  })

  await transporter.sendMail({
    from: options.from || `${options.fromName || 'ClientMail Pro'} <${account.email}>`,
    to: options.toName ? `${options.toName} <${options.to}>` : options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  })

  return { success: true }
}

async function sendViaGmail(
  account: { email: string; accessToken?: string | null },
  options: SendEmailOptions
): Promise<{ success: boolean; error?: string }> {
  if (!account.accessToken) {
    return { success: false, error: 'Gmail access token is missing. Please reconnect your account.' }
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: account.email,
      accessToken: account.accessToken,
    },
  })

  await transporter.sendMail({
    from: `${options.fromName || ''} <${account.email}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })

  return { success: true }
}

async function sendViaOutlook(
  account: { email: string; accessToken?: string | null },
  options: SendEmailOptions
): Promise<{ success: boolean; error?: string }> {
  if (!account.accessToken) {
    return { success: false, error: 'Outlook access token is missing. Please reconnect your account.' }
  }

  const endpoint = 'https://graph.microsoft.com/v1.0/me/sendMail'
  
  const message = {
    message: {
      subject: options.subject,
      body: {
        contentType: 'HTML',
        content: options.html,
      },
      toRecipients: [
        {
          emailAddress: {
            address: options.to,
            name: options.toName || options.to,
          },
        },
      ],
    },
    saveToSentItems: 'true',
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })

  if (!response.ok) {
    const error = await response.text()
    return { success: false, error: `Outlook API error: ${error}` }
  }

  return { success: true }
}

export function bodyToHtml(plainText: string, signature?: string): string {
  let html = plainText
    .split('\n')
    .map(line => line.trim() === '' ? '<br>' : `<p style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">${line}</p>`)
    .join('\n')

  if (signature) {
    const sigHtml = signature
      .split('\n')
      .map(line => `<p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #555;">${line}</p>`)
      .join('\n')
    html += `<br><hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;"><br>${sigHtml}`
  }

  return `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; color: #333;">${html}</body></html>`
}
