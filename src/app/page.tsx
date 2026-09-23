import {
  getCategories,
  getSubcategories,
  getReadyArticles,
  getTodayDailySummaries,
} from "@/lib/articles-query";
import { RevueClient } from "@/components/RevueClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [categories, subcategories, articles, summaryMap] = await Promise.all([
    getCategories(),
    getSubcategories(),
    getReadyArticles(),
    getTodayDailySummaries(),
  ]);

  const dailySummaries = Array.from(summaryMap.values());

  return (
    <main className="min-h-screen bg-paper">
      <RevueClient
        initialArticles={articles}
        categories={categories}
        subcategories={subcategories}
        dailySummaries={dailySummaries}
      />
    </main>
  );
}
