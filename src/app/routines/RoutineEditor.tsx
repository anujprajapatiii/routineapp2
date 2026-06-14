"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDuration } from "@/lib/format";
import type { RoutineWithTasks } from "@/lib/types";
import { saveRoutine } from "./actions";

// Higher-contrast, accessible hues — each reads clearly against the glass
// backdrop in both themes and carries white text on the run/play button.
const COLORS = [
  "#4f46e5", // indigo
  "#db2777", // pink
  "#ea580c", // orange
  "#059669", // emerald
  "#2563eb", // blue
  "#dc2626", // red
  "#7c3aed", // violet
  "#0d9488", // teal
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
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      if (!msg.includes("NEXT_REDIRECT")) {
        setError(msg);
        setSaving(false);
      }
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {routine?.id && <input type="hidden" name="id" value={routine.id} />}

      <section className="card p-5 space-y-5">
        <div className="space-y-1.5">
          <label className="text-faint font-display text-xs font-semibold uppercase tracking-wide">
            Routine name
          </label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Morning routine"
            className="field"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-faint font-display text-xs font-semibold uppercase tracking-wide">
              Time of day (optional)
            </label>
            <input
              name="time_of_day"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              placeholder="e.g. 7:00 AM"
              className="field"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-faint font-display text-xs font-semibold uppercase tracking-wide">
              Color
            </label>
            <input type="hidden" name="color" value={color} />
            <div className="flex flex-wrap gap-2 pt-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className={`h-7 w-7 rounded-full transition ${
                    color === c
                      ? "ring-2 ring-white ring-offset-2 ring-offset-transparent"
                      : ""
                  }`}
                  style={{ backgroundColor: c }}
                  data-glass
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-display text-sm font-semibold text-ink">
            Tasks
          </label>
          <span className="text-faint text-xs">
            {tasks.length} · {formatDuration(total)} total
          </span>
        </div>

        {tasks.length > 0 && (
          <ul className="space-y-2">
            {tasks.map((t, i) => (
              <li
                key={i}
                className="glass flex items-center gap-2 rounded-2xl px-3 py-2.5"
              >
                <span className="text-faint w-4 text-xs tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                  {t.name}
                </span>
                <span className="text-soft text-xs tabular-nums">
                  {formatDuration(t.duration)}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveTask(i, -1)}
                    disabled={i === 0}
                    aria-label="Move task up"
                    className="text-faint px-1 hover:text-ink disabled:opacity-25"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTask(i, 1)}
                    disabled={i === tasks.length - 1}
                    aria-label="Move task down"
                    className="text-faint px-1 hover:text-ink disabled:opacity-25"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTask(i)}
                    aria-label="Remove task"
                    className="text-faint px-1 hover:text-ink"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2.5 pt-1">
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
            className="field"
          />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                value={taskMin}
                onChange={(e) => setTaskMin(e.target.value)}
                className="field w-16 text-center"
              />
              <span className="text-faint text-xs">min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={59}
                value={taskSec}
                onChange={(e) => setTaskSec(e.target.value)}
                className="field w-16 text-center"
              />
              <span className="text-faint text-xs">sec</span>
            </div>
            <button
              type="button"
              onClick={addTask}
              className="btn btn-ghost btn-inline glass ml-auto"
              data-glass
            >
              + Add task
            </button>
          </div>
        </div>
      </section>

      {error && (
        <p className="glass rounded-2xl px-3.5 py-2.5 text-sm text-ink">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn glass" data-glass>
          {saving ? "Saving…" : routine?.id ? "Save changes" : "Create routine"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/routines")}
          className="btn btn-ghost glass"
          data-glass
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
