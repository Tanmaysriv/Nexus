import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  getGitHubStats,
  type GitHubRepo,
} from "@/lib/github";
import { getCachedRepositoryAnalysis } from "@/lib/github-cache";
import { analyzeProject } from "@/lib/project-health";
import { extractResumeSkills } from "@/lib/resume-analysis";

export type NexusContext = {
  profile: { name: string | null };
  resume: {
    exists: boolean;
    fileName: string | null;
    skills: string[];
    compatibilityScore: number | null;
  };
  skillGaps: {
    targetRole: string | null;
    skills: { skill: string; gap: string; priority: string; recommendedLearning: string }[];
  };
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

export async function getNexusContext(
  userId: string
): Promise<NexusContext> {
  const [githubResult, sessions, roadmap, profile, resume, skillGap] =
    await Promise.all([
      getGitHubStats(userId).catch((error) => {
        logger.warn("GitHub context unavailable", { error });

        return null;
      }),

      prisma.interviewSession.findMany({
        where: {
          userId,
        },
        include: {
          answers: true,
        },
        orderBy: {
          startedAt: "desc",
        },
      }),

      prisma.careerRoadmap.findFirst({
        where: {
          userId,
        },
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
      }),

      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),

      prisma.resume.findUnique({ where: { userId }, select: { fileName: true, rawText: true, score: true } }),

      prisma.skillGapAnalysis.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { targetRole: true, results: true },
      }),
    ]);

  const github =
    githubResult ?? {
      profile: {
        login: "Not connected",
      },
      repositoryCount: 0,
      totalStars: 0,
      totalForks: 0,
      languages: {},
      repos: [],
      recentRepos: [],
    };

  const answers = sessions.flatMap(
    (session) =>
      session.answers.map((answer) => ({
        ...answer,
        project: session.project,
      }))
  );

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

  const activeRepos =
    github.repos.filter(
      (repo: GitHubRepo) =>
        !repo.fork &&
        !repo.archived
    );

  const gapResult = skillGap?.results as { skills?: { skill: string; gap: string; priority: string; recommendedLearning: string }[] } | undefined;

  const projectResults = [];

  for (const repo of activeRepos) {
    try {
      const signals =
        await getCachedRepositoryAnalysis(
          userId,
          github.profile.login,
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
      logger.error("Project context analysis failed", { repo: repo.name, error });
    }
  }

  const averageProjectHealth =
    average(
      projectResults.map(
        (project) => project.score
      )
    );

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

  return {
    profile: { name: profile?.name ?? null },
    resume: {
      exists: Boolean(resume),
      fileName: resume?.fileName ?? null,
      skills: resume ? extractResumeSkills(resume.rawText).map((entry) => entry.skill) : [],
      compatibilityScore: resume?.score ?? null,
    },
    skillGaps: {
      targetRole: skillGap?.targetRole ?? null,
      skills: (gapResult?.skills ?? []).slice(0, 20).map((item) => ({
        skill: item.skill,
        gap: item.gap,
        priority: item.priority,
        recommendedLearning: item.recommendedLearning,
      })),
    },
    github: {
      username:
        github.profile.login,

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

