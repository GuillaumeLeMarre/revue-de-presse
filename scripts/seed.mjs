import { Pool } from "pg";

const CATEGORIES = [
  ["IA", "ia", 1],
  ["Tech", "tech", 2],
  ["Télécom", "telecom", 3],
  ["Économie", "economie", 4],
  ["France", "france", 5],
  ["International", "international", 6],
  ["Handicap", "handicap", 7],
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

for (const [name, slug, sortOrder] of CATEGORIES) {
  await pool.query(
    `INSERT INTO categories (name, slug, sort_order) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO NOTHING`,
    [name, slug, sortOrder]
  );
}

console.log(`Seeded ${CATEGORIES.length} categories.`);
await pool.end();
