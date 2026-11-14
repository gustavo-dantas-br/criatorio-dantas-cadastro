import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Search, RefreshCw, Users, Bird, Mail, Phone, MapPin, CalendarDays, Clock3, ChevronLeft, ChevronRight, X, CheckCircle2, AlertCircle, ShieldOff, ShieldCheck, Ban, Unlock, Loader2, Pencil, KeyRound } from "lucide-react";

const fmtDate = (value) => value ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "Nunca acessou";
const fmtDateTime = (value) => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Sem acesso registrado";

function Status({ blocked, confirmed }) {
  if (blocked) return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700"><ShieldOff size={12} /> Bloqueado</span>;
  if (!confirmed) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700"><AlertCircle size={12} /> E-mail pendente</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 size={12} /> Ativo</span>;
}

export default function CreatorManagement() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1 });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manageAction, setManageAction] = useState("");
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", creatorName: "", city: "", state: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-list-creators", {
        body: { search: query, page },
      });
      if (invokeError || data?.error) throw new Error(data?.error || "Não foi possível consultar os criadores.");
      setResult(data || { items: [], total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Não foi possível consultar os criadores.");
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => { load(); }, [load]);

  async function confirmAccountAction(event) {
    event.preventDefault();
    if (!selected || !manageAction || actionLoading) return;
    setActionLoading(true);
    setActionError("");
    setActionSuccess("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-manage-creator", {
        body: { user_id: selected.userId, action: manageAction, reason: reason.trim() },
      });
      if (invokeError || data?.error || !data?.success) {
        throw new Error(data?.error || "Não foi possível concluir a ação.");
      }
      const blocked = manageAction === "block" ? true : manageAction === "unblock" ? false : selected.blocked;
      if (manageAction !== "reset_password") {
        setSelected((current) => current ? { ...current, blocked, blockedUntil: null } : current);
        setResult((current) => ({ ...current, items: current.items.map((item) => item.userId === selected.userId ? { ...item, blocked, blockedUntil: null } : item) }));
      }
      setActionSuccess(manageAction === "reset_password" ? "Senha temporária definida. O titular deverá trocá-la no próximo acesso." : blocked ? "Conta bloqueada com sucesso." : "Conta desbloqueada com sucesso.");
      setManageAction("");
      setReason("");
      await load();
    } catch (err) {
      setActionError(err.message || "Não foi possível concluir a ação.");
    } finally {
      setActionLoading(false);
    }
  }

  async function saveAccountEdit(event) {
    event.preventDefault();
    if (!selected || actionLoading) return;
    setActionLoading(true); setActionError(""); setActionSuccess("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-manage-creator", { body: { user_id: selected.userId, action: "update_account", profile: editForm } });
      if (invokeError || data?.error || !data?.success) throw new Error(data?.error || "Não foi possível salvar os dados.");
      setSelected((current) => current ? { ...current, name: editForm.name, phone: editForm.phone || current.phone, creatorName: editForm.creatorName, city: editForm.city, state: editForm.state, hasProfile: true } : current);
      setResult((current) => ({ ...current, items: current.items.map((item) => item.userId === selected.userId ? { ...item, name: editForm.name, phone: editForm.phone || item.phone, creatorName: editForm.creatorName, city: editForm.city, state: editForm.state, hasProfile: true } : item) }));
      setEditing(false); setActionSuccess("Cadastro atualizado com sucesso."); await load();
    } catch (err) { setActionError(err.message || "Não foi possível salvar os dados."); }
    finally { setActionLoading(false); }
  }
  function startEdit() {
    setEditForm({ name: selected.name === "Nome não informado" ? "" : selected.name, phone: selected.phone || "", creatorName: selected.creatorName || "", city: selected.city || "", state: selected.state || "" });
    setEditing(true); setActionError(""); setActionSuccess("");
  }

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-700">Gestão de pessoas</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Criadores e usuários</h1><p className="mt-1.5 text-sm text-slate-500">Consulte contas, perfis, atividade e situação cadastral.</p></div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Contas encontradas</span><Users size={17} className="text-slate-400" /></div><p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{loading ? "—" : new Intl.NumberFormat("pt-BR").format(result.total)}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Nesta página</span><Users size={17} className="text-slate-400" /></div><p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{loading ? "—" : result.items.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Página atual</span><CalendarDays size={17} className="text-slate-400" /></div><p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{page}<span className="text-sm font-medium text-slate-400"> / {result.totalPages}</span></p></div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1"><span className="sr-only">Buscar conta</span><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail, criatório ou cidade" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100" /></label>
          <button type="submit" className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90" style={{ background: "#1d3553" }}>Buscar</button>
        </form>
        {error && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="px-3 py-3 font-semibold">Conta</th><th className="px-3 py-3 font-semibold">Localização</th><th className="px-3 py-3 font-semibold">Aves</th><th className="px-3 py-3 font-semibold">Situação</th><th className="px-3 py-3 font-semibold">Cadastro</th><th className="px-3 py-3 font-semibold text-right">Detalhes</th></tr></thead>
            <tbody>
              {loading ? Array.from({ length: 5 }, (_, i) => <tr key={i} className="border-b border-slate-50"><td colSpan="6" className="px-3 py-4"><div className="h-5 animate-pulse rounded bg-slate-100" /></td></tr>) :
              result.items.length ? result.items.map((item) => <tr key={item.userId} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                <td className="px-3 py-4"><div className="font-semibold text-sm text-slate-800">{item.name}</div><div className="mt-1 text-xs text-slate-400">{item.email || item.creatorName || "E-mail não informado"}</div>{!item.hasProfile && <div className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Perfil não preenchido</div>}</td>
                <td className="px-3 py-4 text-xs text-slate-500">{[item.city, item.state].filter(Boolean).join(" / ") || "Não informado"}</td>
                <td className="px-3 py-4"><span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700"><Bird size={14} className="text-slate-400" />{item.birdsCount}</span></td>
                <td className="px-3 py-4"><Status blocked={item.blocked} confirmed={item.emailConfirmed} /></td>
                <td className="px-3 py-4 text-xs text-slate-500">{fmtDate(item.createdAt)}</td>
                <td className="px-3 py-4 text-right"><button onClick={() => setSelected(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white">Ver conta</button></td>
              </tr>) : <tr><td colSpan="6" className="px-3 py-12 text-center"><Users size={26} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Nenhuma conta encontrada</p><p className="mt-1 text-xs text-slate-400">Tente outro termo de busca.</p></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><p className="text-xs text-slate-400">Mostrando {result.items.length} de {result.total} contas</p><div className="flex items-center gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Página anterior" className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-30"><ChevronLeft size={16} /></button><span className="min-w-14 text-center text-xs font-semibold text-slate-600">{page} / {result.totalPages}</span><button disabled={page >= result.totalPages || loading} onClick={() => setPage((value) => value + 1)} aria-label="Próxima página" className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-30"><ChevronRight size={16} /></button></div></div>
      </div>

      {selected && <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/40" onClick={() => setSelected(null)}><aside role="dialog" aria-modal="true" aria-label="Detalhes do criador" onClick={(event) => event.stopPropagation()} className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-700">Ficha da conta</p><h2 className="mt-2 text-xl font-bold text-slate-900">{selected.name}</h2><p className="mt-1 text-sm text-slate-500">{selected.creatorName || "Criatório não informado"}</p></div><button onClick={() => setSelected(null)} aria-label="Fechar detalhes" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div>
        <div className="mt-6"><Status blocked={selected.blocked} confirmed={selected.emailConfirmed} /></div>
        <div className="mt-6 space-y-4">
          <div className="flex gap-3"><Mail size={17} className="mt-0.5 text-slate-400" /><div className="min-w-0"><p className="text-[11px] text-slate-400">E-mail da conta</p><p className="break-all text-sm font-medium text-slate-800">{selected.email || "Não informado"}</p></div></div>
          {selected.phone && <div className="flex gap-3"><Phone size={17} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Telefone da conta</p><p className="text-sm font-medium text-slate-800">{selected.phone}</p></div></div>}
          <div className="flex gap-3"><CheckCircle2 size={17} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Confirmação do e-mail</p><p className="text-sm font-medium text-slate-800">{selected.emailConfirmedAt ? fmtDateTime(selected.emailConfirmedAt) : "Pendente de confirmação"}</p></div></div>
          <div className="flex gap-3"><Users size={17} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Perfil de criador</p><p className="text-sm font-medium text-slate-800">{selected.hasProfile ? "Perfil cadastrado" : "Perfil não preenchido"}</p></div></div>
          {selected.hasProfile && <div className="flex gap-3"><CalendarDays size={17} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Última atualização do perfil</p><p className="text-sm font-medium text-slate-800">{fmtDateTime(selected.profileUpdatedAt)}</p></div></div>}
          <div className="flex gap-3"><MapPin size={17} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Localização</p><p className="text-sm font-medium text-slate-800">{[selected.city, selected.state].filter(Boolean).join(" / ") || "Não informado"}</p></div></div>
          <div className="flex gap-3"><Bird size={17} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Aves cadastradas</p><p className="text-sm font-medium text-slate-800">{selected.birdsCount}</p></div></div>
          <div className="flex gap-3"><CalendarDays size={17} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Data de cadastro</p><p className="text-sm font-medium text-slate-800">{fmtDate(selected.createdAt)}</p></div></div>
          <div className="flex gap-3"><Clock3 size={17} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Último acesso</p><p className="text-sm font-medium text-slate-800">{fmtDateTime(selected.lastSignInAt)}</p></div></div>
          {selected.blocked && <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">Bloqueio válido até: {fmtDateTime(selected.blockedUntil)}</div>}
        </div>
        {actionSuccess && <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{actionSuccess}</div>}
        {actionError && <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{actionError}</div>}
        <div className="mt-7 border-t border-slate-100 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cadastro e acesso</p>
          <button type="button" onClick={startEdit} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"><Pencil size={16} /> Editar cadastro</button>
        </div>
        <div className="mt-7 border-t border-slate-100 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ações administrativas</p>
          {selected.blocked ? (
            <button type="button" onClick={() => { setManageAction("unblock"); setActionError(""); setActionSuccess(""); }} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"><Unlock size={16} /> Desbloquear conta</button>
          ) : (
            <button type="button" onClick={() => { setManageAction("block"); setActionError(""); setActionSuccess(""); }} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 hover:bg-rose-100"><Ban size={16} /> Bloquear conta</button>
          )}
          <button type="button" onClick={() => { setManageAction("reset_password"); setActionError(""); setActionSuccess(""); setReason(""); }} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 hover:bg-amber-100"><KeyRound size={16} /> Redefinir senha temporária</button>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">Define uma senha temporária. A troca é obrigatória no próximo acesso.</p>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">O bloqueio impede novos logins e renovações de sessão. Uma sessão que já tenha um token ativo poderá permanecer válida até o vencimento desse token. Contas administrativas são protegidas.</p>
        </div>
        {editing && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={saveAccountEdit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Gestão de pessoas</p><h3 className="mt-2 text-lg font-bold text-slate-900">Editar cadastro</h3></div><button type="button" onClick={() => setEditing(false)} disabled={actionLoading} aria-label="Fechar edição" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div><div className="mt-5 space-y-3">{[["name","Nome completo"],["phone","Telefone"],["creatorName","Nome do criatório"],["city","Cidade"],["state","Estado (UF)"]].map(([key,label]) => <label key={key} className="block"><span className="text-xs font-semibold text-slate-700">{label}</span><input value={editForm[key]} onChange={(event) => setEditForm((current) => ({...current,[key]:event.target.value}))} maxLength={key === "state" ? 2 : 120} required={key === "name"} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"/></label>)}</div><p className="mt-3 text-[11px] text-slate-400">A alteração do e-mail é separada e não é feita por esta tela.</p><div className="mt-6 flex gap-2"><button type="button" onClick={() => setEditing(false)} disabled={actionLoading} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Cancelar</button><button type="submit" disabled={actionLoading || !editForm.name.trim()} className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" style={{background:"#1d3553"}}>{actionLoading ? "Salvando..." : "Salvar alterações"}</button></div></form></div>}
        {manageAction && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={confirmAccountAction} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Confirmação de segurança</p><h3 className="mt-2 text-lg font-bold text-slate-900">{manageAction === "block" ? "Bloquear esta conta?" : manageAction === "unblock" ? "Desbloquear esta conta?" : "Redefinir senha desta conta?"}</h3></div><button type="button" onClick={() => setManageAction("")} disabled={actionLoading} aria-label="Cancelar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>
            <p className="mt-3 text-sm text-slate-500">Conta: <strong className="text-slate-700">{selected.email || selected.name}</strong></p>
            <label className="mt-5 block"><span className="text-xs font-semibold text-slate-700">Motivo da ação (obrigatório)</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={8} maxLength={500} required rows={3} placeholder="Descreva o motivo administrativo..." className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" /></label>
            {manageAction === "unblock" && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">O login e as renovações de sessão voltarão a ser permitidos.</p>}
            {manageAction === "reset_password" && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">A senha temporária será definida e o criador deverá cadastrar uma nova senha antes de continuar usando o sistema.</p>}
            <div className="mt-6 flex gap-2"><button type="button" onClick={() => setManageAction("")} disabled={actionLoading} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50">Cancelar</button><button type="submit" disabled={actionLoading || reason.trim().length < 8} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ background: manageAction === "block" ? "#a33d46" : "#247653" }}>{actionLoading && <Loader2 size={15} className="animate-spin" />}{manageAction === "block" ? "Confirmar bloqueio" : manageAction === "unblock" ? "Confirmar desbloqueio" : "Redefinir senha"}</button></div>
          </form>
        </div>}
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2 text-slate-700"><ShieldCheck size={16} /><p className="text-xs font-semibold">Ações protegidas e auditadas</p></div><p className="mt-1.5 text-xs leading-5 text-slate-500">Toda alteração exige autorização Master no servidor, confirmação explícita e registro de auditoria. Contas Master e administradores legados não podem ser bloqueados por esta tela.</p></div>
      </aside></div>}
    </section>
  );
}
