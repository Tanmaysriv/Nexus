import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { parseLearningProgressInput } from "@/lib/learning-validation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const progress = await prisma.learningProgress.findMany({
      where: { userId: user.id },
      orderBy: [{ updatedAt: "desc" }],
    });
    return NextResponse.json({ progress });
  } catch (error) {
    logger.error("Learning progress load failed", { userId: user.id, error });
    return NextResponse.json({ error: "Unable to load learning progress." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }
  const parsed = parseLearningProgressInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const data = parsed.data;
    const progress = await prisma.learningProgress.upsert({
      where: { userId_skill: { userId: user.id, skill: data.skill } },
      create: {
        userId: user.id,
        skill: data.skill,
        status: data.status ?? "NOT_STARTED",
        resourceUrls: data.resourceUrls ?? [],
        practiceNotes: data.practiceNotes ?? null,
        assessmentNotes: data.assessmentNotes ?? null,
      },
      update: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.resourceUrls !== undefined ? { resourceUrls: data.resourceUrls } : {}),
        ...(data.practiceNotes !== undefined ? { practiceNotes: data.practiceNotes } : {}),
        ...(data.assessmentNotes !== undefined ? { assessmentNotes: data.assessmentNotes } : {}),
      },
    });
    return NextResponse.json({ progress });
  } catch (error) {
    logger.error("Learning progress save failed", { userId: user.id, error });
    return NextResponse.json({ error: "Unable to save learning progress." }, { status: 500 });
  }
}
