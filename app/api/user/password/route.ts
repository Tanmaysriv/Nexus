import { NextResponse } from "next/server";

import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const currentPassword = typeof input.currentPassword === "string" ? input.currentPassword : "";
    const newPassword = typeof input.newPassword === "string" ? input.newPassword : "";
    if (!currentPassword || newPassword.length < 8 || newPassword.length > 256) {
      return NextResponse.json({ error: "Enter your current password and a new password between 8 and 256 characters." }, { status: 400 });
    }
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);
    const response = NextResponse.json({ success: true, message: "Password changed. Sign in again on your devices." });
    response.cookies.delete("nexus_session");
    return response;
  } catch (error) {
    logger.error("Password update failed", { userId: user.id, route: "/api/user/password", error });
    return NextResponse.json({ error: "Unable to change password." }, { status: 500 });
  }
}
