import Link from "next/link";
import { getCategoriesFull, getSubcategories } from "@/lib/articles-query";
import { CategoryForm } from "@/components/CategoryForm";
import { CategoryRow } from "@/components/CategoryRow";
import { SubcategoryManager } from "@/components/SubcategoryManager";
import { logout } from "@/lib/auth-actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [categories, subcategories] = await Promise.all([
    getCategoriesFull(),
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
            Catégories
          </h2>

          <div className="border-t border-rule">
            {categories.length === 0 ? (
              <p className="font-body py-6 text-sm text-ink-soft">
                Aucune catégorie pour le moment.
              </p>
            ) : (
              categories.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))
            )}
          </div>

          <CategoryForm />
        </section>

        <SubcategoryManager categories={categories} subcategories={subcategories} />
      </div>
    </main>
  );
}
