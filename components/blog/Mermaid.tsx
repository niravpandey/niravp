"use client";

import { useEffect, useId, useRef, useState, type HTMLAttributes } from "react";

/**
 * Renders a ```mermaid code block as a diagram, styled from the site palette (globals.css tokens),
 * so it follows whichever palette is active: surface boxes, `--line` borders at `--line-width`,
 * ink text and arrows, `--heading` for titles, letter-yellow groups. Text uses the surrounding
 * font (Computer Modern in notes, Verdana on the blog).
 *
 * Mermaid is ~1MB, so it's only loaded on pages that have a diagram. Until it's ready, or if the
 * diagram has a syntax error, the source is shown as a code block instead.
 */
/**
 * Mermaid only typesets `$$…$$` in labels; let `$…$` work too, like everywhere else on the site.
 * `\$` stays a literal dollar sign.
 */
function withDisplayMath(chart: string) {
  // Unquoted `[…]` labels can't contain brackets/parens, which maths often has (`\left(`), so quote any
  // box label holding maths. Maths spans are matched whole, so a `]` inside them doesn't end the label.
  const quoted = chart.replace(/\[(?!["\[(\/\\])((?:\$\$?[^$\n]+?\$\$?|[^\]"$\n])+)\]/g, (whole, label: string) =>
    label.includes("$") ? `["${label}"]` : whole,
  );
  return quoted.replace(/(?<![\\$])\$(?!\$)((?:\\\$|[^$\n])+?)\$(?!\$)/g, (_, tex: string) => `$$${tex}$$`);
}

/**
 * Mermaid sizes each box by measuring its label once, so every font the label uses must be loaded first.
 * KaTeX fonts only download when something on the page uses them (e.g. bold maths), and a box measured
 * with the fallback font comes out too narrow and clips its last characters.
 */
const KATEX_FONTS = [
  "KaTeX_Main", "bold 1em KaTeX_Main", "italic 1em KaTeX_Main", "italic 1em KaTeX_Math",
  "bold italic 1em KaTeX_Math", "KaTeX_AMS", "KaTeX_Size1", "KaTeX_Size2", "KaTeX_Size3", "KaTeX_Size4",
];

async function loadFonts(chart: string) {
  if (!document.fonts) return;
  if (chart.includes("$")) {
    await Promise.all(KATEX_FONTS.map((font) => document.fonts.load(font.includes(" 1em ") ? font : `1em ${font}`).catch(() => [])));
  }
  await document.fonts.ready;
}

let renderQueue: Promise<unknown> = Promise.resolve();

export default function Mermaid({ chart, ...props }: { chart: string } & HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const el = ref.current;
      if (!el) return;
      const style = getComputedStyle(el);
      const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
      const surface = token("--surface", "#ffffff");
      const ink = token("--ink", "#222222");
      const line = token("--line", "#9cbf86");
      const heading = token("--heading", ink);
      const letter = token("--letter", "#fdf6dc");
      const lineWidth = token("--line-width", "2px");
      const fontFamily = style.fontFamily.replace(/"/g, "'"); // Mermaid drops double-quoted font names

      const [{ default: mermaid }] = await Promise.all([import("mermaid"), loadFonts(chart)]);

      // initialize() is global, so diagrams take turns: each sets its own font/colours, then renders.
      const job = renderQueue.then(async () => {
        if (cancelled) return;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
        // Typeset $$…$$ with KaTeX's own HTML + the stylesheet the site already loads, not browser MathML.
        forceLegacyMathML: true,
          theme: "base",
          fontFamily,
          themeVariables: {
            fontFamily,
            fontSize: "15px",
            background: surface,
            primaryColor: surface,
            primaryTextColor: ink,
            primaryBorderColor: line,
            secondaryColor: letter,
            secondaryBorderColor: line,
            tertiaryColor: letter,
            tertiaryBorderColor: line,
            mainBkg: surface,
            nodeBorder: line,
            lineColor: ink,
            textColor: ink,
            titleColor: heading,
            clusterBkg: letter,
            clusterBorder: line,
            edgeLabelBackground: surface,
            noteBkgColor: letter,
            noteBorderColor: line,
            noteTextColor: ink,
            actorBkg: surface,
            actorBorder: line,
            actorTextColor: ink,
            signalColor: ink,
            signalTextColor: ink,
            labelBoxBkgColor: letter,
            labelBoxBorderColor: line,
          },
          // Square corners and the site's line weight; arrows a touch lighter than box borders.
          themeCSS: `
            .node rect, .node polygon, .node circle, .node ellipse, .node path,
            .cluster rect, .actor, .note, .labelBox { stroke-width: ${lineWidth}; }
            .node rect, .cluster rect { rx: 0; ry: 0; }
            .flowchart-link, .edgePath .path, .messageLine0, .messageLine1, .relation { stroke-width: 1.25px; }
            .edgeLabel, .edgeLabel p, .edgeLabel span { background-color: ${surface}; font-style: italic; }
          `,
          flowchart: { curve: "linear", padding: 12, htmlLabels: true },
        });

        try {
          const source = withDisplayMath(chart);
          await mermaid.parse(source);
          const { svg } = await mermaid.render(id, source);
          if (!cancelled) {
            setSvg(svg);
            setError(null);
          }
        } catch (err) {
          if (!cancelled) {
            setSvg(null);
            setError(err instanceof Error ? err.message.split("\n")[0] : "Could not draw this diagram.");
          }
          // Mermaid leaves its error graphic in <body> when render fails.
          document.getElementById(`d${id}`)?.remove();
        }
      });
      renderQueue = job.catch(() => {});
      await job;
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  return (
    <div ref={ref} {...props} className="mermaid-diagram not-prose my-6 overflow-x-auto">
      {svg ? (
        <div className="flex justify-center [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <>
          <pre className="overflow-x-auto bg-transparent px-0 py-3 font-mono text-[0.85rem] leading-7 text-gray-700">
            <code>{chart}</code>
          </pre>
          {error && <p className="text-xs text-mauve-700">Diagram error: {error}</p>}
        </>
      )}
    </div>
  );
}
