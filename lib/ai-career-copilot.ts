import { GoogleGenAI } from "@google/genai";
import type { NexusContext } from "@/lib/nexus-context";

export type CareerCopilotResponse = {
  answer: string;
  recommendations: string[];
  actions: string[];
};

export type CareerCopilotHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function cleanArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .slice(0, 6);
}

export async function askCareerCopilot({
  message,
  context,
  history = [],
}: {
  message: string;
  context: NexusContext;
  history?: CareerCopilotHistoryMessage[];
}): Promise<CareerCopilotResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const conversationHistory =
    history.length === 0
      ? "No previous conversation messages."
      : history
          .map(
            (item, index) =>
              `${index + 1}. ${item.role.toUpperCase()}: ${item.content}`,
          )
          .join("\n");

  const prompt = `
You are NEXUS Career Copilot, an expert software
engineering career advisor.

You have access to the candidate's actual NEXUS
career intelligence data and the previous messages
from the current Copilot conversation.

Your job is to give practical, personalized advice
based ONLY on the provided context.

Do not invent projects, skills, interview results,
technologies, experience, or achievements.

If the available data is insufficient, clearly say so.

CANDIDATE DATA:

GitHub:
${JSON.stringify(context.github, null, 2)}

Interview Performance:
${JSON.stringify(context.interviews, null, 2)}

Career Roadmap:
${JSON.stringify(context.roadmap, null, 2)}

Project Intelligence:
${JSON.stringify(context.projects, null, 2)}

PREVIOUS CONVERSATION:
${conversationHistory}

Use the previous conversation to understand references
such as "it", "that project", "earlier", "what you said",
or follow-up questions. Do not treat previous assistant
messages as verified candidate facts; candidate facts
must still be supported by the NEXUS data above.

CURRENT USER QUESTION:
${message}

Rules:
1. Be specific to this candidate.
2. Preserve continuity with the previous conversation.
3. Prefer actionable engineering advice.
4. Reference actual projects or skills when relevant.
5. Explain WHY a recommendation matters.
6. Don't blindly praise the candidate.
7. Identify weaknesses honestly.
8. Don't claim that a skill exists unless the context
   supports it.
9. If discussing job readiness, distinguish evidence
   from assumptions.
10. Keep the answer concise but useful.
11. Return ONLY valid JSON.

Return exactly:
{
  "answer": "",
  "recommendations": [],
  "actions": []
}

"answer" should be a clear response to the user's
question.

"recommendations" should contain up to 6 personalized
recommendations.

"actions" should contain up to 6 concrete next steps.
`;

  const response = await ai.models.generateContent({
    model:
      process.env.GEMINI_MODEL ||
      "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          answer: {
            type: "string",
          },
          recommendations: {
            type: "array",
            items: {
              type: "string",
            },
          },
          actions: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        required: [
          "answer",
          "recommendations",
          "actions",
        ],
      },
    },
  });

  const raw = response.text?.trim();

  if (!raw) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed: Partial<CareerCopilotResponse>;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }

  return {
    answer:
      typeof parsed.answer === "string"
        ? parsed.answer
        : "I couldn't generate a useful response.",
    recommendations: cleanArray(parsed.recommendations),
    actions: cleanArray(parsed.actions),
  };
}
