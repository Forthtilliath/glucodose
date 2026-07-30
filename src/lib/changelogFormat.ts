// Les notes de release (GitHub) sont écrites en Markdown simple ("### Titre",
// "- item", "**gras**"). Affichées telles quelles dans un <Text>, la syntaxe
// apparaissait en clair au lieu d'être mise en forme — d'où ce petit parseur
// dédié plutôt qu'une dépendance Markdown complète, pour ce sous-ensemble
// volontairement restreint (titres de section + listes + gras).

export type ChangelogSegment = { text: string; bold: boolean };

export type ChangelogBlock =
  | { type: "heading"; text: string }
  | { type: "item"; segments: ChangelogSegment[] }
  | { type: "text"; segments: ChangelogSegment[] };

function parseInlineSegments(text: string): ChangelogSegment[] {
  const segments: ChangelogSegment[] = [];
  const boldPattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = boldPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    lastIndex = boldPattern.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false });
  }
  return segments;
}

export function parseChangelogNotes(notes: string): ChangelogBlock[] {
  return notes
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      if (line.startsWith("### ")) {
        return { type: "heading" as const, text: line.slice(4).trim() };
      }
      if (line.startsWith("- ")) {
        return { type: "item" as const, segments: parseInlineSegments(line.slice(2).trim()) };
      }
      return { type: "text" as const, segments: parseInlineSegments(line) };
    });
}
