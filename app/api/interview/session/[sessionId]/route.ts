import { NextResponse } from "next/server";

import { requireApiAuth, getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: Props,
) {
  const authError = await requireApiAuth();

  if (authError) {
    return authError;
  }

  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required." },
        { status: 400 },
      );
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const session =
      await prisma.interviewSession.findFirst({
        where: {
          id: sessionId,
          userId: user.id,
        },
        include: {
          answers: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    if (!session) {
      return NextResponse.json(
        { error: "Interview session not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      session: {
        id: session.id,
        project: session.project,
        category: session.category,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
      },
      answers: session.answers,
    });
  } catch (error) {
    logger.error("Interview session load error", {
      error,
    });

    return NextResponse.json(
      {
        error: "Unable to load interview session.",
      },
      { status: 500 },
    );
  }
}
