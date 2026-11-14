import React, { useState } from "react";
import { Phone, Pencil, Save, Trash2, MessageCircle, Plus, Search, Users, Truck } from "lucide-react";

function normalizeTelefone(t) {
  return (t || "").replace(/\\D/g, "");
}

function historicoFornecedor(fornecedor, aves) {
  const porId = aves.filter((a) => a.origemTipo === "Comprada" && a.fornecedorId === fornecedor.id);
  let compras = porId;

  if (compras.length === 0) {
    const tel = normalizeTelefone(fornecedor.telefone);
    const nome = (fornecedor.nome || "").trim().toLowerCase();
    compras = aves.filter((a) => {
      if (a.origemTipo !== "Comprada" || a.fornecedorId) return false;
      if (tel) return normalizeTelefone(a.fornecedorTelefone) === tel;
      if (nome) return (a.fornecedorNome || "").trim().toLowerCase() === nome;
      return false;
    });
  }

  const totalAves = compras.length;
  const totalGasto = compras.reduce((s, a) => s + (parseFloat(a.valorCompra) || 0), 0);
  const ultimaCompra = compras.reduce((max, a) => ((a.dataCompra || "") > max ? a.dataCompra : max), "");
  return { compras: [...compras].sort((a, b) => (b.dataCompra || "").localeCompare(a.dataCompra || "")), totalAves, totalGasto, ultimaCompra };
}

function fornecedoresCandidatosDeCompras(aves, fornecedores) {
  const telsExistentes = new Set(fornecedores.map((f) => normalizeTelefone(f.telefone)).filter(Boolean));
  const nomesExistentes = new Set(fornecedores.map((f) => (f.nome || "").trim().toLowerCase()).filter(Boolean));

  const vistos = new Map();
  aves.forEach((a) => {
    if (a.origemTipo !== "Comprada") return;
    const nome = (a.fornecedorNome || "").trim();
    const tel = normalizeTelefone(a.fornecedorTelefone);
    if (!nome && !tel) return;
    const chave = tel || nome.toLowerCase();
    if (tel && telsExistentes.has(tel)) return;
    if (!tel && nomesExistentes.has(nome.toLowerCase())) return;
    if (!vistos.has(chave)) {
      vistos.set(chave, {
        nome: nome || "(sem nome)",
        telefone: a.fornecedorTelefone || "",
        endereco: a.fornecedorEndereco || "",
        observacoes: "Importado automaticamente de uma compra ja cadastrada.",
      });
    }
  });
  return Array.from(vistos.values());
}

function FornecedorCard({ f, historico, onOpen, onEdit, Card, money }) {
  return (
    <Card className="p-4 ui-sans">
      <div className="cursor-pointer" onClick={() => onOpen(f.id)}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-semibold" style={{ color: "#2B241C" }}>{f.nome}</div>
          {f.synced === false && <span className="text-[10px] font-semibold shrink-0" style={{ color: "#a6402b" }}>NAO SINCRONIZADO</span>}
        </div>
        {f.telefone && (
          <div className="text-xs flex items-center gap-1 mb-1" style={{ color: "#8a7a63" }}>
            <Phone size={11} /> {f.telefone}
          </div>
        )}
        <div className="flex gap-3 mt-2">
          <span className="text-xs ui-mono" style={{ color: "#556b3f" }}>{historico.totalAves} {historico.totalAves === 1 ? "venda" : "vendas"}</span>
          <span className="text-xs ui-mono" style={{ color: "#a6402b" }}>{money(historico.totalGasto)}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => onEdit(f)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "#e3d3b4", color: "#2B241C" }}>
          <Pencil size={12} /> Editar
        </button>
        <button onClick={() => onOpen(f.id)} className="text-xs px-2 py-1 rounded" style={{ background: "#f0e6d2", color: "#8a6f2e" }}>
          Ver historico
        </button>
      </div>
    </Card>
  );
}

function FornecedorForm({ inicial, onSave, onCancel, error, Card, Field, inputStyle }) {
  const [f, setF] = useState(inicial);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <Card className="p-4 sm:p-6 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field label="Nome"><input style={inputStyle} value={f.nome} onChange={set("nome")} placeholder="ex: Anderson (Barueri)" /></Field>
        <Field label="Telefone"><input style={inputStyle} value={f.telefone} onChange={set("telefone")} placeholder="ex: (11) 99999-9999" /></Field>
      </div>
      <div className="grid grid-cols-1 gap-4 mb-4">
        <Field label="Endereco"><input style={inputStyle} value={f.endereco} onChange={set("endereco")} placeholder="opcional" /></Field>
        <Field label="Observacoes"><input style={inputStyle} value={f.observacoes} onChange={set("observacoes")} placeholder="opcional" /></Field>
      </div>
      {error && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
      <div className="flex gap-3">
        <button onClick={() => onSave(f)} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          <Save size={15} /> Salvar
        </button>
        <button onClick={onCancel} className="ui-sans px-4 py-2 rounded-lg text-sm" style={{ background: "#e3d3b4", color: "#2B241C" }}>Cancelar</button>
      </div>
    </Card>
  );
}

function FornecedorDetalhe({ fornecedor, historico, onBack, onEdit, onDelete, Card, SummaryCard, money, whatsappUrl }) {
  return (
    <div>
      <button onClick={onBack} className="ui-sans text-xs mb-4 px-3 py-1.5 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>← Voltar pra lista</button>
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-xl font-bold ui-sans" style={{ color: "#2B241C" }}>{fornecedor.nome}</div>
            {fornecedor.telefone && <div className="text-sm flex items-center gap-1 mt-1" style={{ color: "#8a7a63" }}><Phone size={13} /> {fornecedor.telefone}</div>}
            {fornecedor.endereco && <div className="text-sm mt-1 ui-sans" style={{ color: "#8a7a63" }}>{fornecedor.endereco}</div>}
            {fornecedor.observacoes && <div className="text-sm mt-1 italic ui-sans" style={{ color: "#8a7a63" }}>{fornecedor.observacoes}</div>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => onEdit(fornecedor)} className="text-xs px-2 py-1 rounded ui-sans" style={{ background: "#e3d3b4", color: "#2B241C" }}>Editar</button>
            <button onClick={() => onDelete(fornecedor.id)} className="text-xs px-2 py-1 rounded flex items-center gap-1 ui-sans" style={{ background: "#f0dad4", color: "#a6402b" }}><Trash2 size={12} /> Remover</button>
          </div>
        </div>

        <div className="grid gap-3 mb-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <SummaryCard label="Total de aves compradas dele" value={historico.totalAves} />
          <SummaryCard label="Total gasto" value={money(historico.totalGasto)} />
          <SummaryCard label="Ultima compra" value={historico.ultimaCompra || "-"} />
        </div>
      </Card>

      <div className="ui-mono text-xs mb-3" style={{ color: "#173D29" }}>HISTORICO DE COMPRAS</div>
      {historico.compras.length === 0 ? (
        <Card className="p-6 text-center ui-sans" style={{ color: "#8a7a63" }}>
          Nenhuma compra encontrada com esse fornecedor ainda.
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {historico.compras.map((a) => (
            <Card key={a.id} className="p-3 flex items-center gap-3 ui-sans">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
                {a.foto ? <img src={a.foto} className="w-full h-full object-cover" alt="" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{a.nome} <span className="font-normal" style={{ color: "#8a7a63" }}>({a.especie})</span></div>
                <div className="text-xs" style={{ color: "#8a7a63" }}>{a.dataCompra || "sem data"}</div>
              </div>
              <div className="text-sm font-semibold" style={{ color: "#a6402b" }}>{money(a.valorCompra)}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FornecedoresTab({ fornecedores, aves, onSave, onDelete, onImportar, Card, Field, SectionTitle, SummaryCard, money, whatsappUrl, emptyFornecedor, inputStyle }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalheId, setDetalheId] = useState(null);
  const [formError, setFormError] = useState("");

  const candidatos = fornecedoresCandidatosDeCompras(aves, fornecedores);

  const filtrados = fornecedores.filter((f) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (f.nome || "").toLowerCase().includes(q) || (f.telefone || "").includes(q);
  });

  function salvar(fornecedor) {
    const result = onSave(fornecedor);
    if (result?.ok) {
      setShowForm(false);
      setEditando(null);
      setFormError("");
    } else {
      setFormError(result?.error || "Nao consegui salvar.");
    }
  }

  const fornecedorDetalhe = detalheId ? fornecedores.find((f) => f.id === detalheId) : null;
  if (fornecedorDetalhe) {
    const historico = historicoFornecedor(fornecedorDetalhe, aves);
    return (
      <div>
        <SectionTitle>Fornecedores</SectionTitle>
        <FornecedorDetalhe
          fornecedor={fornecedorDetalhe}
          historico={historico}
          onBack={() => setDetalheId(null)}
          onEdit={(f) => { setDetalheId(null); setEditando(f); setShowForm(true); setFormError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          onDelete={(id) => { onDelete(id); setDetalheId(null); }}
          Card={Card} SummaryCard={SummaryCard} money={money} whatsappUrl={whatsappUrl}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <SectionTitle>Fornecedores</SectionTitle>
        {!showForm && (
          <button
            onClick={() => { setEditando(emptyFornecedor()); setShowForm(true); setFormError(""); }}
            className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "#C69A2E", color: "#2B1D14" }}
          >
            <Plus size={16} /> Novo fornecedor
          </button>
        )}
      </div>

      {showForm && (
        <FornecedorForm
          inicial={editando || emptyFornecedor()}
          onSave={salvar}
          onCancel={() => { setShowForm(false); setEditando(null); setFormError(""); }}
          error={formError}
          Card={Card} Field={Field} inputStyle={inputStyle}
        />
      )}

      {candidatos.length > 0 && !showForm && (
        <Card className="p-4 mb-6">
          <div className="ui-sans text-sm mb-3" style={{ color: "#2B241C" }}>
            Encontramos <strong>{candidatos.length}</strong> {candidatos.length === 1 ? "vendedor" : "vendedores"} em compras ja cadastradas que ainda {candidatos.length === 1 ? "nao esta" : "nao estao"} na lista de fornecedores:
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {candidatos.map((f, i) => (
              <span key={i} className="ui-mono text-xs px-2 py-1 rounded" style={{ background: "#f0e6d2", color: "#8a6f2e" }}>
                {f.nome}{f.telefone ? ` - ${f.telefone}` : ""}
              </span>
            ))}
          </div>
          <button
            onClick={() => onImportar(candidatos)}
            className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "#556b3f", color: "#F1E6D2" }}
          >
            <Truck size={15} /> Importar {candidatos.length === 1 ? "esse vendedor" : "todos como fornecedores"}
          </button>
        </Card>
      )}

      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8a7a63" }} />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="ui-sans w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", color: "#2B241C" }}
        />
      </div>

      {filtrados.length === 0 ? (
        <Card className="p-8 text-center ui-sans" style={{ color: "#8a7a63" }}>
          Nenhum fornecedor cadastrado ainda. Cadastre pelo nome/telefone de quem ja te vendeu (ou vai vender) uma ave.
        </Card>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {filtrados.map((f) => (
            <FornecedorCard
              key={f.id}
              f={f}
              historico={historicoFornecedor(f, aves)}
              onOpen={setDetalheId}
              onEdit={(forn) => { setEditando(forn); setShowForm(true); setFormError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              Card={Card} money={money}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pos-venda (Fase 4)
// ---------------------------------------------------------------------------

const POSVENDA_TONS = {
  "Venda realizada": "default",
  "Entregue": "gold",
  "Primeiro contato": "gold",
  "Acompanhamento": "gold",
  "Cliente satisfeito": "good",
};

