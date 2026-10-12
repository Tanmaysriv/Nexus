# NEXUS — AI Developer Career Intelligence Platform

NEXUS is an AI-powered developer career intelligence platform that analyzes a developer's GitHub projects, evaluates project engineering quality, generates project-specific interview questions, and provides AI-powered interview feedback.

The goal of NEXUS is simple:

> Turn a developer's code, projects, and interview performance into actionable career intelligence.

---

## 🚀 Core Features

### 🧠 GitHub Intelligence

NEXUS connects to GitHub repositories and analyzes engineering signals such as:

- README documentation
- TypeScript usage
- package.json
- Automated tests
- Docker configuration
- CI/CD workflows
- Environment configuration
- Licensing
- Repository structure

---

### 📊 Project Health

NEXUS evaluates projects across multiple engineering dimensions:

- Activity
- Documentation
- Maintenance
- Technology stack
- Testing
- DevOps readiness

Each project receives a health score and actionable recommendations.

---

### 🔎 Project Intelligence

Every analyzed repository gets its own intelligence page.

NEXUS can identify:

- Engineering strengths
- Missing production practices
- Documentation gaps
- Testing gaps
- DevOps opportunities
- Technology signals
- Career impact opportunities

---

### 🎯 AI Interview Coach

NEXUS automatically generates interview questions based on the project.

Questions can cover:

- Project explanation
- Architecture
- Technical implementation
- Testing
- DevOps
- System design
- Behavioral questions

The candidate can answer directly inside NEXUS.

---

### 🤖 Gemini-Powered Interview Evaluation

NEXUS uses Google's Gemini API to evaluate interview answers.

Each answer is evaluated across:

| Metric | Description |
|---|---|
| Technical Correctness | Accuracy of the technical explanation |
| Relevance | How directly the answer addresses the question |
| Depth | Understanding beyond surface-level concepts |
| Communication | Clarity and structure |
| Project Knowledge | Understanding of the actual project |

NEXUS also generates:

- Strengths
- Missing concepts
- Improvements
- Ideal answer
- Follow-up technical question

### Resume and job matching

Users can upload a private PDF resume, review extracted skill evidence, and compare it with a target job description. Job requirements are shown separately from evidence found in the resume, GitHub repositories, and interview feedback. The compatibility metric is an ATS-style estimate, not an official ATS score. Account settings also include a persisted dark/light theme preference.

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │       NEXUS UI      │
                    │      Next.js        │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
      GitHub Intelligence  Project Engine   Interview Engine
             │                 │                 │
             ▼                 ▼                 ▼
       GitHub API        Project Health      Gemini AI
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                               ▼
                    Career Intelligence

 GitHub Repository
       │
       ▼
Repository Analyzer
       │
       ▼
Project Health
       │
       ▼
Project Intelligence
       │
       ├───────────────┐
       │               │
       ▼               ▼
Career Analysis    Interview Engine
                       │
                       ▼
                  Gemini AI
                       │
                       ▼
               Interview Evaluation
                       │
                       ▼
                Career Readiness

🛠️ Tech Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Lucide Icons
Backend
Next.js App Router
Next.js Route Handlers
TypeScript
AI
Google Gemini API
@google/genai


Developer Intelligence
GitHub REST API
Repository analysis
Project health scoring
Interview question generation
AI answer evaluation
Database / Infrastructure
Prisma
PostgreSQL-compatible architecture
GitHub
Environment-based configuration          

nexus/
│
├── app/
│   ├── (nexus)/
│   │   ├── dashboard/
│   │   ├── github/
│   │   ├── projects/
│   │   ├── career/
│   │   └── interview/
│   │
│   ├── api/
│   │   ├── github/
│   │   └── interview/
│   │
│   ├── settings/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── dashboard/
│   └── ...
│
├── lib/
│   ├── ai-interviewer.ts
│   ├── github-cache.ts
│   ├── interview-engine.ts
│   ├── project-health.ts
│   └── repository-analyzer.ts
│
├── prisma/
│
├── types/
│
├── public/
│
├── .env.local
├── package.json
├── pnpm-lock.yaml
└── README.md

git clone https://github.com/Tanmaysriv/nexus.git

cd nexus

pnpm install

.env.local

Copy `.env.example` to `.env.local` and configure `DATABASE_URL`, GitHub OAuth credentials and callback, `GITHUB_TOKEN_ENCRYPTION_KEY`, and `GEMINI_API_KEY`. Set `BLOB_READ_WRITE_TOKEN` for private resume storage and the two Upstash variables for production. GitHub identity is taken from each user's OAuth connection; `GITHUB_USERNAME` is not required.

pnpm dev
http://localhost:3000

## Database

Generate Prisma Client and apply development migrations with:

```sh
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

For production, apply only reviewed migrations with `pnpm exec prisma migrate deploy`. Never use `migrate dev` against production.

## GitHub OAuth

Create a GitHub OAuth app and set its callback to `http://localhost:3000/api/github/callback` locally. For production, use `https://<your-domain>/api/github/callback` and set `NEXT_PUBLIC_APP_URL` and `GITHUB_OAUTH_REDIRECT_URI` to the production values. Each user connects their own account from Settings.

## Upstash rate limiting

Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in production. Production requests fail closed when the distributed rate limiter is unavailable.

## Resume storage

Create a **private** Vercel Blob store and configure its `BLOB_READ_WRITE_TOKEN`. NEXUS limits uploads to 3 MB and 30 pages and downloads files only through the authenticated `/api/resume/file` route. Scanned image-only PDFs are not supported; uploaded files are private objects and only their reference and extracted text/analysis are stored in PostgreSQL.

## Tests and deployment

Run `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, and `pnpm build`. CI runs these checks on pushes and pull requests. See [Deployment](docs/DEPLOYMENT.md), [Architecture](docs/ARCHITECTURE.md), and [Security](docs/SECURITY.md) for production setup and the smoke-test checklist.

Interview Question
        │
        ▼
Candidate Answer
        │
        ▼
NEXUS API
        │
        ▼
Repository Context
        │
        ▼
Gemini
        │
        ▼
Structured Evaluation
        │
        ├── Technical Correctness
        ├── Relevance
        ├── Depth
        ├── Communication
        └── Project Knowledge
                │
                ▼
        Interview Feedback
