import { supabase } from "../supabaseClient";

export function uid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

// Cada linha da tabela guarda o objeto inteiro em uma coluna jsonb "data",
// alem de id e user_id (usados pelas politicas de RLS no Supabase).

export async function listRows(table, userId) {
  const { data, error } = await supabase
    .from(table)
    .select("id, data")
    .eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((r) => ({ ...r.data, id: r.id }));
}

export async function saveRow(table, userId, obj) {
  const id = obj.id || uid();
  const payload = { ...obj, id };
  const { error } = await supabase
    .from(table)
    .upsert({ id, user_id: userId, data: payload, updated_at: new Date().toISOString() });
  if (error) throw error;
  return id;
}

export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}
