import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  return NextResponse.json({
    profile: { id: user.id, name: user.name, email: user.email },
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const name = typeof input.name === "string" ? input.name.trim() : undefined;
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : undefined;
    if (name === undefined && email === undefined) {
      return NextResponse.json({ error: "Provide a name or email to update." }, { status: 400 });
    }
    if (name !== undefined && (name.length < 1 || name.length > 100)) {
      return NextResponse.json({ error: "Name must be between 1 and 100 characters." }, { status: 400 });
    }
    if (email !== undefined && (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const profile = await prisma.user.update({
      where: { id: user.id },
      data: { ...(name !== undefined ? { name } : {}), ...(email !== undefined ? { email } : {}) },
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json({ profile });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    logger.error("Profile update failed", { userId: user.id, route: "/api/user/profile", error });
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}
