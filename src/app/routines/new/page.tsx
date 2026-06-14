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
        className="on-bg-soft mb-4 inline-block text-sm transition hover:opacity-80"
      >
        ← Back
      </Link>
      <h1 className="on-bg font-display mb-6 text-3xl font-bold tracking-tight">
        New routine
      </h1>
      <RoutineEditor />
    </main>
  );
}
