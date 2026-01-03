import { NextResponse } from "next/server";
import { kv } from "@/lib/redis";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, ttl_seconds, max_views } = body;

    // Validation
    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (
      ttl_seconds !== undefined &&
      (typeof ttl_seconds !== "number" || ttl_seconds < 1)
    ) {
      return NextResponse.json(
        { error: "Invalid ttl_seconds" },
        { status: 400 }
      );
    }

    if (
      max_views !== undefined &&
      (typeof max_views !== "number" || max_views < 1)
    ) {
      return NextResponse.json({ error: "Invalid max_views" }, { status: 400 });
    }

    const id = nanoid(8);
    const now = Date.now();

    const expiresAt = ttl_seconds ? now + ttl_seconds * 1000 : null;

    const pasteData: Record<string, string | number> = {
      content,
      created_at: now,
    };

    if (max_views) pasteData.views_remaining = max_views;
    if (expiresAt) pasteData.expires_at = expiresAt;

    // Store in Redis Hash
    await kv.hset(`paste:${id}`, pasteData);

    // Set Redis Expiry (TTL) with a 5-minute safety buffer
    if (ttl_seconds) {
      await kv.expire(`paste:${id}`, ttl_seconds + 300);
    }

    // Construct URL
    const host = request.headers.get("host");
    const protocol = host && host.includes("localhost") ? "http" : "https";
    const baseUrl = host ? `${protocol}://${host}` : "";
    const url = `${baseUrl}/p/${id}`;

    return NextResponse.json({ id, url });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
