import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getWorkspaceId(userId: string) {
  const ws = await prisma.workspace.findUnique({ where: { userId } })
  return ws?.id ?? null
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getWorkspaceId(session.user.id)
  if (!workspaceId) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all' // all, sent, drafts, scheduled
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const where: Record<string, unknown> = { workspaceId }
  if (type === 'sent') where.status = 'SENT'
  else if (type === 'drafts') where.isDraft = true
  else if (type === 'scheduled') where.isScheduled = true

  const [emails, total] = await Promise.all([
    prisma.email.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        client: { select: { id: true, name: true, company: true } },
        template: { select: { id: true, name: true } },
        emailAccount: { select: { id: true, email: true, provider: true } },
      },
    }),
    prisma.email.count({ where }),
  ])

  return NextResponse.json({ emails, total, page, limit })
}
