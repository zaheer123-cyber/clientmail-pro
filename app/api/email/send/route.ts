import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmailViaAccount, bodyToHtml } from '@/services/email'
import { buildTemplateVariables, replaceTemplateVariables } from '@/lib/utils'
import { z } from 'zod'

async function getWorkspaceId(userId: string) {
  const ws = await prisma.workspace.findUnique({
    where: { userId },
    include: { companyProfile: true },
  })
  return ws
}

const sendSchema = z.object({
  to: z.string().email(),
  toName: z.string().optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  emailAccountId: z.string().min(1),
  clientId: z.string().optional(),
  templateId: z.string().optional(),
  campaignId: z.string().optional(),
  isDraft: z.boolean().optional(),
  scheduledAt: z.string().optional(),
})

// POST /api/email/send
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspace = await getWorkspaceId(session.user.id)
  if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = sendSchema.parse(body)

    // Get email account
    const emailAccount = await prisma.emailAccount.findFirst({
      where: { id: data.emailAccountId, workspaceId: workspace.id },
    })
    if (!emailAccount) {
      return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
    }

    // Get client for variable replacement
    let client = null
    if (data.clientId) {
      client = await prisma.client.findFirst({
        where: { id: data.clientId, workspaceId: workspace.id },
      })
    }

    // Replace template variables
    const senderVars = {
      name: session.user.name || '',
      company: workspace.companyProfile?.name || 'Nexa Solutions',
      email: emailAccount.email,
      website: workspace.companyProfile?.website || '',
    }
    const clientVars = client || { name: data.toName, email: data.to }
    const variables = buildTemplateVariables(clientVars, senderVars)
    const processedBody = replaceTemplateVariables(data.body, variables)
    const processedSubject = replaceTemplateVariables(data.subject, variables)

    // Handle scheduled email
    if (data.scheduledAt) {
      const scheduled = await prisma.scheduledEmail.create({
        data: {
          workspaceId: workspace.id,
          emailAccountId: data.emailAccountId,
          recipientEmail: data.to,
          recipientName: data.toName,
          subject: processedSubject,
          body: processedBody,
          scheduledAt: new Date(data.scheduledAt),
        },
      })

      await prisma.email.create({
        data: {
          workspaceId: workspace.id,
          clientId: data.clientId,
          templateId: data.templateId,
          emailAccountId: data.emailAccountId,
          campaignId: data.campaignId,
          subject: processedSubject,
          body: processedBody,
          recipientEmail: data.to,
          recipientName: data.toName,
          senderEmail: emailAccount.email,
          senderName: session.user.name,
          status: 'SCHEDULED',
          isScheduled: true,
          scheduledAt: new Date(data.scheduledAt),
        },
      })

      return NextResponse.json({ success: true, scheduled: true, scheduledEmailId: scheduled.id })
    }

    // Handle draft save
    if (data.isDraft) {
      const draft = await prisma.email.create({
        data: {
          workspaceId: workspace.id,
          clientId: data.clientId,
          templateId: data.templateId,
          emailAccountId: data.emailAccountId,
          subject: processedSubject,
          body: processedBody,
          recipientEmail: data.to,
          recipientName: data.toName,
          senderEmail: emailAccount.email,
          senderName: session.user.name,
          status: 'DRAFT',
          isDraft: true,
        },
      })
      return NextResponse.json({ success: true, draft: true, emailId: draft.id })
    }

    // Send email now
    const htmlBody = bodyToHtml(processedBody, workspace.companyProfile?.signature || undefined)
    const result = await sendEmailViaAccount(
      {
        ...emailAccount,
        smtpHost: (emailAccount as Record<string, unknown>).smtpHost as string | null,
        smtpPort: (emailAccount as Record<string, unknown>).smtpPort as number | null,
        smtpUser: (emailAccount as Record<string, unknown>).smtpUser as string | null,
        smtpPassword: (emailAccount as Record<string, unknown>).smtpPassword as string | null,
        accessToken: (emailAccount as Record<string, unknown>).accessToken as string | null,
      },
      {
        to: data.to,
        toName: data.toName,
        subject: processedSubject,
        html: htmlBody,
        fromName: senderVars.company,
      }
    )

    const emailRecord = await prisma.email.create({
      data: {
        workspaceId: workspace.id,
        clientId: data.clientId,
        templateId: data.templateId,
        emailAccountId: data.emailAccountId,
        campaignId: data.campaignId,
        subject: processedSubject,
        body: processedBody,
        recipientEmail: data.to,
        recipientName: data.toName,
        senderEmail: emailAccount.email,
        senderName: session.user.name,
        status: result.success ? 'SENT' : 'FAILED',
        sentAt: result.success ? new Date() : undefined,
        failureReason: result.error,
      },
    })

    if (data.clientId) {
      await prisma.client.update({
        where: { id: data.clientId },
        data: { lastContactedAt: new Date() },
      })
    }

    if (data.templateId) {
      await prisma.emailTemplate.update({
        where: { id: data.templateId },
        data: { useCount: { increment: 1 } },
      })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: emailRecord.id })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 422 })
    console.error('Send email error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
