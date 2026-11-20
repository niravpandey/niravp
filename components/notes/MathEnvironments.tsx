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
 * Phosphor (bold) icon outlines, copied from the phosphor-icons font (MIT) so callouts don't load
 * the whole 3.9 MB icon font. Font coordinates: 256-unit em, y up, so they're flipped when drawn.
 */
const CALLOUT_ICONS = {
  "warning": "M116 120V152A12 12 0 0 0 140 152V120A12 12 0 0 0 116 120zM240.2 42A27.5 27.5 0 0 0 216 28H40A28 28 0 0 0 15.8 70L103.8 222A27.9 27.9 0 0 0 152.2 222L240.2 70A27.5 27.5 0 0 0 240.2 42zM219.4 58L131.5 210A4.1 4.1 0 0 1 124.5 210L36.6 58A3.8 3.8 0 0 1 36.6 54A3.8 3.8 0 0 1 40 52H216A3.8 3.8 0 0 1 219.4 54A3.8 3.8 0 0 1 219.4 58zM128 96A16 16 0 1 1 144 80A16 16 0 0 1 128 96z",
  "warning-octagon": "M116 124V176A12 12 0 0 0 140 176V124A12 12 0 0 0 116 124zM236 164.5V91.6A19.9 19.9 0 0 0 230.1 77.4L178.6 25.9A19.8 19.8 0 0 0 164.5 20H91.5A19.8 19.8 0 0 0 77.4 25.9L25.9 77.4A19.9 19.9 0 0 0 20 91.6V164.5A19.8 19.8 0 0 0 25.9 178.6L77.4 230.1A19.8 19.8 0 0 0 91.5 236H164.5A19.8 19.8 0 0 0 178.6 230.1L230.1 178.6A19.8 19.8 0 0 0 236 164.5zM212 162.8L162.8 212H93.2L44 162.8V93.2L93.2 44H162.8L212 93.2zM128 100A16 16 0 1 1 144 84A16 16 0 0 1 128 100z",
  "warning-circle": "M128 236A108 108 0 1 1 236 128A108.1 108.1 0 0 1 128 236zM128 44A84 84 0 1 0 212 128A84.1 84.1 0 0 0 128 44zM116 124V176A12 12 0 0 0 140 176V124A12 12 0 0 0 116 124zM144 84A16 16 0 1 0 128 100A16 16 0 0 0 144 84z",
  "note-pencil": "M232.5 200.5L200.5 232.5A12 12 0 0 1 183.5 232.5L87.5 136.5A11.9 11.9 0 0 1 84 128V96A12 12 0 0 1 96 84H128A12.3 12.3 0 0 1 136.5 87.5L232.5 183.5A12 12 0 0 1 232.5 200.5zM192 207L207 192L196 181L181 196zM123 108H108V123L164 179L179 164zM228 127.4V48A20.1 20.1 0 0 0 208 28H48A20.1 20.1 0 0 0 28 48V208A20.1 20.1 0 0 0 48 228H127.4A12 12 0 0 0 127.4 204H52V52H204V127.4A12 12 0 0 0 228 127.4z",
  "info": "M128 236A108 108 0 1 1 236 128A108.1 108.1 0 0 1 128 236zM128 44A84 84 0 1 0 212 128A84.1 84.1 0 0 0 128 44zM148 80A12 12 0 0 0 136 68H128A12 12 0 0 0 116 80V120.7A11.9 11.9 0 0 0 108 132A12 12 0 0 0 120 144H128A12 12 0 0 0 140 132V91.3A11.9 11.9 0 0 0 148 80zM110 172A16 16 0 1 0 126 156A16 16 0 0 0 110 172z",
  "question": "M128 236A108 108 0 1 1 236 128A108.1 108.1 0 0 1 128 236zM128 44A84 84 0 1 0 212 128A84.1 84.1 0 0 0 128 44zM144 80A16 16 0 1 0 128 96A16 16 0 0 0 144 80zM168 148A40 40 0 0 0 128 108A12 12 0 0 0 128 132A16 16 0 1 1 112 148A12 12 0 0 0 88 148A40 40 0 0 0 168 148z",
  "lightbulb": "M180 24A12 12 0 0 0 168 12H88A12 12 0 0 0 88 36H168A12 12 0 0 0 180 24zM220 152A92.3 92.3 0 0 0 183 78.3A8 8 0 0 1 180 72A20.1 20.1 0 0 0 160 52H96A20.1 20.1 0 0 0 76 72V72.2A7.8 7.8 0 0 1 72.8 78.4A91.6 91.6 0 0 0 36 151.5C35.7 201.3 76 242.8 125.8 244A92 92 0 0 0 220 152zM196 152A68 68 0 0 1 126.4 220C89.6 219.1 59.8 188.4 60 151.6A67.4 67.4 0 0 1 87.2 97.6A32.3 32.3 0 0 0 99.8 76H156.3A31.4 31.4 0 0 0 168.7 97.5A67.6 67.6 0 0 1 196 152zM138.7 198.8A12 12 0 0 1 133.3 175.4A23.9 23.9 0 0 0 151.4 157.3A12.1 12.1 0 0 1 163.1 148A12.4 12.4 0 0 1 165.8 148.3A12 12 0 0 1 174.8 162.7A48.2 48.2 0 0 1 138.7 198.8z",
  "lightbulb-filament": "M180 24A12 12 0 0 0 168 12H88A12 12 0 0 0 88 36H168A12 12 0 0 0 180 24zM220 152A92.3 92.3 0 0 0 183 78.3A8 8 0 0 1 180 72A20.1 20.1 0 0 0 160 52H96A20.1 20.1 0 0 0 76 72V72.2A7.8 7.8 0 0 1 72.8 78.4A91.6 91.6 0 0 0 36 151.5C35.7 201.3 76 242.8 125.8 244A92 92 0 0 0 220 152zM196 152A68 68 0 0 1 126.4 220C89.6 219.1 59.8 188.4 60 151.6A67.4 67.4 0 0 1 87.2 97.6A32.3 32.3 0 0 0 99.8 76H116V107L87.5 135.5A12 12 0 0 0 104.5 152.5L128 129L151.5 152.5A12 12 0 0 0 168.5 135.5L140 107V76H156.3A31.4 31.4 0 0 0 168.7 97.5A67.6 67.6 0 0 1 196 152z",
} as const;

function CalloutIcon({ icon }: { icon: keyof typeof CALLOUT_ICONS }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 256 256" fill="currentColor" className="mr-1 inline-block h-[1em] w-[1em] align-[-0.125em]">
      <path transform="matrix(1 0 0 -1 0 256)" d={CALLOUT_ICONS[icon]} />
    </svg>
  );
}

/**
 * Callout kinds, picked by title (case-insensitive). Each gets a Phosphor icon (above), its name in typewriter caps (like \texttt{WARNING}), and a hue
 * taken from the existing palette tokens in globals.css (no new colours). The hue is used at full strength for the
 * label and border, and washed into the card surface for the background, so it follows the active palette.
 */
const CALLOUT_KINDS: Record<string, { icon: keyof typeof CALLOUT_ICONS; hue: string }> = {
  warning: { icon: "warning", hue: "var(--skyline)" },
  caution: { icon: "warning", hue: "var(--skyline)" },
  danger: { icon: "warning-octagon", hue: "var(--accent-2)" },
  important: { icon: "warning-circle", hue: "var(--accent-2)" },
  note: { icon: "note-pencil", hue: "var(--accent)" },
  info: { icon: "info", hue: "var(--accent)" },
  question: { icon: "question", hue: "var(--accent)" },
  tip: { icon: "lightbulb", hue: "var(--line)" },
  intuition: { icon: "lightbulb-filament", hue: "var(--line)" },
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
          <CalloutIcon icon={kind.icon} />
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
