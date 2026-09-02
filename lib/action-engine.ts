import type { NexusContext } from "@/lib/nexus-context";

export type ActionPriority =
  | "Critical"
  | "High"
  | "Medium";

export type CareerAction = {
  id: string;
  title: string;
  priority: ActionPriority;
  category:
    | "Interview"
    | "Project"
    | "Roadmap"
    | "Career";
  reason: string;
  impact: string;
  steps: string[];
  relatedSkill?: string;
  relatedProject?: string;
};

function priorityRank(
  priority: ActionPriority
) {
  if (priority === "Critical") return 3;
  if (priority === "High") return 2;
  return 1;
}

function sortActions(
  actions: CareerAction[]
) {
  return [...actions].sort(
    (a, b) =>
      priorityRank(b.priority) -
      priorityRank(a.priority)
  );
}

export function generateCareerActions(
  context: NexusContext
): CareerAction[] {
  const actions: CareerAction[] = [];

  /*
   * --------------------------------------------------
   * Interview actions
   * --------------------------------------------------
   */

  if (
    context.interviews.questions === 0
  ) {
    actions.push({
      id: "start-interview-practice",
      title:
        "Complete your first technical interview",
      priority: "Critical",
      category: "Interview",
      reason:
        "NEXUS does not have enough interview evidence to evaluate your technical performance.",
      impact:
        "Creates the first measurable baseline for technical correctness, depth, communication, and project knowledge.",
      steps: [
        "Start a Software Engineer interview.",
        "Answer at least 5 technical questions.",
        "Review the AI evaluation after the session.",
      ],
    });
  } else {
    if (
      context.interviews.averageScore < 50
    ) {
      actions.push({
        id: "improve-interview-score",
        title:
          "Improve technical interview performance",
        priority: "Critical",
        category: "Interview",
        reason:
          `Your current average interview score is ${context.interviews.averageScore}/100.`,
        impact:
          "Improving interview performance directly increases your readiness for technical hiring rounds.",
        steps: [
          "Practice 5 technical questions per session.",
          "Review every weak answer.",
          "Repeat questions where your technical score is low.",
        ],
      });
    }

    if (
      context.interviews.depth < 60
    ) {
      actions.push({
        id: "improve-interview-depth",
        title:
          "Improve technical explanation depth",
        priority: "High",
        category: "Interview",
        reason:
          `Your interview depth score is ${context.interviews.depth}/100.`,
        impact:
          "Strong depth demonstrates that you understand implementation details instead of only knowing surface-level concepts.",
        steps: [
          "Explain architecture before implementation details.",
          "Discuss trade-offs and alternatives.",
          "Explain edge cases and failure scenarios.",
        ],
        relatedSkill:
          "System Design",
      });
    }

    if (
      context.interviews.communication < 60
    ) {
      actions.push({
        id: "improve-communication",
        title:
          "Improve technical communication",
        priority: "High",
        category: "Interview",
        reason:
          `Your communication score is ${context.interviews.communication}/100.`,
        impact:
          "Clear technical communication is important for both interviews and collaborative engineering work.",
        steps: [
          "Structure answers as problem → approach → result.",
          "Avoid unnecessary implementation details.",
          "Practice explaining one project in under two minutes.",
        ],
      });
    }

    if (
      context.interviews.projectKnowledge < 60
    ) {
      actions.push({
        id: "improve-project-knowledge",
        title:
          "Deepen project interview knowledge",
        priority: "High",
        category: "Interview",
        reason:
          `Your project knowledge score is ${context.interviews.projectKnowledge}/100.`,
        impact:
          "You should be able to defend the architecture and engineering decisions behind your projects.",
        steps: [
          "Review the architecture of your strongest project.",
          "Prepare explanations for major technical decisions.",
          "Practice discussing trade-offs and limitations.",
        ],
        relatedSkill:
          "Project Knowledge",
      });
    }
  }

  /*
   * --------------------------------------------------
   * Roadmap actions
   * --------------------------------------------------
   */

  const incompleteRoadmapItems =
    context.roadmap.items
      .filter(
        (item) => !item.completed
      )
      .sort(
        (a, b) => {
          const priorityDifference =
            priorityRank(
              a.priority as ActionPriority
            ) -
            priorityRank(
              b.priority as ActionPriority
            );

          if (
            priorityDifference !== 0
          ) {
            return priorityDifference;
          }

          return a.progress - b.progress;
        }
      );

  const nextRoadmapItem =
    incompleteRoadmapItems[0];

  if (nextRoadmapItem) {
    actions.push({
      id: `roadmap-${nextRoadmapItem.skill
        .toLowerCase()
        .replace(/\s+/g, "-")}`,
      title:
        `Continue ${nextRoadmapItem.skill}`,
      priority:
        nextRoadmapItem.priority as ActionPriority,
      category: "Roadmap",
      reason:
        nextRoadmapItem.reason,
      impact:
        `Progressing ${nextRoadmapItem.skill} will close one of the current gaps in your Software Engineer roadmap.`,
      steps:
        nextRoadmapItem.focus
          .slice(0, 4)
          .map(
            (focus) =>
              `Study and practice ${focus}.`
          ),
      relatedSkill:
        nextRoadmapItem.skill,
    });
  }

  /*
   * --------------------------------------------------
   * Career-level actions
   * --------------------------------------------------
   */

  if (
    context.github.repositories === 0
  ) {
    actions.push({
      id: "build-first-project",
      title:
        "Build a production-style project",
      priority: "Critical",
      category: "Project",
      reason:
        "NEXUS has no repository evidence to evaluate.",
      impact:
        "A strong production-style project provides concrete evidence of engineering ability.",
      steps: [
        "Build a full-stack application.",
        "Use a real database.",
        "Add authentication and validation.",
        "Add tests and CI.",
      ],
    });
  }

  /*
   * --------------------------------------------------
   * Project quality actions
   * --------------------------------------------------
   */

  const projectsNeedingWork =
    context.github.recentRepositories
      .filter(
        (repo) =>
          repo.description === null ||
          repo.description.trim().length < 40
      );

  if (
    projectsNeedingWork.length > 0
  ) {
    const project =
      projectsNeedingWork[0];

    actions.push({
      id: `project-documentation-${project.name}`,
      title:
        `Improve ${project.name} documentation`,
      priority: "Medium",
      category: "Project",
      reason:
        "The repository has limited project description evidence.",
      impact:
        "Better documentation makes the project easier for recruiters and interviewers to understand.",
      steps: [
        "Write a clear project overview.",
        "Document the technology stack.",
        "Add setup instructions.",
        "Explain important architecture decisions.",
      ],
      relatedProject:
        project.name,
    });
  }

  return sortActions(actions).slice(
    0,
    8
  );
}
