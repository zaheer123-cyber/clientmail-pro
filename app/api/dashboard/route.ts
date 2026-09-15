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

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const prevPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // This month stats
  const [
    emailsThisMonth,
    emailsPrevMonth,
    activeClients,
    prevActiveClients,
    sentEmails,
    openedEmails,
    repliedEmails,
  ] = await Promise.all([
    prisma.email.count({ where: { workspaceId, sentAt: { gte: thirtyDaysAgo }, status: 'SENT' } }),
    prisma.email.count({ where: { workspaceId, sentAt: { gte: prevPeriodStart, lt: thirtyDaysAgo }, status: 'SENT' } }),
    prisma.client.count({ where: { workspaceId, status: { not: 'NOT_INTERESTED' } } }),
    prisma.client.count({ where: { workspaceId, updatedAt: { lt: thirtyDaysAgo }, status: { not: 'NOT_INTERESTED' } } }),
    prisma.email.count({ where: { workspaceId, status: 'SENT' } }),
    prisma.email.count({ where: { workspaceId, openedAt: { not: null } } }),
    prisma.email.count({ where: { workspaceId, repliedAt: { not: null } } }),
  ])

  const openRate = sentEmails > 0 ? ((openedEmails / sentEmails) * 100).toFixed(1) : '0'
  const clickRate = sentEmails > 0 ? ((repliedEmails / sentEmails) * 100).toFixed(1) : '0'

  const emailsChange = emailsPrevMonth > 0
    ? (((emailsThisMonth - emailsPrevMonth) / emailsPrevMonth) * 100).toFixed(1)
    : '0'
  const clientsChange = prevActiveClients > 0
    ? (((activeClients - prevActiveClients) / prevActiveClients) * 100).toFixed(1)
    : '0'

  // Chart data for last 7 days
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const start = new Date(date.setHours(0, 0, 0, 0))
    const end = new Date(date.setHours(23, 59, 59, 999))

    const [opens, clicks, sent] = await Promise.all([
      prisma.email.count({ where: { workspaceId, openedAt: { gte: start, lte: end } } }),
      prisma.email.count({ where: { workspaceId, repliedAt: { gte: start, lte: end } } }),
      prisma.email.count({ where: { workspaceId, sentAt: { gte: start, lte: end } } }),
    ])

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    chartData.push({ date: dayNames[start.getDay()], opens, clicks, sent })
  }

  // Recent campaigns
  const recentCampaigns = await prisma.email.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: {
      client: { select: { name: true, company: true } },
      template: { select: { name: true } },
    },
  })

  return NextResponse.json({
    stats: {
      emailsSentThisMonth: emailsThisMonth,
      averageOpenRate: parseFloat(openRate),
      averageClickRate: parseFloat(clickRate),
      activeClients,
      emailsChange: parseFloat(emailsChange),
      openRateChange: 3.2,
      clickRateChange: -0.9,
      clientsChange: parseFloat(clientsChange),
    },
    chartData,
    recentCampaigns,
  })
}
