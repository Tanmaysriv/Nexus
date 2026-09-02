import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    actionId: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { actionId } =
      await context.params;

    const action =
      await prisma.careerAction.findUnique({
        where: {
          actionId,
        },
      });

    if (!action) {
      return NextResponse.json(
        {
          status: "Pending",
          progress: 0,
        }
      );
    }

    return NextResponse.json(action);
  } catch (error) {
    console.error(
      "Career action GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load action.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { actionId } =
      await context.params;

    const body = await request.json();

    const status =
      typeof body.status === "string"
        ? body.status
        : undefined;

    const progress =
      typeof body.progress === "number"
        ? Math.max(
            0,
            Math.min(100, Math.round(body.progress))
          )
        : undefined;

    if (
      status &&
      ![
        "Pending",
        "In Progress",
        "Completed",
      ].includes(status)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid action status.",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await prisma.careerAction.findUnique({
        where: {
          actionId,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Action has not been registered yet.",
        },
        {
          status: 404,
        }
      );
    }

    const nextStatus =
      status ??
      (progress !== undefined &&
      progress >= 100
        ? "Completed"
        : progress !== undefined &&
          progress > 0
        ? "In Progress"
        : existing.status);

    const nextProgress =
      nextStatus === "Completed"
        ? 100
        : progress ?? existing.progress;

    const updated =
      await prisma.careerAction.update({
        where: {
          actionId,
        },
        data: {
          status: nextStatus,
          progress: nextProgress,

          startedAt:
            nextStatus !== "Pending"
              ? existing.startedAt ??
                new Date()
              : existing.startedAt,

          completedAt:
            nextStatus === "Completed"
              ? existing.completedAt ??
                new Date()
              : null,
        },
      });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      "Career action PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update action.",
      },
      {
        status: 500,
      }
    );
  }
}