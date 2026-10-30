// Compare only with the reference range entered from this report, in the result's units.
// Missing or ambiguous values/ranges must never be treated as normal or guessed.
const NUMBER = String.raw`[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][-+]?\d+)?`;

function normalize(value: string) {
  return value.trim().replace(/[−]/g, "-").replace(/[–—]/g, "-")
    .replace(/(?<![\d,.])\d{1,3}(?:,\d{3})+(?:\.\d+)?(?![\d,.])/g, (number) => number.replaceAll(",", ""));
}

export function isAboveReferenceRange(value: string, referenceRange: string): boolean {
  const result = normalize(value).match(new RegExp(`^(>=|>|≥)?\\s*(${NUMBER})$`));
  if (!result) return false;
  const measured = Number(result[2]);
  if (!Number.isFinite(measured)) return false;

  const range = normalize(referenceRange);
  const interval = range.match(new RegExp(`^(${NUMBER})\\s*(?:-|to)\\s*(${NUMBER})$`, "i"));
  const ceiling = range.match(new RegExp(`^(<=|<|≤)\\s*(${NUMBER})$`));
  if (!interval && !ceiling) return false;
  const upper = Number(interval ? interval[2] : ceiling![2]);
  if (!Number.isFinite(upper) || (interval && Number(interval[1]) > upper)) return false;

  // A bounded result such as >10 is definitely high for an inclusive upper limit of 10.
  const excludesUpper = ceiling?.[1] === "<";
  return measured > upper || (measured === upper && (excludesUpper || result[1] === ">"));
}
