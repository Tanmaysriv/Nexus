import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { conversationId } =
      await context.params;

    const conversation =
      await prisma.copilotConversation.findUnique({
        where: {
          id: conversationId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
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

    return NextResponse.json({
      id: conversation.id,
      title:
        conversation.title ??
        "New conversation",
      createdAt:
        conversation.createdAt,
      updatedAt:
        conversation.updatedAt,
      messages:
        conversation.messages,
    });
  } catch (error) {
    console.error(
      "Copilot conversation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load conversation.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { conversationId } =
      await context.params;

    await prisma.copilotConversation.delete({
      where: {
        id: conversationId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Delete Copilot conversation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete conversation.",
      },
      {
        status: 500,
      }
    );
  }
}