import type { ReactNode } from "react";

/**
 * LaTeX-style environments for MDX notes, in the spirit of amsthm.
 * Numbering is done with CSS counters (see `.math-env` in globals.css), so Theorem, Lemma, etc.
 * share one running count per note, like \newtheorem{lemma}[theorem]{Lemma}.
 *
 * Leave blank lines inside the tags so the contents are parsed as markdown:
 *
 *   <Theorem name="Spectral theorem">
 *
 *   Every symmetric matrix $A$ is orthogonally diagonalisable.
 *
 *   </Theorem>
 */

type EnvProps = { name?: string; children?: ReactNode };

function makeEnv(label: string, style: "plain" | "definition" | "remark") {
  function Env({ name, children }: EnvProps) {
    return (
      <div className="math-env" data-style={style}>
        <span className="math-env-label">
          {label} <span className="math-env-number" />
          {name && <span className="math-env-name"> ({name})</span>}.
        </span>{" "}
        {children}
      </div>
    );
  }
  Env.displayName = label;
  return Env;
}

export const Theorem = makeEnv("Theorem", "plain");
export const Lemma = makeEnv("Lemma", "plain");
export const Proposition = makeEnv("Proposition", "plain");
export const Corollary = makeEnv("Corollary", "plain");
export const Conjecture = makeEnv("Conjecture", "plain");
export const Definition = makeEnv("Definition", "definition");
export const Example = makeEnv("Example", "definition");
export const Exercise = makeEnv("Exercise", "definition");
export const Remark = makeEnv("Remark", "remark");
export const Note = makeEnv("Note", "remark");

/** Proof block: italic "Proof." lead-in and a ∎ at the end. `of` gives "Proof of …". */
export function Proof({ of, children }: { of?: string; children?: ReactNode }) {
  return (
    <div className="math-proof">
      <span className="math-proof-label">{of ? `Proof of ${of}.` : "Proof."}</span> {children}
    </div>
  );
}

/**
 * Callout kinds, picked by title (case-insensitive). Each gets a Phosphor icon (bold weight, from the
 * icon font loaded in app/layout.tsx), its name in typewriter caps (like \texttt{WARNING}), and a hue
 * taken from the existing palette tokens in globals.css (no new colours). The hue is used at full strength for the
 * label and border, and washed into the card surface for the background, so it follows the active palette.
 */
const CALLOUT_KINDS: Record<string, { icon: string; hue: string }> = {
  warning: { icon: "ph-warning-bold", hue: "var(--skyline)" },
  caution: { icon: "ph-warning-bold", hue: "var(--skyline)" },
  danger: { icon: "ph-warning-octagon-bold", hue: "var(--accent-2)" },
  important: { icon: "ph-warning-circle-bold", hue: "var(--accent-2)" },
  note: { icon: "ph-note-pencil-bold", hue: "var(--accent)" },
  info: { icon: "ph-info-bold", hue: "var(--accent)" },
  question: { icon: "ph-question-bold", hue: "var(--accent)" },
  tip: { icon: "ph-lightbulb-bold", hue: "var(--line)" },
  intuition: { icon: "ph-lightbulb-filament-bold", hue: "var(--line)" },
};

/** `amount`% of the hue mixed into the card surface. */
const wash = (hue: string, amount: number) => `color-mix(in oklab, ${hue} ${amount}%, var(--surface))`;

/**
 * Boxed aside in the site's letter yellow with a green (`--line`) border.
 * `title` is optional and shown in bold as a lead-in. A title naming a kind above
 * (Warning, Note, Tip, …) instead shows an icon + "WARNING" in typewriter caps on a washed tint of its colour.
 *
 *   <Callout title="Intuition">
 *
 *   Think of $A$ as stretching space along its eigenvectors.
 *
 *   </Callout>
 */
export function Callout({ title, children }: { title?: string; children?: ReactNode }) {
  const cleanTitle = title?.replace(/[.:!?]\s*$/, "").trim();
  const kind = cleanTitle ? CALLOUT_KINDS[cleanTitle.toLowerCase()] : undefined;

  return (
    <aside
      style={kind ? { borderColor: kind.hue, backgroundColor: wash(kind.hue, 9) } : undefined}
      className="my-3 rounded-lg border border-line bg-letter px-2.5 py-1 text-[0.9375rem] [&>:first-child]:mt-0 [&>:last-child]:mb-0 [&_p]:my-0 [&_p+p]:mt-1 [&_p]:leading-normal [&_li]:my-0 [&_ol]:my-1 [&_ul]:my-1 [&_.katex-display]:my-1 [&>.callout-title+p]:inline"
    >
      {kind ? (
        <span className="callout-title" style={{ color: kind.hue }}>
          <i aria-hidden="true" className={`${kind.icon} mr-1 align-[-0.125em]`} />
          <span className="tracking-wide" style={{ fontFamily: "KaTeX_Typewriter, monospace" }}>{cleanTitle!.toUpperCase()}</span>{" "}
        </span>
      ) : (
        cleanTitle && <span className="callout-title font-bold">{cleanTitle}. </span>
      )}
      {children}
    </aside>
  );
}

export const mathEnvironments = {
  Callout,
  Theorem,
  Lemma,
  Proposition,
  Corollary,
  Conjecture,
  Definition,
  Example,
  Exercise,
  Remark,
  Note,
  Proof,
};
