import crypto from 'node:crypto'

function getEncryptionKey() {
  const configured = process.env.ENCRYPTION_KEY
  if (!configured) throw new Error('ENCRYPTION_KEY is not configured')

  const key = /^[0-9a-f]{64}$/i.test(configured)
    ? Buffer.from(configured, 'hex')
    : Buffer.from(configured, 'base64')
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must decode to 32 bytes')
  return key
}

export function encryptSecret(value: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, encrypted].map(part => part.toString('base64url')).join('.')
}

export function decryptSecret(payload: string): string {
  const [ivEncoded, tagEncoded, encryptedEncoded] = payload.split('.')
  if (!ivEncoded || !tagEncoded || !encryptedEncoded) throw new Error('Invalid encrypted secret')
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivEncoded, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedEncoded, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}