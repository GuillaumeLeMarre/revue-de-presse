const SYSTEM_PROMPT = `Tu es chargé de résumer un article de presse.

Produis un résumé fidèle et factuel en français.

Contraintes :

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

Réponds uniquement avec un objet JSON de la forme :
{"summary": "...", "category": "..."}`;

export interface SummarizeInput {
  source: string;
  title: string;
  date: string | null;
  content: string;
  candidateCategories: string[];
}

export interface SummarizeResult {
  summary: string;
  category: string | null;
}

function buildUserMessage(input: SummarizeInput): string {
  const categoriesHint =
    input.candidateCategories.length > 0
      ? `\n\nCATÉGORIES POSSIBLES\n${input.candidateCategories.join(", ")}`
      : "";

  return `SOURCE
${input.source}

TITRE
${input.title}

DATE
${input.date ?? "inconnue"}

CONTENU
${input.content}${categoriesHint}`;
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
