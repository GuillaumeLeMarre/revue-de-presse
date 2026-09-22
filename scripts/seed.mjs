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

const HANDICAP_SUBCATEGORIES = [
  [
    "Handicap en entreprise",
    "handicap-entreprise",
    "Emploi, aménagement de poste, inclusion professionnelle des personnes handicapées.",
    1,
  ],
  [
    "Recherche scientifique",
    "handicap-recherche",
    "Recherche médicale, scientifique ou technologique sur le handicap.",
    2,
  ],
  [
    "Sport",
    "handicap-sport",
    "Sport adapté, paralympisme, athlètes en situation de handicap.",
    3,
  ],
  [
    "Handicap à l'école",
    "handicap-ecole",
    "Scolarisation, accompagnement et inclusion des élèves en situation de handicap.",
    4,
  ],
  [
    "Législation",
    "handicap-legislation",
    "Lois, réglementation, droits et politiques publiques liés au handicap.",
    5,
  ],
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

for (const [name, slug, sortOrder] of CATEGORIES) {
  await pool.query(
    `INSERT INTO categories (name, slug, sort_order) VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO NOTHING`,
    [name, slug, sortOrder]
  );
}

const { rows } = await pool.query(
  `SELECT id FROM categories WHERE slug = 'handicap'`
);
const handicapCategoryId = rows[0]?.id;

if (handicapCategoryId) {
  for (const [name, slug, description, sortOrder] of HANDICAP_SUBCATEGORIES) {
    await pool.query(
      `INSERT INTO subcategories (category_id, name, slug, description, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO NOTHING`,
      [handicapCategoryId, name, slug, description, sortOrder]
    );
  }
  console.log(`Seeded ${HANDICAP_SUBCATEGORIES.length} handicap subcategories.`);
}

console.log(`Seeded ${CATEGORIES.length} categories.`);
await pool.end();
