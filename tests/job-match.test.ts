import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser, requireApiAuth, findSessions, findResume, hasGitHubAccount, getGitHubRepos, analyzeRepositories, checkRateLimit } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  requireApiAuth: vi.fn(),
  findSessions: vi.fn(),
  findResume: vi.fn(),
  hasGitHubAccount: vi.fn(),
  getGitHubRepos: vi.fn(),
  analyzeRepositories: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser, requireApiAuth }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: { interviewSession: { findMany: findSessions }, resume: { findUnique: findResume } } }));
vi.mock("@/lib/github", () => ({ hasGitHubAccount, getGitHubRepos: getGitHubRepos, getGitHubAccount: vi.fn() }));
vi.mock("@/lib/repository-analyzer", () => ({ analyzeRepositories }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/resume-analysis", () => ({
  SKILL_PATTERNS: { React: /\breact\b/i, TypeScript: /\btypescript\b/i },
  extractResumeSkills: (text: string) => ["React", "TypeScript"].filter((skill) => new RegExp(skill, "i").test(text)).map((skill) => ({ skill, source: "Resume", excerpt: skill })),
  analyzeResume: () => ({ missingKeywords: ["TypeScript"] }),
}));

import { POST as matchJob } from "@/app/api/career/job-match/route";

describe("job matching evidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({ id: "user-a" });
    requireApiAuth.mockResolvedValue(null);
    findSessions.mockResolvedValue([]);
    findResume.mockResolvedValue({ rawText: "Experience building applications with React" });
    hasGitHubAccount.mockResolvedValue(false);
    getGitHubRepos.mockResolvedValue([]);
    analyzeRepositories.mockResolvedValue({});
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 19, retryAfterSeconds: 30, limit: 20 });
  });

  it("matches job requirements against the user's resume and reports evidence provenance", async () => {
    const response = await matchJob(new Request("http://localhost/api/career/job-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetRole: "Frontend Engineer", jobDescription: "React and TypeScript experience required" }),
    }));

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.matchedSkills).toContain("React");
    expect(result.evidenceBySkill.find((item: { skill: string }) => item.skill === "React").evidence).toEqual([
      { source: "Resume", detail: "Resume text contains evidence for React." },
    ]);
    expect(result.resumeKeywordGaps).toContain("TypeScript");
    expect(result.resumeOptimization.missingKeywords).toContain("TypeScript");
    expect(result.jobDescriptionProvided).toBe(true);
    expect(findSessions).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-a" } }));
  });

  it("rejects malformed or overlong job matching input", async () => {
    const response = await matchJob(new Request("http://localhost/api/career/job-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetRole: "x", jobDescription: "" }),
    }));
    expect(response.status).toBe(400);
    expect(findResume).not.toHaveBeenCalled();
  });
});
