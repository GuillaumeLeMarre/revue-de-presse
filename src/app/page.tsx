import { getCategories, getReadyArticles } from "@/lib/articles-query";
import { RevueClient } from "@/components/RevueClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [categories, articles] = await Promise.all([
    getCategories(),
    getReadyArticles(),
  ]);

  return (
    <main className="min-h-screen bg-paper">
      <RevueClient initialArticles={articles} categories={categories} />
    </main>
  );
}
