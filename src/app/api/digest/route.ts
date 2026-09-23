import { NextRequest, NextResponse } from "next/server";
import { getCategories, getTodayDailySummaries } from "@/lib/articles-query";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.DIGEST_TOKEN;
  const provided = request.headers.get("x-digest-token");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [categories, summaries] = await Promise.all([
    getCategories(),
    getTodayDailySummaries(),
  ]);

  const digest = categories
    .map((category) => {
      const summary = summaries.get(category.id);
      return {
        name: category.name,
        slug: category.slug,
        facts: summary?.globalFacts ?? [],
      };
    })
    .filter((c) => c.facts.length > 0);

  return NextResponse.json({ date: new Date().toISOString(), categories: digest });
}
