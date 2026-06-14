"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlassKit from "@/lib/liquid-glass";
import { formatClock, formatDuration } from "@/lib/format";
import { getTheme } from "@/lib/themes";
import type { RoutineWithTasks } from "@/lib/types";
import { Play, Pause, SkipForward, Restart, Close } from "@/components/icons";

export default function Runner({ routine }: { routine: RoutineWithTasks }) {
  const router = useRouter();
  const tasks = routine.tasks;
  const theme = getTheme(routine.color);

  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(tasks[0]?.duration ?? 0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState<"light" | "dark">("dark");
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

  // Track the active light/dark theme so the immersive backdrop matches it.
  useEffect(() => {
    const read = () =>
      setMode(
        document.documentElement.getAttribute("data-theme") === "light"
          ? "light"
          : "dark",
      );
    read();
    const unsub = GlassKit.theme.subscribe(read);
    return unsub;
  }, []);

  // Countdown ticker.
  useEffect(() => {
    if (!running || done) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
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

  // Re-wire glass physics when the view changes (e.g. the completion screen).
  useEffect(() => {
    GlassKit.init(document);
  }, [done]);

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

  const bg = mode === "light" ? theme.gradLight : theme.gradDark;
  const ring = "rgba(236,250,255,0.95)";

  if (done) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-white"
        style={{ background: bg }}
      >
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">
          {theme.name}
        </p>
        <h1 className="font-display mt-3 text-3xl font-bold">
          Routine complete
        </h1>
        <p className="mt-2 text-white/75">
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
            className="btn btn-inline glass inline-flex text-white"
            data-glass
          >
            Run again
          </button>
          <Link
            href="/routines"
            className="btn btn-ghost btn-inline glass inline-flex text-white"
            data-glass
          >
            Done
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col px-6 py-8 text-white"
      style={{ background: bg }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/routines")}
          aria-label="Stop"
          className="flex items-center gap-1.5 text-sm text-white/70 transition hover:text-white"
        >
          <Close className="h-4 w-4" /> Stop
        </button>
        <span className="text-sm font-medium text-white/70">
          {index + 1} / {tasks.length}
        </span>
      </div>

      {/* Overall progress */}
      <div className="mx-auto mt-5 h-1 w-44 max-w-[60%] overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${overallPct}%`, background: ring }}
        />
      </div>

      {/* Main timer */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="mb-2 text-sm uppercase tracking-widest text-white/55">
          {routine.name}
        </p>
        <h1 className="font-display mb-8 max-w-md text-center text-3xl font-bold">
          {current?.name}
        </h1>

        <div className="relative flex h-64 w-64 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={ring}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 45}
              strokeDashoffset={(2 * Math.PI * 45 * (100 - taskPct)) / 100}
              style={{ transition: "stroke-dashoffset 0.3s linear" }}
            />
          </svg>
          <span className="font-display absolute text-5xl font-bold tabular-nums">
            {formatClock(remaining)}
          </span>
        </div>

        {tasks[index + 1] && (
          <p className="mt-8 text-sm text-white/55">
            Up next: {tasks[index + 1].name}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pb-6">
        <button
          onClick={() => setRemaining(current?.duration ?? 0)}
          className="glass glass-icon h-14 w-14 text-white"
          aria-label="Restart task"
          data-glass
        >
          <Restart className="h-5 w-5" />
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          className="glass flex h-20 w-20 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: theme.accent }}
          aria-label={running ? "Pause" : "Resume"}
          data-glass
        >
          {running ? (
            <Pause className="h-7 w-7" />
          ) : (
            <Play className="ml-0.5 h-7 w-7" />
          )}
        </button>
        <button
          onClick={() => goToTask(index + 1)}
          className="glass glass-icon h-14 w-14 text-white"
          aria-label="Skip task"
          data-glass
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
