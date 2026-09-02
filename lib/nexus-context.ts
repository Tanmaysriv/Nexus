import { prisma } from "@/lib/prisma";
import { getGitHubStats } from "@/lib/github";
import { getCachedRepositoryAnalysis } from "@/lib/github-cache";
import { analyzeProject } from "@/lib/project-health";

export type NexusContext = {
  github: {
    username: string;
    repositories: number;
    stars: number;
    forks: number;
    languages: Record<string, number>;
    recentRepositories: {
      name: string;
      description: string | null;
      language: string | null;
      stars: number;
      forks: number;
      url: string;
    }[];
  };

  projects: {
    total: number;
    averageHealth: number;
    projects: {
      name: string;
      score: number;
      activity: number;
      documentation: number;
      maintenance: number;
      techStack: number;
      engineering: number;
      technologies: string[];
      verdict: string;
      recommendations: string[];
    }[];
  };

  interviews: {
    sessions: number;
    questions: number;
    averageScore: number;
    technicalCorrectness: number;
    relevance: number;
    depth: number;
    communication: number;
    projectKnowledge: number;

    recentAnswers: {
      project: string;
      question: string;
      score: number;
      verdict: string;
    }[];
  };

  roadmap: {
    role: string;
    overallProgress: number;
    completed: number;
    total: number;

    items: {
      skill: string;
      priority: string;
      progress: number;
      completed: boolean;
      reason: string;
      focus: string[];
    }[];
  };
};

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return Math.round(
    values.reduce(
      (total, value) => total + value,
      0
    ) / values.length
  );
}

export async function getNexusContext(): Promise<NexusContext> {
  const username =
    process.env.GITHUB_USERNAME;

  if (!username) {
    throw new Error(
      "GITHUB_USERNAME is not configured."
    );
  }

  /*
   * --------------------------------------------------
   * GitHub + Interviews
   * --------------------------------------------------
   */

  const [github, sessions] =
    await Promise.all([
      getGitHubStats(),

      prisma.interviewSession.findMany({
        include: {
          answers: true,
        },
        orderBy: {
          startedAt: "desc",
        },
      }),
    ]);

  /*
   * --------------------------------------------------
   * Interview intelligence
   * --------------------------------------------------
   */

  const answers = sessions.flatMap(
    (session) =>
      session.answers.map((answer) => ({
        ...answer,
        project: session.project,
      }))
  );

  /*
   * --------------------------------------------------
   * Career roadmap
   * --------------------------------------------------
   */

  const roadmap =
    await prisma.careerRoadmap.findFirst({
      include: {
        items: {
          orderBy: {
            priority: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  const roadmapItems =
    roadmap?.items ?? [];

  const completedRoadmapItems =
    roadmapItems.filter(
      (item) => item.completed
    ).length;

  const roadmapProgress =
    roadmapItems.length > 0
      ? Math.round(
          roadmapItems.reduce(
            (total, item) =>
              total + item.progress,
            0
          ) / roadmapItems.length
        )
      : 0;

  /*
   * --------------------------------------------------
   * Project intelligence
   * --------------------------------------------------
   */

  const activeRepos =
    github.repos.filter(
      (repo) =>
        !repo.fork &&
        !repo.archived
    );

  const projectResults = [];

  for (const repo of activeRepos) {
    try {
      const signals =
        await getCachedRepositoryAnalysis(
          username,
          repo.name
        );

      const project =
        analyzeProject(
          repo,
          signals
        );

      projectResults.push({
        name: project.name,
        score: project.score,
        activity: project.activity,
        documentation:
          project.documentation,
        maintenance:
          project.maintenance,
        techStack:
          project.techStack,
        engineering:
          project.engineering,
        technologies:
          project.signals.technologies,
        verdict:
          project.verdict,
        recommendations:
          project.recommendations,
      });
    } catch (error) {
      console.error(
        `Project context analysis failed for ${repo.name}:`,
        error
      );
    }
  }

  const averageProjectHealth =
    average(
      projectResults.map(
        (project) => project.score
      )
    );

  /*
   * --------------------------------------------------
   * Recent GitHub repositories
   * --------------------------------------------------
   */

  const recentRepositories =
    github.recentRepos.map(
      (repo) => ({
        name: repo.name,
        description:
          repo.description,
        language:
          repo.language,
        stars:
          repo.stargazers_count,
        forks:
          repo.forks_count,
        url:
          repo.html_url,
      })
    );

  /*
   * --------------------------------------------------
   * Final NEXUS context
   * --------------------------------------------------
   */

  return {
    github: {
      username,

      repositories:
        github.repositoryCount,

      stars:
        github.totalStars,

      forks:
        github.totalForks,

      languages:
        github.languages,

      recentRepositories,
    },

    projects: {
      total:
        projectResults.length,

      averageHealth:
        averageProjectHealth,

      projects:
        projectResults,
    },

    interviews: {
      sessions:
        sessions.length,

      questions:
        answers.length,

      averageScore:
        average(
          answers.map(
            (answer) =>
              answer.overall
          )
        ),

      technicalCorrectness:
        average(
          answers.map(
            (answer) =>
              answer.technicalCorrectness
          )
        ),

      relevance:
        average(
          answers.map(
            (answer) =>
              answer.relevance
          )
        ),

      depth:
        average(
          answers.map(
            (answer) =>
              answer.depth
          )
        ),

      communication:
        average(
          answers.map(
            (answer) =>
              answer.communication
          )
        ),

      projectKnowledge:
        average(
          answers.map(
            (answer) =>
              answer.projectKnowledge
          )
        ),

      recentAnswers:
        answers
          .slice(0, 10)
          .map(
            (answer) => ({
              project:
                answer.project,

              question:
                answer.question,

              score:
                answer.overall,

              verdict:
                answer.verdict,
            })
          ),
    },

    roadmap: {
      role:
        roadmap?.role ??
        "Software Engineer",

      overallProgress:
        roadmapProgress,

      completed:
        completedRoadmapItems,

      total:
        roadmapItems.length,

      items:
        roadmapItems.map(
          (item) => ({
            skill:
              item.skill,

            priority:
              item.priority,

            progress:
              item.progress,

            completed:
              item.completed,

            reason:
              item.reason,

            focus:
              item.focus,
          })
        ),
    },
  };
}