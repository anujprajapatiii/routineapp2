import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RoutineWithTasks } from "@/lib/types";
import Runner from "./Runner";

export default async function RunRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("routines")
    .select("*, tasks(*)")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const routine = data as RoutineWithTasks;
  routine.tasks.sort((a, b) => a.position - b.position);

  if (routine.tasks.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">This routine has no tasks yet.</h1>
        <Link
          href={`/routines/${routine.id}/edit`}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
        >
          Add tasks
        </Link>
      </main>
    );
  }

  return <Runner routine={routine} />;
}
