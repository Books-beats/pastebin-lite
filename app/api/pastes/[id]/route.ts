import { NextResponse } from "next/server";
import { kv } from "@/lib/redis";
import { getEffectiveTime } from "@/lib/time";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch data
    const paste = await kv.hgetall(`paste:${id}`);

    if (!paste || Object.keys(paste).length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check Expiry
    const now = await getEffectiveTime();
    if (paste.expires_at) {
      const expiresAt = parseInt(paste.expires_at as string, 10);
      if (now > expiresAt) {
        return NextResponse.json({ error: "Expired" }, { status: 404 });
      }
    }

    // Check and Update Views
    let viewsRemaining: number | null = null;

    if (paste.views_remaining !== undefined && paste.views_remaining !== null) {
      // Atomic Decrement: Decrement first to ensure concurrency safety
      const newViews = await kv.hincrby(`paste:${id}`, "views_remaining", -1);

      if (newViews < 0) {
        // Limit exceeded (it was 0 before we decremented, so it became -1)
        return NextResponse.json(
          { error: "View limit exceeded" },
          { status: 404 }
        );
      }

      viewsRemaining = newViews;
    }

    return NextResponse.json({
      content: paste.content,
      remaining_views: viewsRemaining,
      expires_at: paste.expires_at
        ? new Date(parseInt(paste.expires_at as string)).toISOString()
        : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
