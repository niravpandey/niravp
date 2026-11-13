"use client";

import { formatPomodoroTime } from "./editorUtils";
import { ToolLink, ToolSection } from "./WritingToolsSidebar";

type PomodoroToolProps = {
  open: boolean;
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

function Stepper({ label, value, onDown, onUp, downDisabled, upDisabled }: {
  label: string;
  value: React.ReactNode;
  onDown: () => void;
  onUp: () => void;
  downDisabled: boolean;
  upDisabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs text-gray-600">
      <span>{label}</span>
      <span className="flex items-center gap-2 tabular-nums">
        <ToolLink onClick={onDown} disabled={downDisabled} aria-label={`Less ${label}`}>−</ToolLink>
        <span className="w-12 text-center">{value}</span>
        <ToolLink onClick={onUp} disabled={upDisabled} aria-label={`More ${label}`}>+</ToolLink>
      </span>
    </div>
  );
}

export default function PomodoroTool({
  open,
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
  return (
    <ToolSection
      title="Timer"
      meta={running || seconds !== minutes * 60 ? formatPomodoroTime(seconds) : undefined}
      open={open}
      onToggleOpen={onToggleOpen}
    >
      <p className="text-center text-3xl text-blue-900 tabular-nums">{formatPomodoroTime(seconds)}</p>
      <p className="mb-3 text-center text-xs text-gray-500">
        {completedSessions} of {targetSessions} sessions done
      </p>

      <div className="space-y-1">
        <Stepper
          label="minutes"
          value={minutes}
          onDown={() => onAdjustMinutes(-1)}
          onUp={() => onAdjustMinutes(1)}
          downDisabled={minutes <= 1}
          upDisabled={minutes >= 120}
        />
        <Stepper
          label="sessions"
          value={targetSessions}
          onDown={() => onTargetSessionsChange(String(targetSessions - 1))}
          onUp={() => onTargetSessionsChange(String(targetSessions + 1))}
          downDisabled={targetSessions <= 2}
          upDisabled={targetSessions >= 10}
        />
      </div>

      <div className="mt-3 flex justify-center gap-4">
        <ToolLink onClick={onStartPause}>{running ? "pause" : "start"}</ToolLink>
        <ToolLink onClick={onReset}>reset</ToolLink>
      </div>
    </ToolSection>
  );
}
