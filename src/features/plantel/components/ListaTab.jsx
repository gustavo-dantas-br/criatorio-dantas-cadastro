import React from "react";
import { Plus, Download, Upload, Search, SlidersHorizontal, Bird } from "lucide-react";

const STATUS_ABAS = [
  { id: "plantel", label: "Aves no plantel", count: (aves) => aves.filter((a) => ["No plantel", "A venda", "Reservada"].includes(a.status || "No plantel")).length },
  { id: "A venda", label: "À venda", count: (aves) => aves.filter((a) => a.status === "A venda").length },
  { id: "Reservada", label: "Reservadas", count: (aves) => aves.filter((a) => a.status === "Reservada").length },
  { id: "Vendida", label: "Vendidas", count: (aves) => aves.filter((a) => a.status === "Vendida").length },
  { id: "Falecida", label: "Falecidas", count: (aves) => aves.filter((a) => a.status === "Falecida").length },
  { id: "Perdida", label: "Perdidas", count: (aves) => aves.filter((a) => a.status === "Perdida").length },
];

export default function ListaTab({ aves, todasAves = aves, search, setSearch, onEdit, onDelete, onNew, onSync, onExport, onImport, statusFilter, setStatusFilter, casaisAgrupados, Card, SectionTitle, AveCard, FILTER_LABELS }) {
  const pendentes = aves.filter((a) => a.synced === false).length;
  const totalLabel = aves.length === 1 ? "ave encontrada" : "aves encontradas";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <SectionTitle>Meu plantel</SectionTitle>
          <p className="-mt-4 text-sm" style={{ color: "#587061" }}>
            Organize, acompanhe e atualize as aves do seu criatório.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button onClick={onNew} className="ui-sans inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition hover:brightness-95" style={{ background: "#18764B", color: "#FFFFFF", boxShadow: "0 3px 8px rgba(24,118,75,.16)" }}>
            <Plus size={17} /> Nova ave
          </button>
          <button onClick={onExport} className="ui-sans inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition hover:bg-[#F2F7F3]" style={{ background: "#FFFFFF", borderColor: "#D6E3D9", color: "#315542" }}>
            <Download size={15} /> Backup
          </button>
          <label className="ui-sans inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition hover:bg-[#F2F7F3]" style={{ background: "#FFFFFF", borderColor: "#D6E3D9", color: "#315542" }}>
            <Upload size={15} /> Importar
            <input type="file" accept="application/json" className="hidden" onChange={onImport} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {STATUS_ABAS.map((aba) => {
          const ativa = statusFilter === aba.id;
          return (
            <button key={aba.id} type="button" onClick={() => setStatusFilter(aba.id)} aria-pressed={ativa}
              className="rounded-xl border px-3 py-3 text-left transition hover:-translate-y-0.5"
              style={{ background: ativa ? "#EAF4ED" : "#FFFFFF", borderColor: ativa ? "#78AE89" : "#DCE8DF", boxShadow: ativa ? "0 2px 8px rgba(24,118,75,.08)" : "none" }}>
              <span className="block text-[11px] font-semibold leading-tight" style={{ color: ativa ? "#176B45" : "#668071" }}>{aba.label}</span>
              <span className="mt-1 block text-xl font-bold tabular-nums" style={{ color: "#203B2C" }}>{aba.count(todasAves)}</span>
            </button>
          );
        })}
      </div>

      {statusFilter && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm" style={{ background: "#EDF6F0", color: "#28563C", borderColor: "#CFE2D4" }}>
          <span className="flex items-center gap-2"><SlidersHorizontal size={16} /> Exibindo: <strong>{FILTER_LABELS[statusFilter] || statusFilter}</strong> <span style={{ color: "#66816F" }}>({statusFilter === "casais" ? casaisAgrupados.length : aves.length})</span></span>
          {statusFilter !== "plantel" && <button onClick={() => setStatusFilter("plantel")} className="rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-white" style={{ color: "#176B45" }}>Voltar ao plantel</button>}
        </div>
      )}

      {pendentes > 0 && (
        <div className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm" style={{ background: "#FFF8E8", color: "#76551B", borderColor: "#F0DDAE" }}>
          <span className="mt-0.5 rounded-lg p-1.5" style={{ background: "#F8EBCB" }}><Upload size={16} /></span>
          <div><strong>{pendentes} {pendentes === 1 ? "ave aguardando sincronização" : "aves aguardando sincronização"}</strong><p className="mt-0.5 text-xs" style={{ color: "#8B713D" }}>Esses registros estão salvos neste aparelho. Use “Sincronizar” no cartão ou faça um backup.</p></div>
        </div>
      )}

      <div className="rounded-2xl border p-3 sm:p-4" style={{ background: "#FFFFFF", borderColor: "#DCE8DF", boxShadow: "0 3px 12px rgba(28,67,43,.04)" }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#668071" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, anilha ou espécie..." aria-label="Buscar aves"
              className="ui-sans min-h-11 w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-[#B7D9C2]"
              style={{ background: "#F8FBF8", borderColor: "#D8E5DB", color: "#203B2C" }} />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "#668071" }}>
            <Bird size={16} /> {aves.length} {totalLabel}
          </div>
        </div>
      </div>

      {aves.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "#EAF4ED", color: "#287A50" }}><Bird size={24} /></div>
          <h3 className="text-base font-bold" style={{ color: "#244532" }}>{search ? "Nenhuma ave encontrada" : statusFilter ? "Nenhuma ave nesta categoria" : "Seu plantel começa aqui"}</h3>
          <p className="mx-auto mt-1 max-w-md text-sm" style={{ color: "#668071" }}>{search ? "Tente outro nome, número de anilha ou espécie." : "Cadastre sua primeira ave para organizar o plantel e acompanhar a árvore genealógica."}</p>
          {!search && statusFilter === "plantel" && <button onClick={onNew} className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold" style={{ background: "#18764B", color: "#FFFFFF" }}><Plus size={16} /> Cadastrar primeira ave</button>}
        </Card>
      ) : statusFilter === "casais" ? (
        <div className="flex flex-col gap-4">
          {casaisAgrupados.map(({ a, b, label: casalLabel }) => (
            <Card key={a.id} className="p-3 sm:p-4">
              {casalLabel && <div className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "#477257" }}>{casalLabel}</div>}
              <div className="grid gap-3 md:grid-cols-2">
                <AveCard a={a} onEdit={onEdit} onDelete={onDelete} onSync={onSync} />
                {b ? <AveCard a={b} onEdit={onEdit} onDelete={onDelete} onSync={onSync} /> : <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed text-sm" style={{ borderColor: "#D6E3D9", color: "#789080" }}>Parceiro não identificado no sistema</div>}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {aves.map((a) => <AveCard key={a.id} a={a} onEdit={onEdit} onDelete={onDelete} onSync={onSync} />)}
        </div>
      )}
    </div>
  );
}
