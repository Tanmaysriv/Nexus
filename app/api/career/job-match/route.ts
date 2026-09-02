import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getGitHubRepos } from "@/lib/github";
import {
  analyzeRepositories,
} from "@/lib/repository-analyzer";
type RoleProfile = {
  name: string;
  description: string;
  skills: string[];
};

const ROLE_PROFILES: Record<
  string,
  RoleProfile
> = {
  "software-engineer": {
    name: "Software Engineer",
    description:
      "Build scalable software applications and solve engineering problems.",
    skills: [
      "JavaScript",
      "TypeScript",
      "React",
      "Node.js",
      "Python",
      "SQL",
      "Git",
      "REST APIs",
      "Testing",
      "DSA",
      "OOP",
      "System Design",
    ],
  },

  "full-stack-developer": {
    name: "Full Stack Developer",
    description:
      "Build complete web applications across frontend, backend, APIs, and databases.",
    skills: [
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "Express",
      "REST APIs",
      "SQL",
      "PostgreSQL",
      "Git",
      "Docker",
      "Testing",
    ],
  },

  "ai-ml-engineer": {
    name: "AI / ML Engineer",
    description:
      "Build machine learning and AI systems and integrate models into production applications.",
    skills: [
      "Python",
      "Machine Learning",
      "Deep Learning",
      "PyTorch",
      "TensorFlow",
      "Scikit-learn",
      "Pandas",
      "NumPy",
      "SQL",
      "APIs",
      "Docker",
      "Git",
    ],
  },

  "backend-developer": {
    name: "Backend Developer",
    description:
      "Design APIs, services, databases, and scalable backend systems.",
    skills: [
      "Node.js",
      "Python",
      "Java",
      "REST APIs",
      "SQL",
      "PostgreSQL",
      "Redis",
      "Docker",
      "Git",
      "Testing",
      "System Design",
    ],
  },

  "cloud-devops-engineer": {
    name: "Cloud / DevOps Engineer",
    description:
      "Build reliable infrastructure, deployment pipelines, and cloud-native systems.",
    skills: [
      "Linux",
      "Git",
      "Docker",
      "Kubernetes",
      "CI/CD",
      "GitHub Actions",
      "AWS",
      "Azure",
      "Terraform",
      "Networking",
      "Monitoring",
      "Python",
    ],
  },
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.]/g, "");
}

/*
 * Repository technologies are concrete evidence.
 * Broader engineering skills can be inferred only
 * when the repository provides reasonable evidence.
 */
const TECHNOLOGY_SKILL_MAP: Record<
  string,
  string[]
> = {
  JavaScript: [
    "JavaScript",
  ],

  TypeScript: [
    "TypeScript",
  ],

  React: [
    "React",
  ],

  "Next.js": [
    "Next.js",
    "React",
  ],

  "Node.js": [
    "Node.js",
  ],

  Express: [
    "Express",
    "Node.js",
    "REST APIs",
  ],

  Python: [
    "Python",
  ],

  Java: [
    "Java",
  ],

  SQL: [
    "SQL",
  ],

  PostgreSQL: [
    "PostgreSQL",
    "SQL",
  ],

  Docker: [
    "Docker",
  ],

  Kubernetes: [
    "Kubernetes",
  ],

  "GitHub Actions": [
    "GitHub Actions",
    "CI/CD",
  ],

  "CI/CD": [
    "CI/CD",
  ],

  TensorFlow: [
    "TensorFlow",
    "Deep Learning",
    "Machine Learning",
  ],

  PyTorch: [
    "PyTorch",
    "Deep Learning",
    "Machine Learning",
  ],

  "Scikit-learn": [
    "Scikit-learn",
    "Machine Learning",
  ],

  Pandas: [
    "Pandas",
  ],

  NumPy: [
    "NumPy",
  ],

  "Machine Learning": [
    "Machine Learning",
  ],

  "Deep Learning": [
    "Deep Learning",
  ],

  "Tailwind CSS": [
    "Tailwind CSS",
  ],
};

type InterviewEvidence = {
  score: number;
  questions: number;
  sessions: number;

  dimensions: {
    technicalCorrectness: number;
    relevance: number;
    depth: number;
    communication: number;
    projectKnowledge: number;
  };
};

async function detectRepositorySkills(
  repositories: {
    name: string;
    fork?: boolean;
    archived?: boolean;
  }[]
) {
  const owner =
    process.env.GITHUB_USERNAME ||
    "Tanmaysriv";

  const analyses =
    await analyzeRepositories(
      owner,
      repositories.map(
        (repo) => repo.name
      )
    );

  const detected =
    new Set<string>();

  const repositoryTechnologies:
    Record<string, string[]> = {};

  for (const repo of repositories) {
    const signals =
      analyses[repo.name];

    if (!signals) {
      continue;
    }

    repositoryTechnologies[
      repo.name
    ] = signals.technologies;

    for (
      const technology of
        signals.technologies
    ) {
      const mappedSkills =
        TECHNOLOGY_SKILL_MAP[
          technology
        ] ?? [technology];

      for (
        const skill of mappedSkills
      ) {
        detected.add(skill);
      }
    }
  }

  return {
    detectedSkills:
      Array.from(
        detected
      ).sort(),

    repositoryTechnologies,
  };
}

function calculateInterviewEvidence(
  answers: {
    overall: number;
    technicalCorrectness: number;
    relevance: number;
    depth: number;
    communication: number;
    projectKnowledge: number;
  }[]
): InterviewEvidence {
  if (answers.length === 0) {
    return {
      score: 0,
      questions: 0,
      sessions: 0,

      dimensions: {
        technicalCorrectness: 0,
        relevance: 0,
        depth: 0,
        communication: 0,
        projectKnowledge: 0,
      },
    };
  }

  const average = (
    selector: (
      answer: (typeof answers)[number]
    ) => number
  ) =>
    Math.round(
      answers.reduce(
        (total, answer) =>
          total + selector(answer),
        0
      ) / answers.length
    );

  return {
    score:
      average(
        (answer) =>
          answer.overall
      ),

    questions:
      answers.length,

    sessions: 0,

    dimensions: {
      technicalCorrectness:
        average(
          (answer) =>
            answer.technicalCorrectness
        ),

      relevance:
        average(
          (answer) =>
            answer.relevance
        ),

      depth:
        average(
          (answer) =>
            answer.depth
        ),

      communication:
        average(
          (answer) =>
            answer.communication
        ),

      projectKnowledge:
        average(
          (answer) =>
            answer.projectKnowledge
        ),
    },
  };
}

function calculateSkillMatch(
  profile: RoleProfile,
  detectedSkills: string[]
) {
  const matchedSkills =
    profile.skills.filter(
      (skill) => {
        const normalizedSkill =
          normalize(skill);

        return detectedSkills.some(
          (detected) =>
            normalize(
              detected
            ) ===
            normalizedSkill
        );
      }
    );

  const missingSkills =
    profile.skills.filter(
      (skill) =>
        !matchedSkills.includes(
          skill
        )
    );

  const skillMatch =
    profile.skills.length > 0
      ? Math.round(
          (matchedSkills.length /
            profile.skills.length) *
            100
        )
      : 0;

  return {
    matchedSkills,
    missingSkills,
    skillMatch,
  };
}

/*
 * Some skills are more important for
 * interview readiness than others.
 */
const PRIORITY_WEIGHTS: Record<
  string,
  number
> = {
  DSA: 100,
  OOP: 95,
  "System Design": 90,
  "REST APIs": 85,
  Testing: 80,

  Python: 70,
  SQL: 70,
  Git: 65,

  Docker: 60,
  PostgreSQL: 60,
  Kubernetes: 60,

  JavaScript: 20,
  TypeScript: 20,
  React: 20,
  "Node.js": 20,
};

function calculatePrioritySkills(
  missingSkills: string[]
) {
  return [...missingSkills]
    .sort(
      (a, b) =>
        (PRIORITY_WEIGHTS[b] ??
          50) -
        (PRIORITY_WEIGHTS[a] ??
          50)
    )
    .slice(0, 5);
}

function calculateEvidenceLevel(
  skill: string,
  detectedSkills: string[],
  interview: InterviewEvidence
) {
  const normalizedSkill =
    normalize(skill);

  const repositoryVerified =
    detectedSkills.some(
      (detected) =>
        normalize(
          detected
        ) === normalizedSkill
    );

  if (repositoryVerified) {
    return "verified";
  }

  /*
   * Interview-derived engineering
   * evidence.
   */
  if (
    [
      "DSA",
      "OOP",
      "System Design",
    ].includes(skill)
  ) {
    if (
      interview.score >= 70
    ) {
      return "interview-supported";
    }

    return "needs-interview-evidence";
  }

  /*
   * REST API and Testing evidence
   * comes from technical interview
   * performance.
   */
  if (
    skill === "REST APIs" &&
    interview.dimensions
      .technicalCorrectness >= 70
  ) {
    return "interview-supported";
  }

  if (
    skill === "Testing" &&
    interview.dimensions
      .technicalCorrectness >= 75
  ) {
    return "interview-supported";
  }

  return "missing";
}

function buildSkillEvidence(
  profile: RoleProfile,
  detectedSkills: string[],
  interview: InterviewEvidence
) {
  const verified: string[] = [];
  const interviewSupported: string[] = [];
  const missing: string[] = [];

  for (
    const skill of profile.skills
  ) {
    const evidence =
      calculateEvidenceLevel(
        skill,
        detectedSkills,
        interview
      );

    if (
      evidence ===
      "verified"
    ) {
      verified.push(skill);
    } else if (
      evidence ===
      "interview-supported"
    ) {
      interviewSupported.push(
        skill
      );
    } else {
      missing.push(skill);
    }
  }

  return {
    verified,
    interviewSupported,
    missing,
  };
}

function calculateReadiness(
  skillMatch: number,
  interviewScore: number
) {
  /*
   * Repository evidence: 50%
   * Interview performance: 50%
   */
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        skillMatch * 0.5 +
          interviewScore * 0.5
      )
    )
  );
}

function getReadinessLabel(
  score: number
) {
  if (score >= 85) {
    return "Excellent";
  }

  if (score >= 70) {
    return "Strong";
  }

  if (score >= 50) {
    return "Developing";
  }

  return "Needs Improvement";
}

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(request.url);

    const role =
      url.searchParams.get(
        "role"
      ) ??
      "software-engineer";

    const profile =
      ROLE_PROFILES[role];

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Unknown role.",

          availableRoles:
            Object.keys(
              ROLE_PROFILES
            ),
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ----------------------------------------
     * GitHub repositories
     * ----------------------------------------
     */

    const repos =
      await getGitHubRepos();

    const activeRepos =
      repos.filter(
        (repo) =>
          !repo.fork &&
          !repo.archived
      );

    const {
      detectedSkills,
      repositoryTechnologies,
    } =
      await detectRepositorySkills(
        activeRepos
      );

    /*
     * ----------------------------------------
     * Interview performance
     * ----------------------------------------
     */

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

    const interview =
      calculateInterviewEvidence(
        answers
      );

    interview.sessions =
      sessions.length;

    /*
     * ----------------------------------------
     * Role skill matching
     * ----------------------------------------
     */

    const {
      matchedSkills,
      missingSkills,
      skillMatch,
    } =
      calculateSkillMatch(
        profile,
        detectedSkills
      );

    /*
     * ----------------------------------------
     * Skill evidence
     * ----------------------------------------
     */

    const skillEvidence =
      buildSkillEvidence(
        profile,
        detectedSkills,
        interview
      );

    /*
     * ----------------------------------------
     * Priority skills
     * ----------------------------------------
     */

    const prioritySkills =
      calculatePrioritySkills(
        skillEvidence.missing
      );

    /*
     * ----------------------------------------
     * Readiness
     * ----------------------------------------
     */

    const readiness =
      calculateReadiness(
        skillMatch,
        interview.score
      );

    return NextResponse.json({
      role: {
        id: role,

        name:
          profile.name,

        description:
          profile.description,
      },

      readiness: {
        score:
          readiness,

        label:
          getReadinessLabel(
            readiness
          ),
      },

      skillMatch,

      matchedSkills,

      missingSkills,

      prioritySkills,

      skillEvidence: {
        verified:
          skillEvidence.verified,

        interviewSupported:
          skillEvidence.interviewSupported,

        missing:
          skillEvidence.missing,
      },

      interview: {
        score:
          interview.score,

        questions:
          interview.questions,

        sessions:
          interview.sessions,

        dimensions:
          interview.dimensions,
      },

      repositories: {
        count:
          activeRepos.length,

        detectedSkills,

        technologies:
          repositoryTechnologies,
      },
    });
  } catch (error) {
    console.error(
      "Job match error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate job match.",
      },
      {
        status: 500,
      }
    );
  }
}