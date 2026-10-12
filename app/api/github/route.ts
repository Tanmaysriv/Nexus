import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { getCurrentUser, requireApiAuth } from "@/lib/auth";
import {
  getGitHubActivity,
  getGitHubStats,
  hasGitHubAccount,
} from "@/lib/github";

export async function GET() {
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

    const connected = await hasGitHubAccount(user.id);

    if (!connected) {
      return NextResponse.json({
        connected: false,
        stats: null,
        activity: [],
      });
    }

    const stats = await getGitHubStats(user.id);
    const activity = await getGitHubActivity(user.id);

    return NextResponse.json({
      connected: true,
      stats,
      activity,
    });
  } catch (error) {
    logger.error("GitHub API error", { error });

    return NextResponse.json(
      {
        error: "Unable to fetch GitHub data",
      },
      { status: 500 },
    );
  }
}

