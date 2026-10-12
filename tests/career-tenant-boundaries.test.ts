import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser, requireApiAuth, findAction, updateAction, findRoadmapItem, updateRoadmapItem, findSkillAnalyses, hasGitHubAccount, getGitHubStats, getGitHubActivity } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  requireApiAuth: vi.fn(),
  findAction: vi.fn(),
  updateAction: vi.fn(),
  findRoadmapItem: vi.fn(),
  updateRoadmapItem: vi.fn(),
  findSkillAnalyses: vi.fn(),
  hasGitHubAccount: vi.fn(),
  getGitHubStats: vi.fn(),
  getGitHubActivity: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser, requireApiAuth }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    careerAction: { findUnique: findAction, update: updateAction },
    careerRoadmapItem: { findFirst: findRoadmapItem, update: updateRoadmapItem },
    skillGapAnalysis: { findMany: findSkillAnalyses },
  },
}));
vi.mock("@/lib/github", () => ({ hasGitHubAccount, getGitHubStats, getGitHubActivity }));

import { PATCH as updateCareerAction } from "@/app/api/career/actions/[actionId]/route";
import { PATCH as updateRoadmapProgress } from "@/app/api/career/progress/route";
import { GET as getGitHub } from "@/app/api/github/route";
import { GET as getSkillGapHistory } from "@/app/api/skill-gap/route";

describe("career and GitHub tenant boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({ id: "user-a" });
    requireApiAuth.mockResolvedValue(null);
    findAction.mockResolvedValue(null);
    findRoadmapItem.mockResolvedValue(null);
    updateAction.mockResolvedValue({});
    updateRoadmapItem.mockResolvedValue({});
    findSkillAnalyses.mockResolvedValue([]);
    hasGitHubAccount.mockResolvedValue(false);
    getGitHubStats.mockResolvedValue({ profile: { login: "user-a" } });
    getGitHubActivity.mockResolvedValue([]);
  });

  it("does not modify another user's career action", async () => {
    const response = await updateCareerAction(new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress: 50 }),
    }), { params: Promise.resolve({ actionId: "action-b" }) });

    expect(response.status).toBe(404);
    expect(findAction).toHaveBeenCalledWith({ where: { userId_actionId: { userId: "user-a", actionId: "action-b" } } });
    expect(updateAction).not.toHaveBeenCalled();
  });

  it("does not modify another user's roadmap item", async () => {
    const response = await updateRoadmapProgress(new Request("http://localhost", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: "item-b", progress: 100 }),
    }));

    expect(response.status).toBe(404);
    expect(findRoadmapItem).toHaveBeenCalledWith({ where: { id: "item-b", roadmap: { userId: "user-a" } } });
    expect(updateRoadmapItem).not.toHaveBeenCalled();
  });

  it("checks GitHub connection state only for the current user", async () => {
    const response = await getGitHub();
    expect(response.status).toBe(200);
    expect(hasGitHubAccount).toHaveBeenCalledWith("user-a");
    expect(getGitHubStats).not.toHaveBeenCalled();
  });

  it("returns skill-gap history scoped to the current user", async () => {
    const response = await getSkillGapHistory();
    expect(response.status).toBe(200);
    expect(findSkillAnalyses).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-a" } }));
  });
});
