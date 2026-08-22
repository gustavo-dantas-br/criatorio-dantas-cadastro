import React, { useState, useEffect, useRef, useCallback } from "react";
import { Bird, Plus, Search, GitBranch, Tag, Upload, Trash2, X, Loader2, Save, Download, Feather, DollarSign, LogOut } from "lucide-react";
import { supabase } from "./supabaseClient";
import { listRows, saveRow, deleteRow } from "./lib/db";
import AuthPage from "./components/AuthPage";

// ---------------------------------------------------------------------------
// Design tokens (see inline <style> for fonts)
// bg base:      #2B1D14  (walnut, header/sidebar)
// panel:        #FAF3E6  (parchment card)
// panel-alt:    #F1E6D2
// accent gold:  #C69A2E
// accent rust:  #A6402B
// accent sage:  #6E7B57
// ink:          #2B241C
// ---------------------------------------------------------------------------

const ESPECIES = ["Ring Neck", "Calopsita", "Outra"];
const SEXOS = ["Macho", "Femea", "Indefinido"];
const STATUS_AVE = ["No plantel", "A venda", "Reservada", "Vendida", "Falecida"];
const ORIGEM_TIPOS = ["Nasceu no plantel", "Comprada"];
const DESPESA_TIPOS = ["Racao", "Veterinario/Medicamento", "Gaiola/Equipamento", "Anilha", "Outro"];

function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : "ave-" + Date.now() + "-" + Math.random().toString(16).slice(2));
}

function emptyAve() {
  return {
    id: null,
    nome: "",
    especie: "Ring Neck",
    sexo: "Indefinido",
    corMutacao: "",
    corAnilha: "",
    anilha: "",
    nascimento: "",
    origem: "",
    criador: "Dantas",
    ctf: "",
    sexado: false,
    laudoNota: "",
    paiId: "",
    paiExterno: "",
    maeId: "",
    maeExterno: "",
    parceiroId: "",
    casalLabel: "",
    foto: "",
    status: "No plantel",
    ninhadasGeradas: "",
    garantiaDias: "",
    origemTipo: "Nasceu no plantel",
    fornecedorNome: "",
    fornecedorTelefone: "",
    fornecedorEndereco: "",
    valorCompra: "",
    dataCompra: "",
    compradorNome: "",
    compradorTelefone: "",
    compradorEndereco: "",
    valorVenda: "",
    dataVenda: "",
  };
}

function emptyDespesa() {
  return {
    id: null,
    tipo: "Racao",
    descricao: "",
    valor: "",
    data: "",
  };
}

// ---------- Photo compression ----------
function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 480;
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.72;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        // se ainda ficar pesada, comprime mais um pouco
        while (dataUrl.length > 900000 && quality > 0.35) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Plaque canvas drawing ----------
function drawWood(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#8a5a34");
  grad.addColorStop(0.5, "#6b4225");
  grad.addColorStop(1, "#4a2c18");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(30,16,6,0.55)";
  ctx.lineWidth = 2;
  const plankH = h / 5;
  for (let y = 0; y < h; y += plankH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  // vignette
  const rg = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.2, w * 0.5, h * 0.5, w * 0.75);
  rg.addColorStop(0, "rgba(0,0,0,0)");
  rg.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);
}

function drawRibbon(ctx, x, y, w, h, text, fill, outline, textColor) {
  const notch = h * 0.32;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - notch, y + h / 2);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + notch, y + h / 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.font = "bold 30px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(text).width;
  ctx.fillText(text, x + (w - tw) / 2, y + h / 2 + 2);
}

function fieldBox(ctx, x, y, w, h, value, big) {
  ctx.fillStyle = "#faf8f0";
  ctx.strokeStyle = "#1e1006";
  ctx.lineWidth = 2;
  roundRectPath(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1c1712";
  ctx.font = (big ? "bold 42px" : "bold 30px") + " 'Fraunces', serif";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(value).width;
  ctx.fillText(value, x + (w - tw) / 2, y + h / 2 + 2);
}

function label(ctx, x, y, text) {
  ctx.fillStyle = "#e8c46a";
  ctx.font = "bold 22px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPlaque(canvas, ave, photoImg) {
  const W = 1888, H = 1180;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  drawWood(ctx, W, H);

  const photoW = Math.round(W * 0.37);

  // jagged clip path for the photo
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  const seg = 6;
  for (let i = 0; i <= seg; i++) {
    const y = (H * i) / seg;
    const x = photoW - 14 - (i % 2 === 0 ? 10 : -5);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.clip();
  if (photoImg) {
    const scale = Math.max(photoW / photoImg.width, H / photoImg.height);
    const dw = photoImg.width * scale;
    const dh = photoImg.height * scale;
    ctx.drawImage(photoImg, (photoW - dw) / 2, (H * 0.32) - dh * 0.32, dw, dh);
  } else {
    ctx.fillStyle = "#3a2a1c";
    ctx.fillRect(0, 0, photoW, H);
    ctx.fillStyle = "#8a7a63";
    ctx.font = "24px 'Fraunces', serif";
    ctx.fillText("sem foto", 20, H / 2);
  }
  ctx.restore();

  const PX = photoW + 18;
  const PW = W - PX - 14;
  const half = (PW - 14) / 2;
  let y = 22;
  const rowGap = 34;

  label(ctx, PX, y, "NOME");
  fieldBox(ctx, PX, y + 30, PW, 78, ave.nome || "-", true);
  y += 30 + 78 + rowGap;

  label(ctx, PX, y, "SEXO");
  label(ctx, PX + half + 14, y, "ANILHA");
  fieldBox(ctx, PX, y + 30, half, 66, ave.sexo || "-");
  fieldBox(ctx, PX + half + 14, y + 30, half, 66, ave.anilha || "-");
  y += 30 + 66 + rowGap;

  label(ctx, PX, y, "NASCIMENTO");
  label(ctx, PX + half + 14, y, "CASAL / SEXAGEM");
  fieldBox(ctx, PX, y + 30, half, 66, ave.nascimento || "-");
  const casalSex = (ave.casalLabel ? ave.casalLabel + " - " : "") + (ave.sexado ? "SEXADO" : "S/ SEXAGEM");
  fieldBox(ctx, PX + half + 14, y + 30, half, 66, casalSex);
  y += 30 + 66 + rowGap;

  label(ctx, PX, y, "CRIADOR");
  fieldBox(ctx, PX, y + 30, PW, 66, ave.criador || "-");

  const ribbonH = 46;
  const rx = 14, ry = H - ribbonH - 12;
  drawRibbon(ctx, rx, ry, 220, ribbonH, (ave.especie || "AVE").toUpperCase(), "#a6402b", "#6e2417", "#f7dfb0");
  if (ave.corMutacao) {
    drawRibbon(ctx, rx + 220 + 14, ry, 200, ribbonH, ave.corMutacao.toUpperCase(), "#d2a014", "#826008", "#3c2300");
  }

  ctx.fillStyle = "rgba(235,220,190,0.9)";
  ctx.font = "italic 18px 'Fraunces', serif";
  const footer = `Criatorio ${ave.criador || "-"}  \u2022  CTF: ${ave.ctf || "-"}`;
  const fw = ctx.measureText(footer).width;
  ctx.fillText(footer, W - fw - 16, H - 20);
}

// ---------------------------------------------------------------------------

function AppInner({ user, onLogout }) {
  const [aves, setAves] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("lista");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyAve());
  const [saving, setSaving] = useState(false);
  const [placaId, setPlacaId] = useState("");
  const [arvoreId, setArvoreId] = useState("");
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  const loadAves = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await listRows("aves", user.id);
      setAves(items.map((a) => ({ ...a, synced: true })).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    } catch (e) {
      setError("Nao foi possivel carregar o cadastro. Tenta recarregar. (" + (e?.message || "") + ")");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const loadDespesas = useCallback(async () => {
    try {
      const items = await listRows("despesas", user.id);
      setDespesas(items.map((d) => ({ ...d, synced: true })).sort((a, b) => (a.data || "").localeCompare(b.data || "")));
    } catch {
      // silencioso - despesas nao sao criticas pro cadastro funcionar
    }
  }, [user.id]);

  useEffect(() => {
    loadAves();
    loadDespesas();
  }, [loadAves, loadDespesas]);

  function startNew() {
    setForm(emptyAve());
    setTab("form");
  }

  function startEdit(ave) {
    setForm({ ...emptyAve(), ...ave });
    setTab("form");
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      setError("Da um nome pra ave antes de salvar.");
      return;
    }
    setSaving(true);
    setError("");
    const id = form.id || uid();
    const toSave = { ...form, id };

    // 1) Atualiza a tela na hora (otimista)
    setAves((prev) => {
      const others = prev.filter((a) => a.id !== id);
      return [...others, { ...toSave, synced: false }].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    });
    setTab("lista");

    // 2) Salva de verdade no banco (Supabase)
    try {
      await saveRow("aves", user.id, toSave);
      setAves((prev) => prev.map((a) => (a.id === id ? { ...a, synced: true } : a)));
    } catch (e) {
      setError(
        `"${form.nome}" ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Use o botao de sincronizar no card dela pra tentar de novo, ou baixe o backup."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSync(ave) {
    try {
      await saveRow("aves", user.id, ave);
      setAves((prev) => prev.map((a) => (a.id === ave.id ? { ...a, synced: true } : a)));
      setError("");
    } catch (e) {
      setError(`Ainda nao consegui sincronizar "${ave.nome}" (${e?.message || "erro desconhecido"}).`);
    }
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(aves, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_criatorio_dantas_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!Array.isArray(imported)) throw new Error("arquivo invalido");
      setAves((prev) => {
        const byId = new Map(prev.map((a) => [a.id, a]));
        imported.forEach((a) => { if (a.id) byId.set(a.id, { ...a, synced: false }); });
        return Array.from(byId.values()).sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
      });
      setError("Backup importado neste aparelho. Sincronize os cards marcados como pendentes quando puder.");
    } catch {
      setError("Nao consegui ler esse arquivo de backup.");
    } finally {
      e.target.value = "";
    }
  }

  async function handleSaveDespesa(despesa) {
    const id = despesa.id || uid();
    const toSave = { ...despesa, id };
    setDespesas((prev) => {
      const others = prev.filter((d) => d.id !== id);
      return [...others, { ...toSave, synced: false }].sort((a, b) => (a.data || "").localeCompare(b.data || ""));
    });
    try {
      await saveRow("despesas", user.id, toSave);
      setDespesas((prev) => prev.map((d) => (d.id === id ? { ...d, synced: true } : d)));
    } catch (e) {
      setError(`Despesa ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}).`);
    }
  }

  async function handleDeleteDespesa(id) {
    setDespesas((prev) => prev.filter((d) => d.id !== id));
    try {
      await deleteRow("despesas", id);
    } catch {
      // ja removida localmente
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remover essa ave do cadastro?")) return;
    setAves((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteRow("aves", id);
    } catch {
      setError("Removida da lista, mas pode ainda existir no banco (falha de conexao). Sem problema, ela nao vai reaparecer aqui.");
    }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressPhoto(file);
      setForm((f) => ({ ...f, foto: dataUrl }));
    } catch {
      setError("Nao consegui processar essa foto.");
    }
  }

  // ---- Placa tab: redraw canvas on selection ----
  useEffect(() => {
    if (tab !== "placa" || !placaId) return;
    const ave = aves.find((a) => a.id === placaId);
    if (!ave || !canvasRef.current) return;
    if (ave.foto) {
      const img = new Image();
      img.onload = () => drawPlaque(canvasRef.current, ave, img);
      img.src = ave.foto;
    } else {
      drawPlaque(canvasRef.current, ave, null);
    }
  }, [tab, placaId, aves]);

  function downloadPlaca() {
    if (!canvasRef.current) return;
    const ave = aves.find((a) => a.id === placaId);
    const link = document.createElement("a");
    link.download = `placa_${(ave?.nome || "ave").replace(/\s+/g, "_")}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  const filtered = aves.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (a.nome || "").toLowerCase().includes(q) ||
      (a.anilha || "").toLowerCase().includes(q) ||
      (a.especie || "").toLowerCase().includes(q)
    );
  });

  const machoOptions = aves.filter((a) => a.sexo === "Macho");
  const femeaOptions = aves.filter((a) => a.sexo === "Femea");
  const parceiroOptions = aves.filter((a) => a.id !== form.id && (form.sexo === "Macho" ? a.sexo === "Femea" : form.sexo === "Femea" ? a.sexo === "Macho" : true));

  const arvoreAve = aves.find((a) => a.id === arvoreId);
  const filhos = arvoreAve ? aves.filter((a) => a.paiId === arvoreAve.id || a.maeId === arvoreAve.id) : [];
  const pai = arvoreAve?.paiId ? aves.find((a) => a.id === arvoreAve.paiId) : null;
  const mae = arvoreAve?.maeId ? aves.find((a) => a.id === arvoreAve.maeId) : null;
  const parceiro = arvoreAve?.parceiroId ? aves.find((a) => a.id === arvoreAve.parceiroId) : null;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row" style={{ background: "#2B1D14", fontFamily: "'Fraunces', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ui-sans { font-family: 'Inter', sans-serif; }
        .ui-mono { font-family: 'IBM Plex Mono', monospace; }
        ::selection { background: #C69A2E; color: #2B1D14; }
      `}</style>

      {/* Sidebar / topbar */}
      <aside
        className="w-full md:w-60 shrink-0 flex flex-row md:flex-col items-center md:items-stretch py-3 md:py-6 px-3 md:px-4 gap-2 md:gap-0"
        style={{ background: "#241609", borderBottom: "1px solid #4a2c18", borderRight: "1px solid #4a2c18" }}
      >
        <div className="flex items-center gap-2 mb-0 md:mb-8 px-1 shrink-0">
          <Feather size={20} color="#C69A2E" />
          <div className="hidden sm:block">
            <div style={{ color: "#F1E6D2", fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>Criatorio Dantas</div>
            <div className="ui-mono" style={{ color: "#8a6f4a", fontSize: 10, letterSpacing: 1 }}>CADASTRO DE AVES</div>
          </div>
        </div>

        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible flex-1 md:flex-none">
          {[
            { id: "lista", label: "Aves", icon: Bird },
            { id: "form", label: "Cadastrar", icon: Plus },
            { id: "arvore", label: "Arvore", icon: GitBranch },
            { id: "placa", label: "Placa", icon: Tag },
            { id: "financeiro", label: "Financeiro", icon: DollarSign },
          ].map(({ id, label: lbl, icon: Icon }) => (
            <button
              key={id}
              onClick={() => (id === "form" ? startNew() : setTab(id))}
              className="ui-sans flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm text-left transition-colors shrink-0"
              style={{
                background: tab === id ? "#3a2314" : "transparent",
                color: tab === id ? "#F1E6D2" : "#b09a78",
                fontWeight: tab === id ? 600 : 500,
              }}
            >
              <Icon size={16} />
              {lbl}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex mt-auto flex-col gap-2">
          <div className="ui-mono text-[11px]" style={{ color: "#6b5638" }}>
            {aves.length} {aves.length === 1 ? "ave cadastrada" : "aves cadastradas"}
          </div>
          <div className="ui-mono text-[10px] truncate" style={{ color: "#5a4a30" }}>{user.email}</div>
          <button
            onClick={onLogout}
            className="ui-sans flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg self-start"
            style={{ color: "#b09a78" }}
          >
            <LogOut size={13} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full min-w-0" style={{ minHeight: "60vh" }}>
        {error && (
          <div className="ui-sans mb-4 px-4 py-2.5 rounded-lg flex items-center justify-between" style={{ background: "#4a2018", color: "#f2c9c0", border: "1px solid #7a3226" }}>
            <span className="text-sm">{error}</span>
            <button onClick={() => setError("")}><X size={16} /></button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 ui-sans" style={{ color: "#F1E6D2" }}>
            <Loader2 className="animate-spin" size={18} /> Carregando cadastro...
          </div>
        ) : (
          <>
            {tab === "lista" && (
              <ListaTab
                aves={filtered}
                search={search}
                setSearch={setSearch}
                onEdit={startEdit}
                onDelete={handleDelete}
                onNew={startNew}
                onSync={handleSync}
                onExport={handleExport}
                onImport={handleImport}
              />
            )}

            {tab === "form" && (
              <FormTab
                form={form}
                setForm={setForm}
                onSave={handleSave}
                onPhoto={handlePhoto}
                saving={saving}
                machoOptions={machoOptions}
                femeaOptions={femeaOptions}
                parceiroOptions={parceiroOptions}
                onCancel={() => setTab("lista")}
              />
            )}

            {tab === "arvore" && (
              <ArvoreTab
                aves={aves}
                arvoreId={arvoreId}
                setArvoreId={setArvoreId}
                arvoreAve={arvoreAve}
                pai={pai}
                mae={mae}
                parceiro={parceiro}
                filhos={filhos}
              />
            )}

            {tab === "placa" && (
              <PlacaTab
                aves={aves}
                placaId={placaId}
                setPlacaId={setPlacaId}
                canvasRef={canvasRef}
                onDownload={downloadPlaca}
              />
            )}

            {tab === "financeiro" && (
              <FinanceiroTab
                aves={aves}
                despesas={despesas}
                onSaveDespesa={handleSaveDespesa}
                onDeleteDespesa={handleDeleteDespesa}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="mb-5" style={{ color: "#F1E6D2", fontSize: 24, fontWeight: 700 }}>
      {children}
    </h2>
  );
}

function ListaTab({ aves, search, setSearch, onEdit, onDelete, onNew, onSync, onExport, onImport }) {
  const pendentes = aves.filter((a) => a.synced === false).length;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <SectionTitle>Minhas Aves</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onNew}
            className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shrink-0"
            style={{ background: "#C69A2E", color: "#2B1D14" }}
          >
            <Plus size={16} /> Nova ave
          </button>
          <button
            onClick={onExport}
            className="ui-sans flex items-center gap-2 px-3 py-2 rounded-lg text-sm shrink-0"
            style={{ background: "#e3d3b4", color: "#2B241C" }}
          >
            <Download size={15} /> Backup
          </button>
          <label
            className="ui-sans flex items-center gap-2 px-3 py-2 rounded-lg text-sm shrink-0 cursor-pointer"
            style={{ background: "#e3d3b4", color: "#2B241C" }}
          >
            <Upload size={15} /> Importar
            <input type="file" accept="application/json" className="hidden" onChange={onImport} />
          </label>
        </div>
      </div>

      {pendentes > 0 && (
        <div className="ui-sans mb-4 px-4 py-2 rounded-lg text-sm" style={{ background: "#f0e6d2", color: "#8a6f2e", border: "1px solid #d6c39a" }}>
          {pendentes} {pendentes === 1 ? "ave salva so neste aparelho" : "aves salvas so neste aparelho"} (nao sincronizou na nuvem ainda). Use "Sincronizar" no card, ou baixe o backup pra guardar num lugar seguro.
        </div>
      )}

      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8a7a63" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, anilha ou especie..."
          className="ui-sans w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", color: "#2B241C" }}
        />
      </div>

      {aves.length === 0 ? (
        <Card className="p-8 text-center ui-sans" style={{ color: "#8a7a63" }}>
          Nenhuma ave encontrada. Cadastre a primeira pra comecar a preencher a arvore genealogica e gerar placas.
        </Card>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {aves.map((a) => (
            <Card key={a.id} className="overflow-hidden flex">
              <div className="w-24 shrink-0" style={{ background: "#3a2a1c" }}>
                {a.foto ? (
                  <img src={a.foto} alt={a.nome} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Bird size={22} color="#8a7a63" />
                  </div>
                )}
              </div>
              <div className="flex-1 p-3 ui-sans min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold truncate" style={{ color: "#2B241C" }}>{a.nome}</div>
                  <span
                    className="ui-mono text-[10px] px-1.5 py-0.5 rounded shrink-0"
                    style={{ background: a.sexado ? "#e4ead9" : "#f0e6d2", color: a.sexado ? "#556b3f" : "#8a6f2e" }}
                  >
                    {a.sexado ? "SEXADO" : "S/ SEXAGEM"}
                  </span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#7a6a52" }}>{a.especie} - {a.sexo}</div>
                <div className="text-xs" style={{ color: "#7a6a52" }}>{a.corMutacao || "sem mutacao"}</div>
                <div className="ui-mono text-[11px] mt-1" style={{ color: "#a6402b" }}>{a.anilha || "sem anilha"}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded ui-mono" style={{ background: "#e3d3b4", color: "#5a4a30" }}>
                    {a.status || "No plantel"}
                  </span>
                  {a.status === "Vendida" && a.valorVenda && (
                    <span className="text-[10px] ui-mono" style={{ color: "#556b3f" }}>R$ {a.valorVenda}</span>
                  )}
                </div>
                {a.synced === false && (
                  <div className="text-[10px] mt-1 font-semibold" style={{ color: "#a6402b" }}>NAO SINCRONIZADO</div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button onClick={() => onEdit(a)} className="text-xs px-2 py-1 rounded" style={{ background: "#e3d3b4", color: "#2B241C" }}>Editar</button>
                  <button onClick={() => onDelete(a.id)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "#f0dad4", color: "#a6402b" }}>
                    <Trash2 size={12} /> Remover
                  </button>
                  {a.synced === false && (
                    <button onClick={() => onSync(a)} className="text-xs px-2 py-1 rounded" style={{ background: "#e4ead9", color: "#556b3f" }}>
                      Sincronizar
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label: lbl, children }) {
  return (
    <label className="flex flex-col gap-1.5 ui-sans">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8a7a63" }}>{lbl}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  background: "#fff",
  border: "1px solid #e3d3b4",
  color: "#2B241C",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 14,
  outline: "none",
};

function FormTab({ form, setForm, onSave, onPhoto, saving, machoOptions, femeaOptions, parceiroOptions, onCancel }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.type === "checkbox" ? e.target.checked : e.target.value }));

  return (
    <div className="max-w-3xl">
      <SectionTitle>{form.id ? `Editando ${form.nome || "ave"}` : "Nova ave"}</SectionTitle>
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-lg overflow-hidden flex items-center justify-center relative mx-auto sm:mx-0" style={{ background: "#f1e6d2", border: "1px dashed #d6c39a" }}>
            {form.foto ? <img src={form.foto} className="w-full h-full object-cover" alt="" /> : <Bird size={28} color="#b09a78" />}
            <label className="absolute bottom-1 right-1 p-1.5 rounded-full cursor-pointer" style={{ background: "#C69A2E" }}>
              <Upload size={13} color="#2B1D14" />
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
            {form.foto && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, foto: "" }))}
                className="absolute top-1 right-1 p-1 rounded-full"
                style={{ background: "#A6402B" }}
                title="Remover foto"
              >
                <X size={12} color="#fff" />
              </button>
            )}
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome">
              <input style={inputStyle} value={form.nome} onChange={set("nome")} placeholder="ex: Princesa" />
            </Field>
            <Field label="Especie">
              <select style={inputStyle} value={form.especie} onChange={set("especie")}>
                {ESPECIES.map((e) => <option key={e}>{e}</option>)}
              </select>
            </Field>
            <Field label="Sexo">
              <select style={inputStyle} value={form.sexo} onChange={set("sexo")}>
                {SEXOS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Mutacao / Cor">
              <input style={inputStyle} value={form.corMutacao} onChange={set("corMutacao")} placeholder="ex: Cremina" />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Numero da anilha">
            <input style={inputStyle} value={form.anilha} onChange={set("anilha")} placeholder="ex: FOB 0080" />
          </Field>
          <Field label="Cor da anilha">
            <input style={inputStyle} value={form.corAnilha} onChange={set("corAnilha")} placeholder="ex: azul 2024" />
          </Field>
          <Field label="Nascimento">
            <input style={inputStyle} value={form.nascimento} onChange={set("nascimento")} placeholder="ex: Ago/2024" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="De onde veio (origem)">
            <input style={inputStyle} value={form.origem} onChange={set("origem")} placeholder="ex: Nascido no criatorio / comprado de..." />
          </Field>
          <Field label="Criador">
            <input style={inputStyle} value={form.criador} onChange={set("criador")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field label="CTF">
            <input style={inputStyle} value={form.ctf} onChange={set("ctf")} placeholder="opcional" />
          </Field>
          <Field label="Sexagem">
            <div className="flex items-center gap-2 h-full pt-1.5">
              <input type="checkbox" checked={form.sexado} onChange={set("sexado")} />
              <span className="text-sm ui-sans" style={{ color: "#2B241C" }}>Ja tem laudo de sexagem</span>
            </div>
          </Field>
          <Field label="Nota do laudo">
            <input style={inputStyle} value={form.laudoNota} onChange={set("laudoNota")} placeholder="opcional" />
          </Field>
        </div>

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>STATUS E PLANTEL</div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={set("status")}>
              {STATUS_AVE.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Ninhadas ja geradas (se reprodutora)">
            <input style={inputStyle} type="number" min="0" value={form.ninhadasGeradas} onChange={set("ninhadasGeradas")} placeholder="0" />
          </Field>
          <Field label="Garantia de saude (dias)">
            <input style={inputStyle} type="number" min="0" value={form.garantiaDias} onChange={set("garantiaDias")} placeholder="ex: 7" />
          </Field>
        </div>

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>AQUISICAO (COMPRA)</div>

        <Field label="Como essa ave chegou no plantel">
          <select style={{ ...inputStyle, maxWidth: 280 }} value={form.origemTipo} onChange={set("origemTipo")}>
            {ORIGEM_TIPOS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>

        {form.origemTipo === "Comprada" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Field label="Nome de quem vendeu"><input style={inputStyle} value={form.fornecedorNome} onChange={set("fornecedorNome")} /></Field>
            <Field label="Telefone do vendedor"><input style={inputStyle} value={form.fornecedorTelefone} onChange={set("fornecedorTelefone")} /></Field>
            <Field label="Endereco do vendedor"><input style={inputStyle} value={form.fornecedorEndereco} onChange={set("fornecedorEndereco")} /></Field>
            <Field label="Valor pago (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valorCompra} onChange={set("valorCompra")} /></Field>
            <Field label="Data da compra"><input style={inputStyle} type="date" value={form.dataCompra} onChange={set("dataCompra")} /></Field>
          </div>
        )}

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>VENDA</div>

        {form.status === "Vendida" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome do comprador"><input style={inputStyle} value={form.compradorNome} onChange={set("compradorNome")} /></Field>
            <Field label="Telefone do comprador"><input style={inputStyle} value={form.compradorTelefone} onChange={set("compradorTelefone")} /></Field>
            <Field label="Endereco do comprador"><input style={inputStyle} value={form.compradorEndereco} onChange={set("compradorEndereco")} /></Field>
            <Field label="Valor vendido (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valorVenda} onChange={set("valorVenda")} /></Field>
            <Field label="Data da venda"><input style={inputStyle} type="date" value={form.dataVenda} onChange={set("dataVenda")} /></Field>
          </div>
        ) : (
          <div className="text-xs ui-sans" style={{ color: "#8a7a63" }}>Muda o status pra "Vendida" acima pra preencher os dados do comprador.</div>
        )}

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>GENEALOGIA E CASAL</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Pai (se estiver cadastrado)">
            <select style={inputStyle} value={form.paiId} onChange={set("paiId")}>
              <option value="">-- nenhum --</option>
              {machoOptions.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <Field label="Pai (se nao estiver no sistema)">
            <input style={inputStyle} value={form.paiExterno} onChange={set("paiExterno")} placeholder="ex: desconhecido / de outro criador" />
          </Field>
          <Field label="Mae (se estiver cadastrada)">
            <select style={inputStyle} value={form.maeId} onChange={set("maeId")}>
              <option value="">-- nenhuma --</option>
              {femeaOptions.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <Field label="Mae (se nao estiver no sistema)">
            <input style={inputStyle} value={form.maeExterno} onChange={set("maeExterno")} placeholder="ex: emprestada do Anderson" />
          </Field>
          <Field label="Parceiro(a) / casal">
            <select style={inputStyle} value={form.parceiroId} onChange={set("parceiroId")}>
              <option value="">-- nenhum --</option>
              {parceiroOptions.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <Field label="Identificacao do casal">
            <input style={inputStyle} value={form.casalLabel} onChange={set("casalLabel")} placeholder="ex: Casal 04" />
          </Field>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onSave}
            disabled={saving}
            className="ui-sans flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "#C69A2E", color: "#2B1D14" }}
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Salvar
          </button>
          <button onClick={onCancel} className="ui-sans px-5 py-2.5 rounded-lg text-sm" style={{ background: "#e3d3b4", color: "#2B241C" }}>
            Cancelar
          </button>
        </div>
      </Card>
    </div>
  );
}

function TreeCard({ ave, tone = "default" }) {
  if (!ave) return null;
  return (
    <div className="rounded-lg px-4 py-2.5 ui-sans text-center" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", minWidth: 140 }}>
      <div className="font-semibold text-sm" style={{ color: "#2B241C" }}>{ave.nome}</div>
      <div className="text-[11px]" style={{ color: "#8a7a63" }}>{ave.especie} - {ave.sexo}</div>
    </div>
  );
}

function ArvoreTab({ aves, arvoreId, setArvoreId, arvoreAve, pai, mae, parceiro, filhos }) {
  return (
    <div>
      <SectionTitle>Arvore Genealogica</SectionTitle>
      <Field label="Escolha a ave">
        <select
          style={{ ...inputStyle, maxWidth: 320 }}
          value={arvoreId}
          onChange={(e) => setArvoreId(e.target.value)}
        >
          <option value="">-- selecione --</option>
          {aves.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
      </Field>

      {arvoreAve && (
        <Card className="p-8 mt-6">
          <div className="flex flex-col items-center gap-6 ui-sans">
            <div className="ui-mono text-xs" style={{ color: "#8a7a63" }}>PAIS</div>
            <div className="flex gap-4">
              <TreeCard ave={pai} />
              {!pai && arvoreAve.paiExterno && <TreeCard ave={{ nome: arvoreAve.paiExterno, especie: "externo", sexo: "Macho" }} />}
              <TreeCard ave={mae} />
              {!mae && arvoreAve.maeExterno && <TreeCard ave={{ nome: arvoreAve.maeExterno, especie: "externo", sexo: "Femea" }} />}
            </div>

            <div className="h-6 w-px" style={{ background: "#e3d3b4" }} />

            <div className="flex gap-4 items-center">
              <div className="rounded-lg px-5 py-3 text-center" style={{ background: "#C69A2E", color: "#2B1D14" }}>
                <div className="font-bold">{arvoreAve.nome}</div>
                <div className="text-[11px]">{arvoreAve.especie} - {arvoreAve.sexo}</div>
              </div>
              {parceiro && (
                <>
                  <span className="text-xs" style={{ color: "#8a7a63" }}>x</span>
                  <TreeCard ave={parceiro} />
                </>
              )}
            </div>

            {filhos.length > 0 && (
              <>
                <div className="h-6 w-px" style={{ background: "#e3d3b4" }} />
                <div className="ui-mono text-xs" style={{ color: "#8a7a63" }}>FILHOS ({filhos.length})</div>
                <div className="flex flex-wrap gap-3 justify-center">
                  {filhos.map((f) => <TreeCard key={f.id} ave={f} />)}
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function money(n) {
  const v = parseFloat(n);
  if (isNaN(v)) return "R$ 0,00";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

function FinanceiroTab({ aves, despesas, onSaveDespesa, onDeleteDespesa }) {
  const [novaDespesa, setNovaDespesa] = useState(emptyDespesa());

  const totalCompras = aves.reduce((s, a) => s + (a.origemTipo === "Comprada" ? parseFloat(a.valorCompra) || 0 : 0), 0);
  const totalVendas = aves.reduce((s, a) => s + (a.status === "Vendida" ? parseFloat(a.valorVenda) || 0 : 0), 0);
  const totalDespesas = despesas.reduce((s, d) => s + (parseFloat(d.valor) || 0), 0);
  const totalInvestido = totalCompras + totalDespesas;
  const lucro = totalVendas - totalInvestido;
  const avesVendidas = aves.filter((a) => a.status === "Vendida").length;

  function addDespesa() {
    if (!novaDespesa.descricao.trim() || !novaDespesa.valor) return;
    onSaveDespesa(novaDespesa);
    setNovaDespesa(emptyDespesa());
  }

  return (
    <div>
      <SectionTitle>Financeiro</SectionTitle>

      <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <SummaryCard label="Gasto com compras de aves" value={money(totalCompras)} />
        <SummaryCard label="Gasto com despesas (racao, vet...)" value={money(totalDespesas)} />
        <SummaryCard label="Total investido" value={money(totalInvestido)} tone="bad" />
        <SummaryCard label={`Total vendido (${avesVendidas} aves)`} value={money(totalVendas)} tone="good" />
        <SummaryCard label={lucro >= 0 ? "Lucro" : "Prejuizo"} value={money(Math.abs(lucro))} tone={lucro >= 0 ? "good" : "bad"} />
      </div>

      <div className="ui-mono text-xs mb-3" style={{ color: "#F1E6D2" }}>DESPESAS DO PLANTEL (racao, veterinario, equipamentos...)</div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <Field label="Tipo">
            <select style={inputStyle} value={novaDespesa.tipo} onChange={(e) => setNovaDespesa((d) => ({ ...d, tipo: e.target.value }))}>
              {DESPESA_TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
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
        <button
          onClick={addDespesa}
          className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold mt-3"
          style={{ background: "#C69A2E", color: "#2B1D14" }}
        >
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
                <button onClick={() => onDeleteDespesa(d.id)} className="p-1.5 rounded" style={{ background: "#f0dad4" }}>
                  <Trash2 size={13} color="#a6402b" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
function PlacaTab({ aves, placaId, setPlacaId, canvasRef, onDownload }) {
  return (
    <div>
      <SectionTitle>Gerar Placa</SectionTitle>
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <Field label="Escolha a ave">
          <select style={{ ...inputStyle, minWidth: 200, maxWidth: "100%" }} value={placaId} onChange={(e) => setPlacaId(e.target.value)}>
            <option value="">-- selecione --</option>
            {aves.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </Field>
        {placaId && (
          <button onClick={onDownload} className="ui-sans flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            <Download size={16} /> Baixar PNG
          </button>
        )}
      </div>

      {placaId ? (
        <div className="rounded-xl overflow-hidden w-full" style={{ border: "3px solid #4a2c18", maxWidth: 720 }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
      ) : (
        <Card className="p-8 ui-sans" style={{ color: "#8a7a63" }}>Selecione uma ave pra ver a previa da placa.</Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Autenticacao: decide entre a tela de login e o sistema em si
// ---------------------------------------------------------------------------

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = carregando, null = deslogado

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#2B1D14" }}>
        <Loader2 className="animate-spin" color="#C69A2E" size={28} />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return <AppInner user={session.user} onLogout={() => supabase.auth.signOut()} />;
}
