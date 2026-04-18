/**
 * Renders a tiny character-count indicator aligned to the right of an input.
 * Always visible — shows 0/max when empty.
 *
 * Usage:
 *   <CharCount value={form.name} max={INPUT_LIMITS.productName} />
 */
export default function CharCount({ value = "", max }) {
  if (!max) return null;

  const len = String(value ?? "").length;
  const pct = max > 0 ? len / max : 0;
  const isNear = pct >= 0.85;
  const isFull = len >= max;

  return (
    <span
      className={`admin-char-count ${
        isFull
          ? "admin-char-count--full"
          : isNear
            ? "admin-char-count--near"
            : ""
      }`}
    >
      {len}/{max}
    </span>
  );
}
