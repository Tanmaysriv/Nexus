import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser, findMany, create, updateMany, findFirst, deleteMany } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
  findFirst: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: { application: { findMany, create, updateMany, findFirst, deleteMany } } }));

import { GET, POST } from "@/app/api/applications/route";
import { DELETE, PATCH } from "@/app/api/applications/[applicationId]/route";

describe("application tracker tenant boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({ id: "user-a" });
    findMany.mockResolvedValue([]);
    create.mockResolvedValue({ id: "app-a", company: "Acme", role: "Engineer", userId: "user-a" });
    updateMany.mockResolvedValue({ count: 0 });
    findFirst.mockResolvedValue(null);
    deleteMany.mockResolvedValue({ count: 0 });
  });

  it("requires authentication for reads and writes", async () => {
    getCurrentUser.mockResolvedValue(null);
    expect((await GET(new Request("http://localhost/api/applications"))).status).toBe(401);
    expect((await POST(new Request("http://localhost/api/applications", { method: "POST", body: "{}" }))).status).toBe(401);
    expect((await PATCH(new Request("http://localhost", { method: "PATCH", body: "{}" }), { params: Promise.resolve({ applicationId: "app-b" }) })).status).toBe(401);
    expect((await DELETE(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ applicationId: "app-b" }) })).status).toBe(401);
    expect(create).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("lists only the authenticated user's applications and scopes stats", async () => {
    const response = await GET(new Request("http://localhost/api/applications?status=INTERVIEW&search=acme"));
    expect(response.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "user-a" }) }));
    expect(findMany).toHaveBeenCalledWith({ where: { userId: "user-a" }, select: { status: true, interviewAt: true } });
  });

  it("creates an application owned by the authenticated user", async () => {
    const response = await POST(new Request("http://localhost/api/applications", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company: " Acme ", role: "Engineer" }),
    }));
    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: "user-a", company: "Acme", role: "Engineer" }) }));
  });

  it("does not update an application owned by another user", async () => {
    const response = await PATCH(new Request("http://localhost", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "OFFER" }),
    }), { params: Promise.resolve({ applicationId: "app-b" }) });
    expect(response.status).toBe(404);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "app-b", userId: "user-a" }, data: { status: "OFFER" } });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("does not delete an application owned by another user", async () => {
    const response = await DELETE(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ applicationId: "app-b" }) });
    expect(response.status).toBe(404);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "app-b", userId: "user-a" } });
  });

  it("rejects invalid status and unsafe job URLs", async () => {
    const invalidStatus = await POST(new Request("http://localhost", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company: "Acme", role: "Engineer", status: "HIRED" }),
    }));
    const unsafeUrl = await POST(new Request("http://localhost", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company: "Acme", role: "Engineer", jobUrl: "javascript:alert(1)" }),
    }));
    expect(invalidStatus.status).toBe(400);
    expect(unsafeUrl.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
