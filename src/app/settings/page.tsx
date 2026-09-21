import Link from "next/link";
import { getCategories } from "@/lib/articles-query";
import { getSources } from "@/lib/sources-query";
import { SourceForm } from "@/components/SourceForm";
import { SourceRow } from "@/components/SourceRow";
import { logout } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [categories, sources] = await Promise.all([
    getCategories(),
    getSources(),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-gray-50 px-4 py-6 dark:bg-gray-950">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            ← Retour
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Paramètres
          </h1>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Se déconnecter
          </button>
        </form>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Sources suivies
        </h2>

        <div className="rounded-lg border border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
          {sources.length === 0 ? (
            <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
              Aucune source pour le moment.
            </p>
          ) : (
            sources.map((source) => (
              <SourceRow key={source.id} source={source} />
            ))
          )}
        </div>

        <SourceForm categories={categories} />
      </section>
    </main>
  );
}
