import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Best-effort: for articles discovered before source_id existed, tag them
// with a source only when their category maps to exactly one enabled
// source (no ambiguity). Idempotent — only touches rows with source_id NULL.
const result = await pool.query(`
  UPDATE articles
  SET source_id = matched.source_id
  FROM (
    SELECT category_id, MIN(id) AS source_id
    FROM sources
    WHERE enabled = true AND category_id IS NOT NULL
    GROUP BY category_id
    HAVING COUNT(*) = 1
  ) AS matched
  WHERE articles.source_id IS NULL
    AND articles.category_id = matched.category_id
`);

console.log(`Backfilled source tag on ${result.rowCount} article(s).`);
await pool.end();
