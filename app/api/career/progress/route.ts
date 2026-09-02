import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const DEFAULT_ROADMAP = [
  {
    skill: "DSA",
    priority: "Critical",
    reason:
      "Core requirement for software engineering interviews.",
    focus: [
      "Arrays and Strings",
      "Hashing",
      "Two Pointers",
      "Stacks and Queues",
      "Trees and Graphs",
      "Dynamic Programming",
      "Problem solving",
    ],
  },
  {
    skill: "OOP",
    priority: "Critical",
    reason:
      "Important for writing maintainable and scalable software.",
    focus: [
      "Classes and Objects",
      "Inheritance",
      "Polymorphism",
      "Encapsulation",
      "Abstraction",
      "SOLID principles",
    ],
  },
  {
    skill: "System Design",
    priority: "High",
    reason:
      "Builds the ability to reason about scalable systems.",
    focus: [
      "Scalability",
      "Caching",
      "Load balancing",
      "Databases",
      "API design",
      "Distributed systems",
    ],
  },
  {
    skill: "Testing",
    priority: "High",
    reason:
      "Strong engineering projects require reliable automated testing.",
    focus: [
      "Unit testing",
      "Integration testing",
      "API testing",
      "Mocking",
      "Test coverage",
      "CI testing",
    ],
  },
  {
    skill: "Python",
    priority: "High",
    reason:
      "Adds versatility for backend, automation, data and AI roles.",
    focus: [
      "Python fundamentals",
      "OOP",
      "Modules",
      "Virtual environments",
      "FastAPI",
      "Automation",
    ],
  },
  {
    skill: "Git",
    priority: "Medium",
    reason:
      "Essential for professional software development workflows.",
    focus: [
      "Branching",
      "Merging",
      "Rebasing",
      "Pull requests",
      "Conflict resolution",
      "Git workflows",
    ],
  },
  {
    skill: "REST APIs",
    priority: "High",
    reason:
      "Important for modern frontend/backend application development.",
    focus: [
      "HTTP methods",
      "Status codes",
      "Authentication",
      "Validation",
      "Pagination",
      "API security",
    ],
  },
];

async function getOrCreateRoadmap(role: string) {
  let roadmap = await prisma.careerRoadmap.findFirst({
    where: { role },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (roadmap) {
    return roadmap;
  }

  roadmap = await prisma.careerRoadmap.create({
    data: {
      role,
      items: {
        create: DEFAULT_ROADMAP.map((item) => ({
          skill: item.skill,
          priority: item.priority,
          reason: item.reason,
          focus: item.focus,
        })),
      },
    },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return roadmap;
}

export async function GET() {
  try {
    const roadmap =
      await getOrCreateRoadmap(
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
    console.error(
      "Career progress GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load roadmap progress.",
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
      await prisma.careerRoadmapItem.findUnique(
        {
          where: {
            id: itemId,
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
    console.error(
      "Career progress PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update roadmap progress.",
      },
      {
        status: 500,
      }
    );
  }
}