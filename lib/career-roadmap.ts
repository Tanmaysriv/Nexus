import { prisma } from "@/lib/prisma";

const DEFAULT_ROADMAP = [
  {
    skill: "DSA",
    priority: "Critical",
    reason: "Core requirement for software engineering interviews.",
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
    reason: "Important for writing maintainable and scalable software.",
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
    reason: "Builds the ability to reason about scalable systems.",
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
    reason: "Strong engineering projects require reliable automated testing.",
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
    reason: "Adds versatility for backend, automation, data and AI roles.",
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
    reason: "Essential for professional software development workflows.",
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
    reason: "Important for modern frontend/backend application development.",
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

export async function getOrCreateCareerRoadmap(
  userId: string,
  role: string,
) {
  const existing = await prisma.careerRoadmap.findFirst({
    where: { userId, role },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (existing) {
    return existing;
  }

  const skillAnalysis = await prisma.skillGapAnalysis.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { results: true },
  });

  const skillResults =
    skillAnalysis?.results &&
    typeof skillAnalysis.results === "object" &&
    !Array.isArray(skillAnalysis.results) &&
    Array.isArray(
      (skillAnalysis.results as { skills?: unknown }).skills,
    )
      ? (
          skillAnalysis.results as {
            skills: {
              skill?: unknown;
              gap?: unknown;
              priority?: unknown;
              recommendedLearning?: unknown;
            }[];
          }
        ).skills
      : [];

  const evidenceBasedItems = skillResults
    .filter(
      (item) =>
        typeof item.skill === "string" &&
        item.gap === "No direct evidence found",
    )
    .map((item) => {
      const template = DEFAULT_ROADMAP.find(
        (entry) => entry.skill === item.skill,
      );

      return {
        skill: item.skill as string,
        priority:
          typeof item.priority === "string"
            ? item.priority
            : "Medium",
        reason:
          typeof item.recommendedLearning === "string"
            ? item.recommendedLearning
            : `No direct resume or GitHub evidence was found for ${item.skill} in your target job analysis.`,
        focus:
          template?.focus ??
          [
            `Practice ${item.skill}`,
            `Build a project demonstrating ${item.skill}`,
            `Review your evidence for ${item.skill}`,
          ],
      };
    });

  return prisma.careerRoadmap.create({
    data: {
      userId,
      role,
      items: {
        create: evidenceBasedItems.map((item) => ({
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
}
