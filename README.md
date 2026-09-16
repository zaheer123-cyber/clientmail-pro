# ClientMail Pro

ClientMail Pro is a workspace-scoped outreach app built with Next.js, Prisma, PostgreSQL, NextAuth, and provider abstractions for AI and email delivery.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Setup

```bash
npm install
copy .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Open `http://localhost:3000` and create a user at `/auth/register`.

## Environment variables

See `.env.example` for the full list. Required for local auth and database access are `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, and a 32-byte `ENCRYPTION_KEY` (hex or base64). AI generation requires `OPENAI_API_KEY`. Never commit real secrets.

### Gmail OAuth

Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`. Register this callback URL with Google:

`http://localhost:3000/api/email-accounts/oauth/gmail/callback`

Use the deployed origin in production. The client secret stays server-side. OAuth state is signed and stored in an HTTP-only cookie; access and refresh tokens are encrypted before storage.

### Microsoft Outlook OAuth

Configure `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, and `MICROSOFT_REDIRECT_URI`. Register:

`http://localhost:3000/api/email-accounts/oauth/outlook/callback`

Grant delegated `openid`, `email`, `offline_access`, `Mail.Send`, and `User.Read` permissions as required by the tenant.

### SMTP

SMTP accounts are tested with `transporter.verify()` before saving. The password is encrypted with `ENCRYPTION_KEY` and is never returned to the browser.

## Database setup

Use `npx prisma migrate dev --name <change-name>` for local schema changes and `npx prisma migrate deploy` in production. The secure account migration is in `prisma/migrations/20260915113000_secure_email_accounts`. There is currently no seed script.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Production deployment

Set the environment variables in the deployment platform, run Prisma migrations, build with `npm run build`, and start with `npm run start`. Configure OAuth callback URLs for the deployed `NEXTAUTH_URL` and use a managed PostgreSQL instance.
