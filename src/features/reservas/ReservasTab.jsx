import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Wallet, CalendarDays, Bird, UserRound, CheckCircle2, Clock3, XCircle, RefreshCw, Printer } from "lucide-react";
import { supabase } from "../../supabaseClient";

const moneyBR = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateBR = (v) => v ? new Date(v + "T12:00:00").toLocaleDateString("pt-BR") : "—";

export default function ReservasTab({ userId, perfil = {}, clientes = [], aves = [], posturas = [], onReservaConcluida, onFinanceiroAtualizado, Card, SectionTitle }) {
  const [reservas, setReservas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("ativas");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ tipo: "ave_existente", cliente_id: "", ave_id: "", postura_id: "", descricao_futura: "", valor_total: "", valor_sinal: "", data_reserva: new Date().toISOString().slice(0,10), previsao_nascimento: "", observacoes: "" });
  const [pagamentoForm, setPagamentoForm] = useState({});
  const [expandida, setExpandida] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true); setErro("");
    const [r, p] = await Promise.all([
      supabase.from("reservas_aves").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("reserva_pagamentos").select("*").eq("user_id", userId).order("data_pagamento", { ascending: false }),
    ]);
    if (r.error || p.error) setErro("Não foi possível carregar as reservas. " + (r.error?.message || p.error?.message || ""));
    else { setReservas(r.data || []); setPagamentos(p.data || []); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { carregar(); }, [carregar]);

  const resumo = useMemo(() => reservas.reduce((acc, r) => {
    const pagos = pagamentos.filter(p => p.reserva_id === r.id && p.status === "recebido").reduce((s,p) => s + Number(p.valor || 0), 0);
    if (!["concluida","cancelada"].includes(r.status)) acc.ativas += 1;
    acc.recebido += pagos;
    acc.saldo += Math.max(0, Number(r.valor_total || 0) - pagos);
    return acc;
  }, { ativas: 0, recebido: 0, saldo: 0 }), [reservas, pagamentos]);

  const criar = async (e) => {
    e.preventDefault(); setErro("");
    const total = Number(String(form.valor_total).replace(",", "."));
    const sinal = Number(String(form.valor_sinal || 0).replace(",", "."));
    if (!form.cliente_id || !(total > 0) || sinal < 0 || sinal > total) { setErro("Selecione o cliente e informe valores válidos. O sinal não pode superar o valor total."); return; }
    if (form.tipo === "ave_existente" && !form.ave_id) { setErro("Selecione a ave que está sendo reservada."); return; }
    if (form.tipo === "antecipada" && !form.descricao_futura.trim() && !form.postura_id) { setErro("Informe o casal/ninhada ou selecione uma postura."); return; }
    setSaving(true);
    const payload = {
      user_id: userId, cliente_id: form.cliente_id, ave_id: form.tipo === "ave_existente" ? form.ave_id : null,
      postura_id: form.postura_id || null, tipo: form.tipo, descricao_futura: form.descricao_futura.trim() || null,
      valor_total: total, status: form.tipo === "antecipada" ? "aguardando_nascimento" : sinal > 0 ? "reservada" : "aguardando_sinal",
      data_reserva: form.data_reserva, previsao_nascimento: form.previsao_nascimento || null, observacoes: form.observacoes.trim() || null,
    };
    const { data, error } = await supabase.from("reservas_aves").insert(payload).select().single();
    if (error) setErro("Não foi possível criar a reserva: " + error.message);
    else {
      if (sinal > 0) {
        const { error: payError } = await supabase.from("reserva_pagamentos").insert({ reserva_id: data.id, user_id: userId, valor: sinal, data_pagamento: form.data_reserva, descricao: "Sinal da reserva", status: "recebido" });
        if (payError) setErro("Reserva criada, mas o sinal não foi registrado. Abra a reserva e registre o pagamento: " + payError.message);
      }
      setForm({ tipo: "ave_existente", cliente_id: "", ave_id: "", postura_id: "", descricao_futura: "", valor_total: "", valor_sinal: "", data_reserva: new Date().toISOString().slice(0,10), previsao_nascimento: "", observacoes: "" });
      setMostrarForm(false); await carregar();
    }
    setSaving(false);
  };

  const adicionarPagamento = async (reserva) => {
    const f = pagamentoForm[reserva.id] || {};
    const valor = Number(String(f.valor || "").replace(",", "."));
    const recebido = pagamentos.filter(p => p.reserva_id === reserva.id && p.status === "recebido").reduce((s,p) => s + Number(p.valor || 0), 0);
    const saldo = Number(reserva.valor_total || 0) - recebido;
    if (!(valor > 0) || valor > saldo) { setErro("Informe um pagamento maior que zero e não superior ao saldo restante."); return; }
    setSaving(true); setErro("");
    const { error } = await supabase.from("reserva_pagamentos").insert({ reserva_id: reserva.id, user_id: userId, valor, data_pagamento: f.data || new Date().toISOString().slice(0,10), forma_pagamento: f.forma || null, descricao: f.descricao || null, status: "recebido" });
    if (error) setErro("Não foi possível registrar o pagamento: " + error.message);
    else { setPagamentoForm(v => ({ ...v, [reserva.id]: {} })); await carregar(); if (onFinanceiroAtualizado) await onFinanceiroAtualizado(); }
    setSaving(false);
  };


  const escapar = (valor) => String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const imprimirOrdem = (r) => {
    const cliente = clientes.find(c => c.id === r.cliente_id) || {};
    const ave = aves.find(a => a.id === r.ave_id) || {};
    const pays = pagamentos.filter(p => p.reserva_id === r.id && p.status === "recebido");
    const recebido = pays.reduce((s, p) => s + Number(p.valor || 0), 0);
    const saldo = Math.max(0, Number(r.valor_total || 0) - recebido);
    const identificacao = r.tipo === "antecipada"
      ? (r.descricao_futura || nomePostura(r.postura_id) || "Futura ninhada")
      : [ave.nome, ave.especie, ave.mutacao].filter(Boolean).join(" · ") || "Ave reservada";
    const statusLabel = ({ aguardando_nascimento: "Aguardando nascimento", aguardando_sinal: "Aguardando sinal", reservada: "Reservada", concluida: "Concluída", cancelada: "Cancelada" })[r.status] || r.status;
    const numero = String(r.id || "").slice(0, 8).toUpperCase();
    const nomeCriatorio = perfil.nomeCriatorio?.trim() || [perfil.nome, perfil.sobrenome].filter(Boolean).join(" ").trim() || "Criatório";
    const contatoCriatorio = perfil.whatsapp || "";
    const logoCriatorio = perfil.logoUrl || "";
    const linhasPagamentos = pays.length ? pays.map(p => `<tr><td>${escapar(dateBR(p.data_pagamento))}</td><td>${escapar(p.descricao || p.forma_pagamento || "Pagamento")}</td><td>${escapar(p.forma_pagamento || "—")}</td><td class="valor">${moneyBR(p.valor)}</td></tr>`).join("") : '<tr><td colspan="4" class="vazio">Nenhum pagamento registrado até o momento.</td></tr>';
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comprovante de Reserva ${numero} · ${escapar(nomeCriatorio)}</title>
      <style>
        *{box-sizing:border-box}body{margin:0;background:#eef2ef;color:#23372c;font:14px/1.5 Arial,Helvetica,sans-serif}.folha{width:210mm;min-height:297mm;margin:24px auto;padding:18mm 17mm;background:#fff;box-shadow:0 8px 32px #173c2520}.topo{display:flex;justify-content:space-between;align-items:center;gap:18px;border-bottom:2px solid #dce8df;padding-bottom:16px}.marca{display:flex;align-items:center;gap:12px;font-size:19px;font-weight:800;color:#31523e}.marca img{width:76px;height:76px;object-fit:contain;border-radius:9px}.marca small{display:block;font-size:10px;color:#718477;font-weight:500}.tipo{text-align:right}.tipo strong{display:block;font-size:20px;color:#203b2c}.tipo span{font-size:11px;color:#718477}.faixa{display:flex;justify-content:space-between;align-items:center;margin:22px 0 18px;padding:12px 15px;border-radius:10px;background:#edf6ef}.faixa strong{color:#176b45}.selo{padding:5px 10px;border-radius:30px;background:#dcefe2;color:#176b45;font-size:11px;font-weight:700}.secao{margin-top:20px}.secao h2{margin:0 0 10px;padding-bottom:7px;border-bottom:1px solid #e1e9e3;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#477057}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 22px}.campo label{display:block;margin-bottom:3px;font-size:10px;color:#7a8b80;text-transform:uppercase;letter-spacing:.5px}.campo strong{font-size:13px;color:#23372c}.resumo{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.box{padding:13px;border:1px solid #e1e9e3;border-radius:9px}.box label{display:block;font-size:10px;color:#718477;text-transform:uppercase}.box strong{display:block;margin-top:4px;font-size:17px;color:#203b2c}.box.destaque{background:#edf6ef;border-color:#d2e7d8}.box.destaque strong{color:#176b45}table{width:100%;border-collapse:collapse;font-size:11px}th{text-align:left;padding:9px 8px;background:#f1f6f2;color:#55705f;font-size:10px;text-transform:uppercase}td{padding:9px 8px;border-bottom:1px solid #e7eee8}.valor{text-align:right;font-weight:700;white-space:nowrap}.vazio{text-align:center;color:#7a8b80}.observacoes{min-height:48px;padding:11px;border:1px solid #e1e9e3;border-radius:8px;white-space:pre-wrap}.nota{margin-top:18px;padding:12px 14px;border-left:3px solid #18764b;background:#f5f8f5;color:#617367;font-size:11px}.assinaturas{display:grid;grid-template-columns:1fr 1fr;gap:38px;margin-top:54px}.assinatura{text-align:center;padding-top:8px;border-top:1px solid #87958b;font-size:11px;color:#53665a}.rodape{margin-top:32px;padding-top:12px;border-top:1px solid #e1e9e3;text-align:center;font-size:10px;color:#829087}.acoes{width:210mm;margin:0 auto 24px;display:flex;justify-content:flex-end;gap:8px}.acoes button{border:0;border-radius:8px;padding:11px 16px;background:#18764b;color:#fff;font-weight:700;cursor:pointer}.acoes .sec{background:#fff;color:#31523e;border:1px solid #d5e2d8}
        @page{size:A4;margin:0}@media print{body{background:#fff}.folha{width:210mm;min-height:297mm;margin:0;padding:16mm 17mm;box-shadow:none}.acoes{display:none}.nota,.faixa,.box.destaque,th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
        @media(max-width:760px){body{background:#fff}.folha{width:100%;min-height:0;margin:0;padding:22px}.acoes{width:100%;padding:0 22px}.grid{grid-template-columns:1fr 1fr}}
      </style></head><body><main class="folha">
        <header class="topo"><div class="marca">${logoCriatorio ? `<img src="${escapar(logoCriatorio)}" alt="Logo do criatório">` : ""}<div>${escapar(nomeCriatorio)}<small>Comprovante de controle do criatório</small></div></div><div class="tipo"><strong>Comprovante de reserva</strong><span>Registro nº ${numero}</span></div></header>
        <div class="faixa"><div><div style="font-size:10px;color:#718477;text-transform:uppercase">Data da reserva</div><strong>${escapar(dateBR(r.data_reserva))}</strong></div><span class="selo">${escapar(statusLabel)}</span></div>
        <section class="secao"><h2>Dados do cliente</h2><div class="grid"><div class="campo"><label>Nome completo</label><strong>${escapar(cliente.nome || "—")}</strong></div><div class="campo"><label>Telefone / WhatsApp</label><strong>${escapar(cliente.telefone || "—")}</strong></div><div class="campo"><label>Criador / Criatório</label><strong>${escapar(nomeCriatorio)}</strong></div><div class="campo"><label>Contato</label><strong>${escapar(contatoCriatorio || "—")}</strong></div></div></section>
        <section class="secao"><h2>Identificação da reserva</h2><div class="grid"><div class="campo"><label>Tipo</label><strong>${r.tipo === "antecipada" ? "Reserva antecipada" : "Ave já nascida"}</strong></div><div class="campo"><label>Ave / espécie / identificação</label><strong>${escapar(identificacao)}</strong></div><div class="campo"><label>Previsão de nascimento</label><strong>${escapar(r.previsao_nascimento ? dateBR(r.previsao_nascimento) : "A definir")}</strong></div><div class="campo"><label>Referência da reserva</label><strong>${numero}</strong></div></div></section>
        <section class="secao"><h2>Resumo financeiro</h2><div class="resumo"><div class="box"><label>Valor total combinado</label><strong>${moneyBR(r.valor_total)}</strong></div><div class="box"><label>Total recebido</label><strong>${moneyBR(recebido)}</strong></div><div class="box destaque"><label>Saldo restante</label><strong>${moneyBR(saldo)}</strong></div></div></section>
        <section class="secao"><h2>Histórico de pagamentos</h2><table><thead><tr><th>Data</th><th>Descrição</th><th>Forma</th><th class="valor">Valor</th></tr></thead><tbody>${linhasPagamentos}</tbody></table></section>
        <section class="secao"><h2>Observações e condições combinadas</h2><div class="observacoes">${escapar(r.observacoes || "________________________________________________________________________________")}</div></section>
        <div class="nota">Este comprovante é apenas para controle do criatório e do comprador. Registra a reserva e os pagamentos combinados. Não é nota fiscal.</div>
        <section class="assinaturas"><div class="assinatura">Confirmação do criador / criatório</div><div class="assinatura">Assinatura do cliente</div></section>
        <footer class="rodape">Controle de reserva · ${escapar(new Date().toLocaleString("pt-BR"))}</footer>
      </main><div class="acoes"><button class="sec" onclick="window.close()">Fechar</button><button onclick="window.print()">Imprimir / Salvar em PDF</button></div></body></html>`;
    const janela = window.open("", "_blank", "width=900,height=1100");
    if (!janela) { setErro("O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente novamente."); return; }
    janela.document.open(); janela.document.write(html); janela.document.close();
  };


  const concluirReserva = async (r) => {
    if (!r.ave_id || !r.cliente_id) {
      setErro("Vincule uma ave e um cliente antes de concluir a venda.");
      return;
    }
    const confirmado = window.confirm("Confirmar a venda desta ave pelo valor total de " + moneyBR(r.valor_total) + "? Os pagamentos já registrados serão preservados.");
    if (!confirmado) return;
    setSaving(true); setErro("");
    const { data, error } = await supabase.rpc("concluir_reserva_ave", { p_reserva_id: r.id });
    if (error) {
      setErro("Não foi possível concluir a venda: " + error.message);
    } else {
      await carregar();
      if (onReservaConcluida) await onReservaConcluida();
      if (onFinanceiroAtualizado) await onFinanceiroAtualizado();
      const saldoPendente = Number(data?.saldo_pendente || 0);
      if (saldoPendente > 0) {
        setErro("Venda concluída. Saldo que continua pendente: " + moneyBR(saldoPendente) + ". Consulte o histórico da reserva para acompanhar o recebimento.");
      }
    }
    setSaving(false);
  };

  const atualizarStatus = async (r, status) => {
    if (status === "concluida") {
      setErro("Use o botão Concluir venda para atualizar a ave e a reserva juntas.");
      return;
    }
    const { error } = await supabase.from("reservas_aves").update({ status, updated_at: new Date().toISOString() }).eq("id", r.id).eq("user_id", userId);
    if (error) setErro("Não foi possível atualizar a reserva: " + error.message); else await carregar();
  };

  const visiveis = reservas.filter(r => filtro === "todas" || (filtro === "ativas" ? !["concluida","cancelada"].includes(r.status) : r.status === filtro));
  const nomeCliente = (id) => clientes.find(c => c.id === id)?.nome || "Cliente não localizado";
  const nomeAve = (id) => aves.find(a => a.id === id)?.nome || "Ave não vinculada";
  const nomePostura = (id) => { const p = posturas.find(x => x.id === id); return p ? [p.casalLabel, p.nomeCasal, p.identificacao].filter(Boolean).join(" · ") || "Postura vinculada" : ""; };

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><SectionTitle>Reservas</SectionTitle><p className="-mt-4 text-sm" style={{color:"#587061"}}>Controle sinais, pagamentos e valores pendentes dos seus clientes.</p></div>
      <button onClick={() => setMostrarForm(v => !v)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold" style={{background:"#18764B",color:"#fff"}}><Plus size={17}/>{mostrarForm ? "Fechar formulário" : "Nova reserva"}</button>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[["Reservas ativas", resumo.ativas, Clock3],["Total recebido", moneyBR(resumo.recebido), Wallet],["Saldo pendente", moneyBR(resumo.saldo), CalendarDays]].map(([label,value,Icon]) => <Card key={label} className="p-4"><div className="flex items-center gap-2 text-xs font-semibold" style={{color:"#668071"}}><Icon size={16}/>{label}</div><div className="mt-2 text-xl font-extrabold" style={{color:"#203B2C"}}>{value}</div></Card>)}
    </div>
    {erro && <div className="rounded-xl border px-4 py-3 text-sm" style={{background:"#FFF1EF",borderColor:"#F1D0CB",color:"#9B5148"}}>{erro}</div>}
    {mostrarForm && <Card className="p-4 sm:p-5"><h3 className="mb-4 font-bold" style={{color:"#244532"}}>Dados da reserva</h3>
      <form onSubmit={criar} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold" style={{color:"#496653"}}>Tipo de reserva<select value={form.tipo} onChange={e=>setForm(v=>({...v,tipo:e.target.value,ave_id:""}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}><option value="ave_existente">Ave já nascida</option><option value="antecipada">Futura ninhada / ave ainda não nascida</option></select></label>
        <label className="text-xs font-semibold" style={{color:"#496653"}}>Cliente<select required value={form.cliente_id} onChange={e=>setForm(v=>({...v,cliente_id:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}><option value="">Selecione o cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome}{c.telefone ? " · "+c.telefone : ""}</option>)}</select></label>
        {form.tipo === "ave_existente" ? <label className="text-xs font-semibold sm:col-span-2" style={{color:"#496653"}}>Ave<select required value={form.ave_id} onChange={e=>setForm(v=>({...v,ave_id:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}><option value="">Selecione a ave</option>{aves.filter(a=>!["Vendida","Falecida","Perdida"].includes(a.status)).map(a=><option key={a.id} value={a.id}>{a.nome || "Sem nome"} · {a.especie || "Espécie não informada"}</option>)}</select></label> :
          <><label className="text-xs font-semibold" style={{color:"#496653"}}>Postura / ninhada (opcional)<select value={form.postura_id} onChange={e=>setForm(v=>({...v,postura_id:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}><option value="">Não vincular agora</option>{posturas.map(p=><option key={p.id} value={p.id}>{nomePostura(p.id) || "Postura"}</option>)}</select></label><label className="text-xs font-semibold" style={{color:"#496653"}}>Casal / descrição da futura ave<input value={form.descricao_futura} onChange={e=>setForm(v=>({...v,descricao_futura:e.target.value}))} placeholder="Ex.: filhote do casal Mel × Zazur" className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/></label></>}
        <label className="text-xs font-semibold" style={{color:"#496653"}}>Valor total combinado (R$)<input required type="number" min="0.01" step="0.01" value={form.valor_total} onChange={e=>setForm(v=>({...v,valor_total:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/></label>
        <label className="text-xs font-semibold" style={{color:"#496653"}}>Sinal recebido agora (R$)<input type="number" min="0" step="0.01" value={form.valor_sinal} onChange={e=>setForm(v=>({...v,valor_sinal:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/></label>
        <label className="text-xs font-semibold" style={{color:"#496653"}}>Data da reserva / sinal<input type="date" value={form.data_reserva} onChange={e=>setForm(v=>({...v,data_reserva:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/></label>
        {form.tipo === "antecipada" && <label className="text-xs font-semibold" style={{color:"#496653"}}>Previsão de nascimento<input type="date" value={form.previsao_nascimento} onChange={e=>setForm(v=>({...v,previsao_nascimento:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/></label>}
        <label className="text-xs font-semibold sm:col-span-2" style={{color:"#496653"}}>Observações<textarea value={form.observacoes} onChange={e=>setForm(v=>({...v,observacoes:e.target.value}))} rows="2" className="mt-1 w-full rounded-xl border p-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/></label>
        <div className="flex flex-wrap gap-2 sm:col-span-2"><button disabled={saving} className="rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50" style={{background:"#18764B",color:"#fff"}}>{saving ? "Salvando..." : "Salvar reserva"}</button><button type="button" onClick={()=>setMostrarForm(false)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{borderColor:"#D8E5DB",color:"#496653"}}>Cancelar</button></div>
      </form>
    </Card>}
    <div className="flex flex-wrap gap-2">{[["ativas","Ativas"],["todas","Todas"],["aguardando_nascimento","Aguardando nascimento"],["concluida","Concluídas"],["cancelada","Canceladas"]].map(([id,label])=><button key={id} onClick={()=>setFiltro(id)} className="rounded-full px-3 py-2 text-xs font-bold" style={{background:filtro===id?"#18764B":"#fff",color:filtro===id?"#fff":"#496653",border:"1px solid "+(filtro===id?"#18764B":"#D8E5DB")}}>{label}</button>)}</div>
    {loading ? <Card className="p-8 text-center text-sm" >Carregando reservas...</Card> : visiveis.length === 0 ? <Card className="p-8 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{background:"#EAF4ED",color:"#287A50"}}><CalendarDays size={24}/></div><h3 className="font-bold" style={{color:"#244532"}}>Nenhuma reserva encontrada</h3><p className="mt-1 text-sm" style={{color:"#668071"}}>Cadastre a primeira reserva para acompanhar sinais e pagamentos.</p></Card> :
      <div className="space-y-3">{visiveis.map(r=>{const pays=pagamentos.filter(p=>p.reserva_id===r.id);const recebido=pays.filter(p=>p.status==="recebido").reduce((s,p)=>s+Number(p.valor||0),0);const saldo=Math.max(0,Number(r.valor_total||0)-recebido);const cliente=clientes.find(c=>c.id===r.cliente_id);const aberta=expandida===r.id;return <Card key={r.id} className="overflow-hidden"><button onClick={()=>setExpandida(aberta?"":r.id)} className="w-full p-4 text-left sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-bold" style={{color:"#203B2C"}}>{r.tipo==="antecipada"?"Reserva antecipada":nomeAve(r.ave_id)}</span><span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{background:r.status==="concluida"?"#EAF4ED":r.status==="cancelada"?"#FCEFED":"#FFF4DF",color:r.status==="concluida"?"#287A50":r.status==="cancelada"?"#A64F45":"#95651A"}}>{({aguardando_nascimento:"Aguardando nascimento",aguardando_sinal:"Aguardando sinal",reservada:"Reservada",concluida:"Concluída",cancelada:"Cancelada"})[r.status]||r.status}</span></div><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{color:"#668071"}}><span className="inline-flex items-center gap-1"><UserRound size={13}/>{nomeCliente(r.cliente_id)}</span><span>{dateBR(r.data_reserva)}</span></div>{r.tipo==="antecipada"&&<p className="mt-1 text-xs" style={{color:"#52705D"}}>{r.descricao_futura || nomePostura(r.postura_id) || "Futura ninhada"}</p>}</div><div className="grid grid-cols-2 gap-4 text-right sm:min-w-[230px]"><div><div className="text-[10px]" style={{color:"#668071"}}>Recebido</div><div className="font-bold" style={{color:"#287A50"}}>{moneyBR(recebido)}</div></div><div><div className="text-[10px]" style={{color:"#668071"}}>Saldo</div><div className="font-bold" style={{color:"#203B2C"}}>{moneyBR(saldo)}</div></div></div></div></button>
        {aberta&&<div className="border-t px-4 py-4 sm:px-5" style={{borderColor:"#E2EBE4"}}><div className="grid gap-3 text-sm sm:grid-cols-3"><div><span className="text-xs" style={{color:"#668071"}}>Valor combinado</span><div className="font-bold" style={{color:"#203B2C"}}>{moneyBR(r.valor_total)}</div></div><div><span className="text-xs" style={{color:"#668071"}}>Cliente / contato</span><div className="font-semibold" style={{color:"#203B2C"}}>{cliente?.nome||"—"}</div><div className="text-xs" style={{color:"#668071"}}>{cliente?.telefone||"Telefone não cadastrado"}</div></div><div><span className="text-xs" style={{color:"#668071"}}>Previsão nascimento</span><div className="font-semibold" style={{color:"#203B2C"}}>{dateBR(r.previsao_nascimento)}</div></div></div>
        {r.observacoes&&<p className="mt-3 rounded-lg p-3 text-xs" style={{background:"#F5F8F5",color:"#52705D"}}>{r.observacoes}</p>}
        <h4 className="mt-4 text-xs font-bold uppercase tracking-wide" style={{color:"#496653"}}>Histórico de pagamentos</h4>{pays.length===0?<p className="mt-2 text-xs" style={{color:"#668071"}}>Nenhum pagamento registrado.</p>:<div className="mt-2 space-y-2">{pays.map(p=><div key={p.id} className="flex flex-wrap justify-between gap-2 rounded-lg px-3 py-2 text-xs" style={{background:"#F5F8F5",color:"#496653"}}><span>{dateBR(p.data_pagamento)} · {p.descricao||p.forma_pagamento||"Pagamento"}</span><strong>{moneyBR(p.valor)}</strong></div>)}</div>}
        {saldo>0&&r.status!=="cancelada"&&<div className="mt-4 rounded-xl p-3" style={{background:"#F5F8F5"}}><h4 className="mb-2 text-xs font-bold" style={{color:"#496653"}}>Registrar novo pagamento</h4><div className="grid gap-2 sm:grid-cols-[1fr_150px_1fr_auto]"><input type="number" min="0.01" max={saldo} step="0.01" placeholder="Valor recebido" value={pagamentoForm[r.id]?.valor||""} onChange={e=>setPagamentoForm(v=>({...v,[r.id]:{...v[r.id],valor:e.target.value}}))} className="min-h-10 rounded-lg border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/><input type="date" value={pagamentoForm[r.id]?.data||new Date().toISOString().slice(0,10)} onChange={e=>setPagamentoForm(v=>({...v,[r.id]:{...v[r.id],data:e.target.value}}))} className="min-h-10 rounded-lg border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/><input placeholder="Forma / observação" value={pagamentoForm[r.id]?.forma||""} onChange={e=>setPagamentoForm(v=>({...v,[r.id]:{...v[r.id],forma:e.target.value}}))} className="min-h-10 rounded-lg border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/><button disabled={saving} onClick={()=>adicionarPagamento(r)} className="rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50" style={{background:"#18764B",color:"#fff"}}>Registrar</button></div></div>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={()=>imprimirOrdem(r)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold" style={{borderColor:"#CFE0D3",color:"#18764B",background:"#F5FAF6"}}><Printer size={14}/> Imprimir ordem de reserva</button>{!["concluida","cancelada"].includes(r.status)&&r.ave_id&&r.cliente_id&&<button type="button" disabled={saving} onClick={()=>concluirReserva(r)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50" style={{background:"#18764B",color:"#fff"}}><CheckCircle2 size={14}/>{saving?"Concluindo...":"Concluir venda"}</button>}</div><div className="flex items-center gap-2"><div className="text-xs" style={{color:"#668071"}}>Situação da reserva</div><select value={r.status} onChange={e=>atualizarStatus(r,e.target.value)} className="min-h-9 rounded-lg border px-3 text-xs font-semibold" style={{borderColor:"#D8E5DB",color:"#496653"}}><option value="aguardando_nascimento">Aguardando nascimento</option><option value="aguardando_sinal">Aguardando sinal</option><option value="reservada">Reservada</option><option value="cancelada">Cancelada</option></select></div></div>
        </div>}
      </Card>})}</div>}
    <div className="flex justify-end"><button onClick={carregar} className="inline-flex items-center gap-2 text-xs font-semibold" style={{color:"#52705D"}}><RefreshCw size={14}/> Atualizar lista</button></div>
  </div>;
}
