import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leaderboard } from "@/lib/db/schema";
import { validateSubmission } from "@/lib/validation";
import { LEADERBOARD_LIMIT } from "@/lib/constants";
import { desc } from "drizzle-orm";

// GET /api/leaderboard - Retrieve top 10 scores
export async function GET() {
  try {
    const scores = await db
      .select({
        id: leaderboard.id,
        nick: leaderboard.nick,
        score: leaderboard.score,
        snakeLength: leaderboard.snakeLength,
        createdAt: leaderboard.createdAt,
      })
      .from(leaderboard)
      .orderBy(desc(leaderboard.score))
      .limit(LEADERBOARD_LIMIT);

    return NextResponse.json({
      success: true,
      data: scores.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

// POST /api/leaderboard - Submit new score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the submission
    const validation = validateSubmission(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { nick, score, snakeLength } = validation.data;

    // Insert the new score
    const result = await db
      .insert(leaderboard)
      .values({
        nick: nick || "Anonymous",
        score,
        snakeLength,
      })
      .returning();

    const newEntry = result[0];

    return NextResponse.json({
      success: true,
      data: {
        id: newEntry.id,
        nick: newEntry.nick,
        score: newEntry.score,
        snakeLength: newEntry.snakeLength,
        createdAt: newEntry.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to submit score:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit score" },
      { status: 500 }
    );
  }
}

