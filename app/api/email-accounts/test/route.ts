import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getWorkspaceForUser } from '@/lib/email-accounts'
import { testSmtpConnection } from '@/services/providers'

const schema = z.object({
  smtpHost: z.string().trim().min(1), smtpPort: z.number().int().min(1).max(65535),
  smtpUser: z.string().trim().min(1), smtpPassword: z.string().min(1),
  smtpSecurity: z.enum(['SSL', 'STARTTLS', 'NONE']).default('STARTTLS'),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await getWorkspaceForUser(session.user.id))) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  try {
    const result = await testSmtpConnection(schema.parse(await request.json()))
    return result.success ? NextResponse.json(result) : NextResponse.json(result, { status: 422 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 422 })
    return NextResponse.json({ error: 'SMTP connection test failed' }, { status: 500 })
  }
}
