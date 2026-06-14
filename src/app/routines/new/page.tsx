import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoutineEditor from "../RoutineEditor";

export default async function NewRoutinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-8">
      <Link
        href="/routines"
        className="mb-4 inline-block text-sm text-zinc-400 transition hover:text-zinc-200"
      >
        ← Back
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">New routine</h1>
      <RoutineEditor />
    </main>
  );
}
