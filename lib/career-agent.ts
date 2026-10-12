import { GoogleGenAI } from "@google/genai";
import type { NexusContext } from "@/lib/nexus-context";
import {
  generateCareerActions,
  type CareerAction,
} from "@/lib/action-engine";

export type CareerAgentSignal = {
  severity: "Critical" | "High" | "Medium";
  area: "Interview" | "Projects" | "Roadmap" | "GitHub";
  signal: string;
  evidence: string;
};

export type CareerAgentRecommendation = {
  actionId: string;
  title: string;
  category: CareerAction["category"];
  priority: CareerAction["priority"];
  whyNow: string;
  firstStep: string;
  expectedImpact: string;
  relatedSkill?: string;
  relatedProject?: string;
};

export type CareerAgentResponse = {
  summary: string;
  focus: string;
  signals: CareerAgentSignal[];
  recommendations: CareerAgentRecommendation[];
  generatedAt: string;
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function buildSignals(
  context: NexusContext
): CareerAgentSignal[] {
  const signals: CareerAgentSignal[] = [];

  if (context.interviews.questions === 0) {
    signals.push({
      severity: "Critical",
      area: "Interview",
      signal: "No interview evidence",
      evidence:
        "NEXUS has recorded 0 interview questions.",
    });
  } else if (context.interviews.averageScore < 60) {
    signals.push({
      severity: "Critical",
      area: "Interview",
      signal: "Interview performance is below target",
      evidence:
        `Average interview score is ${context.interviews.averageScore}/100.`,
    });
  } else if (context.interviews.averageScore < 75) {
    signals.push({
      severity: "High",
      area: "Interview",
      signal: "Interview performance needs improvement",
      evidence:
        `Average interview score is ${context.interviews.averageScore}/100.`,
    });
  }

  const interviewDimensions = [
    {
      name: "Technical correctness",
      value: context.interviews.technicalCorrectness,
    },
    {
      name: "Relevance",
      value: context.interviews.relevance,
    },
    {
      name: "Depth",
      value: context.interviews.depth,
    },
    {
      name: "Communication",
      value: context.interviews.communication,
    },
    {
      name: "Project knowledge",
      value: context.interviews.projectKnowledge,
    },
  ];

  const weakestInterviewDimension =
    [...interviewDimensions].sort(
      (a, b) => a.value - b.value
    )[0];

  if (
    context.interviews.questions > 0 &&
    weakestInterviewDimension.value < 60
  ) {
    signals.push({
      severity: "High",
      area: "Interview",
      signal: `Weak ${weakestInterviewDimension.name.toLowerCase()}`,
      evidence:
        `${weakestInterviewDimension.name} is ${weakestInterviewDimension.value}/100.`,
    });
  }

  if (context.projects.total === 0) {
    signals.push({
      severity: "Critical",
      area: "Projects",
      signal: "No analyzed projects",
      evidence:
        "NEXUS currently has no analyzed active repositories.",
    });
  } else if (context.projects.averageHealth < 60) {
    signals.push({
      severity: "Critical",
      area: "Projects",
      signal: "Project engineering quality is weak",
      evidence:
        `Average project health is ${context.projects.averageHealth}/100.`,
    });
  } else if (context.projects.averageHealth < 75) {
    signals.push({
      severity: "High",
      area: "Projects",
      signal: "Project engineering quality can improve",
      evidence:
        `Average project health is ${context.projects.averageHealth}/100.`,
    });
  }

  const incompleteRoadmap = context.roadmap.items
    .filter((item) => !item.completed)
    .sort((a, b) => {
      const priorityRank = {
        Critical: 3,
        High: 2,
        Medium: 1,
      };

      return (
        (priorityRank[b.priority as keyof typeof priorityRank] ?? 0) -
        (priorityRank[a.priority as keyof typeof priorityRank] ?? 0)
      );
    });

  const nextRoadmapItem = incompleteRoadmap[0];

  if (nextRoadmapItem) {
    signals.push({
      severity:
        nextRoadmapItem.priority === "Critical"
          ? "Critical"
          : nextRoadmapItem.priority === "High"
            ? "High"
            : "Medium",
      area: "Roadmap",
      signal: `Roadmap gap: ${nextRoadmapItem.skill}`,
      evidence:
        `${nextRoadmapItem.priority} priority, ${nextRoadmapItem.progress}% complete.`,
    });
  }

  if (context.github.repositories === 0) {
    signals.push({
      severity: "High",
      area: "GitHub",
      signal: "No GitHub repositories detected",
      evidence:
        "NEXUS currently reports 0 repositories.",
    });
  } else if (context.github.repositories < 5) {
    signals.push({
      severity: "Medium",
      area: "GitHub",
      signal: "Limited GitHub portfolio breadth",
      evidence:
        `${context.github.repositories} repositories are available to NEXUS.`,
    });
  }

  return signals.slice(0, 8);
}

function sanitizeRecommendations(
  value: unknown,
  actions: CareerAction[]
): CareerAgentRecommendation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const actionMap = new Map(
    actions.map((action) => [action.id, action])
  );

  const recommendations: CareerAgentRecommendation[] = [];

  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null
    ) {
      continue;
    }

    const record = item as Record<string, unknown>;

    if (typeof record.actionId !== "string") {
      continue;
    }

    const action = actionMap.get(record.actionId);

    if (!action) {
      continue;
    }

    recommendations.push({
      actionId: action.id,
      title: action.title,
      category: action.category,
      priority: action.priority,
      whyNow:
        typeof record.whyNow === "string"
          ? record.whyNow.slice(0, 500)
          : action.reason,
      firstStep:
        typeof record.firstStep === "string"
          ? record.firstStep.slice(0, 300)
          : action.steps[0] ??
            "Start the recommended action.",
      expectedImpact:
        typeof record.expectedImpact === "string"
          ? record.expectedImpact.slice(0, 400)
          : action.impact,
      relatedSkill: action.relatedSkill,
      relatedProject: action.relatedProject,
    });

    if (recommendations.length >= 3) {
      break;
    }
  }

  return recommendations;
}
export async function runCareerAgent(
  context: NexusContext
): Promise<CareerAgentResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  const signals = buildSignals(context);
  const actions = generateCareerActions(context);

  const prompt = `
You are NEXUS Career Agent.

Your job is to determine the candidate's highest-value
next career actions using ONLY the supplied NEXUS data.

This is not a generic career chatbot.

You must:
1. Use actual evidence from the supplied context.
2. Prioritize actions by expected career impact.
3. Prefer the smallest number of actions that can create
   meaningful progress.
4. Be honest about weak or missing evidence.
5. Never invent skills, projects, scores, technologies,
   achievements, or experience.
6. Select recommendations ONLY from the supplied action
   candidates.
7. Do not create new action IDs.
8. Explain why the action should happen NOW.
9. Keep the response practical.

NEXUS CONTEXT:
${JSON.stringify(context, null, 2)}

DETERMINISTIC SIGNALS:
${JSON.stringify(signals, null, 2)}

AVAILABLE CAREER ACTIONS:
${JSON.stringify(actions, null, 2)}

Return ONLY valid JSON:

{
  "summary": "",
  "focus": "",
  "recommendations": [
    {
      "actionId": "",
      "whyNow": "",
      "firstStep": "",
      "expectedImpact": ""
    }
  ]
}

Rules:
- recommendations must contain at most 3 items.
- Use only actionId values from AVAILABLE CAREER ACTIONS.
- Put the highest-impact action first.
- summary must be one concise paragraph.
- focus must name the single most important area to improve.
`;

  const response =
    await ai.models.generateContent({
      model:
        process.env.GEMINI_MODEL ||
        "gemini-2.5-flash",

      contents: prompt,

      config: {
        temperature: 0.2,
        responseMimeType: "application/json",

        responseSchema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
            },
            focus: {
              type: "string",
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  actionId: {
                    type: "string",
                  },
                  whyNow: {
                    type: "string",
                  },
                  firstStep: {
                    type: "string",
                  },
                  expectedImpact: {
                    type: "string",
                  },
                },
                required: [
                  "actionId",
                  "whyNow",
                  "firstStep",
                  "expectedImpact",
                ],
              },
            },
          },
          required: [
            "summary",
            "focus",
            "recommendations",
          ],
        },
      },
    });

  const raw = response.text?.trim();

  if (!raw) {
    throw new Error(
      "Career Agent returned an empty response."
    );
  }

  let parsed: {
    summary?: unknown;
    focus?: unknown;
    recommendations?: unknown;
  };

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "Career Agent returned invalid JSON."
    );
  }

  const recommendations =
    sanitizeRecommendations(
      parsed.recommendations,
      actions
    );

  return {
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary.slice(0, 1000)
        : "NEXUS identified the highest-value next steps from your current evidence.",
    focus:
      typeof parsed.focus === "string"
        ? parsed.focus.slice(0, 300)
        : signals[0]?.signal ?? "Career progression",
    signals,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}


