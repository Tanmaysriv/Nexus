import type { RepositorySignals } from "@/lib/project-health";

export type InterviewQuestion = {
  question: string;
  category:
    | "Project"
    | "Architecture"
    | "Technical"
    | "Testing"
    | "DevOps"
    | "System Design"
    | "Behavioral";
  difficulty: "Easy" | "Medium" | "Hard";
};

export function generateInterviewQuestions(
  projectName: string,
  signals: RepositorySignals
): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];

  questions.push({
    question: `Explain ${projectName} as if you were presenting it to a technical interviewer.`,
    category: "Project",
    difficulty: "Easy",
  });

  questions.push({
    question: `What problem does ${projectName} solve and why did you choose this approach?`,
    category: "Project",
    difficulty: "Easy",
  });

  questions.push({
    question: `Walk me through the architecture of ${projectName}.`,
    category: "Architecture",
    difficulty: "Medium",
  });

  questions.push({
    question: `What were the most difficult technical decisions you made while building ${projectName}?`,
    category: "Architecture",
    difficulty: "Medium",
  });

  if (signals.hasTypeScript) {
    questions.push({
      question:
        "Why did you use TypeScript and what benefits did it provide over JavaScript?",
      category: "Technical",
      difficulty: "Medium",
    });
  }

  if (signals.hasPackageJson) {
    questions.push({
      question:
        "Which dependencies are critical to this project and why were they selected?",
      category: "Technical",
      difficulty: "Medium",
    });
  }

  if (signals.hasTests) {
    questions.push({
      question:
        "What testing strategy did you use and how do you decide what should be tested?",
      category: "Testing",
      difficulty: "Medium",
    });
  } else {
    questions.push({
      question:
        "How would you design an automated testing strategy for this project?",
      category: "Testing",
      difficulty: "Medium",
    });
  }

  if (signals.hasDocker) {
    questions.push({
      question:
        "Why did you use Docker and what problem does containerization solve here?",
      category: "DevOps",
      difficulty: "Medium",
    });
  } else {
    questions.push({
      question:
        "How would you containerize and deploy this project using Docker?",
      category: "DevOps",
      difficulty: "Medium",
    });
  }

  if (signals.hasCI) {
    questions.push({
      question:
        "Explain your CI/CD pipeline and what happens after a developer pushes code.",
      category: "DevOps",
      difficulty: "Hard",
    });
  } else {
    questions.push({
      question:
        "Design a CI/CD pipeline for this project using GitHub Actions.",
      category: "DevOps",
      difficulty: "Hard",
    });
  }

  questions.push({
    question:
      "If this project had 100,000 users, what part of the architecture would you scale first?",
    category: "System Design",
    difficulty: "Hard",
  });

  questions.push({
    question:
      "What would you change if you had to rebuild this project for production?",
    category: "System Design",
    difficulty: "Hard",
  });

  questions.push({
    question:
      "What is the biggest limitation of the current implementation?",
    category: "Behavioral",
    difficulty: "Medium",
  });

  questions.push({
    question:
      "What did you personally learn while building this project?",
    category: "Behavioral",
    difficulty: "Easy",
  });

  return questions;
}