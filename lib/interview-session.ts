import type { AIEvaluation } from "@/lib/ai-interviewer";

export type InterviewResult = {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
  evaluation: AIEvaluation;
};

export type InterviewSession = {
  id: string;
  projectName: string;
  startedAt: string;
  completedAt?: string;
  results: InterviewResult[];
};

export type SessionAnalytics = {
  overall: number;
  technicalCorrectness: number;
  relevance: number;
  depth: number;
  communication: number;
  projectKnowledge: number;
  totalQuestions: number;
  passedQuestions: number;
  weakAreas: string[];
  strengths: string[];
};

export function calculateSessionAnalytics(
  results: InterviewResult[]
): SessionAnalytics {
  if (results.length === 0) {
    return {
      overall: 0,
      technicalCorrectness: 0,
      relevance: 0,
      depth: 0,
      communication: 0,
      projectKnowledge: 0,
      totalQuestions: 0,
      passedQuestions: 0,
      weakAreas: [],
      strengths: [],
    };
  }

  const average = (
    selector: (evaluation: AIEvaluation) => number
  ) =>
    Math.round(
      results.reduce(
        (total, result) =>
          total + selector(result.evaluation),
        0
      ) / results.length
    );

  const overall = average(
    (evaluation) => evaluation.overall
  );

  const technicalCorrectness = average(
    (evaluation) =>
      evaluation.technicalCorrectness
  );

  const relevance = average(
    (evaluation) => evaluation.relevance
  );

  const depth = average(
    (evaluation) => evaluation.depth
  );

  const communication = average(
    (evaluation) => evaluation.communication
  );

  const projectKnowledge = average(
    (evaluation) =>
      evaluation.projectKnowledge
  );

  const passedQuestions =
    results.filter(
      (result) =>
        result.evaluation.overall >= 60
    ).length;

  const dimensionScores = [
    {
      name: "Technical Correctness",
      score: technicalCorrectness,
    },
    {
      name: "Relevance",
      score: relevance,
    },
    {
      name: "Depth",
      score: depth,
    },
    {
      name: "Communication",
      score: communication,
    },
    {
      name: "Project Knowledge",
      score: projectKnowledge,
    },
  ];

  const weakAreas = dimensionScores
    .filter((item) => item.score < 75)
    .sort((a, b) => a.score - b.score)
    .map((item) => item.name);

  const strengths = dimensionScores
    .filter((item) => item.score >= 85)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.name);

  return {
    overall,
    technicalCorrectness,
    relevance,
    depth,
    communication,
    projectKnowledge,
    totalQuestions: results.length,
    passedQuestions,
    weakAreas,
    strengths,
  };
}