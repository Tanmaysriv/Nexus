import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

import { destroyCurrentSession } from "@/lib/auth";

export async function POST() {
  try {
    await destroyCurrentSession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error("NEXUS logout error", { error });

    return NextResponse.json(
      { error: "Unable to sign out." },
      { status: 500 },
    );
  }
}

