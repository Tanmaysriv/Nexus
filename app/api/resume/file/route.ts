import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const resume = await prisma.resume.findUnique({ where: { userId: user.id }, select: { blobUrl: true, fileName: true } });
    if (!resume) return NextResponse.json({ error: "Resume not found." }, { status: 404 });
    if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Private resume storage is not configured." }, { status: 503 });
    const blob = await get(resume.blobUrl, { access: "private", token: process.env.BLOB_READ_WRITE_TOKEN, useCache: false });
    if (!blob || blob.statusCode !== 200) return NextResponse.json({ error: "Resume file not found." }, { status: 404 });
    const safeName = resume.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 120) || "resume.pdf";
    const encodedName = encodeURIComponent(safeName).replace(/['()]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    return new NextResponse(blob.stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume.pdf"; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logger.error("Resume download failed", { userId: user.id, route: "/api/resume/file", error });
    return NextResponse.json({ error: "Unable to download resume." }, { status: 500 });
  }
}
