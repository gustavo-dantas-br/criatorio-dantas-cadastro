import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

function SummaryCard({ label: lbl, value, tone = "default" }) {
  const tones = {
    default: { bg: "#FAF3E6", color: "#2B241C" },
    bad: { bg: "#f0dad4", color: "#a6402b" },
    good: { bg: "#e4ead9", color: "#556b3f" },
  };
  const t = tones[tone];
  return (
    <div className="rounded-xl p-4" style={{ background: t.bg, border: "1px solid #e3d3b4" }}>
      <div className="ui-mono text-[11px] uppercase tracking-wide mb-1" style={{ color: "#8a7a63" }}>{lbl}</div>
      <div className="text-xl font-bold" style={{ color: t.color, fontFamily: "'Fraunces', serif" }}>{value}</div>
    </div>
  );
}

export default function FinanceiroTab({ aves, despesas, reservasFinanceiro = [], pagamentosReservasFinanceiro = [], clientes = [], onSaveDespesa, onDeleteDespesa, emptyDespesa, primeiroDiaMesISO, hojeISO, ultimoDiaMesISO, primeiroDiaAnoISO, computeFinanceiro, computeFinanceiroPeriodo, money, DESPESA_TIPOS, inputStyle, SectionTitle, Card, Field }) {
  const [novaDespesa, setNovaDespesa] = useState(emptyDespesa());
  const [inicio, setInicio] = useState(primeiroDiaMesISO());
  const [fim, setFim] = useState(hojeISO());

  const finTotal = computeFinanceiro(aves, despesas);
  const finPeriodo = computeFinanceiroPeriodo(aves, despesas, inicio, fim);

  const pagamentosRecebidos = pagamentosReservasFinanceiro.filter((p) => p.status === "recebido");
  const recebidoReservas = reservasFinanceiro.reduce((total, r) => total + pagamentosRecebidos.filter((p) => p.reserva_id === r.id).reduce((s, p) => s + Number(p.valor || 0), 0), 0);
  const aReceberReservas = reservasFinanceiro.reduce((total, r) => {
    const recebido = pagamentosRecebidos.filter((p) => p.reserva_id === r.id).reduce((s, p) => s + Number(p.valor || 0), 0);
    return total + Math.max(0, Number(r.valor_total || 0) - recebido);
  }, 0);
  const reservasComSaldo = reservasFinanceiro.filter((r) => {
    const recebido = pagamentosRecebidos.filter((p) => p.reserva_id === r.id).reduce((s, p) => s + Number(p.valor || 0), 0);
    return Number(r.valor_total || 0) - recebido > 0.009;
  });
  const recebidosNoPeriodo = pagamentosRecebidos.filter((p) => (!inicio || p.data_pagamento >= inicio) && (!fim || p.data_pagamento <= fim) && reservasFinanceiro.some((r) => r.id === p.reserva_id)).reduce((s, p) => s + Number(p.valor || 0), 0);

  function addDespesa() {
    if (!novaDespesa.descricao.trim() || !novaDespesa.valor) return;
    onSaveDespesa(novaDespesa);
    setNovaDespesa(emptyDespesa());
  }

  function aplicarAtalho(tipo) {
    if (tipo === "hoje") { setInicio(hojeISO()); setFim(hojeISO()); }
    if (tipo === "mesAtual") { setInicio(primeiroDiaMesISO()); setFim(hojeISO()); }
    if (tipo === "mesPassado") { setInicio(primeiroDiaMesISO(-1)); setFim(ultimoDiaMesISO(-1)); }
    if (tipo === "anoAtual") { setInicio(primeiroDiaAnoISO()); setFim(hojeISO()); }
    if (tipo === "tudo") { setInicio(""); setFim(""); }
  }

  return (
    <div>
      <SectionTitle>Financeiro</SectionTitle>

      <div className="ui-mono text-xs mb-3" style={{ color: "#173D29" }}>SALDO TOTAL (DESDE O INICIO)</div>
      <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <SummaryCard label="Gasto com compras de aves" value={money(finTotal.totalCompras)} />
        <SummaryCard label="Gasto com despesas (racao, vet...)" value={money(finTotal.totalDespesas)} />
        <SummaryCard label="Total investido" value={money(finTotal.totalInvestido)} tone="bad" />
        <SummaryCard label={`Total vendido (${finTotal.avesVendidas} aves)`} value={money(finTotal.totalVendas)} tone="good" />
        <SummaryCard label={finTotal.lucro >= 0 ? "Lucro" : "Prejuizo"} value={money(Math.abs(finTotal.lucro))} tone={finTotal.lucro >= 0 ? "good" : "bad"} />
      </div>

      <div className="ui-mono text-xs mb-3" style={{ color: "#173D29" }}>RESERVAS CONCLUÍDAS — RECEBIMENTOS E CONTAS A RECEBER</div>
      <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <SummaryCard label="Recebido nas vendas por reserva" value={money(recebidoReservas)} tone="good" />
        <SummaryCard label="A receber de vendas concluídas" value={money(aReceberReservas)} tone={aReceberReservas > 0 ? "bad" : "good"} />
        <SummaryCard label="Vendas com saldo pendente" value={String(reservasComSaldo.length)} />
      </div>

      <div className="ui-mono text-xs mb-3" style={{ color: "#173D29" }}>RESUMO POR PERIODO</div>
      <Card className="p-4 mb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => aplicarAtalho("hoje")} className="ui-sans text-xs px-3 py-1.5 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>Hoje</button>
          <button onClick={() => aplicarAtalho("mesAtual")} className="ui-sans text-xs px-3 py-1.5 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>Este mes</button>
          <button onClick={() => aplicarAtalho("mesPassado")} className="ui-sans text-xs px-3 py-1.5 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>Mes passado</button>
          <button onClick={() => aplicarAtalho("anoAtual")} className="ui-sans text-xs px-3 py-1.5 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>Este ano</button>
          <button onClick={() => aplicarAtalho("tudo")} className="ui-sans text-xs px-3 py-1.5 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>Tudo</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-1">
          <Field label="De"><input style={inputStyle} type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></Field>
          <Field label="Ate"><input style={inputStyle} type="date" value={fim} onChange={(e) => setFim(e.target.value)} /></Field>
        </div>
      </Card>

      <div className="grid gap-3 mb-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <SummaryCard label="Gasto com compras no periodo" value={money(finPeriodo.totalCompras)} />
        <SummaryCard label="Despesas no periodo" value={money(finPeriodo.totalDespesas)} />
        <SummaryCard label="Investido no periodo" value={money(finPeriodo.totalInvestido)} tone="bad" />
        <SummaryCard label={`Vendido no periodo (${finPeriodo.avesVendidas} aves)`} value={money(finPeriodo.totalVendas)} tone="good" />
        <SummaryCard label={finPeriodo.lucro >= 0 ? "Lucro no periodo" : "Prejuizo no periodo"} value={money(Math.abs(finPeriodo.lucro))} tone={finPeriodo.lucro >= 0 ? "good" : "bad"} />
      </div>
      <div className="mb-6"><SummaryCard label="Pagamentos de reservas recebidos no período" value={money(recebidosNoPeriodo)} tone="good" /></div>
      {finPeriodo.semData > 0 && (
        <div className="ui-sans text-xs mb-8" style={{ color: "#475569" }}>
          ⚠️ {finPeriodo.semData} {finPeriodo.semData === 1 ? "registro (compra/venda/despesa) esta" : "registros (compra/venda/despesa) estao"} sem data preenchida e por isso nao entram no filtro por periodo, so no saldo total.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div>
          <div className="ui-mono text-xs mb-2" style={{ color: "#173D29" }}>DESPESAS NO PERIODO ({finPeriodo.despesasPeriodo.length})</div>
          {finPeriodo.despesasPeriodo.length === 0 ? (
            <Card className="p-3 ui-sans text-xs" style={{ color: "#8a7a63" }}>Nenhuma despesa nesse periodo.</Card>
          ) : (
            <div className="flex flex-col gap-2">
              {finPeriodo.despesasPeriodo.map((d) => (
                <Card key={d.id} className="p-3 ui-sans">
                  <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{d.descricao}</div>
                  <div className="text-xs" style={{ color: "#8a7a63" }}>{d.tipo} {d.data ? `- ${d.data}` : ""}</div>
                  <div className="text-sm font-semibold mt-1" style={{ color: "#a6402b" }}>{money(d.valor)}</div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="ui-mono text-xs mb-2" style={{ color: "#173D29" }}>COMPRAS NO PERIODO ({finPeriodo.comprasPeriodo.length})</div>
          {finPeriodo.comprasPeriodo.length === 0 ? (
            <Card className="p-3 ui-sans text-xs" style={{ color: "#8a7a63" }}>Nenhuma ave comprada nesse periodo.</Card>
          ) : (
            <div className="flex flex-col gap-2">
              {finPeriodo.comprasPeriodo.map((a) => (
                <Card key={a.id} className="p-3 ui-sans">
                  <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{a.nome}</div>
                  <div className="text-xs" style={{ color: "#8a7a63" }}>
                    {a.fornecedorNome ? `Comprada de ${a.fornecedorNome}` : "Vendedor nao informado"}
                    {a.fornecedorTelefone ? ` - ${a.fornecedorTelefone}` : ""}
                  </div>
                  <div className="text-xs" style={{ color: "#8a7a63" }}>{a.dataCompra}</div>
                  <div className="text-sm font-semibold mt-1" style={{ color: "#a6402b" }}>{money(a.valorCompra)}</div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="ui-mono text-xs mb-2" style={{ color: "#173D29" }}>VENDAS NO PERIODO ({finPeriodo.vendasPeriodo.length})</div>
          {finPeriodo.vendasPeriodo.length === 0 ? (
            <Card className="p-3 ui-sans text-xs" style={{ color: "#8a7a63" }}>Nenhuma ave vendida nesse periodo.</Card>
          ) : (
            <div className="flex flex-col gap-2">
              {finPeriodo.vendasPeriodo.map((a) => (
                <Card key={a.id} className="p-3 ui-sans">
                  <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{a.nome}</div>
                  <div className="text-xs" style={{ color: "#8a7a63" }}>
                    {a.compradorNome ? `Vendida para ${a.compradorNome}` : "Comprador nao informado"}
                    {a.compradorTelefone ? ` - ${a.compradorTelefone}` : ""}
                  </div>
                  <div className="text-xs" style={{ color: "#8a7a63" }}>{a.dataVenda}</div>
                  <div className="text-sm font-semibold mt-1" style={{ color: "#556b3f" }}>{money(a.valorVenda)}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ui-mono text-xs mb-3" style={{ color: "#173D29" }}>CONTAS A RECEBER — VENDAS CONCLUÍDAS</div>
      {reservasComSaldo.length === 0 ? (
        <Card className="p-4 mb-6 ui-sans text-sm" style={{ color: "#8a7a63" }}>Nenhuma venda concluída com saldo pendente.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {reservasComSaldo.map((r) => {
            const ave = aves.find((a) => a.id === r.ave_id) || {};
            const cliente = clientes.find((c) => c.id === r.cliente_id) || {};
            const recebido = pagamentosRecebidos.filter((p) => p.reserva_id === r.id).reduce((s, p) => s + Number(p.valor || 0), 0);
            const saldo = Math.max(0, Number(r.valor_total || 0) - recebido);
            return <Card key={r.id} className="p-4 ui-sans">
              <div className="font-semibold text-sm" style={{ color: "#2B241C" }}>{ave.nome || "Ave vendida"}</div>
              <div className="text-xs mt-1" style={{ color: "#8a7a63" }}>Cliente: {cliente.nome || "Não identificado"}{cliente.telefone ? ` · ${cliente.telefone}` : ""}</div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div><div style={{ color: "#8a7a63" }}>Venda</div><strong style={{ color: "#2B241C" }}>{money(r.valor_total)}</strong></div>
                <div><div style={{ color: "#8a7a63" }}>Recebido</div><strong style={{ color: "#556b3f" }}>{money(recebido)}</strong></div>
                <div><div style={{ color: "#8a7a63" }}>Falta receber</div><strong style={{ color: "#a6402b" }}>{money(saldo)}</strong></div>
              </div>
            </Card>;
          })}
        </div>
      )}

      <div className="my-8 h-px" style={{ background: "#4a2c18" }} />

      <div className="ui-mono text-xs mb-3" style={{ color: "#173D29" }}>DESPESAS DO PLANTEL (racao, veterinario, equipamentos...)</div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <Field label="Tipo">
            <select style={inputStyle} value={novaDespesa.tipo} onChange={(e) => setNovaDespesa((d) => ({ ...d, tipo: e.target.value }))}>{DESPESA_TIPOS.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="Descricao">
            <input style={inputStyle} value={novaDespesa.descricao} onChange={(e) => setNovaDespesa((d) => ({ ...d, descricao: e.target.value }))} placeholder="ex: Saco de racao 20kg" />
          </Field>
          <Field label="Valor (R$)">
            <input style={inputStyle} type="number" step="0.01" value={novaDespesa.valor} onChange={(e) => setNovaDespesa((d) => ({ ...d, valor: e.target.value }))} />
          </Field>
          <Field label="Data">
            <input style={inputStyle} type="date" value={novaDespesa.data} onChange={(e) => setNovaDespesa((d) => ({ ...d, data: e.target.value }))} />
          </Field>
        </div>
        <button onClick={addDespesa} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold mt-3" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          <Plus size={15} /> Adicionar despesa
        </button>
      </Card>

      {despesas.length === 0 ? (
        <Card className="p-6 text-center ui-sans" style={{ color: "#8a7a63" }}>Nenhuma despesa lancada ainda.</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {despesas.map((d) => (
            <Card key={d.id} className="p-3 flex items-center justify-between gap-3 ui-sans">
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{d.descricao}</div>
                <div className="text-xs" style={{ color: "#8a7a63" }}>{d.tipo} {d.data ? `- ${d.data}` : ""} {d.synced === false ? "(nao sincronizado)" : ""}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="font-semibold text-sm" style={{ color: "#a6402b" }}>{money(d.valor)}</div>
                <button onClick={() => onDeleteDespesa(d.id)} className="p-1.5 rounded" style={{ background: "#f0dad4" }}><Trash2 size={13} color="#a6402b" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
