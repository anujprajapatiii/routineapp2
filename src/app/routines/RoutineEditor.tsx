"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDuration } from "@/lib/format";
import { THEME_LIST, getTheme, type ThemeKey } from "@/lib/themes";
import type { RoutineWithTasks } from "@/lib/types";
import { ChevronUp, ChevronDown, Close } from "@/components/icons";
import { saveRoutine } from "./actions";

type DraftTask = { name: string; duration: number };

const QUICK_MINUTES = [5, 10, 20];

export default function RoutineEditor({
  routine,
}: {
  routine?: RoutineWithTasks;
}) {
  const router = useRouter();
  const [name, setName] = useState(routine?.name ?? "");
  const [themeKey, setThemeKey] = useState<ThemeKey>(getTheme(routine?.color).key);
  const [tasks, setTasks] = useState<DraftTask[]>(
    routine?.tasks.map((t) => ({ name: t.name, duration: t.duration })) ?? [],
  );
  const [taskName, setTaskName] = useState("");
  const [taskMin, setTaskMin] = useState("1");
  const [taskSec, setTaskSec] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = tasks.reduce((sum, t) => sum + t.duration, 0);

  function addTaskWith(duration: number) {
    const trimmed = taskName.trim();
    if (!trimmed) {
      setError("Give the task a name first.");
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

  function addCustomTask() {
    const duration =
      Math.max(0, parseInt(taskMin || "0", 10)) * 60 +
      Math.max(0, parseInt(taskSec || "0", 10));
    addTaskWith(duration);
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
      <input type="hidden" name="color" value={themeKey} />

      <section className="card space-y-5 p-5">
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

        <div className="space-y-2">
          <label className="text-faint font-display text-xs font-semibold uppercase tracking-wide">
            Ocean theme
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {THEME_LIST.map((t) => {
              const selected = t.key === themeKey;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setThemeKey(t.key)}
                  className={`glass flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                    selected ? "ring-2 ring-white/70" : ""
                  }`}
                  data-glass
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-full"
                    style={{
                      background: `linear-gradient(140deg, ${t.accent}, ${t.accent}99)`,
                    }}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="font-display block text-sm font-semibold text-ink">
                      {t.name}
                    </span>
                    <span className="text-faint block truncate text-xs">
                      {t.blurb}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="card space-y-3 p-5">
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
                <div className="text-faint flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveTask(i, -1)}
                    disabled={i === 0}
                    aria-label="Move task up"
                    className="p-1 hover:text-ink disabled:opacity-25"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTask(i, 1)}
                    disabled={i === tasks.length - 1}
                    aria-label="Move task down"
                    className="p-1 hover:text-ink disabled:opacity-25"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTask(i)}
                    aria-label="Remove task"
                    className="p-1 hover:text-ink"
                  >
                    <Close className="h-4 w-4" />
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
                addCustomTask();
              }
            }}
            placeholder="Task name (e.g. Stretch)"
            className="field"
          />

          <div className="flex flex-wrap items-center gap-2">
            {QUICK_MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => addTaskWith(m * 60)}
                className="btn btn-ghost btn-inline glass"
                data-glass
              >
                {m} min
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                value={taskMin}
                onChange={(e) => setTaskMin(e.target.value)}
                className="field w-16 text-center"
                aria-label="Minutes"
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
                aria-label="Seconds"
              />
              <span className="text-faint text-xs">sec</span>
            </div>
            <button
              type="button"
              onClick={addCustomTask}
              className="btn btn-inline glass ml-auto"
              data-glass
            >
              Add task
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
