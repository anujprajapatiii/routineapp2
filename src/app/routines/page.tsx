import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/format";
import { getTheme } from "@/lib/themes";
import type { RoutineWithTasks } from "@/lib/types";
import { ChevronUp, ChevronDown } from "@/components/icons";
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
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-8">
      <header className="rise mb-8 flex items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Stream</div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            My Routines
          </h1>
          <p className="text-faint mt-0.5 text-sm">{user.email}</p>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn-ghost btn-inline glass" data-glass>
            Log out
          </button>
        </form>
      </header>

      {routines.length === 0 ? (
        <div className="card rise p-10 text-center">
          <h2 className="font-display text-lg font-semibold text-ink">
            No routines yet
          </h2>
          <p className="text-soft mx-auto mt-1.5 max-w-xs text-sm">
            Create your first routine — a sequence of timed tasks you want to do
            on repeat.
          </p>
          <Link
            href="/routines/new"
            className="btn glass mt-6 inline-flex w-full justify-center"
            data-glass
          >
            New routine
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3.5">
            {routines.map((routine, index) => {
              const total = routine.tasks.reduce(
                (sum, t) => sum + t.duration,
                0,
              );
              const theme = getTheme(routine.color);
              return (
                <li key={routine.id} className="card rise p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 h-11 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display truncate text-base font-semibold text-ink">
                        {routine.name}
                      </h3>
                      <p className="text-faint mt-0.5 text-sm">
                        {routine.tasks.length}{" "}
                        {routine.tasks.length === 1 ? "task" : "tasks"} ·{" "}
                        {formatDuration(total)} · {theme.name}
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                      <form action={moveRoutine}>
                        <input type="hidden" name="id" value={routine.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          disabled={index === 0}
                          aria-label="Move up"
                          className="glass glass-icon h-7 w-7 disabled:opacity-25"
                          data-glass
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                      </form>
                      <form action={moveRoutine}>
                        <input type="hidden" name="id" value={routine.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          disabled={index === routines.length - 1}
                          aria-label="Move down"
                          className="glass glass-icon h-7 w-7 disabled:opacity-25"
                          data-glass
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/routines/${routine.id}/run`}
                      className={`btn btn-inline glass inline-flex ${
                        routine.tasks.length === 0
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                      data-glass
                      aria-disabled={routine.tasks.length === 0}
                    >
                      Start
                    </Link>
                    <Link
                      href={`/routines/${routine.id}/edit`}
                      className="btn btn-ghost btn-inline glass inline-flex"
                      data-glass
                    >
                      Edit
                    </Link>
                    <form action={deleteRoutine} className="ml-auto">
                      <input type="hidden" name="id" value={routine.id} />
                      <button
                        type="submit"
                        className="text-faint px-2 py-1 text-sm transition hover:text-ink"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>

          <Link
            href="/routines/new"
            className="btn glass mt-5 inline-flex w-full justify-center"
            data-glass
          >
            New routine
          </Link>
        </>
      )}
    </main>
  );
}
