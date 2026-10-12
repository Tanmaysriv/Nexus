import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { APPLICATION_STATUSES, parseApplicationInput } from "@/lib/application-validation";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search")?.trim().slice(0, 160);
    if (status && status !== "ALL" && !APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) {
      return NextResponse.json({ error: "Choose a valid application status." }, { status: 400 });
    }

    const [applications, allApplications] = await Promise.all([
      prisma.application.findMany({
        where: {
          userId: user.id,
          ...(status && status !== "ALL" ? { status } : {}),
          ...(search ? { OR: [
            { company: { contains: search, mode: "insensitive" } },
            { role: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
          ] } : {}),
        },
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.application.findMany({
        where: { userId: user.id },
        select: { status: true, interviewAt: true },
      }),
    ]);

    const byStatus = Object.fromEntries(APPLICATION_STATUSES.map((item) => [item, 0])) as Record<string, number>;
    for (const application of allApplications) byStatus[application.status] = (byStatus[application.status] ?? 0) + 1;
    const now = new Date();
    const upcomingInterviews = allApplications.filter((item) => item.interviewAt && item.interviewAt >= now).length;

    return NextResponse.json({
      applications,
      stats: {
        total: allApplications.length,
        active: allApplications.filter((item) => !["REJECTED", "WITHDRAWN"].includes(item.status)).length,
        interviews: byStatus.INTERVIEW,
        offers: byStatus.OFFER,
        upcomingInterviews,
        byStatus,
      },
    });
  } catch (error) {
    logger.error("Application list failed", { userId: user.id, error });
    return NextResponse.json({ error: "Unable to load applications." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }
  const parsed = parseApplicationInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const data = parsed.data;
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        company: data.company!,
        role: data.role!,
        jobUrl: data.jobUrl,
        location: data.location,
        salary: data.salary,
        description: data.description,
        status: data.status,
        appliedAt: data.appliedAt ? new Date(data.appliedAt) : null,
        interviewAt: data.interviewAt ? new Date(data.interviewAt) : null,
        notes: data.notes,
      },
    });
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    logger.error("Application creation failed", { userId: user.id, error });
    return NextResponse.json({ error: "Unable to create application." }, { status: 500 });
  }
}
