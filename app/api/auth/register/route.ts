import { NextResponse } from "next/server";

import {
  createUserSession,
  hashPassword,
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
    `register:${getClientKey(request)}`,
    5,
    15 * 60 * 1000,
  );

  if (rateLimit.serviceUnavailable) {
    return NextResponse.json(
      { error: "Registration service temporarily unavailable." },
      { status: 503, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many registration attempts. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: "Enter a valid name." },
        { status: 400 },
      );
    }

    if (!email || email.length > 320) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    if (password.length < 8 || password.length > 256) {
      return NextResponse.json(
        {
          error:
            "Password must be between 8 and 256 characters.",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "An account with this email already exists.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    await createUserSession(user.id);

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Registration request failed", { error });

    return NextResponse.json(
      { error: "Unable to create your account." },
      { status: 500 },
    );
  }
}



