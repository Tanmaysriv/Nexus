import { NextResponse } from "next/server";

import {
  createUserSession,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(
    `login:${getClientKey(request)}`,
    5,
    15 * 60 * 1000
  );

  if (rateLimit.serviceUnavailable) {
    return NextResponse.json(
      { error: "Sign-in service temporarily unavailable." },
      { status: 503, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "Too many login attempts. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            rateLimit.retryAfterSeconds
          ),
        },
      }
    );
  }

  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const input = body as Record<string, unknown>;

    const email =
      typeof input.email === "string"
        ? input.email.trim().toLowerCase()
        : "";

    const password =
      typeof input.password === "string"
        ? input.password
        : "";

    if (
      !email ||
      email.length > 320 ||
      !password ||
      password.length > 256
    ) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    const validPassword = await verifyPassword(
      password,
      user.passwordHash
    );

    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    await createUserSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    logger.error("Login request failed", { error });

    return NextResponse.json(
      { error: "Unable to sign in." },
      { status: 500 }
    );
  }
}


