import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function getWorkspaceId(userId: string) {
  const ws = await prisma.workspace.findUnique({ where: { userId } })
  return ws?.id ?? null
}

// PATCH /api/templates/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const workspaceId = await getWorkspaceId(session.user.id)

  const body = await req.json()
  await prisma.emailTemplate.updateMany({ where: { id, workspaceId: workspaceId! }, data: body })
  return NextResponse.json({ success: true })
}

// DELETE /api/templates/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const workspaceId = await getWorkspaceId(session.user.id)

  await prisma.emailTemplate.deleteMany({ where: { id, workspaceId: workspaceId! } })
  return NextResponse.json({ success: true })
}
