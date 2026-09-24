import { NextResponse } from "next/server";

import { requireApiAuth, getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNexusContext } from "@/lib/nexus-context";
import { askCareerCopilot } from "@/lib/ai-career-copilot";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const authError = await requireApiAuth();

  if (authError) {
    return authError;
  }
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const rateLimit = await checkRateLimit(
    `copilot:user:${user.id}:ip:${getClientKey(request)}`,
    20,
    10 * 60 * 1000,
  );

  if (rateLimit.serviceUnavailable) {
    return NextResponse.json(
      { error: "Copilot service temporarily unavailable." },
      { status: 503, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "Too many Copilot requests. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }
  try {
    const body = await request.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const conversationId =
      typeof body.conversationId === "string"
        ? body.conversationId.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "Message is too long." },
        { status: 400 },
      );
    }

    /*
     * --------------------------------------------------
     * Conversation
     * --------------------------------------------------
     */
    let conversation;

    if (conversationId) {
      conversation = await prisma.copilotConversation.findUnique({
        where: {
          id: conversationId,
          userId: user.id,
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found." },
          { status: 404 },
        );
      }
    } else {
      conversation = await prisma.copilotConversation.create({
        data: {
          userId: user.id,
          title:
            message.length > 80
              ? `${message.slice(0, 77)}...`
              : message,
        },
      });
    }

    /*
     * --------------------------------------------------
     * Previous conversation context
     *
     * Load the history BEFORE saving the current user
     * message so the current message is not duplicated
     * inside the conversation history.
     * --------------------------------------------------
     */
    const previousMessages =
      await prisma.copilotMessage.findMany({
        where: {
          conversationId: conversation.id,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 20,
      });

    /*
     * --------------------------------------------------
     * Save user message
     * --------------------------------------------------
     */
    await prisma.copilotMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    /*
     * --------------------------------------------------
     * NEXUS career context
     * --------------------------------------------------
     */

    const context = await getNexusContext(user.id);

    /*
     * --------------------------------------------------
     * Generate response with conversation memory
     * --------------------------------------------------
     */
    const response = await askCareerCopilot({
      message,
      context,
      history: previousMessages.map((item) => ({
        role:
          item.role === "assistant"
            ? "assistant"
            : "user",
        content: item.content,
      })),
    });

    /*
     * --------------------------------------------------
     * Save AI response
     * --------------------------------------------------
     */
    const assistantMessage =
      await prisma.copilotMessage.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: response.answer,
        },
      });

    return NextResponse.json({
      ...response,
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      historyCount: previousMessages.length + 2,
    });
  } catch (error) {
    logger.error("Career Copilot request failed", {
      userId: user.id,
      error,
    });

    return NextResponse.json(
      {
        error: "Unable to process Copilot request.",
      },
      { status: 500 },
    );
  }
}












