import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const sessions = await prisma.session.findMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, expiresAt: true },
  });
  return NextResponse.json({ sessions });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    await prisma.session.deleteMany({ where: { userId: user.id } });
    const cookieStore = await cookies();
    cookieStore.delete("nexus_session");
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Session revocation failed", { userId: user.id, route: "/api/user/sessions", error });
    return NextResponse.json({ error: "Unable to sign out all sessions." }, { status: 500 });
  }
}
