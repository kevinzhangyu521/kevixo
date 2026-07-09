const currencySymbols: Record<string, string> = {
  "\u20ac": "$",
  "\u00a3": "$",
  "\u00a5": "$",
  "\u20a9": "$",
  "\u20bd": "$",
  "\u20bf": "$",
};

const unicodeSuitMap: Record<string, string> = {
  "\u2660": "s",
  "\u2665": "h",
  "\u2666": "d",
  "\u2663": "c",
};

export type NormalizedHandHistory = {
  text: string;
  changed: boolean;
  notes: string[];
};

export function normalizeHandHistory(input: string): NormalizedHandHistory {
  const notes: string[] = [];
  let text = input;

  const original = text;

  text = text.replace(/\r\n?/g, "\n");

  if (text !== original) {
    notes.push("Line endings were cleaned up.");
  }

  const beforeSymbols = text;
  text = normalizeUnicodeSymbols(text);

  if (text !== beforeSymbols) {
    notes.push("Card suits and currency symbols were normalized.");
  }

  const beforeSpaces = text;
  text = text
    .split("\n")
    .map((line) => normalizeStackFormatting(line).replace(/[ \t]+/g, " ").trim())
    .filter((line, index, lines) => line || lines[index - 1])
    .join("\n")
    .trim();

  if (text !== beforeSpaces) {
    notes.push("Extra spacing was cleaned up.");
  }

  return {
    text,
    changed: text !== input,
    notes,
  };
}

function normalizeUnicodeSymbols(input: string) {
  return input
    .replace(/[\u20ac\u00a3\u00a5\u20a9\u20bd\u20bf]/g, (symbol) => currencySymbols[symbol] ?? "$")
    .replace(/([AKQJT2-9])\s*[\u2660\u2665\u2666\u2663]/gi, (match, rank: string) => {
      const suit = unicodeSuitMap[match.replace(rank, "").trim()];
      return `${rank.toUpperCase()}${suit ?? ""}`;
    })
    .replace(/\b([AKQJT2-9])([SHDC])\b/g, (_match, rank: string, suit: string) => {
      return `${rank.toUpperCase()}${suit.toLowerCase()}`;
    });
}

function normalizeStackFormatting(line: string) {
  return line
    .replace(/\bstack[:\s]+([$]?\d+(?:\.\d+)?)/i, "stack $1")
    .replace(/\((\d+(?:\.\d+)?)\s*(?:chips|bb|BB)\)/g, "($1)")
    .replace(/\b(\d+(?:\.\d+)?)\s*(?:chips|bb|BB)\b/g, "$1");
}
