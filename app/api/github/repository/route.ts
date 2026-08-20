import { analyzeRepository } from "@/lib/repository-analyzer";
import { NextResponse } from "next/server";

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");

    if (!owner || !repo) {
      return NextResponse.json(
        {
          error:
            "Both owner and repo are required.",
        },
        {
          status: 400,
        }
      );
    }

    const signals = await analyzeRepository(
      owner,
      repo
    );

    return NextResponse.json({
      owner,
      repo,
      signals,
    });
  } catch (error) {
    console.error(
      "Repository analysis error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to analyze repository.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}