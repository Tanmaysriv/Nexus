import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { requireApiAuth, getCurrentUser } from "@/lib/auth";
import { getNexusContext } from "@/lib/nexus-context";
import { runCareerAgent } from "@/lib/career-agent";

export async function POST() {
  const auth = await requireApiAuth();

  if (auth) {
    return auth;
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const context = await getNexusContext(user.id);
    const result = await runCareerAgent(context);

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Career Agent error", { error });

    return NextResponse.json(
      {
        error: "Unable to run Career Agent.",
      },
      {
        status: 500,
      }
    );
  }
}

