import Link from "next/link";
import { getCategories, getSubcategories } from "@/lib/articles-query";
import { getSources } from "@/lib/sources-query";
import { SourceForm } from "@/components/SourceForm";
import { SourceRow } from "@/components/SourceRow";
import { SubcategoryManager } from "@/components/SubcategoryManager";
import { logout } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [categories, sources, subcategories] = await Promise.all([
    getCategories(),
    getSources(),
    getSubcategories(),
  ]);

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6">
        <header className="flex items-center justify-between border-b border-rule pb-5">
          <div className="flex items-baseline gap-4">
            <Link
              href="/"
              className="font-body text-sm text-ink-soft hover:text-ink"
            >
              ← Édition
            </Link>
            <h1 className="font-display text-2xl font-medium text-ink">
              Réglages
            </h1>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="font-body text-sm text-ink-soft hover:text-ink"
            >
              Quitter
            </button>
          </form>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="font-display text-sm font-medium uppercase tracking-wide text-ink-soft">
            Sources suivies
          </h2>

          <div className="border-t border-rule">
            {sources.length === 0 ? (
              <p className="font-body py-6 text-sm text-ink-soft">
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

        <SubcategoryManager categories={categories} subcategories={subcategories} />
      </div>
    </main>
  );
}
