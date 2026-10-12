import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser, requireApiAuth, findConversations, findSessions, findConversation, findSession, deleteConversation } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  requireApiAuth: vi.fn(),
  findConversations: vi.fn(),
  findSessions: vi.fn(),
  findConversation: vi.fn(),
  findSession: vi.fn(),
  deleteConversation: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser, requireApiAuth }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    copilotConversation: { findMany: findConversations, findUnique: findConversation, delete: deleteConversation },
    interviewSession: { findMany: findSessions, findFirst: findSession },
  },
}));

import { GET as getCopilotHistory } from "@/app/api/copilot/history/route";
import { GET as getInterviewAnalytics } from "@/app/api/interview/analytics/route";
import { GET as getConversation, DELETE as deleteConversationRoute } from "@/app/api/copilot/[conversationId]/route";
import { GET as getInterviewSession } from "@/app/api/interview/session/[sessionId]/route";

describe("user-owned history endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiAuth.mockResolvedValue(null);
    findConversations.mockResolvedValue([]);
    findSessions.mockResolvedValue([]);
    findConversation.mockResolvedValue(null);
    findSession.mockResolvedValue(null);
    deleteConversation.mockResolvedValue({ id: "conversation-b" });
  });

  it("does not query Copilot history for an anonymous request", async () => {
    getCurrentUser.mockResolvedValue(null);

    const response = await getCopilotHistory();

    expect(response.status).toBe(401);
    expect(findConversations).not.toHaveBeenCalled();
  });

  it("limits Copilot history to the authenticated user", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-a" });

    const response = await getCopilotHistory();

    expect(response.status).toBe(200);
    expect(findConversations).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-a" } })
    );
  });

  it("does not query interview analytics for an anonymous request", async () => {
    getCurrentUser.mockResolvedValue(null);

    const response = await getInterviewAnalytics();

    expect(response.status).toBe(401);
    expect(findSessions).not.toHaveBeenCalled();
  });

  it("limits interview analytics to the authenticated user", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-a" });

    const response = await getInterviewAnalytics();

    expect(response.status).toBe(200);
    expect(findSessions).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-a" } })
    );
  });

  it("does not reveal a Copilot conversation owned by another user", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-a" });
    const response = await getConversation(new Request("http://localhost"), {
      params: Promise.resolve({ conversationId: "conversation-b" }),
    });

    expect(response.status).toBe(404);
    expect(findConversation).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "conversation-b", userId: "user-a" },
    }));
  });

  it("cannot delete another user's Copilot conversation", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-a" });
    const response = await deleteConversationRoute(new Request("http://localhost"), {
      params: Promise.resolve({ conversationId: "conversation-b" }),
    });

    expect(response.status).toBe(404);
    expect(deleteConversation).not.toHaveBeenCalled();
    expect(findConversation).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "conversation-b", userId: "user-a" },
    }));
  });

  it("does not reveal an interview session owned by another user", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-a" });
    const response = await getInterviewSession(new Request("http://localhost"), {
      params: Promise.resolve({ sessionId: "session-b" }),
    });

    expect(response.status).toBe(404);
    expect(findSession).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "session-b", userId: "user-a" },
    }));
  });
});
