import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const conversations =
      await prisma.copilotConversation.findMany({
        where: { userId: user.id },
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          _count: {
            select: {
              messages: true,
            },
          },
          messages: {
            orderBy: {
              createdAt: "asc",
            },
            take: 1,
          },
        },
      });

    return NextResponse.json({
      conversations:
        conversations.map(
          (conversation) => ({
            id: conversation.id,
            title:
              conversation.title ??
              "New conversation",
            createdAt:
              conversation.createdAt,
            updatedAt:
              conversation.updatedAt,
            messageCount:
              conversation._count.messages,
            preview:
              conversation.messages[0]
                ?.content ?? "",
          })
        ),
    });
  } catch (error) {
    logger.error("Copilot history request failed", { route: "/api/copilot/history", error });

    return NextResponse.json(
      {
        error: "Unable to load Copilot history.",
      },
      {
        status: 500,
      }
    );
  }
}
