interface KeywordRule {
  categorySlug: string;
  keywords: string[];
}

const KEYWORD_RULES: KeywordRule[] = [
  { categorySlug: "ia", keywords: ["intelligence artificielle", "openai", "anthropic", "llm", "chatgpt"] },
  { categorySlug: "telecom", keywords: ["sd-wan", "5g", "fibre", "opérateur télécom", "orange business"] },
  { categorySlug: "tech", keywords: ["startup", "logiciel", "application mobile", "cybersécurité"] },
  { categorySlug: "economie", keywords: ["inflation", "bourse", "pib", "banque centrale"] },
  { categorySlug: "handicap", keywords: ["handicap", "accessibilité", "mdph"] },
];

export function categorizeByKeywords(text: string): string | null {
  const normalized = text.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.categorySlug;
    }
  }
  return null;
}
