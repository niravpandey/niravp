"use client";

type WritingToolsSidebarProps = {
  children: React.ReactNode;
};

export default function WritingToolsSidebar({ children }: WritingToolsSidebarProps) {
  return (
    <aside className="hidden max-h-[calc(100vh-6rem)] min-w-0 flex-col overflow-y-auto border border-line bg-white/80 xl:sticky xl:top-6 xl:flex">
      {children}
    </aside>
  );
}

type ToolSectionProps = {
  title: string;
  /** Short status shown next to the title, e.g. the timer while it runs. */
  meta?: React.ReactNode;
  open: boolean;
  onToggleOpen: () => void;
  children: React.ReactNode;
};

/** A plain, collapsible tool section: "▾ Title ....... meta". */
export function ToolSection({ title, meta, open, onToggleOpen, children }: ToolSectionProps) {
  return (
    <section className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={open}
        className="flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-white"
      >
        <span>
          <span className="inline-block w-3 text-gray-400">{open ? "▾" : "▸"}</span>
          {title}
        </span>
        {meta !== undefined && <span className="text-xs text-gray-400 tabular-nums">{meta}</span>}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </section>
  );
}

/** Text button used throughout the tools: looks like an old underlined link. */
export function ToolLink({ className, ...props }: React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      className={[
        "text-xs text-blue-900 underline decoration-gray-300 underline-offset-2 hover:decoration-current disabled:text-gray-400 disabled:no-underline",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
