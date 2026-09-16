CREATE TYPE "EmailAccountStatus" AS ENUM ('CONNECTED', 'ERROR', 'DISCONNECTED');

ALTER TABLE "email_accounts"
  ADD COLUMN "userId" TEXT,
  ADD COLUMN "status" "EmailAccountStatus" NOT NULL DEFAULT 'CONNECTED',
  ADD COLUMN "encryptedAccessToken" TEXT,
  ADD COLUMN "encryptedRefreshToken" TEXT,
  ADD COLUMN "encryptedSmtpPassword" TEXT,
  ADD COLUMN "smtpSecurity" TEXT DEFAULT 'STARTTLS';

CREATE INDEX "email_accounts_workspaceId_status_idx" ON "email_accounts"("workspaceId", "status");
CREATE INDEX "email_accounts_userId_idx" ON "email_accounts"("userId");

ALTER TABLE "email_accounts"
  ADD CONSTRAINT "email_accounts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;