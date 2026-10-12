import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const supportedThemes = ["dark", "light"] as const;
type Theme = (typeof supportedThemes)[number];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ preferences: { theme: user.theme === "light" ? "light" : "dark" } });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const theme = (body as Record<string, unknown>).theme;
    if (!supportedThemes.includes(theme as Theme)) return NextResponse.json({ error: "Choose dark or light theme." }, { status: 400 });

    await prisma.user.update({ where: { id: user.id }, data: { theme: theme as Theme }, select: { id: true } });
    const cookieStore = await cookies();
    cookieStore.set("nexus_theme", theme as Theme, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return NextResponse.json({ preferences: { theme } });
  } catch (error) {
    logger.error("Preference update failed", { userId: user.id, route: "/api/user/preferences", error });
    return NextResponse.json({ error: "Unable to save preferences." }, { status: 500 });
  }
}
