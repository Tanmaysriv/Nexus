# Security notes

## Authentication and ownership

Sessions use random bearer tokens in HttpOnly, SameSite=Lax cookies. Only token hashes are stored. Production cookies are Secure. Passwords use bcrypt. Every private route must resolve its user and scope user-owned Prisma operations by `userId`.

GitHub OAuth state is stored hashed, expires, is consumed once, and is bound to the signed-in NEXUS user. GitHub tokens are encrypted at rest and kept server-side. Disconnect removes local credentials and attempts GitHub token revocation.

Resume PDFs use private Vercel Blob storage and are downloaded through an authenticated, user-scoped route. Job descriptions, resume text, repository metadata, and interview transcripts are treated as untrusted content in AI prompts.

## Secrets

Never commit `.env`, `.env.local`, provider keys, OAuth secrets, encryption keys, or database credentials. `.gitignore` excludes `.env*`. Logs must not include passwords, tokens, cookies, or API keys. User-facing errors should be generic; diagnostic details belong in structured server logs.

## Production controls

Use HTTPS, strong random auth and encryption secrets, and Upstash Redis credentials. The rate limiter rejects production requests when Redis is unavailable instead of falling back to per-process memory. Configure the GitHub OAuth callback to the production HTTPS URL. Restrict database credentials to the app and migration roles as appropriate.

## Current scope and follow-up

The health route reports application availability only and does not expose dependency state. Security-sensitive APIs should retain explicit input validation and safe status codes. Review new routes for IDOR, CSRF-sensitive writes, untrusted URL fetches, upload limits, and prompt injection before release. Automated tenant tests cover selected API query boundaries; add integration coverage for database-backed account flows before production launch.
