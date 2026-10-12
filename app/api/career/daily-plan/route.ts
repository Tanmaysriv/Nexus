import { NextResponse } from "next/server";
import { getCurrentUser, requireApiAuth } from "@/lib/auth";
import { getDailyCareerPlan } from "@/lib/daily-career-plan";

export async function GET() {
  const authError = await requireApiAuth();

  if (authError) {
    return authError;
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  try {
    const plan = await getDailyCareerPlan(user.id);

    return NextResponse.json({
      plan,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[daily-plan] Failed to generate daily plan", error);

    return NextResponse.json(
      { error: "Failed to generate daily career plan." },
      { status: 500 },
    );
  }
}