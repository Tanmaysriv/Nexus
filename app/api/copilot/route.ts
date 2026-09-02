import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
  getNexusContext,
} from "@/lib/nexus-context";

import {
  askCareerCopilot,
} from "@/lib/ai-career-copilot";

export async function POST(
  request: Request
) {
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
        {
          error: "Message is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        {
          error: "Message is too long.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * Conversation
     * --------------------------------------------------
     */

    let conversation;

    if (conversationId) {
      conversation =
        await prisma.copilotConversation.findUnique({
          where: {
            id: conversationId,
          },
        });

      if (!conversation) {
        return NextResponse.json(
          {
            error:
              "Conversation not found.",
          },
          {
            status: 404,
          }
        );
      }
    } else {
      conversation =
        await prisma.copilotConversation.create({
          data: {
            title:
              message.length > 80
                ? `${message.slice(0, 77)}...`
                : message,
          },
        });
    }

    /*
     * --------------------------------------------------
     * Save user message
     * --------------------------------------------------
     */

    await prisma.copilotMessage.create({
      data: {
        conversationId:
          conversation.id,
        role: "user",
        content: message,
      },
    });

    /*
     * --------------------------------------------------
     * NEXUS career context
     * --------------------------------------------------
     */

    const context =
      await getNexusContext();

    /*
     * --------------------------------------------------
     * Previous conversation context
     * --------------------------------------------------
     */

    const previousMessages =
      await prisma.copilotMessage.findMany({
        where: {
          conversationId:
            conversation.id,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 20,
      });

    /*
     * Keep the existing Copilot
     * interface intact.
     *
     * The current user message is
     * already stored and remains the
     * source message for Gemini.
     */

    const response =
      await askCareerCopilot({
        message,
        context,
      });

    /*
     * --------------------------------------------------
     * Save AI response
     * --------------------------------------------------
     */

    const assistantMessage =
      await prisma.copilotMessage.create({
        data: {
          conversationId:
            conversation.id,
          role: "assistant",
          content:
            response.answer,
        },
      });

    return NextResponse.json({
      ...response,

      conversationId:
        conversation.id,

      messageId:
        assistantMessage.id,

      historyCount:
        previousMessages.length + 1,
    });
  } catch (error) {
    console.error(
      "Career Copilot error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process Copilot request.",
      },
      {
        status: 500,
      }
    );
  }
}