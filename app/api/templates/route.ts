import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function getWorkspaceId(userId: string) {
  const ws = await prisma.workspace.findUnique({ where: { userId } })
  return ws?.id ?? null
}

// GET /api/templates
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getWorkspaceId(session.user.id)
  if (!workspaceId) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const favorites = searchParams.get('favorites') === 'true'

  const where: Record<string, unknown> = { workspaceId }
  if (category && category !== 'all') {
    if (favorites) where.isFavorite = true
    else where.category = category
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (favorites) where.isFavorite = true

  const templates = await prisma.emailTemplate.findMany({
    where,
    orderBy: [{ isFavorite: 'desc' }, { useCount: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ templates })
}

const templateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  language: z.string().optional(),
  tone: z.string().optional(),
  color: z.string().optional(),
})

// POST /api/templates
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getWorkspaceId(session.user.id)
  if (!workspaceId) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = templateSchema.parse(body)
    const template = await prisma.emailTemplate.create({
      data: { ...data, workspaceId },
    })
    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 422 })
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
