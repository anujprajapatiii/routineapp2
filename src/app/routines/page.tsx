import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/format";
import type { RoutineWithTasks } from "@/lib/types";
import { deleteRoutine, moveRoutine } from "./actions";

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("routines")
    .select("*, tasks(*)")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  const routines = (data ?? []) as RoutineWithTasks[];
  for (const r of routines) {
    r.tasks.sort((a, b) => a.position - b.position);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Routines</h1>
          <p className="text-sm text-zinc-400">{user.email}</p>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-surface-2"
          >
            Log out
          </button>
        </form>
      </header>

      {routines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-10 text-center">
          <div className="mb-2 text-4xl">🌅</div>
          <h2 className="text-lg font-semibold">No routines yet</h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-zinc-400">
            Create your first routine — a sequence of timed tasks you want to do
            on repeat.
          </p>
          <Link
            href="/routines/new"
            className="mt-5 inline-block rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            + New routine
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {routines.map((routine, index) => {
            const total = routine.tasks.reduce((sum, t) => sum + t.duration, 0);
            return (
              <li
                key={routine.id}
                className="group rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: routine.color }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold">
                        {routine.name}
                      </h3>
                      {routine.time_of_day && (
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-zinc-400">
                          {routine.time_of_day}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      {routine.tasks.length}{" "}
                      {routine.tasks.length === 1 ? "task" : "tasks"} ·{" "}
                      {formatDuration(total)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <form action={moveRoutine}>
                      <input type="hidden" name="id" value={routine.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        disabled={index === 0}
                        aria-label="Move up"
                        className="rounded px-1.5 text-zinc-500 transition hover:text-zinc-200 disabled:opacity-20"
                      >
                        ▲
                      </button>
                    </form>
                    <form action={moveRoutine}>
                      <input type="hidden" name="id" value={routine.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        disabled={index === routines.length - 1}
                        aria-label="Move down"
                        className="rounded px-1.5 text-zinc-500 transition hover:text-zinc-200 disabled:opacity-20"
                      >
                        ▼
                      </button>
                    </form>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/routines/${routine.id}/run`}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition ${
                      routine.tasks.length === 0
                        ? "pointer-events-none bg-surface-2 text-zinc-500"
                        : "bg-indigo-500 hover:bg-indigo-400"
                    }`}
                    aria-disabled={routine.tasks.length === 0}
                  >
                    ▶ Start
                  </Link>
                  <Link
                    href={`/routines/${routine.id}/edit`}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-surface-2"
                  >
                    Edit
                  </Link>
                  <form
                    action={deleteRoutine}
                    className="ml-auto"
                  >
                    <input type="hidden" name="id" value={routine.id} />
                    <button
                      type="submit"
                      className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition hover:text-red-400"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/routines/new"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-400"
      >
        + New routine
      </Link>
    </main>
  );
}
