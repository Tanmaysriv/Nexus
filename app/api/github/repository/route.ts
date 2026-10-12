import { NextResponse } from "next/server";

import { getCurrentUser, requireApiAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { analyzeRepository } from "@/lib/repository-analyzer";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const authError = await requireApiAuth();

  if (authError) {
    return authError;
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const limit = await checkRateLimit(`github-analysis:${user.id}`, 30, 60 * 60 * 1000);
    if (limit.serviceUnavailable) return NextResponse.json({ error: "Repository analysis is temporarily unavailable." }, { status: 503, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    if (!limit.allowed) return NextResponse.json({ error: "Repository analysis limit reached. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });

    const { searchParams } =
      new URL(request.url);

    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");

    if (!owner || !repo || owner.length > 100 || repo.length > 100 || !/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
      return NextResponse.json(
        {
          error:
            "Both owner and repo are required.",
        },
        { status: 400 },
      );
    }

    const signals = await analyzeRepository(
      user.id,
      owner,
      repo,
    );

    return NextResponse.json({
      owner,
      repo,
      signals,
    });
  } catch (error) {
    logger.error("Repository analysis error", {
      error,
    });

    return NextResponse.json(
      {
        error: "Unable to analyze repository.",
      },
      { status: 500 },
    );
  }
}
