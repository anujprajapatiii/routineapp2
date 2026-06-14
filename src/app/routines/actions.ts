"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type TaskInput = { name: string; duration: number };

function parseTasks(raw: string): TaskInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((t) => {
      const obj = t as Record<string, unknown>;
      const name = String(obj.name ?? "").trim();
      const duration = Math.max(1, Math.floor(Number(obj.duration) || 0));
      return { name, duration };
    })
    .filter((t) => t.name.length > 0);
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return { supabase, user };
}

/**
 * Create or update a routine plus its tasks. Tasks are passed as a JSON string.
 * On update we replace the whole task set to keep ordering simple.
 */
export async function saveRoutine(formData: FormData) {
  const { supabase, user } = await requireUser();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const timeOfDay = String(formData.get("time_of_day") ?? "").trim();
  const color = String(formData.get("color") ?? "#6366f1").trim();
  const tasks = parseTasks(String(formData.get("tasks") ?? "[]"));

  if (!name) {
    throw new Error("Routine name is required.");
  }

  let routineId = id;

  if (id) {
    const { error } = await supabase
      .from("routines")
      .update({
        name,
        time_of_day: timeOfDay || null,
        color,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);

    // Replace tasks.
    const { error: delError } = await supabase
      .from("tasks")
      .delete()
      .eq("routine_id", id);
    if (delError) throw new Error(delError.message);
  } else {
    // Place new routine at the end.
    const { count } = await supabase
      .from("routines")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { data, error } = await supabase
      .from("routines")
      .insert({
        user_id: user.id,
        name,
        time_of_day: timeOfDay || null,
        color,
        position: count ?? 0,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    routineId = data.id;
  }

  if (tasks.length > 0) {
    const rows = tasks.map((t, i) => ({
      routine_id: routineId,
      name: t.name,
      duration: t.duration,
      position: i,
    }));
    const { error } = await supabase.from("tasks").insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/routines");
  redirect("/routines");
}

export async function deleteRoutine(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/routines");
}

export async function moveRoutine(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) return;

  const { data: routines, error } = await supabase
    .from("routines")
    .select("id, position")
    .eq("user_id", user.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  if (!routines) return;

  const index = routines.findIndex((r) => r.id === id);
  if (index === -1) return;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= routines.length) return;

  // Normalize positions and swap the two adjacent items.
  const ordered = [...routines];
  [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];

  await Promise.all(
    ordered.map((r, i) =>
      supabase
        .from("routines")
        .update({ position: i })
        .eq("id", r.id)
        .eq("user_id", user.id),
    ),
  );

  revalidatePath("/routines");
}
