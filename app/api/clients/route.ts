import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function getWorkspaceId(userId: string): Promise<string | null> {
  const workspace = await prisma.workspace.findUnique({ where: { userId } })
  return workspace?.id ?? null
}

// GET /api/clients
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getWorkspaceId(session.user.id)
  if (!workspaceId) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const tag = searchParams.get('tag') || ''
  const isVip = searchParams.get('vip') === 'true'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const where: Record<string, unknown> = { workspaceId }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (status) where.status = status
  if (tag) where.tags = { has: tag }
  if (isVip) where.isVip = true

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { emails: true } },
      },
    }),
    prisma.client.count({ where }),
  ])

  return NextResponse.json({ clients, total, page, limit })
}

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  company: z.string().optional(),
  position: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  requirement: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CONVERTED', 'NOT_INTERESTED']).optional(),
  tags: z.array(z.string()).optional(),
  isVip: z.boolean().optional(),
})

// POST /api/clients
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getWorkspaceId(session.user.id)
  if (!workspaceId) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = clientSchema.parse(body)

    const client = await prisma.client.create({
      data: { ...data, workspaceId },
    })
    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 422 })
    }
    const msg = error instanceof Error && error.message.includes('Unique constraint')
      ? 'A client with this email already exists'
      : 'Failed to create client'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
