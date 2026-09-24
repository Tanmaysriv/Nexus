import { NextResponse } from "next/server";
import { requireApiAuth, getCurrentUser } from "@/lib/auth";


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
  const authError = await requireApiAuth();
  if (authError) {
    return authError;
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const { conversationId } =
      await context.params;

    const conversation =
      await prisma.copilotConversation.findUnique({
        where: {
          id: conversationId,
          userId: user.id,
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
    logger.error("Copilot conversation error", { error });

    return NextResponse.json(
      {
        error: "Unable to load conversation.",
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
  const authError = await requireApiAuth();
  if (authError) {
    return authError;
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const { conversationId } =
      await context.params;

    const conversation =
      await prisma.copilotConversation.findUnique({
        where: {
          id: conversationId,
          userId: user.id,
        },
        select: {
          id: true,
        },
      });

    if (!conversation) {
      return NextResponse.json(
        {
          error: "Conversation not found.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.copilotConversation.delete({
      where: {
        id: conversation.id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error("Delete Copilot conversation error", { error });

    return NextResponse.json(
      {
        error: "Unable to delete conversation.",
      },
      {
        status: 500,
      }
    );
  }
}






