export const APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ApplicationInput = {
  company?: string;
  role?: string;
  jobUrl?: string | null;
  location?: string | null;
  salary?: string | null;
  description?: string | null;
  status?: ApplicationStatus;
  appliedAt?: string | null;
  interviewAt?: string | null;
  notes?: string | null;
};

const textLimits: Record<string, number> = {
  company: 160,
  role: 120,
  location: 160,
  salary: 120,
  description: 20_000,
  notes: 10_000,
};

export function parseApplicationInput(value: unknown, partial = false):
  | { ok: true; data: ApplicationInput }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Provide an application object." };
  }

  const body = value as Record<string, unknown>;
  const allowed = new Set([
    "company", "role", "jobUrl", "location", "salary", "description",
    "status", "appliedAt", "interviewAt", "notes",
  ]);
  if (Object.keys(body).some((key) => !allowed.has(key))) {
    return { ok: false, error: "The request contains unsupported fields." };
  }

  if (!partial || "company" in body) {
    if (typeof body.company !== "string" || !body.company.trim() || body.company.trim().length > textLimits.company) {
      return { ok: false, error: "Company is required and must be 160 characters or fewer." };
    }
  }
  if (!partial || "role" in body) {
    if (typeof body.role !== "string" || !body.role.trim() || body.role.trim().length > textLimits.role) {
      return { ok: false, error: "Role is required and must be 120 characters or fewer." };
    }
  }

  const data: ApplicationInput = {};
  for (const field of Object.keys(textLimits) as (keyof typeof textLimits)[]) {
    if (!(field in body)) continue;
    const item = body[field];
    if (typeof item !== "string" || item.length > textLimits[field]) {
      return { ok: false, error: `${field} must be text with at most ${textLimits[field]} characters.` };
    }
    (data as Record<string, unknown>)[field] = field === "company" || field === "role" ? item.trim() : item.trim() || null;
  }

  if ("jobUrl" in body) {
    if (body.jobUrl !== null && typeof body.jobUrl !== "string") return { ok: false, error: "Job URL must be a URL." };
    const url = typeof body.jobUrl === "string" ? body.jobUrl.trim() : "";
    if (url) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
      } catch {
        return { ok: false, error: "Job URL must use http or https." };
      }
      data.jobUrl = url;
    } else data.jobUrl = null;
  }

  if ("status" in body) {
    if (typeof body.status !== "string" || !APPLICATION_STATUSES.includes(body.status as ApplicationStatus)) {
      return { ok: false, error: "Choose a valid application status." };
    }
    data.status = body.status as ApplicationStatus;
  }

  for (const field of ["appliedAt", "interviewAt"] as const) {
    if (!(field in body)) continue;
    const item = body[field];
    if (item === null || item === "") {
      data[field] = null;
    } else if (typeof item === "string" && !Number.isNaN(Date.parse(item))) {
      data[field] = new Date(item).toISOString();
    } else {
      return { ok: false, error: `${field} must be a valid date.` };
    }
  }

  return { ok: true, data };
}
