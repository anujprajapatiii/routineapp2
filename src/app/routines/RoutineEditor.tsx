"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDuration } from "@/lib/format";
import type { RoutineWithTasks } from "@/lib/types";
import { saveRoutine } from "./actions";

const COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

type DraftTask = { name: string; duration: number };

export default function RoutineEditor({
  routine,
}: {
  routine?: RoutineWithTasks;
}) {
  const router = useRouter();
  const [name, setName] = useState(routine?.name ?? "");
  const [timeOfDay, setTimeOfDay] = useState(routine?.time_of_day ?? "");
  const [color, setColor] = useState(routine?.color ?? COLORS[0]);
  const [tasks, setTasks] = useState<DraftTask[]>(
    routine?.tasks.map((t) => ({ name: t.name, duration: t.duration })) ?? [],
  );
  const [taskName, setTaskName] = useState("");
  const [taskMin, setTaskMin] = useState("1");
  const [taskSec, setTaskSec] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = tasks.reduce((sum, t) => sum + t.duration, 0);

  function addTask() {
    const trimmed = taskName.trim();
    const duration =
      Math.max(0, parseInt(taskMin || "0", 10)) * 60 +
      Math.max(0, parseInt(taskSec || "0", 10));
    if (!trimmed) {
      setError("Give the task a name.");
      return;
    }
    if (duration <= 0) {
      setError("Task duration must be at least 1 second.");
      return;
    }
    setError(null);
    setTasks((prev) => [...prev, { name: trimmed, duration }]);
    setTaskName("");
    setTaskMin("1");
    setTaskSec("0");
  }

  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  function moveTask(index: number, dir: -1 | 1) {
    setTasks((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(formData: FormData) {
    if (!name.trim()) {
      setError("Routine name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    formData.set("tasks", JSON.stringify(tasks));
    try {
      await saveRoutine(formData);
    } catch (e) {
      // redirect() throws a special error we should let bubble (handled by Next),
      // but a real failure shows here.
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      if (!msg.includes("NEXT_REDIRECT")) {
        setError(msg);
        setSaving(false);
      }
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {routine?.id && <input type="hidden" name="id" value={routine.id} />}

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">Routine name</label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Morning routine"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-indigo-500/40 placeholder:text-zinc-600 focus:ring-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400">
            Time of day (optional)
          </label>
          <input
            name="time_of_day"
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            placeholder="e.g. 7:00 AM"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-indigo-500/40 placeholder:text-zinc-600 focus:ring-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-400">Color</label>
          <input type="hidden" name="color" value={color} />
          <div className="flex flex-wrap gap-2 pt-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className={`h-7 w-7 rounded-full transition ${
                  color === c ? "ring-2 ring-white ring-offset-2 ring-offset-bg" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">Tasks</label>
          <span className="text-xs text-zinc-500">
            {tasks.length} · {formatDuration(total)} total
          </span>
        </div>

        {tasks.length > 0 && (
          <ul className="space-y-2">
            {tasks.map((t, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <span className="text-xs tabular-nums text-zinc-600">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{t.name}</span>
                <span className="text-xs tabular-nums text-zinc-400">
                  {formatDuration(t.duration)}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveTask(i, -1)}
                    disabled={i === 0}
                    aria-label="Move task up"
                    className="px-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-20"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTask(i, 1)}
                    disabled={i === tasks.length - 1}
                    aria-label="Move task down"
                    className="px-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-20"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTask(i)}
                    aria-label="Remove task"
                    className="px-1 text-zinc-500 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-lg border border-dashed border-border bg-surface/40 p-3">
          <input
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTask();
              }
            }}
            placeholder="Task name (e.g. Stretch)"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none ring-indigo-500/40 placeholder:text-zinc-600 focus:ring-2"
          />
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                value={taskMin}
                onChange={(e) => setTaskMin(e.target.value)}
                className="w-16 rounded-lg border border-border bg-surface px-2 py-2 text-center text-sm outline-none ring-indigo-500/40 focus:ring-2"
              />
              <span className="text-xs text-zinc-500">min</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={59}
                value={taskSec}
                onChange={(e) => setTaskSec(e.target.value)}
                className="w-16 rounded-lg border border-border bg-surface px-2 py-2 text-center text-sm outline-none ring-indigo-500/40 focus:ring-2"
              />
              <span className="text-xs text-zinc-500">sec</span>
            </div>
            <button
              type="button"
              onClick={addTask}
              className="ml-auto rounded-lg bg-surface-2 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-border"
            >
              + Add task
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
        >
          {saving ? "Saving…" : routine?.id ? "Save changes" : "Create routine"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/routines")}
          className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm text-zinc-300 transition hover:bg-surface-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
