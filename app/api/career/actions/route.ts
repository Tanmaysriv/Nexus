import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getNexusContext } from "@/lib/nexus-context";
import { generateCareerActions } from "@/lib/action-engine";
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

    const context = await getNexusContext(user.id);
    const actions = generateCareerActions(context);

    for (const action of actions) {
      await prisma.careerAction.upsert({
        where: {
          userId_actionId: {
            userId: user.id,
            actionId: action.id,
          },
        },
        create: {
          userId: user.id,
          actionId: action.id,
          title: action.title,
          priority: action.priority,
          category: action.category,
          reason: action.reason,
          impact: action.impact,
          steps: action.steps,
          relatedSkill: action.relatedSkill,
          relatedProject: action.relatedProject,
        },
        update: {
          title: action.title,
          priority: action.priority,
          category: action.category,
          reason: action.reason,
          impact: action.impact,
          steps: action.steps,
          relatedSkill: action.relatedSkill,
          relatedProject: action.relatedProject,
        },
      });
    }

    const savedActions = await prisma.careerAction.findMany({
      where: {
        userId: user.id,
        actionId: {
          in: actions.map((action) => action.id),
        },
      },
      orderBy: [
        {
          priority: "desc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    return NextResponse.json({
      actions: savedActions,
      count: savedActions.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Career actions error", { error });

    return NextResponse.json(
      {
        error: "Unable to generate career actions.",
      },
      {
        status: 500,
      }
    );
  }
}

