import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { DSA_DIFFICULTIES, DSA_TOPICS, parseDsaInput } from "@/lib/dsa-validation";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const url = new URL(request.url);
  const topic = url.searchParams.get("topic");
  const difficulty = url.searchParams.get("difficulty");
  if (topic && topic !== "ALL" && !DSA_TOPICS.includes(topic as (typeof DSA_TOPICS)[number])) return NextResponse.json({ error: "Choose a supported DSA topic." }, { status: 400 });
  if (difficulty && difficulty !== "ALL" && !DSA_DIFFICULTIES.includes(difficulty as (typeof DSA_DIFFICULTIES)[number])) return NextResponse.json({ error: "Choose a supported difficulty." }, { status: 400 });
  try {
    const [entries, allEntries] = await Promise.all([
      prisma.dsaEntry.findMany({ where: { userId: user.id, ...(topic && topic !== "ALL" ? { topic } : {}), ...(difficulty && difficulty !== "ALL" ? { difficulty } : {}) }, orderBy: [{ updatedAt: "desc" }] }),
      prisma.dsaEntry.findMany({ where: { userId: user.id }, select: { topic: true, difficulty: true, isSolved: true, attempts: true, accuracy: true, solvedAt: true } }),
    ]);
    const solved = allEntries.filter((entry) => entry.isSolved);
    const topicProgress = Object.fromEntries(DSA_TOPICS.map((item) => [item, {
      total: allEntries.filter((entry) => entry.topic === item).length,
      solved: solved.filter((entry) => entry.topic === item).length,
    }]));
    const difficultyDistribution = Object.fromEntries(DSA_DIFFICULTIES.map((item) => [item, allEntries.filter((entry) => entry.difficulty === item).length]));
    const byTopic = new Map<string, number[]>();
    for (const entry of solved) byTopic.set(entry.topic, [...(byTopic.get(entry.topic) ?? []), entry.accuracy]);
    const weakTopics = [...byTopic.entries()]
      .filter(([, values]) => values.length >= 2 && values.reduce((sum, value) => sum + value, 0) / values.length < 70)
      .map(([name, values]) => ({ topic: name, accuracy: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length), solved: values.length }))
      .sort((a, b) => a.accuracy - b.accuracy);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 29);
    const practiceDays = new Set(solved.filter((entry) => entry.solvedAt && entry.solvedAt >= cutoff).map((entry) => entry.solvedAt!.toISOString().slice(0, 10))).size;
    const averageAccuracy = solved.length ? Math.round(solved.reduce((sum, entry) => sum + entry.accuracy, 0) / solved.length) : null;
    return NextResponse.json({
      entries,
      stats: {
        total: allEntries.length, solved: solved.length, averageAccuracy, totalAttempts: allEntries.reduce((sum, entry) => sum + entry.attempts, 0),
        topicProgress, weakTopics, difficultyDistribution, practiceDaysLast30: practiceDays,
      },
    });
  } catch (error) {
    logger.error("DSA tracker load failed", { userId: user.id, error });
    return NextResponse.json({ error: "Unable to load DSA progress." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
  const parsed = parseDsaInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const data = parsed.data;
  if (data.isSolved === true && data.solvedAt === undefined) data.solvedAt = new Date();
  try {
    const entry = await prisma.dsaEntry.create({
      data: {
        userId: user.id,
        topic: data.topic as string,
        problem: data.problem as string,
        difficulty: data.difficulty as string,
        problemUrl: data.problemUrl as string | null | undefined,
        isSolved: data.isSolved as boolean | undefined,
        attempts: data.attempts as number | undefined,
        accuracy: data.accuracy as number | undefined,
        notes: data.notes as string | null | undefined,
        solvedAt: data.solvedAt as Date | null | undefined,
      },
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    logger.error("DSA entry creation failed", { userId: user.id, error });
    return NextResponse.json({ error: "Unable to create DSA entry." }, { status: 500 });
  }
}
