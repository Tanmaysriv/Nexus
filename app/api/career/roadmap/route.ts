import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getGitHubRepos } from "@/lib/github";

type RoadmapItem = {
  skill: string;
  priority: "Critical" | "High" | "Medium";
  reason: string;
  focus: string[];
};

const ROADMAP: Record<
  string,
  Omit<RoadmapItem, "skill"> & {
    aliases?: string[];
  }
> = {
  DSA: {
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

  OOP: {
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

  "System Design": {
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

  Testing: {
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

  Python: {
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

  Git: {
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

  "REST APIs": {
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

  Docker: {
    priority: "Medium",
    reason:
      "Improves deployment and environment consistency.",
    focus: [
      "Dockerfiles",
      "Images",
      "Containers",
      "Volumes",
      "Networks",
      "Docker Compose",
    ],
  },

  PostgreSQL: {
    priority: "Medium",
    reason:
      "Useful for production backend and database-driven applications.",
    focus: [
      "Schema design",
      "Indexes",
      "Joins",
      "Transactions",
      "Query optimization",
      "Normalization",
    ],
  },
};

function getFallbackRoadmap(
  missingSkills: string[]
): RoadmapItem[] {
  return missingSkills
    .map((skill) => {
      const item =
        ROADMAP[skill];

      if (!item) {
        return {
          skill,
          priority: "Medium" as const,
          reason:
            `Improve ${skill} to strengthen your target-role readiness.`,
          focus: [
            `${skill} fundamentals`,
            `${skill} practical projects`,
            `${skill} interview questions`,
          ],
        };
      }

      return {
        skill,
        priority: item.priority,
        reason: item.reason,
        focus: item.focus,
      };
    })
    .slice(0, 8);
}

export async function GET() {
  try {
    const sessions =
      await prisma.interviewSession.findMany(
        {
          include: {
            answers: true,
          },
        }
      );

    const answers =
      sessions.flatMap(
        (session) =>
          session.answers
      );

    const interviewScore =
      answers.length > 0
        ? Math.round(
            answers.reduce(
              (total, answer) =>
                total +
                answer.overall,
              0
            ) /
              answers.length
          )
        : 0;

    const repos =
      await getGitHubRepos();

    const activeRepos =
      repos.filter(
        (repo) =>
          !repo.fork &&
          !repo.archived
      );

    /*
     * Skills that are already clearly
     * represented by repository evidence.
     *
     * The roadmap intentionally focuses
     * on development gaps instead of
     * attempting to infer every skill.
     */
    const repositoryLanguages =
      new Set(
        activeRepos
          .map(
            (repo) =>
              repo.language
          )
          .filter(Boolean)
      );

    const missingSkills = [
      "DSA",
      "OOP",
      "System Design",
      "Testing",
      "Python",
      "Git",
      "REST APIs",
    ].filter(
      (skill) => {
        if (
          skill === "Python" &&
          repositoryLanguages.has(
            "Python"
          )
        ) {
          return false;
        }

        return true;
      }
    );

    const roadmap =
      getFallbackRoadmap(
        missingSkills
      );

    const estimatedWeeks =
      roadmap.length <= 3
        ? 6
        : roadmap.length <= 5
          ? 10
          : 14;

    return NextResponse.json({
      targetRole:
        "Software Engineer",

      currentInterviewScore:
        interviewScore,

      repositoryCount:
        activeRepos.length,

      roadmap: {
        estimatedWeeks,

        items: roadmap,
      },

      nextAction:
        roadmap.length > 0
          ? `Start with ${roadmap[0].skill}.`
          : "Continue practicing technical interviews.",
    });
  } catch (error) {
    console.error(
      "Career roadmap error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate career roadmap.",
      },
      {
        status: 500,
      }
    );
  }
}