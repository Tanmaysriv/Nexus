import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser, findMany, create, updateMany, findFirst, deleteMany } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(), findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn(), deleteMany: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: { dsaEntry: { findMany, create, updateMany, findFirst, deleteMany } } }));

import { GET, POST } from "@/app/api/dsa/route";
import { DELETE, PATCH } from "@/app/api/dsa/[entryId]/route";
import { calculateDsaReadinessAccuracy } from "@/lib/dsa-validation";

describe("DSA tracker tenant boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks(); getCurrentUser.mockResolvedValue({ id: "user-a" }); findMany.mockResolvedValue([]);
    create.mockResolvedValue({ id: "dsa-a", userId: "user-a" }); updateMany.mockResolvedValue({ count: 0 });
    findFirst.mockResolvedValue(null); deleteMany.mockResolvedValue({ count: 0 });
  });

  it("requires authentication and scopes entries and dashboard data", async () => {
    getCurrentUser.mockResolvedValue(null);
    expect((await GET(new Request("http://localhost/api/dsa"))).status).toBe(401);
    getCurrentUser.mockResolvedValue({ id: "user-a" });
    expect((await GET(new Request("http://localhost/api/dsa?topic=Arrays"))).status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "user-a", topic: "Arrays" }) }));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-a" }, select: expect.objectContaining({ isSolved: true }) }));
  });

  it("creates a problem under the authenticated user", async () => {
    const response = await POST(new Request("http://localhost/api/dsa", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: "Trees", problem: "User-entered problem title", difficulty: "MEDIUM", attempts: 2, accuracy: 75 }),
    }));
    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: "user-a", topic: "Trees", problem: "User-entered problem title" }) }));
  });

  it("does not update or delete another user's entry", async () => {
    const context = { params: Promise.resolve({ entryId: "entry-b" }) };
    const updated = await PATCH(new Request("http://localhost", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isSolved: true }) }), context);
    const deleted = await DELETE(new Request("http://localhost", { method: "DELETE" }), context);
    expect(updated.status).toBe(404); expect(deleted.status).toBe(404);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "entry-b", userId: "user-a" }, data: expect.objectContaining({ isSolved: true, solvedAt: expect.any(Date) }) });
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "entry-b", userId: "user-a" } });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("rejects unsupported topics, URLs, and out-of-range accuracy", async () => {
    const unsupported = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: "Other", problem: "Title", difficulty: "EASY" }) }));
    const unsafe = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: "Arrays", problem: "Title", difficulty: "EASY", problemUrl: "javascript:alert(1)" }) }));
    const accuracy = await POST(new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: "Arrays", problem: "Title", difficulty: "EASY", accuracy: 101 }) }));
    expect(unsupported.status).toBe(400); expect(unsafe.status).toBe(400); expect(accuracy.status).toBe(400); expect(create).not.toHaveBeenCalled();
  });

  it("uses only solved, user-entered accuracy as a DSA readiness signal", () => {
    expect(calculateDsaReadinessAccuracy([{ isSolved: true, accuracy: 80 }, { isSolved: true, accuracy: 60 }, { isSolved: false, accuracy: 0 }])).toBe(70);
    expect(calculateDsaReadinessAccuracy([{ isSolved: false, accuracy: 90 }])).toBeNull();
  });
});
