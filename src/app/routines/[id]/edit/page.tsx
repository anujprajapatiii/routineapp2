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
        className="mb-4 inline-block text-sm text-zinc-400 transition hover:text-zinc-200"
      >
        ← Back
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Edit routine</h1>
      <RoutineEditor routine={routine} />
    </main>
  );
}
