import { NextResponse } from "next/server";
import { kv } from "@/lib/redis";

export async function GET() {
  try {
    await kv.ping();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { ok: false, error: "Database unreachable" },
      { status: 503 }
    );
  }
}
