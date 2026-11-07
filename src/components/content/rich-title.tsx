import { Fragment } from "react";

/**
 * Renders owner-written titles from Admin → Studio → Content:
 * "From our wheel / to your *table*" → line break at "/", *word* in italics.
 * Plain React text only (no HTML is interpreted).
 */
export function RichTitle({ text, emClassName = "italic" }: { text: string; emClassName?: string }) {
  const lines = text.split(/\s*\/\s*/);
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br className="hidden md:block" />}
          {i > 0 && " "}
          {line.split(/(\*[^*]+\*)/g).map((part, j) =>
            part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
              <em key={j} className={emClassName}>{part.slice(1, -1)}</em>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}
