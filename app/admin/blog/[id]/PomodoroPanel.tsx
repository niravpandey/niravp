"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import FocusOverlays from "./FocusOverlays";
import PomodoroTool from "./PomodoroTool";
import { BREAK_SECONDS, DEFAULT_POMODORO_MINUTES, DEFAULT_POMODORO_SESSIONS, clamp } from "./editorUtils";

type PomodoroPanelProps = {
  open: boolean;
  onToggleOpen: () => void;
};

/**
 * The pomodoro timer and its break/congrats overlays, with all their state kept here. The timer ticks
 * every second; holding that state in the editor would re-render the whole editor (and preview) each tick.
 */
export default function PomodoroPanel({ open, onToggleOpen }: PomodoroPanelProps) {
  const [minutes, setMinutes] = useState(DEFAULT_POMODORO_MINUTES);
  const [targetSessions, setTargetSessions] = useState(DEFAULT_POMODORO_SESSIONS);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [seconds, setSeconds] = useState(DEFAULT_POMODORO_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [breakSeconds, setBreakSeconds] = useState(BREAK_SECONDS);
  const [breakOpen, setBreakOpen] = useState(false);
  const [breakRunning, setBreakRunning] = useState(false);
  const [congratsOpen, setCongratsOpen] = useState(false);

  function reset() {
    setRunning(false);
    setBreakRunning(false);
    setBreakOpen(false);
    setCongratsOpen(false);
    setBreakSeconds(BREAK_SECONDS);
    setCompletedSessions(0);
    setSeconds(minutes * 60);
  }

  function endBreak(startNext: boolean) {
    setBreakRunning(false);
    setBreakOpen(false);
    setBreakSeconds(BREAK_SECONDS);
    setSeconds(minutes * 60);
    if (startNext) setRunning(true);
  }

  function adjustMinutes(delta: number) {
    const next = clamp(minutes + delta, 1, 120);
    setMinutes(next);
    if (!running) setSeconds(next * 60);
  }

  function handleSessionsChange(value: string) {
    const next = clamp(Number.parseInt(value, 10) || 2, 2, 10);
    setTargetSessions(next);
    setCompletedSessions((completed) => Math.min(completed, next));
  }

  function startPause() {
    setCongratsOpen(false);
    setBreakOpen(false);
    setBreakRunning(false);

    if (running) {
      setRunning(false);
      return;
    }

    if (completedSessions >= targetSessions) setCompletedSessions(0);
    if (seconds <= 0) setSeconds(minutes * 60);
    setRunning(true);
  }

  useEffect(() => {
    if (!running) return;

    const intervalId = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          setRunning(false);
          setCompletedSessions((completed) => {
            const nextCompleted = Math.min(completed + 1, targetSessions);

            if (nextCompleted >= targetSessions) {
              setBreakOpen(false);
              setBreakRunning(false);
              setCongratsOpen(true);
            } else {
              setBreakSeconds(BREAK_SECONDS);
              setBreakOpen(true);
              setBreakRunning(true);
            }

            return nextCompleted;
          });
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [running, targetSessions]);

  useEffect(() => {
    if (!breakOpen || !breakRunning) return;

    const intervalId = window.setInterval(() => {
      setBreakSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          setBreakRunning(false);
          setBreakOpen(false);
          setSeconds(minutes * 60);
          return BREAK_SECONDS;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [breakOpen, breakRunning, minutes]);

  return (
    <>
      <PomodoroTool
        open={open}
        seconds={seconds}
        minutes={minutes}
        running={running}
        completedSessions={completedSessions}
        targetSessions={targetSessions}
        onToggleOpen={onToggleOpen}
        onAdjustMinutes={adjustMinutes}
        onTargetSessionsChange={handleSessionsChange}
        onStartPause={startPause}
        onReset={reset}
      />
      {/* The sidebar is hidden below xl, so the overlays render at the body instead. They only open
          after the timer runs, so `document` always exists by then. */}
      {(breakOpen || congratsOpen) &&
        createPortal(
          <FocusOverlays
            breakOpen={breakOpen}
            breakSeconds={breakSeconds}
            congratsOpen={congratsOpen}
            targetSessions={targetSessions}
            onCancelBreak={() => endBreak(false)}
            onSkipBreak={() => endBreak(true)}
            onCloseCongrats={() => setCongratsOpen(false)}
            onResetPomodoro={reset}
          />,
          document.body,
        )}
    </>
  );
}
