import { supabase } from "../supabaseClient";

export function uid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

export async function listRows(table, userId) {
  const { data, error } = await supabase.from(table).select("id, data").eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((r) => ({ ...r.data, id: r.id }));
}

export async function saveRow(table, userId, obj) {
  const id = obj.id || uid();
  const payload = { ...obj, id };
  const { error } = await supabase.from(table).upsert({ id, user_id: userId, data: payload, updated_at: new Date().toISOString() });
  if (error) throw error;
  return id;
}

export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

// ---------- Perfil do criador (uma linha por usuario, chave = user_id) ----------
export async function getPerfil(userId) {
  const { data, error } = await supabase.from("perfil_criador").select("data").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? data.data : null;
}

export async function savePerfil(userId, perfilData) {
  const { error } = await supabase.from("perfil_criador").upsert({
    user_id: userId,
    data: perfilData,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ---------- Anuncios (tem colunas proprias ave_id/ativo, alem do data jsonb) ----------
export async function listAnuncios(userId) {
  const { data, error } = await supabase.from("anuncios").select("id, ave_id, ativo, data").eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((r) => ({ ...r.data, id: r.id, aveId: r.ave_id, ativo: r.ativo }));
}

export async function saveAnuncio(userId, anuncio) {
  const id = anuncio.id || uid();
  const { error } = await supabase.from("anuncios").upsert({
    id,
    user_id: userId,
    ave_id: anuncio.aveId,
    ativo: anuncio.ativo !== false,
    data: anuncio,
  });
  if (error) throw error;
  return id;
}

export async function deleteAnuncio(id) {
  const { error } = await supabase.from("anuncios").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Administracao (Fase 8D) ----------
export async function checkIsAdmin(userId) {
  const { data, error } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return !!data;
}

// So retorna dado se o usuario logado for admin (garantido pela RLS: a
// policy "admin ve todos os anuncios" so libera linha pra quem esta na
// tabela admins - um usuario comum so veria os proprios, como sempre).
export async function listTodosAnunciosParaAdmin() {
  const { data, error } = await supabase.from("anuncios").select("id, user_id, ave_id, ativo, status, data");
  if (error) throw error;
  return (data || []).map((r) => ({ ...r.data, id: r.id, userId: r.user_id, aveId: r.ave_id, ativo: r.ativo, status: r.status }));
}

export async function updateAnuncioStatus(id, status) {
  const { error } = await supabase.from("anuncios").update({ status }).eq("id", id);
  if (error) throw error;
}

// Nomes/whatsapp dos criadores - usado no painel de aprovacao pra identificar
// quem publicou cada anuncio. A tabela perfil_criador ja tem leitura publica.
export async function listPerfisPublicos() {
  const { data, error } = await supabase.from("perfil_criador").select("user_id, data");
  if (error) throw error;
  return (data || []).map((r) => ({ userId: r.user_id, ...r.data }));
}

// ---------- Aves perdidas/encontradas (Fase 8E) ----------
export async function listPerdidas(userId) {
  const { data, error } = await supabase.from("perdidas").select("id, ave_id, status, data").eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((r) => ({ ...r.data, id: r.id, aveId: r.ave_id, status: r.status }));
}

export async function savePerdida(userId, perdida) {
  const id = perdida.id || uid();
  const { error } = await supabase.from("perdidas").upsert({
    id,
    user_id: userId,
    ave_id: perdida.aveId,
    status: perdida.status || "perdida",
    data: perdida,
  });
  if (error) throw error;
  return id;
}

export async function deletePerdida(id) {
  const { error } = await supabase.from("perdidas").delete().eq("id", id);
  if (error) throw error;
}

// Busca publica por anilha - funciona sem login, ve registros de QUALQUER
// criador (a policy de leitura publica da tabela 'perdidas' permite isso).
export async function buscarPerdidaPorAnilha(anilha) {
  const termo = (anilha || "").trim();
  if (!termo) return [];
  const { data, error } = await supabase
    .from("perdidas")
    .select("id, user_id, status, data")
    .ilike("data->>anilha", `%${termo}%`);
  if (error) throw error;
  return (data || []).map((r) => ({ ...r.data, id: r.id, userId: r.user_id, status: r.status }));
}
