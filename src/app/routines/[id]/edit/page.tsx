import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RoutineWithTasks } from "@/lib/types";
import RoutineEditor from "../../RoutineEditor";

export default async function EditRoutinePage({
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

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-8">
      <Link
        href="/routines"
        className="on-bg-soft mb-4 inline-block text-sm transition hover:opacity-80"
      >
        ← Back
      </Link>
      <h1 className="on-bg font-display mb-6 text-3xl font-bold tracking-tight">
        Edit routine
      </h1>
      <RoutineEditor routine={routine} />
    </main>
  );
}
