import { Pool } from "pg";

// Manual, one-off script. Re-runs relevance + subcategory classification on
// existing "ready" articles through the LLM. NOT part of the Docker startup
// chain (would re-bill the LLM on every deploy). Run manually via:
//   DATABASE_URL=... LLM_API_KEY=... LLM_MODEL=... node scripts/reclassify.mjs

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const apiKey = process.env.LLM_API_KEY;
const model = process.env.LLM_MODEL;
const baseUrl = process.env.LLM_BASE_URL ?? "https://api.openai.com/v1";

if (!apiKey || !model) {
  console.error("LLM_API_KEY and LLM_MODEL must be set.");
  process.exit(1);
}

const SYSTEM_PROMPT = `Tu juges la pertinence et la sous-catégorie d'un article déjà classé dans une catégorie.

"relevant" doit valoir false si l'article mentionne le mot-clé de la catégorie sans que son sujet réel la concerne.
"relevant" doit valoir true si le sujet principal correspond bien à la catégorie.
Si une sous-catégorie correspond mieux, indique-la ; sinon laisse subcategory à null.

Réponds uniquement avec un objet JSON : {"subcategory": "..." | null, "relevant": true | false}`;

const { rows: categories } = await pool.query(
  `SELECT id, name, slug FROM categories`
);
const { rows: subcategories } = await pool.query(
  `SELECT id, category_id, name, slug, description FROM subcategories WHERE enabled = true`
);
const { rows: articles } = await pool.query(
  `SELECT id, title, content, category_id FROM articles WHERE status = 'ready' AND category_id IS NOT NULL`
);

let reclassified = 0;
let markedIrrelevant = 0;

for (const article of articles) {
  const category = categories.find((c) => c.id === article.category_id);
  if (!category) continue;

  const candidateSubs = subcategories.filter(
    (s) => s.category_id === article.category_id
  );

  const userMessage = `CATÉGORIE ACTUELLE\n${category.name}\n\nTITRE\n${
    article.title
  }\n\nCONTENU\n${(article.content ?? "").slice(0, 4000)}${
    candidateSubs.length > 0
      ? `\n\nSOUS-CATÉGORIES POSSIBLES\n${candidateSubs
          .map((s) => `- ${s.name} : ${s.description}`)
          .join("\n")}`
      : ""
  }`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    const relevant = typeof parsed.relevant === "boolean" ? parsed.relevant : true;
    const subName =
      typeof parsed.subcategory === "string" ? parsed.subcategory.trim().toLowerCase() : null;
    const subMatch = subName
      ? candidateSubs.find(
          (s) => s.name.toLowerCase() === subName || s.slug === subName
        )
      : null;

    await pool.query(
      `UPDATE articles SET status = $1, subcategory_id = $2, updated_at = now() WHERE id = $3`,
      [relevant ? "ready" : "irrelevant", subMatch ? subMatch.id : null, article.id]
    );

    reclassified += 1;
    if (!relevant) markedIrrelevant += 1;
  } catch (error) {
    console.error(`Skip article ${article.id}:`, error.message);
  }
}

console.log(
  `Reclassified ${reclassified} article(s), marked ${markedIrrelevant} irrelevant.`
);
await pool.end();
