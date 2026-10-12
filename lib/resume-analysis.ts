import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const MAX_RESUME_BYTES = 3 * 1024 * 1024;
export const MAX_RESUME_PAGES = 30;
export const MAX_RESUME_TEXT_CHARS = 100_000;

export const SKILL_PATTERNS: Record<string, RegExp> = {
  JavaScript: /\b(?:javascript|js)\b/i,
  TypeScript: /\b(?:typescript|ts)\b/i,
  React: /\breact(?:\.js)?\b/i,
  "Next.js": /\bnext(?:\.js|js)\b/i,
  "Node.js": /\bnode(?:\.js|js)\b/i,
  Python: /\bpython\b/i,
  Java: /\bjava\b/i,
  "C#": /\bc\s*#(?:\b|(?=\s|[,.;)]|$))/i,
  Go: /\bgolang\b|\bgo\s+(?:language|programming)\b/i,
  Rust: /\brust\b/i,
  SQL: /\bsql\b/i,
  PostgreSQL: /\bpostgres(?:ql)?\b/i,
  MongoDB: /\bmongodb\b/i,
  Redis: /\bredis\b/i,
  Docker: /\bdocker\b/i,
  Kubernetes: /\bkubernetes|\bk8s\b/i,
  AWS: /\baws|amazon web services\b/i,
  Azure: /\bazure\b/i,
  GCP: /\bgcp|google cloud(?: platform)?\b/i,
  Git: /\bgit\b/i,
  "CI/CD": /\bci\s*\/\s*cd|continuous integration\b/i,
  GraphQL: /\bgraphql\b/i,
  "REST APIs": /\brest(?:ful)?\s+apis?\b/i,
  Testing: /\b(?:unit|integration|end-to-end|e2e) testing\b/i,
  Playwright: /\bplaywright\b/i,
  Jest: /\bjest\b/i,
  Vitest: /\bvitest\b/i,
  "System Design": /\bsystem design\b/i,
  "Data Structures": /\bdata structures?\b/i,
  Algorithms: /\balgorithms?\b/i,
};

export async function extractPdfText(data: Uint8Array) {
  const task = getDocument({
    data,
    useSystemFonts: true,
    stopAtErrors: true,
  });
  const document = await task.promise;
  try {
    if (document.numPages > MAX_RESUME_PAGES) {
      throw new Error(`PDFs may contain at most ${MAX_RESUME_PAGES} pages.`);
    }
    const chunks: string[] = [];
    let length = 0;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .flatMap((item) => "str" in item ? [item.str] : [])
        .join(" ");
      chunks.push(text);
      length += text.length;
      if (length > MAX_RESUME_TEXT_CHARS) {
        throw new Error("Extracted resume text is too long to analyze safely.");
      }
    }
    const rawText = chunks.join("\n").replace(/[\t\u00a0 ]+/g, " ").trim();
    if (rawText.length < 40) {
      throw new Error("No readable text was found. Scanned PDFs without selectable text are not supported yet.");
    }
    return rawText;
  } finally {
    await task.destroy();
  }
}

export function extractResumeSkills(text: string) {
  return Object.entries(SKILL_PATTERNS).flatMap(([skill, pattern]) => {
    const match = pattern.exec(text);
    if (!match) return [];
    const start = Math.max(0, match.index - 75);
    const end = Math.min(text.length, match.index + match[0].length + 100);
    const excerpt = text.slice(start, end).replace(/\s+/g, " ").trim();
    return [{ skill, source: "Resume", excerpt }];
  });
}

const STOP_WORDS = new Set("a an and are as at be by for from has have in into is it its of on or our that the their this to we will with you your experience including required preferred strong skills ability work team role candidate years using knowledge responsibilities development software engineer engineering".split(" "));

function containsPhrase(text: string, phrase: string) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+#.])${escaped}($|[^a-z0-9+#.])`, "i").test(text);
}

export function analyzeResume(text: string, jobDescription: string) {
  const resumeSkills = extractResumeSkills(text);
  const requiredSkills = Object.entries(SKILL_PATTERNS)
    .filter(([, pattern]) => pattern.test(jobDescription))
    .map(([skill]) => skill);
  const lowerDescription = jobDescription.toLowerCase();
  const words = lowerDescription.match(/[a-z][a-z+#.]{2,}/g) ?? [];
  const frequency = new Map<string, number>();
  for (const word of words) {
    if (!STOP_WORDS.has(word)) frequency.set(word, (frequency.get(word) ?? 0) + 1);
  }
  const keywordCandidates = [
    ...requiredSkills,
    ...[...frequency.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([word]) => word),
  ];
  const keywords = [...new Set(keywordCandidates)].slice(0, 20);
  const matchedKeywords = keywords.filter((keyword) => containsPhrase(text, keyword));
  const missingKeywords = keywords.filter((keyword) => !containsPhrase(text, keyword));
  const lowerText = text.toLowerCase();
  const sections = [
    { name: "Experience", pattern: /\b(?:experience|employment|work history)\b/i },
    { name: "Projects", pattern: /\bprojects?\b/i },
    { name: "Skills", pattern: /\b(?:skills|technical skills|technologies)\b/i },
    { name: "Education", pattern: /\b(?:education|academic background)\b/i },
  ];
  const presentSections = sections.filter(({ pattern }) => pattern.test(text)).map(({ name }) => name);
  const weakSections = sections.filter(({ pattern }) => !pattern.test(text)).map(({ name }) => name);
  const keywordCoverage = keywords.length ? Math.round((matchedKeywords.length / keywords.length) * 100) : 0;
  const sectionCoverage = Math.round((presentSections.length / sections.length) * 100);
  const compatibilityScore = keywords.length
    ? Math.round(keywordCoverage * 0.8 + sectionCoverage * 0.2)
    : null;
  const suggestions = [
    ...weakSections.map((section) => `Consider adding a clearly labeled ${section} section if relevant to your experience.`),
    ...requiredSkills.filter((skill) => !resumeSkills.some((item) => item.skill === skill))
      .map((skill) => `The job description requires ${skill}; your resume did not provide evidence for it. Add a truthful example if you have one, or build a project to demonstrate it.`),
    ...(missingKeywords.length ? [`Review these job-description keywords and add only those that accurately describe your experience: ${missingKeywords.slice(0, 8).join(", ")}.`] : []),
  ];

  return {
    compatibilityScore,
    methodology: "ATS-style estimate: 80% distinct job-description keyword coverage and 20% presence of Experience, Projects, Skills, and Education headings. This is not an official ATS score.",
    keywordCoverage,
    sectionCoverage,
    matchedKeywords,
    missingKeywords,
    requiredSkills,
    identifiedSkills: resumeSkills,
    presentSections,
    weakSections,
    suggestions,
    textLength: lowerText.length,
  };
}
