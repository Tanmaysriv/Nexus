# NEXUS architecture

NEXUS is a Next.js App Router application using React, TypeScript, Prisma 7, and PostgreSQL. Server components and route handlers use the shared Prisma client; interactive views use browser components that call the application API.

## Main paths

- `app/(nexus)` contains authenticated dashboard, GitHub, projects, career, Copilot, and interview pages.
- `app/api` contains authentication, GitHub OAuth/data, career, Copilot, interview, profile, and account endpoints.
- `lib/auth.ts` stores a SHA-256 hash of a random session token in the database and sends the token in an HttpOnly, SameSite=Lax cookie.
- `lib/github.ts` loads the connected account using the NEXUS `userId`, decrypts its token server-side, and fetches GitHub data.
- `lib/nexus-context.ts` and the career/AI libraries build user-specific analysis and recommendations.
- `app/api/resume` stores private PDF files in Vercel Blob and keeps extracted text and analysis in the user's Resume record.
- `app/api/skill-gap` and `app/api/career/job-match` compare supported requirements with evidence from the signed-in user's resume, repositories, and interview records.
- `prisma/schema.prisma` also stores account-level theme preferences.
- `prisma/schema.prisma` defines user ownership and cascading deletion for persisted user data.

## Tenant boundary

Resolve the current user on every private API request. Include that user's ID in each read, update, and delete filter. IDs supplied by a client are identifiers, not authorization. For nested data, first scope the parent lookup to the owner before returning or mutating children. User-specific cache keys and cache tags include the user ID.

## Data flow

GitHub OAuth binds short-lived state to a signed-in NEXUS user. GitHub access tokens are encrypted before storage and are only decrypted by server-side code. Gemini requests are made by server libraries; API keys and provider tokens are never sent to browser code. Persisted interviews, Copilot conversations, roadmaps, and actions are linked to users through Prisma relations.

## Runtime

Run `pnpm dev` locally. Production builds use Next.js standalone output. The app expects PostgreSQL and uses Upstash Redis for distributed rate limits in production. Apply migrations during deployment with `pnpm exec prisma migrate deploy`.
