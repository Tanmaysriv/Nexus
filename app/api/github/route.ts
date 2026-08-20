import { getGitHubActivity, getGitHubStats } from "@/lib/github";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stats = await getGitHubStats();

    const username = stats.profile.login;

    const activity = await getGitHubActivity(username);

    return NextResponse.json({
      stats,
      activity,
    });
  } catch (error) {
    console.error("GitHub API error:", error);

    return NextResponse.json(
      {
        error: "Unable to fetch GitHub data",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}