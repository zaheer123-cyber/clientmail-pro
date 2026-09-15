import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function getWorkspaceId(userId: string) {
  const ws = await prisma.workspace.findUnique({ where: { userId } })
  return ws?.id ?? null
}

// GET /api/clients/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const workspaceId = await getWorkspaceId(session.user.id)
  
  const client = await prisma.client.findFirst({
    where: { id, workspaceId: workspaceId! },
    include: {
      emails: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { template: true },
      },
    },
  })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  return NextResponse.json({ client })
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
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

// PATCH /api/clients/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const workspaceId = await getWorkspaceId(session.user.id)

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)
    const client = await prisma.client.updateMany({
      where: { id, workspaceId: workspaceId! },
      data,
    })
    if (client.count === 0) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 422 })
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE /api/clients/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const workspaceId = await getWorkspaceId(session.user.id)

  await prisma.client.deleteMany({ where: { id, workspaceId: workspaceId! } })
  return NextResponse.json({ success: true })
}
