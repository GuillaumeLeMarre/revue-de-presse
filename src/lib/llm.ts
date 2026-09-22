const SYSTEM_PROMPT = `Tu es chargé de résumer et classer un article de presse.

Produis un résumé fidèle et factuel en français.

Contraintes résumé :

- 3 à 5 lignes maximum ;
- commence directement par l'information principale ;
- conserve les chiffres, dates et faits importants ;
- utilise uniquement les informations fournies ;
- n'invente aucune information ;
- ne complète aucune information manquante ;
- ne donne aucune opinion ;
- ne dramatise pas ;
- ne reproduis pas de longues portions du texte ;
- utilise un français naturel et concis.

Contraintes classification :

- choisis la catégorie la plus pertinente dans la liste fournie ;
- si une sous-catégorie est fournie pour cette catégorie, choisis celle qui correspond le mieux au sujet réel de l'article, en te basant sur sa description ; sinon laisse subcategory à null ;
- "relevant" doit valoir false si l'article mentionne le mot-clé de la catégorie sans que le sujet réel de l'article la concerne (ex : un article sur un fait divers où une personne "handicapée" est citée en passant, mais qui ne traite pas du handicap) ; dans ce cas, relevant=false même si une catégorie est indiquée ;
- "relevant" doit valoir true si le sujet principal de l'article correspond bien à la catégorie choisie.

Réponds uniquement avec un objet JSON de la forme :
{"summary": "...", "category": "...", "subcategory": "..." | null, "relevant": true | false}`;

export interface SummarizeInput {
  source: string;
  title: string;
  date: string | null;
  content: string;
  candidateCategories: string[];
  candidateSubcategories?: Array<{ name: string; description: string }>;
}

export interface SummarizeResult {
  summary: string;
  category: string | null;
  subcategory: string | null;
  relevant: boolean;
}

function buildUserMessage(input: SummarizeInput): string {
  const categoriesHint =
    input.candidateCategories.length > 0
      ? `\n\nCATÉGORIES POSSIBLES\n${input.candidateCategories.join(", ")}`
      : "";

  const subcategoriesHint =
    input.candidateSubcategories && input.candidateSubcategories.length > 0
      ? `\n\nSOUS-CATÉGORIES POSSIBLES\n${input.candidateSubcategories
          .map((s) => `- ${s.name} : ${s.description}`)
          .join("\n")}`
      : "";

  return `SOURCE
${input.source}

TITRE
${input.title}

DATE
${input.date ?? "inconnue"}

CONTENU
${input.content}${categoriesHint}${subcategoriesHint}`;
}

function parseResponse(raw: string): SummarizeResult | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.summary !== "string" || parsed.summary.trim() === "") {
      return null;
    }
    return {
      summary: parsed.summary.trim(),
      category: typeof parsed.category === "string" ? parsed.category : null,
      subcategory:
        typeof parsed.subcategory === "string" ? parsed.subcategory : null,
      relevant: typeof parsed.relevant === "boolean" ? parsed.relevant : true,
    };
  } catch {
    return null;
  }
}

async function callLlm(input: SummarizeInput): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  const baseUrl = process.env.LLM_BASE_URL ?? "https://api.openai.com/v1";

  if (!apiKey || !model) {
    throw new Error("LLM_API_KEY and LLM_MODEL must be configured");
  }

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
        { role: "user", content: buildUserMessage(input) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: HTTP ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("LLM response missing message content");
  }
  return content;
}

export async function summarizeArticle(
  input: SummarizeInput
): Promise<SummarizeResult> {
  const first = await callLlm(input);
  const parsedFirst = parseResponse(first);
  if (parsedFirst) return parsedFirst;

  const second = await callLlm(input);
  const parsedSecond = parseResponse(second);
  if (parsedSecond) return parsedSecond;

  throw new Error("LLM returned invalid JSON after retry");
}
