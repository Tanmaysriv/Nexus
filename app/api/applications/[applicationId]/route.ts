import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { parseApplicationInput } from "@/lib/application-validation";

type Context = { params: Promise<{ applicationId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { applicationId } = await params;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }
  const parsed = parseApplicationInput(body, true);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!Object.keys(parsed.data).length) return NextResponse.json({ error: "Provide at least one field to update." }, { status: 400 });

  try {
    const data = {
      ...parsed.data,
      ...(parsed.data.appliedAt !== undefined ? { appliedAt: parsed.data.appliedAt ? new Date(parsed.data.appliedAt) : null } : {}),
      ...(parsed.data.interviewAt !== undefined ? { interviewAt: parsed.data.interviewAt ? new Date(parsed.data.interviewAt) : null } : {}),
    };
    const result = await prisma.application.updateMany({
      where: { id: applicationId, userId: user.id },
      data,
    });
    if (!result.count) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    const application = await prisma.application.findFirst({ where: { id: applicationId, userId: user.id } });
    return NextResponse.json({ application });
  } catch (error) {
    logger.error("Application update failed", { userId: user.id, error });
    return NextResponse.json({ error: "Unable to update application." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { applicationId } = await params;

  try {
    const result = await prisma.application.deleteMany({ where: { id: applicationId, userId: user.id } });
    if (!result.count) return NextResponse.json({ error: "Application not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    logger.error("Application deletion failed", { userId: user.id, error });
    return NextResponse.json({ error: "Unable to delete application." }, { status: 500 });
  }
}
