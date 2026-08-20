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

GITHUB_USERNAME=your_github_username

GEMINI_API_KEY=your_gemini_api_key

GEMINI_MODEL=gemini-3.6-flash

pnpm dev
http://localhost:3000

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