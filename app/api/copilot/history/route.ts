import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const conversations =
      await prisma.copilotConversation.findMany({
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
    console.error(
      "Copilot history error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Copilot history.",
      },
      {
        status: 500,
      }
    );
  }
}