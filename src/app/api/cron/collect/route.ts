import { NextRequest, NextResponse } from "next/server";
import { runCollection } from "@/lib/collect";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runCollection();
  return NextResponse.json(result);
}
