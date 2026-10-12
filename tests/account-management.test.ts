import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser, verifyPassword, hashPassword, updateUser, deleteUser, transaction, deleteSessions, deleteCookie, setCookie } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  transaction: vi.fn(),
  deleteSessions: vi.fn(),
  deleteCookie: vi.fn(),
  setCookie: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ delete: deleteCookie, set: setCookie })) }));
vi.mock("@/lib/auth", () => ({ getCurrentUser, verifyPassword, hashPassword }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: updateUser, delete: deleteUser },
    session: { deleteMany: deleteSessions },
    resume: { findUnique: vi.fn(async () => null) },
    gitHubAccount: { findUnique: vi.fn(async () => null) },
    $transaction: transaction,
  },
}));

import { PATCH as updateProfile } from "@/app/api/user/profile/route";
import { POST as changePassword } from "@/app/api/user/password/route";
import { DELETE as deleteAccount } from "@/app/api/user/account/route";
import { PATCH as updatePreferences } from "@/app/api/user/preferences/route";

describe("account management ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({ id: "user-a", email: "a@example.com", passwordHash: "hash-a" });
    verifyPassword.mockResolvedValue(true);
    hashPassword.mockResolvedValue("new-hash");
    updateUser.mockResolvedValue({ id: "user-a", name: "A", email: "a@example.com" });
    deleteUser.mockResolvedValue({ id: "user-a" });
    deleteSessions.mockResolvedValue({ count: 1 });
    transaction.mockImplementation((operations: unknown[]) => Promise.all(operations));
  });

  it("updates only the authenticated user's profile", async () => {
    const response = await updateProfile(new Request("http://localhost/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A" }),
    }));

    expect(response.status).toBe(200);
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "user-a" } }));
  });

  it("changes the authenticated user's password and revokes that user's sessions", async () => {
    const response = await changePassword(new Request("http://localhost/api/user/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: "old-password", newPassword: "new-password-123" }),
    }));

    expect(response.status).toBe(200);
    expect(transaction).toHaveBeenCalled();
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "user-a" } }));
    expect(deleteSessions).toHaveBeenCalledWith({ where: { userId: "user-a" } });
  });

  it("requires the current password before deleting the authenticated user's account", async () => {
    verifyPassword.mockResolvedValueOnce(false);
    const response = await deleteAccount(new Request("http://localhost/api/user/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong-password" }),
    }));

    expect(response.status).toBe(403);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("deletes only the authenticated user's account", async () => {
    const response = await deleteAccount(new Request("http://localhost/api/user/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "correct-password" }),
    }));

    expect(response.status).toBe(200);
    expect(deleteUser).toHaveBeenCalledWith({ where: { id: "user-a" } });
  });

  it("stores theme preferences on the authenticated account and sets the display cookie", async () => {
    const response = await updatePreferences(new Request("http://localhost/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: "light" }),
    }));

    expect(response.status).toBe(200);
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "user-a" }, data: { theme: "light" } }));
    expect(setCookie).toHaveBeenCalledWith("nexus_theme", "light", expect.objectContaining({ httpOnly: false, sameSite: "lax" }));
  });

  it("rejects unsupported theme values", async () => {
    const response = await updatePreferences(new Request("http://localhost/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: "neon" }),
    }));

    expect(response.status).toBe(400);
    expect(updateUser).not.toHaveBeenCalled();
  });
});

