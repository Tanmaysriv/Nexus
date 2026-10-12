import { del, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { extractPdfText, MAX_RESUME_BYTES } from "@/lib/resume-analysis";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const resume = await prisma.resume.findUnique({
      where: { userId: user.id },
      select: { id: true, fileName: true, mimeType: true, sizeBytes: true, score: true, analysis: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ resume });
  } catch (error) {
    logger.error("Resume metadata load failed", { userId: user.id, route: "/api/resume", error });
    return NextResponse.json({ error: "Unable to load resume." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rateLimit = await checkRateLimit(`resume-upload:${user.id}`, 5, 60 * 60 * 1000);
  if (rateLimit.serviceUnavailable) return NextResponse.json({ error: "Resume uploads are temporarily unavailable." }, { status: 503, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  if (!rateLimit.allowed) return NextResponse.json({ error: "Upload limit reached. Try again later." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Private resume storage is not configured." }, { status: 503 });
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_RESUME_BYTES + 256_000) {
    return NextResponse.json({ error: "Resume PDF must be no larger than 3 MB." }, { status: 413 });
  }

  let uploadedUrl: string | undefined;
  try {
    const form = await request.formData();
    const file = form.get("resume");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a PDF resume to upload." }, { status: 400 });
    }
    if (file.size < 1 || file.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: "Resume PDF must be between 1 byte and 3 MB." }, { status: 413 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!Buffer.from(bytes.subarray(0, 1024)).includes(Buffer.from("%PDF-"))) {
      return NextResponse.json({ error: "The uploaded file is not a valid PDF." }, { status: 400 });
    }

    const rawText = await extractPdfText(bytes);
    const previous = await prisma.resume.findUnique({ where: { userId: user.id }, select: { blobUrl: true } });
    const safeName = file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 120) || "resume.pdf";
    const blob = await put(`resumes/${user.id}/${randomUUID()}.pdf`, Buffer.from(bytes), {
      access: "private",
      addRandomSuffix: true,
      contentType: "application/pdf",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    uploadedUrl = blob.url;

    await prisma.resume.upsert({
      where: { userId: user.id },
      create: { userId: user.id, fileName: safeName, sizeBytes: file.size, blobUrl: blob.url, rawText, analysis: {}, score: null },
      update: { fileName: safeName, sizeBytes: file.size, blobUrl: blob.url, rawText, analysis: {}, score: null },
    });
    if (previous?.blobUrl) {
      try { await del(previous.blobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN }); }
      catch (error) { logger.warn("Replaced resume object cleanup failed", { userId: user.id, error }); }
    }

    return NextResponse.json({ success: true, resume: { fileName: safeName, sizeBytes: file.size } });
  } catch (error) {
    if (uploadedUrl) {
      try { await del(uploadedUrl, { token: process.env.BLOB_READ_WRITE_TOKEN }); }
      catch { /* Keep the original request failure safe; orphan cleanup can be retried operationally. */ }
    }
    const message = error instanceof Error ? error.message : "";
    if (/PDFs may contain|No readable text|too long to analyze|password/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    logger.error("Resume upload failed", { userId: user.id, route: "/api/resume", error });
    return NextResponse.json({ error: "Unable to process this resume. Please try again." }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rateLimit = await checkRateLimit(`resume-delete:${user.id}`, 10, 60 * 60 * 1000);
  if (rateLimit.serviceUnavailable) return NextResponse.json({ error: "Resume service is temporarily unavailable." }, { status: 503 });
  if (!rateLimit.allowed) return NextResponse.json({ error: "Please wait before trying again." }, { status: 429 });

  try {
    const resume = await prisma.resume.findUnique({ where: { userId: user.id }, select: { id: true, blobUrl: true } });
    if (!resume) return NextResponse.json({ success: true, deleted: false });
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Private resume storage is not configured." }, { status: 503 });
    }
    await del(resume.blobUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
    await prisma.resume.delete({ where: { id: resume.id, userId: user.id } });
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    logger.error("Resume deletion failed", { userId: user.id, route: "/api/resume", error });
    return NextResponse.json({ error: "Unable to delete resume." }, { status: 500 });
  }
}
