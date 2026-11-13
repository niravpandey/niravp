"use client";

type EditorStageProps = {
  title: string;
  /** One-line summary shown once the stage is ticked off. */
  summary: React.ReactNode;
  done: boolean;
  onDoneChange: (done: boolean) => void;
  children: React.ReactNode;
};

/**
 * A setup step (title, details, cover) above the editor. Ticking the box collapses it to a
 * single line so the writing area gets the attention; unticking reopens it.
 */
export default function EditorStage({ title, summary, done, onDoneChange, children }: EditorStageProps) {
  return (
    <section className={done ? "min-w-0 max-w-full" : "basis-full border border-line bg-white/60"}>
      <label
        className={[
          "flex min-w-0 cursor-pointer items-baseline gap-2 text-sm",
          done ? "text-gray-500 hover:text-gray-800" : "border-b border-line px-4 py-2 text-gray-800",
        ].join(" ")}
      >
        <input
          type="checkbox"
          checked={done}
          onChange={(event) => onDoneChange(event.target.checked)}
          className="relative top-px accent-blue-900"
        />
        <span className={done ? "line-through decoration-gray-300" : "font-medium"}>{title}</span>
        {done && <span className="min-w-0 max-w-64 truncate text-xs text-gray-400">{summary}</span>}
        {!done && <span className="ml-auto text-xs text-gray-400">tick when done</span>}
      </label>
      {!done && <div className="grid grid-cols-1 gap-4 p-4">{children}</div>}
    </section>
  );
}
