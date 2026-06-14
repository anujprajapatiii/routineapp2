"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatClock, formatDuration } from "@/lib/format";
import type { RoutineWithTasks } from "@/lib/types";

export default function Runner({ routine }: { routine: RoutineWithTasks }) {
  const router = useRouter();
  const tasks = routine.tasks;

  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(tasks[0]?.duration ?? 0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = tasks[index];

  const goToTask = useCallback(
    (nextIndex: number) => {
      if (nextIndex >= tasks.length) {
        setDone(true);
        setRunning(false);
        return;
      }
      setIndex(nextIndex);
      setRemaining(tasks[nextIndex].duration);
    },
    [tasks],
  );

  // Countdown ticker.
  useEffect(() => {
    if (!running || done) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          // Advance on next tick to keep state updates clean.
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, done, index]);

  // When a task hits zero, advance.
  useEffect(() => {
    if (!running || done) return;
    if (remaining === 0) {
      goToTask(index + 1);
    }
  }, [remaining, running, done, index, goToTask]);

  const totalSeconds = tasks.reduce((s, t) => s + t.duration, 0);
  const elapsedBefore = tasks
    .slice(0, index)
    .reduce((s, t) => s + t.duration, 0);
  const overallElapsed = done
    ? totalSeconds
    : elapsedBefore + ((current?.duration ?? 0) - remaining);
  const overallPct = totalSeconds > 0 ? (overallElapsed / totalSeconds) * 100 : 0;
  const taskPct = current
    ? ((current.duration - remaining) / current.duration) * 100
    : 0;

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-6xl">🎉</div>
        <h1 className="text-3xl font-bold">Routine complete!</h1>
        <p className="mt-2 text-zinc-400">
          You finished “{routine.name}” — {tasks.length}{" "}
          {tasks.length === 1 ? "task" : "tasks"},{" "}
          {formatDuration(totalSeconds)}.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => {
              setDone(false);
              setIndex(0);
              setRemaining(tasks[0]?.duration ?? 0);
              setRunning(true);
            }}
            className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            ↻ Run again
          </button>
          <Link
            href="/routines"
            className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm text-zinc-300 transition hover:bg-surface-2"
          >
            Done
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col px-6 py-8"
      style={{
        background: `radial-gradient(120% 90% at 50% 0%, ${routine.color}22 0%, #0b0b0f 55%)`,
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/routines")}
          className="text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          ✕ Stop
        </button>
        <span className="text-sm font-medium text-zinc-400">
          {index + 1} / {tasks.length}
        </span>
      </div>

      {/* Overall progress */}
      <div className="mt-4">
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${overallPct}%`, backgroundColor: routine.color }}
          />
        </div>
      </div>

      {/* Main timer */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="mb-2 text-sm uppercase tracking-widest text-zinc-500">
          {routine.name}
        </p>
        <h1 className="mb-8 max-w-md text-center text-3xl font-bold">
          {current?.name}
        </h1>

        <div className="relative flex h-64 w-64 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1f1f29"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={routine.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={(2 * Math.PI * 45 * (100 - taskPct)) / 100}
              style={{ transition: "stroke-dashoffset 0.3s linear" }}
            />
          </svg>
          <span className="absolute text-5xl font-bold tabular-nums">
            {formatClock(remaining)}
          </span>
        </div>

        {tasks[index + 1] && (
          <p className="mt-8 text-sm text-zinc-500">
            Up next: {tasks[index + 1].name}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pb-6">
        <button
          onClick={() => {
            // Restart current task.
            setRemaining(current?.duration ?? 0);
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface text-lg text-zinc-300 transition hover:bg-surface-2"
          aria-label="Restart task"
        >
          ↺
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg transition hover:opacity-90"
          style={{ backgroundColor: routine.color }}
          aria-label={running ? "Pause" : "Resume"}
        >
          {running ? "❚❚" : "▶"}
        </button>
        <button
          onClick={() => goToTask(index + 1)}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface text-lg text-zinc-300 transition hover:bg-surface-2"
          aria-label="Skip task"
        >
          ⏭
        </button>
      </div>
    </div>
  );
}
