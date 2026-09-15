import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateEmailWithAI } from '@/services/ai'
import { z } from 'zod'

const generateSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  clientCompany: z.string().optional(),
  clientPosition: z.string().optional(),
  clientIndustry: z.string().optional(),
  clientWebsite: z.string().optional(),
  clientRequirement: z.string().optional(),
  clientLocation: z.string().optional(),
  templateId: z.string().optional(),
  purpose: z.string().optional(),
  tone: z.string().default('Professional'),
  language: z.string().default('English'),
  length: z.string().default('Medium'),
  senderName: z.string().default(''),
  senderCompany: z.string().default('Nexa Solutions'),
  senderEmail: z.string().default(''),
  senderWebsite: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = generateSchema.parse(body)
    const result = await generateEmailWithAI(data)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 422 })
    }
    return NextResponse.json({ error: 'Email generation failed' }, { status: 500 })
  }
}
