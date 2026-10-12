export const DSA_TOPICS = [
  "Arrays", "Strings", "Linked Lists", "Stack", "Queue", "Hashing", "Trees", "Graphs",
  "Recursion", "Backtracking", "Greedy", "Dynamic Programming", "Binary Search", "Heaps",
] as const;
export const DSA_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export type DsaTopic = (typeof DSA_TOPICS)[number];
export type DsaDifficulty = (typeof DSA_DIFFICULTIES)[number];

export function calculateDsaReadinessAccuracy(entries: readonly { isSolved: boolean; accuracy: number }[]) {
  const solved = entries.filter((entry) => entry.isSolved);
  if (!solved.length) return null;
  return Math.round(solved.reduce((total, entry) => total + entry.accuracy, 0) / solved.length);
}

export function parseDsaInput(value: unknown, partial = false):
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "Provide a problem tracker object." };
  const body = value as Record<string, unknown>;
  const allowed = new Set(["topic", "problem", "problemUrl", "difficulty", "isSolved", "attempts", "accuracy", "notes", "solvedAt"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return { ok: false, error: "The request contains unsupported fields." };
  const data: Record<string, unknown> = {};
  const required = ["topic", "problem", "difficulty"];
  for (const field of required) {
    if (partial && !(field in body)) continue;
    const item = body[field];
    if (typeof item !== "string") return { ok: false, error: `Choose a valid ${field}.` };
    if (field === "topic" && !DSA_TOPICS.includes(item as DsaTopic)) return { ok: false, error: "Choose a supported DSA topic." };
    if (field === "difficulty" && !DSA_DIFFICULTIES.includes(item as DsaDifficulty)) return { ok: false, error: "Choose Easy, Medium, or Hard difficulty." };
    if (field === "problem" && (!item.trim() || item.trim().length > 200)) return { ok: false, error: "Problem title is required and must be 200 characters or fewer." };
    data[field] = field === "problem" ? item.trim() : item;
  }
  if ("problemUrl" in body) {
    if (body.problemUrl !== null && typeof body.problemUrl !== "string") return { ok: false, error: "Problem URL must be text." };
    const url = typeof body.problemUrl === "string" ? body.problemUrl.trim() : "";
    if (url) {
      try { const parsed = new URL(url); if (!["https:", "http:"].includes(parsed.protocol)) throw new Error(); }
      catch { return { ok: false, error: "Problem URL must use http or https." }; }
      if (url.length > 2048) return { ok: false, error: "Problem URL must be 2,048 characters or fewer." };
    }
    data.problemUrl = url || null;
  }
  if ("isSolved" in body) {
    if (typeof body.isSolved !== "boolean") return { ok: false, error: "Solved status must be true or false." };
    data.isSolved = body.isSolved;
  }
  for (const field of ["attempts", "accuracy"] as const) {
    if (!(field in body)) continue;
    const value = body[field];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > (field === "accuracy" ? 100 : 10000)) return { ok: false, error: field === "accuracy" ? "Accuracy must be a whole number from 0 to 100." : "Attempts must be a whole number from 0 to 10,000." };
    data[field] = value;
  }
  if ("notes" in body) {
    if (body.notes !== null && (typeof body.notes !== "string" || body.notes.length > 5000)) return { ok: false, error: "Notes must be text with at most 5,000 characters." };
    data.notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  }
  if ("solvedAt" in body) {
    if (body.solvedAt === null || body.solvedAt === "") data.solvedAt = null;
    else if (typeof body.solvedAt === "string" && !Number.isNaN(Date.parse(body.solvedAt))) data.solvedAt = new Date(body.solvedAt);
    else return { ok: false, error: "Solved date must be valid." };
  }
  return { ok: true, data };
}
