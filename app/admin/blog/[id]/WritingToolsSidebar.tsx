"use client";

import PhosphorIcon from "@/components/ui/PhosphorIcon";
import type { ToolDensity } from "./editorUtils";

type WritingToolsSidebarProps = {
  children: React.ReactNode;
  density: ToolDensity;
};

export default function WritingToolsSidebar({ children, density }: WritingToolsSidebarProps) {
  const isIconDensity = density === "icon";

  return (
    <aside className="hidden max-h-[calc(100vh-6rem)] min-w-0 flex-col border border-gray-200 bg-white/80 xl:sticky xl:top-6 xl:flex">
      <div className={["border-b border-gray-200", isIconDensity ? "flex justify-center px-2 py-2" : "px-3 py-2"].join(" ")}>
        {isIconDensity ? (
          <div className="flex h-9 w-9 items-center justify-center border border-gray-200 bg-white text-gray-700" title="Writing tools">
            <PhosphorIcon name="note-pencil" size={17} />
          </div>
        ) : (
          <p className="text-sm font-medium text-gray-800">Writing tools</p>
        )}
        {density === "comfortable" && <p className="mt-0.5 text-xs text-gray-400">Images, focus, sketches</p>}
      </div>

      <div className={["min-h-0 flex-1 overflow-y-auto", isIconDensity ? "space-y-2 p-2" : "p-3"].join(" ")}>{children}</div>
    </aside>
  );
}
