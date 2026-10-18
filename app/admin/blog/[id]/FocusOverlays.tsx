"use client";

import PhosphorIcon from "@/components/ui/PhosphorIcon";
import { formatPomodoroTime } from "./editorUtils";

type FocusOverlaysProps = {
  breakOpen: boolean;
  breakSeconds: number;
  congratsOpen: boolean;
  targetSessions: number;
  onCancelBreak: () => void;
  onSkipBreak: () => void;
  onCloseCongrats: () => void;
  onResetPomodoro: () => void;
};

export default function FocusOverlays({
  breakOpen,
  breakSeconds,
  congratsOpen,
  targetSessions,
  onCancelBreak,
  onSkipBreak,
  onCloseCongrats,
  onResetPomodoro,
}: FocusOverlaysProps) {
  return (
    <>
      {breakOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm border border-gray-200 bg-white px-6 py-8 text-center shadow-2xl">
            <button
              type="button"
              aria-label="Cancel break"
              onClick={onCancelBreak}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-900"
            >
              <PhosphorIcon name="x" size={15} />
            </button>
            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-blue-100 bg-blue-50 text-blue-900">
              <PhosphorIcon name="clock" size={28} />
            </div>
            <h2 className="mt-5 text-3xl font-semibold text-gray-900">Break time</h2>
            <p className="mt-2 text-sm text-gray-500">Step away for a minute. The next session will be ready when this ends.</p>
            <p className="mt-5 font-mono text-5xl text-blue-900">{formatPomodoroTime(breakSeconds)}</p>
            <button
              type="button"
              onClick={onSkipBreak}
              className="mt-6 border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-gray-500"
            >
              Skip break
            </button>
          </div>
        </div>
      )}

      {congratsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/45 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md border border-gray-200 bg-white px-6 py-8 text-center shadow-2xl">
            <button
              type="button"
              aria-label="Close congratulations"
              onClick={onCloseCongrats}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-900"
            >
              <PhosphorIcon name="x" size={15} />
            </button>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-mauve-500">Focus complete</p>
            <h2 className="mt-3 text-3xl font-semibold text-gray-900">Congratulations</h2>
            <p className="mt-3 text-sm text-gray-500">
              You finished {targetSessions} focused {targetSessions === 1 ? "session" : "sessions"}.
            </p>
            <button
              type="button"
              onClick={onResetPomodoro}
              className="mt-6 border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-gray-500"
            >
              Start again
            </button>
          </div>
        </div>
      )}
    </>
  );
}
