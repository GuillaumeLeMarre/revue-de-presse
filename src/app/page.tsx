import { getCategories, getReadyArticles } from "@/lib/articles-query";
import { RevueClient } from "@/components/RevueClient";
import { logout } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [categories, articles] = await Promise.all([
    getCategories(),
    getReadyArticles(),
  ]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto flex max-w-5xl justify-end px-4 pt-4">
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Se déconnecter
          </button>
        </form>
      </div>
      <RevueClient initialArticles={articles} categories={categories} />
    </main>
  );
}
