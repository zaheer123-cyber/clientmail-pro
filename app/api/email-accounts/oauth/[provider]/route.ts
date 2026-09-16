import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createOAuthState, getWorkspaceForUser } from '@/lib/email-accounts'

export async function GET(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const session = await auth()
  const { provider } = await params
  if (!session?.user?.id) return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  if (provider !== 'gmail' && provider !== 'outlook') return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
  if (!(await getWorkspaceForUser(session.user.id))) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const state = createOAuthState(provider, session.user.id)
  const redirectUri = provider === 'gmail' ? process.env.GOOGLE_REDIRECT_URI : process.env.MICROSOFT_REDIRECT_URI
  const clientId = provider === 'gmail' ? process.env.GOOGLE_CLIENT_ID : process.env.MICROSOFT_CLIENT_ID
  if (!redirectUri || !clientId) return NextResponse.json({ error: `${provider} OAuth is not configured` }, { status: 503 })

  const url = provider === 'gmail'
    ? new URL('https://accounts.google.com/o/oauth2/v2/auth')
    : new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')
  url.searchParams.set('scope', provider === 'gmail' ? 'openid email https://www.googleapis.com/auth/gmail.send' : 'openid email offline_access Mail.Send User.Read')
  const response = NextResponse.redirect(url)
  response.cookies.set('clientmail_oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 600, path: '/' })
  return response
}