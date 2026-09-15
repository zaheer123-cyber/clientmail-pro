import type { GenerateEmailRequest, GenerateEmailResponse } from '@/types'

export async function generateEmailWithAI(
  request: GenerateEmailRequest
): Promise<GenerateEmailResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-4o'

  if (!apiKey) {
    // Return a well-crafted mock email when no API key is configured
    return generateMockEmail(request)
  }

  const prompt = buildPrompt(request)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are a professional email writer for ${request.senderCompany}, a software and IT solutions company. 
Write highly personalized, professional client outreach emails. 
Never use generic placeholder text. Always use the actual client information provided.
Return a JSON object with "subject" and "body" fields only.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = JSON.parse(data.choices[0].message.content)

    return {
      subject: content.subject,
      body: content.body,
    }
  } catch (error) {
    console.error('AI generation error:', error)
    return generateMockEmail(request)
  }
}

function buildPrompt(request: GenerateEmailRequest): string {
  const lengthMap = {
    Short: '3-4 short paragraphs',
    Medium: '4-5 paragraphs',
    Detailed: '5-7 paragraphs with detailed value propositions',
  }

  return `Write a ${request.tone.toLowerCase()} outreach email in ${request.language} language.

Client Information:
- Name: ${request.clientName}
- Company: ${request.clientCompany || 'Not specified'}
- Position: ${request.clientPosition || 'Not specified'}
- Industry: ${request.clientIndustry || 'Not specified'}
- Website: ${request.clientWebsite || 'Not specified'}
- Location: ${request.clientLocation || 'Not specified'}
- Requirement/Need: ${request.clientRequirement || 'General IT solutions inquiry'}

Sender Information:
- Name: ${request.senderName}
- Company: ${request.senderCompany}
- Email: ${request.senderEmail}
- Website: ${request.senderWebsite || 'Not specified'}

Purpose: ${request.purpose || 'Initial outreach to offer software and IT solutions'}
Tone: ${request.tone}
Length: ${lengthMap[request.length as keyof typeof lengthMap] || '4-5 paragraphs'}

Requirements:
1. Use the client's actual name and company name naturally
2. Reference their industry or specific requirement if provided
3. Highlight how ${request.senderCompany} can solve their specific needs
4. Include a clear call to action
5. ${request.language !== 'English' ? `Write in ${request.language}` : 'Write in professional English'}
6. Do NOT use placeholder text like [Your Name] or [Company]
7. End with a professional signature from ${request.senderName}

Return JSON: { "subject": "email subject line", "body": "full email body with proper line breaks" }`
}

function generateMockEmail(request: GenerateEmailRequest): GenerateEmailResponse {
  const clientFirstName = request.clientName.split(' ')[0]
  const company = request.clientCompany || 'your company'
  const requirement = request.clientRequirement

  const subject = `Transforming ${company}'s Digital Operations — ${request.senderCompany}`

  const body = `Dear ${clientFirstName},

I hope this message finds you well. My name is ${request.senderName}, and I represent ${request.senderCompany}, a dedicated software and IT solutions provider helping businesses like ${company} unlock their full digital potential.

${requirement ? `I came across your interest in ${requirement}, and I believe we are uniquely positioned to help ${company} achieve exactly that.` : `I've been following ${company}'s growth in the ${request.clientIndustry || 'industry'} space, and I believe ${request.senderCompany} can add significant value to your operations.`}

At ${request.senderCompany}, we specialize in:

• Custom Software Development — tailor-made solutions built around your exact business processes
• E-Commerce & Web Platforms — scalable, high-performance online presence
• Mobile Applications — iOS and Android apps that engage and convert
• IT Consulting & Support — strategic technology guidance from experienced professionals

What sets us apart is our commitment to understanding your business first. We don't just write code — we deliver solutions that genuinely solve problems and drive measurable results.

I'd love to schedule a brief 20-minute call to learn more about ${company}'s goals and explore how we can support your vision. Would any time this week or next work for you?

Looking forward to connecting,

Best Regards,
${request.senderName}
${request.senderCompany}
${request.senderEmail}
${request.senderWebsite ? request.senderWebsite : ''}`

  return { subject, body }
}
