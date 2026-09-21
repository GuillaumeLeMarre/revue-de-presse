import { db } from "./index";
import { categories } from "./schema";

const INITIAL_CATEGORIES = [
  { name: "IA", slug: "ia", sortOrder: 1 },
  { name: "Tech", slug: "tech", sortOrder: 2 },
  { name: "Télécom", slug: "telecom", sortOrder: 3 },
  { name: "Économie", slug: "economie", sortOrder: 4 },
  { name: "France", slug: "france", sortOrder: 5 },
  { name: "International", slug: "international", sortOrder: 6 },
  { name: "Handicap", slug: "handicap", sortOrder: 7 },
];

async function seed() {
  for (const category of INITIAL_CATEGORIES) {
    await db.insert(categories).values(category).onConflictDoNothing({
      target: categories.slug,
    });
  }
  console.log(`Seeded ${INITIAL_CATEGORIES.length} categories.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
