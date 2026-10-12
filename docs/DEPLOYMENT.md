# Deployment: Vercel and Neon

## Configure

Create a Neon PostgreSQL database and set `DATABASE_URL` in Vercel for Production, Preview, and Development as appropriate. Set the required GitHub OAuth, GitHub encryption, Gemini, and private Vercel Blob token variables from `.env.example`. Configure both Upstash REST variables for production rate limiting. Set `NEXT_PUBLIC_APP_URL` to the canonical HTTPS application origin.

Register the GitHub OAuth application with the production callback URL `<NEXT_PUBLIC_APP_URL>/api/github/callback`. Keep the OAuth client secret and token encryption key server-only. Use a high-entropy 32-byte encryption key and protect a backup so stored tokens remain decryptable during key rotation.

Create a private Vercel Blob store for resume PDFs and connect it to the project so `BLOB_READ_WRITE_TOKEN` is available. Resume files are served through the authenticated app endpoint, not direct public Blob URLs.

## Deploy

1. Run CI and confirm typecheck, lint, tests, and build pass.
2. Apply reviewed schema migrations to the target database with `pnpm exec prisma migrate deploy` (including the additive Resume, Skill Gap, and account theme fields).
3. Deploy the Vercel build with environment variables configured.
4. Confirm HTTPS, `/api/health`, login, GitHub OAuth, Redis rate limiting, and account isolation.

Do not run `prisma migrate dev` against production. Back up Neon before schema changes and test migration behavior against a staging copy.

## Smoke test checklist

- [ ] Register, log in, log out, and log in again.
- [ ] Open the dashboard and verify useful empty states for missing integrations.
- [ ] Connect GitHub; load repositories and analyze one; disconnect and verify the disconnected UI.
- [ ] Create and evaluate an interview; inspect history and analytics.
- [ ] View readiness and roadmap; use Copilot; create and delete a conversation.
- [ ] Update profile, change password, sign in again, and sign out all sessions.
- [ ] Delete a disposable test account and verify its sessions and owned data are removed.
- [ ] With two test users, verify neither can read or change the other's interview, Copilot, career, GitHub, resume, or skill-gap data.
- [ ] Confirm `/api/health` returns only a safe status and production rate limiting works with Upstash configured.
