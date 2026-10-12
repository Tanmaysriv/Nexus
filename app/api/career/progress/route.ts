import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { requireApiAuth, getCurrentUser } from "@/lib/auth";


import { prisma } from "@/lib/prisma";
import { getOrCreateCareerRoadmap } from "@/lib/career-roadmap";

export async function GET() {
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
    const roadmap =
      await getOrCreateCareerRoadmap(
        user.id,
        "software-engineer"
      );

    const totalItems =
      roadmap.items.length;

    const completedItems =
      roadmap.items.filter(
        (item) => item.completed
      ).length;

    const totalProgress =
      totalItems > 0
        ? Math.round(
            roadmap.items.reduce(
              (total, item) =>
                total + item.progress,
              0
            ) / totalItems
          )
        : 0;

    return NextResponse.json({
      roadmapId: roadmap.id,
      role: roadmap.role,

      progress: {
        overall: totalProgress,
        completed: completedItems,
        total: totalItems,
      },

      items: roadmap.items,
    });
  } catch (error) {
    logger.error("Career progress GET error", { error });

    return NextResponse.json(
      {
        error: "Unable to load roadmap progress.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request
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
    const body = await request.json();

    const {
      itemId,
      progress,
      completed,
    } = body;

    if (!itemId) {
      return NextResponse.json(
        {
          error: "itemId is required.",
        },
        {
          status: 400,
        }
      );
    }

    const item =
      await prisma.careerRoadmapItem.findFirst(
        {
          where: {
            id: itemId,
            roadmap: {
              userId: user.id,
            },
          },
        }
      );

    if (!item) {
      return NextResponse.json(
        {
          error:
            "Roadmap item not found.",
        },
        {
          status: 404,
        }
      );
    }

    const nextProgress =
      typeof progress === "number"
        ? Math.max(
            0,
            Math.min(
              100,
              Math.round(progress)
            )
          )
        : item.progress;

    const nextCompleted =
      typeof completed === "boolean"
        ? completed
        : nextProgress >= 100;

    const updated =
      await prisma.careerRoadmapItem.update(
        {
          where: {
            id: itemId,
            roadmap: {
              userId: user.id,
            },
          },
          data: {
            progress: nextProgress,
            completed: nextCompleted,
          },
        }
      );

    return NextResponse.json({
      success: true,
      item: updated,
    });
  } catch (error) {
    logger.error("Career progress PATCH error", { error });

    return NextResponse.json(
      {
        error: "Unable to update roadmap progress.",
      },
      {
        status: 500,
      }
    );
  }
}

