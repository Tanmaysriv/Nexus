import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser, findResume, upsertResume, deleteResume, updateResume, getBlob, putBlob, deleteBlob, extractPdfText, analyzeResume } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findResume: vi.fn(),
  upsertResume: vi.fn(),
  deleteResume: vi.fn(),
  updateResume: vi.fn(),
  getBlob: vi.fn(),
  putBlob: vi.fn(),
  deleteBlob: vi.fn(),
  extractPdfText: vi.fn(),
  analyzeResume: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: { resume: { findUnique: findResume, upsert: upsertResume, delete: deleteResume, update: updateResume } } }));
vi.mock("@vercel/blob", () => ({ get: getBlob, put: putBlob, del: deleteBlob }));
vi.mock("@/lib/resume-analysis", () => ({
  MAX_RESUME_BYTES: 3 * 1024 * 1024,
  extractPdfText,
  analyzeResume,
}));

import { GET as getResume, DELETE as deleteResumeRoute } from "@/app/api/resume/route";
import { GET as getResumeFile } from "@/app/api/resume/file/route";
import { POST as analyzeResumeRoute } from "@/app/api/resume/analyze/route";

describe("resume tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-token");
    getCurrentUser.mockResolvedValue({ id: "user-a" });
    findResume.mockResolvedValue({ id: "resume-a", userId: "user-a", blobUrl: "https://private.example/resume-a", fileName: "resume.pdf", rawText: "TypeScript experience and React projects" });
    deleteResume.mockResolvedValue({ id: "resume-a" });
    updateResume.mockResolvedValue({ id: "resume-a" });
    getBlob.mockResolvedValue({ statusCode: 200, stream: new ReadableStream(), blob: { size: 10 } });
    deleteBlob.mockResolvedValue(undefined);
    extractPdfText.mockResolvedValue("TypeScript experience and React projects");
    analyzeResume.mockReturnValue({ compatibilityScore: 70, requiredSkills: ["React"] });
  });

  it("requires authentication before returning resume metadata", async () => {
    getCurrentUser.mockResolvedValue(null);
    const response = await getResume();
    expect(response.status).toBe(401);
    expect(findResume).not.toHaveBeenCalled();
  });

  it("looks up the signed-in user's resume file only", async () => {
    const response = await getResumeFile();
    expect(response.status).toBe(200);
    expect(findResume).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-a" } }));
    expect(getBlob).toHaveBeenCalledWith("https://private.example/resume-a", expect.objectContaining({ access: "private" }));
  });

  it("deletes only the signed-in user's resume reference and blob", async () => {
    const response = await deleteResumeRoute();
    expect(response.status).toBe(200);
    expect(findResume).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "user-a" } }));
    expect(deleteResume).toHaveBeenCalledWith({ where: { id: "resume-a", userId: "user-a" } });
    expect(deleteBlob).toHaveBeenCalledWith("https://private.example/resume-a", expect.objectContaining({ token: "test-token" }));
  });

  it("analyzes only the signed-in user's extracted resume text", async () => {
    const response = await analyzeResumeRoute(new Request("http://localhost/api/resume/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription: "React developer" }),
    }));
    expect(response.status).toBe(200);
    expect(analyzeResume).toHaveBeenCalledWith("TypeScript experience and React projects", "React developer");
    expect(updateResume).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "resume-a", userId: "user-a" } }));
  });
});
