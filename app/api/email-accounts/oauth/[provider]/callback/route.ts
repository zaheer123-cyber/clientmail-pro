import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getWorkspaceForUser, saveOAuthAccount, verifyOAuthState } from '@/lib/email-accounts'

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const session = await auth()
  const { provider } = await params
  const url = new URL(request.url)
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state')
  const code = url.searchParams.get('code')
  const stateCookie = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith('clientmail_oauth_state='))?.slice('clientmail_oauth_state='.length)
  const redirect = new URL('/email-accounts', url.origin)
  if (error) redirect.searchParams.set('error', 'OAuth authorization was denied')
  if (!session?.user?.id || !state || !code || (provider !== 'gmail' && provider !== 'outlook')) {
    redirect.searchParams.set('error', 'Invalid OAuth callback')
    return NextResponse.redirect(redirect)
  }
  if (!stateCookie || stateCookie !== state || !verifyOAuthState(state, provider, session.user.id)) {
    redirect.searchParams.set('error', 'OAuth state validation failed')
    return NextResponse.redirect(redirect)
  }
  const workspace = await getWorkspaceForUser(session.user.id)
  if (!workspace) {
    redirect.searchParams.set('error', 'Workspace not found')
    return NextResponse.redirect(redirect)
  }

  try {
    const isGmail = provider === 'gmail'
    const tokenResponse = await fetch(isGmail ? 'https://oauth2.googleapis.com/token' : 'https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: isGmail ? process.env.GOOGLE_CLIENT_ID! : process.env.MICROSOFT_CLIENT_ID!,
        client_secret: isGmail ? process.env.GOOGLE_CLIENT_SECRET! : process.env.MICROSOFT_CLIENT_SECRET!,
        redirect_uri: isGmail ? process.env.GOOGLE_REDIRECT_URI! : process.env.MICROSOFT_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    })
    if (!tokenResponse.ok) throw new Error('OAuth token exchange failed')
    const tokens = await tokenResponse.json() as { access_token?: string; refresh_token?: string; expires_in?: number }
    if (!tokens.access_token) throw new Error('OAuth provider returned no access token')
    const profileResponse = await fetch(isGmail ? 'https://openidconnect.googleapis.com/v1/userinfo' : 'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName,displayName', { headers: { Authorization: `Bearer ${tokens.access_token}` } })
    if (!profileResponse.ok) throw new Error('Unable to read provider profile')
    const profile = await profileResponse.json() as { email?: string; mail?: string; userPrincipalName?: string; name?: string; displayName?: string }
    const email = profile.email || profile.mail || profile.userPrincipalName
    if (!email) throw new Error('Provider profile did not include an email address')
    await saveOAuthAccount({ workspaceId: workspace.id, userId: session.user.id, provider: isGmail ? 'GMAIL' : 'OUTLOOK', email, name: profile.name || profile.displayName, accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null })
    redirect.searchParams.set('connected', '1')
  } catch {
    redirect.searchParams.set('error', 'Unable to connect account. Check provider configuration and try again.')
  }
  const response = NextResponse.redirect(redirect)
  response.cookies.delete('clientmail_oauth_state')
  return response
}