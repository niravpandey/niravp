"use client";

import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { formatPomodoroTime, type ToolDensity } from "./editorUtils";

type PomodoroToolProps = {
  open: boolean;
  density: ToolDensity;
  seconds: number;
  minutes: number;
  running: boolean;
  completedSessions: number;
  targetSessions: number;
  onToggleOpen: () => void;
  onAdjustMinutes: (delta: number) => void;
  onTargetSessionsChange: (value: string) => void;
  onStartPause: () => void;
  onReset: () => void;
};

export default function PomodoroTool({
  open,
  density,
  seconds,
  minutes,
  running,
  completedSessions,
  targetSessions,
  onToggleOpen,
  onAdjustMinutes,
  onTargetSessionsChange,
  onStartPause,
  onReset,
}: PomodoroToolProps) {
  const isIconDensity = density === "icon";
  const isComfortableDensity = density === "comfortable";

  return (
    <section className={["mt-3 border border-gray-200 bg-white/60", isIconDensity ? "overflow-hidden" : ""].join(" ")}>
      <button
        type="button"
        onClick={onToggleOpen}
        className={["relative flex w-full items-center text-left text-sm text-gray-800 transition-colors hover:bg-white/80", isIconDensity ? "h-11 justify-center px-0 py-0" : "justify-between px-3 py-2"].join(" ")}
        title={isIconDensity ? `Pomodoro · ${formatPomodoroTime(seconds)}` : undefined}
      >
        <span className={["inline-flex min-w-0 items-center justify-center", isIconDensity ? "h-8 w-8" : "gap-2"].join(" ")}>
          <PhosphorIcon name="clock" size={isIconDensity ? 18 : 16} />
          {!isIconDensity && <span className="truncate">{density === "compact" ? "Focus" : "Pomodoro"}</span>}
        </span>
        <span className={["shrink-0 font-mono text-xs text-gray-400", isIconDensity ? "absolute right-1.5 top-1.5 text-[10px]" : ""].join(" ")}>
          {isIconDensity ? `${completedSessions}/${targetSessions}` : formatPomodoroTime(seconds)}
        </span>
      </button>

      {open && (
        <div className={["border-t border-gray-200", isIconDensity ? "p-2" : "p-3"].join(" ")}>
          <div className={["flex items-center justify-center", isIconDensity ? "gap-2" : "gap-3"].join(" ")}>
            <button
              type="button"
              aria-label="Decrease session time"
              onClick={() => onAdjustMinutes(-1)}
              disabled={minutes <= 1}
              className={["inline-flex shrink-0 items-center justify-center border border-gray-300 bg-white/50 text-gray-600 transition-colors hover:border-gray-400 hover:bg-white/80 disabled:opacity-30", isIconDensity ? "h-7 w-7" : "h-8 w-8"].join(" ")}
            >
              <PhosphorIcon name="caret-down" size={15} />
            </button>
            <div className={["text-center", isIconDensity ? "min-w-0 flex-1" : "w-28"].join(" ")}>
              <p className={["font-mono text-blue-900", isIconDensity ? "text-[1.35rem] leading-7" : "text-3xl"].join(" ")}>{formatPomodoroTime(seconds)}</p>
              {!isIconDensity && <p className="text-xs text-gray-400">{minutes} min</p>}
            </div>
            <button
              type="button"
              aria-label="Increase session time"
              onClick={() => onAdjustMinutes(1)}
              disabled={minutes >= 120}
              className={["inline-flex shrink-0 items-center justify-center border border-gray-300 bg-white/50 text-gray-600 transition-colors hover:border-gray-400 hover:bg-white/80 disabled:opacity-30", isIconDensity ? "h-7 w-7" : "h-8 w-8"].join(" ")}
            >
              <PhosphorIcon name="caret-up" size={15} />
            </button>
          </div>
          {!isIconDensity && (
            <p className="mt-1 text-center text-xs text-gray-500">
              {completedSessions}/{targetSessions} sessions
            </p>
          )}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>{isIconDensity ? "Sessions" : "Sessions"}</span>
              <span>{targetSessions}</span>
            </div>
            <input
              type="range"
              min={2}
              max={10}
              step={1}
              value={targetSessions}
              onChange={(event) => onTargetSessionsChange(event.target.value)}
              className="h-1.5 w-full cursor-pointer accent-blue-900"
            />
            <div className="mt-1 flex justify-between text-[10px] text-gray-400">
              <span>2</span>
              <span>10</span>
            </div>
          </div>
          <div className={["mt-3 flex justify-center", isIconDensity ? "gap-2" : "gap-2"].join(" ")}>
            <button
              type="button"
              onClick={onStartPause}
              title={running ? "Pause" : "Start"}
              className={["inline-flex items-center justify-center border border-gray-300 bg-white/50 text-xs text-gray-700 transition-colors hover:border-gray-400 hover:bg-white/80", isIconDensity ? "h-9 w-9 px-0 py-0" : "flex-1 gap-2 px-2 py-1.5"].join(" ")}
            >
              {isIconDensity ? (
                <PhosphorIcon name={running ? "pause" : "play"} size={15} />
              ) : (
                <span>{running ? "Pause" : isComfortableDensity ? "Start" : "Go"}</span>
              )}
            </button>
            <button
              type="button"
              onClick={onReset}
              title="Reset"
              className={["inline-flex items-center justify-center border border-gray-300 bg-white/50 text-xs text-gray-700 transition-colors hover:border-gray-400 hover:bg-white/80", isIconDensity ? "h-9 w-9 px-0 py-0" : "flex-1 gap-2 px-2 py-1.5"].join(" ")}
            >
              {isIconDensity ? <PhosphorIcon name="arrow-counter-clockwise" size={15} /> : "Reset"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
