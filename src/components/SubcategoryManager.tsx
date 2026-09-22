"use client";

import { useActionState, useTransition } from "react";
import {
  createSubcategory,
  toggleSubcategory,
  deleteSubcategory,
  type SubcategoryFormState,
} from "@/lib/subcategories-actions";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  enabled: boolean;
}

const initialState: SubcategoryFormState = {};

export function SubcategoryManager({
  categories,
  subcategories,
}: {
  categories: Category[];
  subcategories: Subcategory[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-sm font-medium uppercase tracking-wide text-ink-soft">
        Sous-catégories
      </h2>
      <p className="font-body text-xs text-ink-soft">
        Définis un critère de pertinence par sous-catégorie. Un article n&apos;est
        gardé que si son sujet réel correspond au critère, pas juste au mot-clé de
        la catégorie.
      </p>

      {categories.map((category) => (
        <CategoryGroup
          key={category.id}
          category={category}
          items={subcategories.filter((s) => s.categoryId === category.id)}
        />
      ))}
    </section>
  );
}

function CategoryGroup({
  category,
  items,
}: {
  category: Category;
  items: Subcategory[];
}) {
  const [state, formAction, isSubmitting] = useActionState(
    createSubcategory,
    initialState
  );
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2 border-t border-rule pt-4">
      <h3 className="font-display text-base text-ink">{category.name}</h3>

      {items.length === 0 ? (
        <p className="font-body text-xs text-ink-soft">Aucune sous-catégorie.</p>
      ) : (
        items.map((s) => (
          <div
            key={s.id}
            className="flex items-start justify-between gap-3 rounded-md bg-card px-3 py-2"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-body text-sm font-medium text-ink">
                {s.name}
              </span>
              <span className="font-body text-xs text-ink-soft">
                {s.description}
              </span>
            </div>
            <div className="font-body flex shrink-0 items-center gap-3 text-xs">
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => toggleSubcategory(s.id, !s.enabled))
                }
                className="text-ink-soft hover:text-ink disabled:opacity-50"
              >
                {s.enabled ? "active" : "inactive"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (confirm(`Supprimer la sous-catégorie "${s.name}" ?`)) {
                    startTransition(() => deleteSubcategory(s.id));
                  }
                }}
                className="text-accent-alert hover:underline disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))
      )}

      <form action={formAction} className="flex flex-col gap-2 pt-1">
        <input type="hidden" name="categoryId" value={category.id} />
        <input
          type="text"
          name="name"
          placeholder="Nom (ex : Handicap en entreprise)"
          className="font-body rounded-md border border-rule bg-card px-3 py-1.5 text-sm text-ink placeholder:text-ink-soft/60"
        />
        <textarea
          name="description"
          rows={2}
          placeholder="Critère de pertinence (ex : emploi, aménagement de poste, inclusion professionnelle des personnes handicapées)"
          className="font-body resize-none rounded-md border border-rule bg-card px-3 py-1.5 text-sm text-ink placeholder:text-ink-soft/60"
        />
        {state.error ? (
          <p className="font-body text-xs text-accent-alert">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="font-body self-start text-xs font-medium text-accent hover:underline disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>
    </div>
  );
}
