export const LEARNING_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;
export type LearningStatus = (typeof LEARNING_STATUSES)[number];

export type LearningProgressInput = {
  skill: string;
  status?: LearningStatus;
  resourceUrls?: string[];
  practiceNotes?: string | null;
  assessmentNotes?: string | null;
};

export function parseLearningProgressInput(value: unknown):
  | { ok: true; data: LearningProgressInput }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "Provide a learning progress object." };
  const body = value as Record<string, unknown>;
  const allowed = new Set(["skill", "status", "resourceUrls", "practiceNotes", "assessmentNotes"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return { ok: false, error: "The request contains unsupported fields." };

  const skill = typeof body.skill === "string" ? body.skill.trim() : "";
  if (!skill || skill.length > 120) return { ok: false, error: "Skill must be between 1 and 120 characters." };

  let status: LearningStatus | undefined;
  if ("status" in body) {
    if (typeof body.status !== "string" || !LEARNING_STATUSES.includes(body.status as LearningStatus)) return { ok: false, error: "Choose a valid learning status." };
    status = body.status as LearningStatus;
  }

  let resourceUrls: string[] | undefined;
  if ("resourceUrls" in body) {
    if (!Array.isArray(body.resourceUrls) || body.resourceUrls.length > 5 || body.resourceUrls.some((item) => typeof item !== "string")) {
      return { ok: false, error: "Add up to five learning resource URLs." };
    }
    resourceUrls = [];
    for (const item of body.resourceUrls as string[]) {
      const candidate = item.trim();
      if (!candidate) continue;
      try {
        const parsed = new URL(candidate);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
      } catch {
        return { ok: false, error: "Learning resource URLs must use http or https." };
      }
      if (candidate.length > 2048) return { ok: false, error: "Learning resource URLs must be 2,048 characters or fewer." };
      resourceUrls.push(candidate);
    }
  }

  const data: LearningProgressInput = { skill };
  if (status !== undefined) data.status = status;
  if (resourceUrls !== undefined) data.resourceUrls = resourceUrls;
  for (const field of ["practiceNotes", "assessmentNotes"] as const) {
    if (!(field in body)) continue;
    const note = body[field];
    if (note !== null && (typeof note !== "string" || note.length > 5000)) return { ok: false, error: `${field} must be text with at most 5,000 characters.` };
    data[field] = typeof note === "string" ? note.trim() || null : null;
  }
  return { ok: true, data };
}
