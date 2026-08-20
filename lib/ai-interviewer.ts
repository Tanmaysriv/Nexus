import { GoogleGenAI } from "@google/genai";

import type {
  RepositorySignals,
} from "@/lib/project-health";

export type AIEvaluation = {
  overall: number;
  technicalCorrectness: number;
  relevance: number;
  depth: number;
  communication: number;
  projectKnowledge: number;
  verdict: string;
  strengths: string[];
  missingConcepts: string[];
  improvements: string[];
  idealAnswer: string;
  followUpQuestion: string;
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function clampScore(value: unknown): number {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(score))
  );
}

function cleanArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string"
    )
    .slice(0, 6);
}

export async function evaluateInterviewAnswer({
  projectName,
  question,
  answer,
  category,
  difficulty,
  signals,
}: {
  projectName: string;
  question: string;
  answer: string;
  category: string;
  difficulty: string;
  signals: RepositorySignals;
}): Promise<AIEvaluation> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  const projectContext = `
PROJECT:
${projectName}

REPOSITORY SIGNALS:
- README: ${signals.hasReadme}
- package.json: ${signals.hasPackageJson}
- Tests: ${signals.hasTests}
- Docker: ${signals.hasDocker}
- CI/CD: ${signals.hasCI}
- TypeScript: ${signals.hasTypeScript}
- Environment example: ${signals.hasEnvironmentExample}
- License: ${signals.hasLicense}
`;

  const prompt = `
You are NEXUS, an expert software engineering interviewer.

Evaluate the candidate's answer to the interview question.

${projectContext}

INTERVIEW CATEGORY:
${category}

DIFFICULTY:
${difficulty}

QUESTION:
${question}

CANDIDATE ANSWER:
${answer}

Evaluate the answer using these dimensions:

1. Technical correctness
2. Relevance
3. Depth
4. Communication
5. Project knowledge

Important rules:

- Do not reward an answer simply because it is long.
- Identify technically incorrect claims.
- Identify missing important concepts.
- Use the project information provided.
- Do not invent technologies that aren't supported.
- Give practical interview advice.
- The ideal answer should sound like something a strong
  candidate could realistically say in an interview.
- The follow-up question should test deeper understanding.

Return ONLY valid JSON.

Use exactly this structure:

{
  "overall": 0,
  "technicalCorrectness": 0,
  "relevance": 0,
  "depth": 0,
  "communication": 0,
  "projectKnowledge": 0,
  "verdict": "",
  "strengths": [],
  "missingConcepts": [],
  "improvements": [],
  "idealAnswer": "",
  "followUpQuestion": ""
}

All scores must be integers between 0 and 100.
`;

  const response =
    await ai.models.generateContent({
      model:
        process.env.GEMINI_MODEL ||
        "gemini-2.5-flash",

      contents: prompt,

      config: {
        temperature: 0.2,

        responseMimeType:
          "application/json",

        responseSchema: {
          type: "object",

          properties: {
            overall: {
              type: "number",
            },

            technicalCorrectness: {
              type: "number",
            },

            relevance: {
              type: "number",
            },

            depth: {
              type: "number",
            },

            communication: {
              type: "number",
            },

            projectKnowledge: {
              type: "number",
            },

            verdict: {
              type: "string",
            },

            strengths: {
              type: "array",
              items: {
                type: "string",
              },
            },

            missingConcepts: {
              type: "array",
              items: {
                type: "string",
              },
            },

            improvements: {
              type: "array",
              items: {
                type: "string",
              },
            },

            idealAnswer: {
              type: "string",
            },

            followUpQuestion: {
              type: "string",
            },
          },

          required: [
            "overall",
            "technicalCorrectness",
            "relevance",
            "depth",
            "communication",
            "projectKnowledge",
            "verdict",
            "strengths",
            "missingConcepts",
            "improvements",
            "idealAnswer",
            "followUpQuestion",
          ],
        },
      },
    });

  const raw = response.text?.trim();

  if (!raw) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  let parsed: Partial<AIEvaluation>;

  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(
      "Invalid Gemini JSON:",
      raw
    );

    throw new Error(
      "Gemini returned invalid JSON."
    );
  }

  const technicalCorrectness =
    clampScore(
      parsed.technicalCorrectness
    );

  const relevance =
    clampScore(parsed.relevance);

  const depth =
    clampScore(parsed.depth);

  const communication =
    clampScore(parsed.communication);

  const projectKnowledge =
    clampScore(
      parsed.projectKnowledge
    );

  const calculatedOverall =
    Math.round(
      (
        technicalCorrectness +
        relevance +
        depth +
        communication +
        projectKnowledge
      ) / 5
    );

  return {
    overall:
      clampScore(parsed.overall) ||
      calculatedOverall,

    technicalCorrectness,

    relevance,

    depth,

    communication,

    projectKnowledge,

    verdict:
      typeof parsed.verdict === "string"
        ? parsed.verdict
        : "Evaluation complete",

    strengths:
      cleanArray(parsed.strengths),

    missingConcepts:
      cleanArray(
        parsed.missingConcepts
      ),

    improvements:
      cleanArray(
        parsed.improvements
      ),

    idealAnswer:
      typeof parsed.idealAnswer === "string"
        ? parsed.idealAnswer
        : "",

    followUpQuestion:
      typeof parsed.followUpQuestion ===
      "string"
        ? parsed.followUpQuestion
        : "",
  };
}