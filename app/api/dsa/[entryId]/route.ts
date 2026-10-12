import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { parseDsaInput } from "@/lib/dsa-validation";

type Context = { params: Promise<{ entryId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { entryId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
  const parsed = parseDsaInput(body, true);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "Provide at least one field to update." }, { status: 400 });
  const data = parsed.data;
  if (data.isSolved === true && data.solvedAt === undefined) data.solvedAt = new Date();
  if (data.isSolved === false && data.solvedAt === undefined) data.solvedAt = null;
  try {
    const result = await prisma.dsaEntry.updateMany({ where: { id: entryId, userId: user.id }, data });
    if (!result.count) return NextResponse.json({ error: "Problem entry not found." }, { status: 404 });
    const entry = await prisma.dsaEntry.findFirst({ where: { id: entryId, userId: user.id } });
    return NextResponse.json({ entry });
  } catch (error) {
    logger.error("DSA entry update failed", { userId: user.id, error });
    return NextResponse.json({ error: "Unable to update DSA entry." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { entryId } = await params;
  try {
    const result = await prisma.dsaEntry.deleteMany({ where: { id: entryId, userId: user.id } });
    if (!result.count) return NextResponse.json({ error: "Problem entry not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    logger.error("DSA entry deletion failed", { userId: user.id, error });
    return NextResponse.json({ error: "Unable to delete DSA entry." }, { status: 500 });
  }
}
