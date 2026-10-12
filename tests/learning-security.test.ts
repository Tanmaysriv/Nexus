import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser, findMany, upsert } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findMany: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: { learningProgress: { findMany, upsert } } }));

import { GET, POST } from "@/app/api/learning/route";

describe("learning progress tenant boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({ id: "user-a" });
    findMany.mockResolvedValue([]);
    upsert.mockResolvedValue({ userId: "user-a", skill: "React", status: "IN_PROGRESS" });
  });

  it("requires authentication and scopes learning history", async () => {
    getCurrentUser.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    getCurrentUser.mockResolvedValue({ id: "user-a" });
    expect((await GET()).status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-a" } }));
  });

  it("saves progress under the authenticated user's unique skill key", async () => {
    const response = await POST(new Request("http://localhost/api/learning", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: " React ", status: "IN_PROGRESS", resourceUrls: ["https://react.dev"], practiceNotes: "Built a small component" }),
    }));
    expect(response.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_skill: { userId: "user-a", skill: "React" } },
      create: expect.objectContaining({ userId: "user-a", skill: "React" }),
    }));
  });

  it("rejects unsafe links and invalid progress states", async () => {
    const unsafe = await POST(new Request("http://localhost/api/learning", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill: "React", resourceUrls: ["javascript:alert(1)"] }),
    }));
    const invalidStatus = await POST(new Request("http://localhost/api/learning", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skill: "React", status: "MASTERED" }),
    }));
    expect(unsafe.status).toBe(400);
    expect(invalidStatus.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });
});
