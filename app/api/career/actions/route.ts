import { NextResponse } from "next/server";

import { getNexusContext } from "@/lib/nexus-context";
import { generateCareerActions } from "@/lib/action-engine";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const context =
      await getNexusContext();

    const actions =
      generateCareerActions(context);

    for (const action of actions) {
      await prisma.careerAction.upsert({
        where: {
          actionId: action.id,
        },

        create: {
          actionId: action.id,
          title: action.title,
          priority: action.priority,
          category: action.category,
          reason: action.reason,
          impact: action.impact,
          steps: action.steps,
          relatedSkill:
            action.relatedSkill,
          relatedProject:
            action.relatedProject,
        },

        update: {
          title: action.title,
          priority: action.priority,
          category: action.category,
          reason: action.reason,
          impact: action.impact,
          steps: action.steps,
          relatedSkill:
            action.relatedSkill,
          relatedProject:
            action.relatedProject,
        },
      });
    }

    const savedActions =
      await prisma.careerAction.findMany({
        where: {
          actionId: {
            in: actions.map(
              (action) => action.id
            ),
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
      generatedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Career actions error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate career actions.",
      },
      {
        status: 500,
      }
    );
  }
}