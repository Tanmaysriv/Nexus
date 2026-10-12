import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser, skillFindMany, sessionFindMany, dsaFindMany, roadmapFindMany, applicationFindMany, githubFindUnique } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  skillFindMany: vi.fn(),
  sessionFindMany: vi.fn(),
  dsaFindMany: vi.fn(),
  roadmapFindMany: vi.fn(),
  applicationFindMany: vi.fn(),
  githubFindUnique: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  skillGapAnalysis: { findMany: skillFindMany },
  interviewSession: { findMany: sessionFindMany },
  dsaEntry: { findMany: dsaFindMany },
  careerRoadmap: { findMany: roadmapFindMany },
  application: { findMany: applicationFindMany },
  gitHubAccount: { findUnique: githubFindUnique },
} }));

import { GET } from "@/app/api/analytics/route";

describe("career analytics tenant boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({ id: "user-a" });
    skillFindMany.mockResolvedValue([]);
    sessionFindMany.mockResolvedValue([]);
    dsaFindMany.mockResolvedValue([]);
    roadmapFindMany.mockResolvedValue([]);
    applicationFindMany.mockResolvedValue([]);
    githubFindUnique.mockResolvedValue(null);
  });

  it("requires authentication", async () => {
    getCurrentUser.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(skillFindMany).not.toHaveBeenCalled();
  });

  it("scopes every data source to the current user and reports empty state without invented history", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    for (const query of [skillFindMany, sessionFindMany, dsaFindMany, roadmapFindMany, applicationFindMany, githubFindUnique]) {
      expect(query).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-a" } }));
    }
    const body = await response.json();
    expect(body.summary.averageInterviewScore).toBeNull();
    expect(body.timeline).toEqual([]);
    expect(body.availability.readinessHistory).toBe(false);
  });

  it("aggregates only saved interview, DSA, and application records", async () => {
    const date = new Date("2026-02-12T00:00:00Z");
    sessionFindMany.mockResolvedValue([{ createdAt: date, answers: [{ overall: 80, createdAt: date }, { overall: 60, createdAt: date }] }]);
    dsaFindMany.mockResolvedValue([{ topic: "Trees", difficulty: "EASY", isSolved: true, solvedAt: date, updatedAt: date }]);
    applicationFindMany.mockResolvedValue([{ status: "INTERVIEW", createdAt: date, interviewAt: date }]);
    const response = await GET();
    const body = await response.json();
    expect(body.summary.averageInterviewScore).toBe(70);
    expect(body.summary.dsaSolved).toBe(1);
    expect(body.summary.applications).toBe(1);
    expect(body.timeline).toEqual([expect.objectContaining({ month: "2026-02", interviewScore: 70, dsaSolved: 1, applications: 1 })]);
  });
});
