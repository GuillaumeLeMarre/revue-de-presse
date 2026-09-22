export const CATEGORY_COLORS: Record<string, string> = {
  ia: "#3B5FE0",
  tech: "#0E9F6E",
  telecom: "#D97706",
  economie: "#7C3AED",
  france: "#DC2626",
  international: "#DC2626",
  handicap: "#0891B2",
};

export function categoryColor(slug: string | null): string {
  if (!slug) return "#6B675E";
  return CATEGORY_COLORS[slug] ?? "#6B675E";
}
