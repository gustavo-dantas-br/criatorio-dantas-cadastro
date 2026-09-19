import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bird, Plus, Search, GitBranch, Tag, Upload, Trash2, X, Loader2, Save,
  Download, Feather, DollarSign, LogOut, LayoutDashboard, Dna, Users, Phone, Pencil, ClipboardCheck, Truck, MessageCircle, Handshake, Megaphone, UserCircle, ShieldCheck, Check,
} from "lucide-react";

import { supabase } from "./supabaseClient";

import {
  listRows, saveRow, deleteRow, uid, getPerfil, savePerfil, listAnuncios, saveAnuncio, deleteAnuncio,
  checkIsAdmin, listTodosAnunciosParaAdmin, updateAnuncioStatus, listPerfisPublicos,
  listPerdidas, savePerdida, deletePerdida, buscarPerdidaPorAnilha,
} from "./lib/db";

import AuthPage from "./components/AuthPage";

// ---------------------------------------------------------------------------
// Design tokens
// bg base:      #2B1D14  (walnut, header/sidebar)
// panel:        #FAF3E6  (parchment card)
// accent gold:  #C69A2E
// accent rust:  #A6402B
// accent sage:  #6E7B57
// ink:          #2B241C
// ---------------------------------------------------------------------------

const ESPECIES = ["Ring Neck", "Calopsita", "Outra"];
const SEXOS = ["Macho", "Femea", "Indefinido"];
const STATUS_AVE = ["No plantel", "A venda", "Reservada", "Vendida", "Falecida", "Perdida"];
const STATUS_PLANTEL = ["No plantel", "A venda", "Reservada"];
const STATUS_POSVENDA = ["Venda realizada", "Entregue", "Primeiro contato", "Acompanhamento", "Cliente satisfeito"];
const SATISFACAO_OPCOES = ["Pendente", "Sim", "Nao"];
const ORIGEM_TIPOS = ["Nasceu no plantel", "Comprada"];
const DESPESA_TIPOS = ["Racao", "Veterinario/Medicamento", "Gaiola/Equipamento", "Anilha", "Outro"];
const TIPOS_HERANCA = [
  "Cor base (selvagem)",
  "Autossomica recessiva",
  "Autossomica dominante",
  "Ligada ao sexo (recessiva)",
  "Ligada ao sexo (dominante)",
  "Codominante",
  "Nao definido / em estudo",
];
const STATUS_INDICACAO = ["Nova", "Em atendimento", "Venda realizada", "Nao converteu"];

function emptyAve() {
  return {
    id: null,
    nome: "",
    especie: "Ring Neck",
    sexo: "Indefinido",
    corMutacao: "",
    portadores: [],
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
    fornecedorId: "",
    valorCompra: "",
    dataCompra: "",
    compradorNome: "",
    compradorTelefone: "",
    compradorEndereco: "",
    valorVenda: "",
    dataVenda: "",
    clienteId: "",
    dataEntrega: "",
    statusPosVenda: "Venda realizada",
    dataUltimoContato: "",
    obsPosVenda: "",
    clienteSatisfeito: "Pendente",
    criadoEm: "",
  };
}

function emptyDespesa() {
  return { id: null, tipo: "Racao", descricao: "", valor: "", data: "" };
}

function emptyMutacao() {
  return {
    id: null,
    nome: "",
    nomeAlternativo: "",
    tipoHeranca: "Autossomica recessiva",
    combinaCom: "",
    comoIdentificar: "",
    observacoes: "",
  };
}

function emptyIndicacao() {
  return {
    id: null,
    clienteIndicouId: "",
    nomeIndicado: "",
    telefoneIndicado: "",
    data: "",
    status: "Nova",
    observacoes: "",
    criadoEm: "",
  };
}

function emptyAnuncio() {
  return {
    id: null,
    aveId: "",
    nomeAve: "",
    especie: "",
    corMutacao: "",
    sexo: "",
    nascimento: "",
    foto: "",
    preco: "",
    descricao: "",
    ativo: true,
    criadoEm: "",
  };
}

function emptyPerfilCriador() {
  return { nomeCriatorio: "", cidade: "", uf: "", whatsapp: "" };
}

function emptyCliente() {
  return { id: null, nome: "", telefone: "", endereco: "", observacoes: "", criadoEm: "" };
}

function emptyFornecedor() {
  return { id: null, nome: "", telefone: "", endereco: "", observacoes: "", criadoEm: "" };
}

function normalizeTelefone(t) {
  return (t || "").replace(/\D/g, "");
}

// Monta o link do WhatsApp a partir de um telefone e uma mensagem opcional.
// Funcao pura - nao le nem grava nada, so formata a URL.
function whatsappUrl(telefone, mensagem) {
  let digitos = normalizeTelefone(telefone);
  if (!digitos) return null;
  // Numeros brasileiros digitados sem DDI (10 ou 11 digitos com DDD) precisam
  // do "55" na frente pro link do WhatsApp funcionar.
  if (digitos.length <= 11) digitos = "55" + digitos;
  const base = `https://wa.me/${digitos}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

// ---------- Compressao de foto ----------
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

// ---------- Desenho da placa (Canvas) ----------
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
    ctx.drawImage(photoImg, (photoW - dw) / 2, H * 0.32 - dh * 0.32, dw, dh);
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

// ---------- Financeiro ----------
function computeFinanceiro(aves, despesas) {
  const totalCompras = aves.reduce((s, a) => s + (a.origemTipo === "Comprada" ? parseFloat(a.valorCompra) || 0 : 0), 0);
  const totalVendas = aves.reduce((s, a) => s + (a.status === "Vendida" ? parseFloat(a.valorVenda) || 0 : 0), 0);
  const totalDespesas = despesas.reduce((s, d) => s + (parseFloat(d.valor) || 0), 0);
  const totalInvestido = totalCompras + totalDespesas;
  const lucro = totalVendas - totalInvestido;
  const avesVendidas = aves.filter((a) => a.status === "Vendida").length;
  return { totalCompras, totalVendas, totalDespesas, totalInvestido, lucro, avesVendidas };
}

function computeFinanceiroPeriodo(aves, despesas, inicio, fim) {
  const dentro = (d) => (!d ? false : (!inicio || d >= inicio) && (!fim || d <= fim));

  const comprasPeriodo = aves.filter((a) => a.origemTipo === "Comprada" && dentro(a.dataCompra));
  const vendasPeriodo = aves.filter((a) => a.status === "Vendida" && dentro(a.dataVenda));
  const despesasPeriodo = despesas.filter((d) => dentro(d.data));

  const totalCompras = comprasPeriodo.reduce((s, a) => s + (parseFloat(a.valorCompra) || 0), 0);
  const totalVendas = vendasPeriodo.reduce((s, a) => s + (parseFloat(a.valorVenda) || 0), 0);
  const totalDespesas = despesasPeriodo.reduce((s, d) => s + (parseFloat(d.valor) || 0), 0);
  const totalInvestido = totalCompras + totalDespesas;
  const lucro = totalVendas - totalInvestido;

  const semData =
    aves.filter((a) => a.origemTipo === "Comprada" && !a.dataCompra).length +
    aves.filter((a) => a.status === "Vendida" && !a.dataVenda).length +
    despesas.filter((d) => !d.data).length;

  return {
    totalCompras, totalVendas, totalDespesas, totalInvestido, lucro,
    avesVendidas: vendasPeriodo.length, semData,
    comprasPeriodo, vendasPeriodo, despesasPeriodo,
  };
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}
function primeiroDiaMesISO(offsetMeses = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMeses);
  return d.toISOString().slice(0, 10);
}
function ultimoDiaMesISO(offsetMeses = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMeses + 1, 0);
  return d.toISOString().slice(0, 10);
}
function primeiroDiaAnoISO() {
  const d = new Date();
  d.setMonth(0, 1);
  return d.toISOString().slice(0, 10);
}

function money(n) {
  const v = parseFloat(n);
  if (isNaN(v)) return "R$ 0,00";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Historico do cliente e sempre CALCULADO na hora, cruzando pelo telefone com
// as aves ja vendidas. Nao grava nada de novo nas aves, nao duplica dado.
function historicoCliente(cliente, aves) {
  const porId = aves.filter((a) => a.status === "Vendida" && a.clienteId === cliente.id);
  let compras = porId;

  if (compras.length === 0) {
    // fallback pra vendas antigas que ainda nao tem o vinculo direto (clienteId)
    const tel = normalizeTelefone(cliente.telefone);
    const nome = (cliente.nome || "").trim().toLowerCase();
    compras = aves.filter((a) => {
      if (a.status !== "Vendida" || a.clienteId) return false; // ja vinculada a outro cliente, nao conta aqui
      if (tel) return normalizeTelefone(a.compradorTelefone) === tel;
      if (nome) return (a.compradorNome || "").trim().toLowerCase() === nome;
      return false;
    });
  }

  const totalAves = compras.length;
  const totalGasto = compras.reduce((s, a) => s + (parseFloat(a.valorVenda) || 0), 0);
  const ultimaCompra = compras.reduce((max, a) => ((a.dataVenda || "") > max ? a.dataVenda : max), "");
  return { compras: [...compras].sort((a, b) => (b.dataVenda || "").localeCompare(a.dataVenda || "")), totalAves, totalGasto, ultimaCompra };
}


// Varre as vendas ja cadastradas (aves com status Vendida) e acha compradores
// que ainda nao viraram Cliente - pra poder importar sem duplicar.
function clientesCandidatosDeVendas(aves, clientes) {
  const telsExistentes = new Set(clientes.map((c) => normalizeTelefone(c.telefone)).filter(Boolean));
  const nomesExistentes = new Set(clientes.map((c) => (c.nome || "").trim().toLowerCase()).filter(Boolean));

  const vistos = new Map(); // chave -> candidato
  aves.forEach((a) => {
    if (a.status !== "Vendida") return;
    const nome = (a.compradorNome || "").trim();
    const tel = normalizeTelefone(a.compradorTelefone);
    if (!nome && !tel) return;
    const chave = tel || nome.toLowerCase();
    if (tel && telsExistentes.has(tel)) return;
    if (!tel && nomesExistentes.has(nome.toLowerCase())) return;
    if (!vistos.has(chave)) {
      vistos.set(chave, {
        nome: nome || "(sem nome)",
        telefone: a.compradorTelefone || "",
        endereco: a.compradorEndereco || "",
        observacoes: "Importado automaticamente de uma venda ja cadastrada.",
      });
    }
  });
  return Array.from(vistos.values());
}

// Historico do fornecedor: espelha historicoCliente, so que olhando pro lado
// da COMPRA (origemTipo === "Comprada") em vez da venda.
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
// ---------------------------------------------------------------------------

function AppInner({ user, onLogout }) {
  const [aves, setAves] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [mutacoes, setMutacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [indicacoes, setIndicacoes] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [perfil, setPerfil] = useState(emptyPerfilCriador());
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [anunciosAprovacao, setAnunciosAprovacao] = useState([]);
  const [perfisPublicos, setPerfisPublicos] = useState([]);
  const [perdidas, setPerdidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyAve());
  const [saving, setSaving] = useState(false);
  const [placaId, setPlacaId] = useState("");
  const [arvoreId, setArvoreId] = useState("");
  const [statusFilter, setStatusFilter] = useState(null); // null | "A venda" | "Vendida" | "Falecida" | "casais" | "solteiros" | "plantel"
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
      // silencioso
    }
  }, [user.id]);

  const loadMutacoes = useCallback(async () => {
    try {
      const items = await listRows("mutacoes", user.id);
      setMutacoes(items.map((m) => ({ ...m, synced: true })).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    } catch {
      // silencioso
      }
    }, [user.id]);

 

  const loadClientes = useCallback(async () => {
    try {
      const items = await listRows("clientes", user.id);
      setClientes(items.map((c) => ({ ...c, synced: true })).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, so fica vazio
    }
  }, [user.id]);

  const loadFornecedores = useCallback(async () => {
    try {
      const items = await listRows("fornecedores", user.id);
      setFornecedores(items.map((f) => ({ ...f, synced: true })).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, so fica vazio
    }
  }, [user.id]);

  const loadIndicacoes = useCallback(async () => {
    try {
      const items = await listRows("indicacoes", user.id);
      setIndicacoes(items.map((i) => ({ ...i, synced: true })).sort((a, b) => (b.data || "").localeCompare(a.data || "")));
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, so fica vazio
    }
  }, [user.id]);

  const loadAnuncios = useCallback(async () => {
    try {
      const items = await listAnuncios(user.id);
      setAnuncios(items.map((a) => ({ ...a, synced: true })));
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, so fica vazio
    }
  }, [user.id]);

    const loadPerfil = useCallback(async () => {
    try {
      const p = await getPerfil(user.id);
      if (p) setPerfil({ ...emptyPerfilCriador(), ...p, synced: true });
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, fica com o perfil vazio
    }
  }, [user.id]);

  const loadAdminStatus = useCallback(async () => {
    try {
      const admin = await checkIsAdmin(user.id);
      setIsAdminUser(admin);

      if (admin) {
        const [todos, perfis] = await Promise.all([
          listTodosAnunciosParaAdmin(),
          listPerfisPublicos(),
        ]);

        setAnunciosAprovacao(todos);
        setPerfisPublicos(perfis);
      }
    } catch {
      // silencioso - se a tabela 'admins' ainda nao existir, so nao mostra o painel
    }
  }, [user.id]);

  const loadPerdidas = useCallback(async () => {
    try {
      const items = await listPerdidas(user.id);
      setPerdidas(items.map((p) => ({ ...p, synced: true })));
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, so fica vazio
    }
  }, [user.id]);

  useEffect(() => {
    loadAves();
    loadDespesas();
    loadMutacoes();
    loadClientes();
    loadFornecedores();
    loadIndicacoes();
    loadAnuncios();
    loadPerfil();
    loadAdminStatus();
    loadPerdidas();
  }, [loadAves, loadDespesas, loadMutacoes, loadClientes, loadFornecedores, loadIndicacoes, loadAnuncios, loadPerfil, loadAdminStatus, loadPerdidas]);

  function startNew() {
    setForm(emptyAve());
    setTab("form");
  }

  function goToLista(filter) {
    setStatusFilter(filter);
    setTab("lista");
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
    let toSave = { ...form, id, criadoEm: form.criadoEm || new Date().toISOString() };

    // Vincula (ou cria) automaticamente o Cliente quando a ave e vendida.
    // Se o usuario ja selecionou um cliente existente no formulario, o
    // clienteId ja vem preenchido e nada precisa ser feito aqui.
    if (toSave.status === "Vendida" && !toSave.clienteId && (toSave.compradorNome?.trim() || toSave.compradorTelefone?.trim())) {
      const tel = normalizeTelefone(toSave.compradorTelefone);
      const nomeBusca = (toSave.compradorNome || "").trim().toLowerCase();
      let existente = null;
      if (tel) existente = clientes.find((c) => normalizeTelefone(c.telefone) === tel);
      if (!existente && nomeBusca) existente = clientes.find((c) => (c.nome || "").trim().toLowerCase() === nomeBusca);

      if (existente) {
        toSave.clienteId = existente.id;
      } else {
        const novoCliente = {
          ...emptyCliente(),
          id: uid(),
          nome: toSave.compradorNome?.trim() || "(sem nome)",
          telefone: toSave.compradorTelefone || "",
          endereco: toSave.compradorEndereco || "",
          observacoes: "Cliente criado automaticamente ao registrar essa venda.",
        };
        handleSaveCliente(novoCliente);
        toSave.clienteId = novoCliente.id;
      }
    }

    // Vincula (ou cria) automaticamente o Fornecedor quando a ave foi comprada.
    if (toSave.origemTipo === "Comprada" && !toSave.fornecedorId && (toSave.fornecedorNome?.trim() || toSave.fornecedorTelefone?.trim())) {
      const tel = normalizeTelefone(toSave.fornecedorTelefone);
      const nomeBusca = (toSave.fornecedorNome || "").trim().toLowerCase();
      let existente = null;
      if (tel) existente = fornecedores.find((f) => normalizeTelefone(f.telefone) === tel);
      if (!existente && nomeBusca) existente = fornecedores.find((f) => (f.nome || "").trim().toLowerCase() === nomeBusca);

      if (existente) {
        toSave.fornecedorId = existente.id;
      } else {
        const novoFornecedor = {
          ...emptyFornecedor(),
          id: uid(),
          nome: toSave.fornecedorNome?.trim() || "(sem nome)",
          telefone: toSave.fornecedorTelefone || "",
          endereco: toSave.fornecedorEndereco || "",
          observacoes: "Fornecedor criado automaticamente ao registrar essa compra.",
        };
        handleSaveFornecedor(novoFornecedor);
        toSave.fornecedorId = novoFornecedor.id;
      }
    }

    setAves((prev) => {
      const others = prev.filter((a) => a.id !== id);
      return [...others, { ...toSave, synced: false }].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    });
    setTab("lista");

    // Cria ou atualiza o registro publico de "ave perdida" automaticamente,
    // conforme o status mudou pra "Perdida" ou saiu dele.
    const aveAnterior = aves.find((a) => a.id === id);
    const eraPerdida = aveAnterior?.status === "Perdida";
    const agoraPerdida = toSave.status === "Perdida";
    if (agoraPerdida && !eraPerdida) {
      const existente = perdidas.find((p) => p.aveId === id);
      handleSavePerdida({
        ...(existente || {}),
        id: existente?.id,
        aveId: id,
        nomeAve: toSave.nome,
        especie: toSave.especie,
        corMutacao: toSave.corMutacao,
        anilha: toSave.anilha,
        foto: toSave.foto,
        status: "perdida",
      });
    } else if (!agoraPerdida && eraPerdida) {
      const existente = perdidas.find((p) => p.aveId === id);
      if (existente) handleSavePerdida({ ...existente, status: "encontrada" });
    }

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

  function handleSavePerdida(perdida) {
    const id = perdida.id || uid();
    const toSave = { ...perdida, id };
    setPerdidas((prev) => {
      const others = prev.filter((p) => p.id !== id);
      return [...others, { ...toSave, synced: false }];
    });
    savePerdida(user.id, toSave)
      .then(() => setPerdidas((prev) => prev.map((p) => (p.id === id ? { ...p, synced: true } : p))))
      .catch((e) => setError(
        `Registro de ave perdida ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'perdidas' ainda nao existe no seu Supabase, roda o schema_fase_perdidas.sql no SQL Editor."
      ));
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

  // Atualiza so os campos de pos-venda de uma ave ja vendida, sem passar
  // pelo formulario inteiro de cadastro.
  async function handleUpdatePosVenda(aveId, patch) {
    const atualizada = aves.find((a) => a.id === aveId);
    if (!atualizada) return;
    const toSave = { ...atualizada, ...patch };
    setAves((prev) => prev.map((a) => (a.id === aveId ? { ...toSave, synced: false } : a)));
    try {
      await saveRow("aves", user.id, toSave);
      setAves((prev) => prev.map((a) => (a.id === aveId ? { ...a, synced: true } : a)));
    } catch (e) {
      setError(`Pos-venda de "${atualizada.nome}" ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}).`);
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

  async function handleSaveMutacao(mutacao) {
    if (!mutacao.nome.trim()) return;
    const id = mutacao.id || uid();
    const toSave = { ...mutacao, id };
    setMutacoes((prev) => {
      const others = prev.filter((m) => m.id !== id);
      return [...others, { ...toSave, synced: false }].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    });
    try {
      await saveRow("mutacoes", user.id, toSave);
      setMutacoes((prev) => prev.map((m) => (m.id === id ? { ...m, synced: true } : m)));
    } catch (e) {
      setError(
        `Mutacao ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'mutacoes' ainda nao existe no seu Supabase, roda o schema_fase2.sql no SQL Editor."
      );
    }
  }

  async function handleDeleteMutacao(id) {
    setMutacoes((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteRow("mutacoes", id);
    } catch {
      // ja removida localmente
    }
  }

  function handleSaveCliente(cliente) {
    if (!cliente.nome.trim()) return { ok: false, error: "Da um nome pro cliente." };
    const telNorm = normalizeTelefone(cliente.telefone);
    if (telNorm) {
      const duplicado = clientes.find((c) => c.id !== cliente.id && normalizeTelefone(c.telefone) === telNorm);
      if (duplicado) {
        return { ok: false, error: `Ja existe um cliente com esse telefone: ${duplicado.nome}. Edita ele em vez de criar outro.` };
      }
    }
    const id = cliente.id || uid();
    const toSave = { ...cliente, id, criadoEm: cliente.criadoEm || new Date().toISOString() };
    setClientes((prev) => {
      const others = prev.filter((c) => c.id !== id);
      return [...others, { ...toSave, synced: false }].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    });
    saveRow("clientes", user.id, toSave)
      .then(() => setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, synced: true } : c))))
      .catch((e) => setError(
        `"${cliente.nome}" ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'clientes' ainda nao existe no seu Supabase, roda o schema_fase_clientes.sql no SQL Editor."
      ));
    return { ok: true };
  }

  async function handleDeleteCliente(id) {
    setClientes((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteRow("clientes", id);
    } catch {
      // ja removido localmente
    }
  }

  function handleImportarClientes(candidatos) {
    const novos = candidatos.map((c) => ({
      ...emptyCliente(),
      ...c,
      id: uid(),
      criadoEm: new Date().toISOString(),
    }));
    setClientes((prev) => [...prev, ...novos.map((c) => ({ ...c, synced: false }))].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    novos.forEach((c) => {
      saveRow("clientes", user.id, c)
        .then(() => setClientes((prev) => prev.map((x) => (x.id === c.id ? { ...x, synced: true } : x))))
        .catch(() => setError(`"${c.nome}" foi importado na tela, mas nao sincronizou ainda. Use o botao de sincronizar depois.`));
    });
  }

  function handleSaveFornecedor(fornecedor) {
    if (!fornecedor.nome.trim()) return { ok: false, error: "Da um nome pro fornecedor." };
    const telNorm = normalizeTelefone(fornecedor.telefone);
    if (telNorm) {
      const duplicado = fornecedores.find((f) => f.id !== fornecedor.id && normalizeTelefone(f.telefone) === telNorm);
      if (duplicado) {
        return { ok: false, error: `Ja existe um fornecedor com esse telefone: ${duplicado.nome}. Edita ele em vez de criar outro.` };
      }
    }
    const id = fornecedor.id || uid();
    const toSave = { ...fornecedor, id, criadoEm: fornecedor.criadoEm || new Date().toISOString() };
    setFornecedores((prev) => {
      const others = prev.filter((f) => f.id !== id);
      return [...others, { ...toSave, synced: false }].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    });
    saveRow("fornecedores", user.id, toSave)
      .then(() => setFornecedores((prev) => prev.map((f) => (f.id === id ? { ...f, synced: true } : f))))
      .catch((e) => setError(
        `"${fornecedor.nome}" ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'fornecedores' ainda nao existe no seu Supabase, roda o schema_fase_fornecedores.sql no SQL Editor."
      ));
    return { ok: true };
  }

  async function handleDeleteFornecedor(id) {
    setFornecedores((prev) => prev.filter((f) => f.id !== id));
    try {
      await deleteRow("fornecedores", id);
    } catch {
      // ja removido localmente
    }
  }

  function handleImportarFornecedores(candidatos) {
    const novos = candidatos.map((f) => ({
      ...emptyFornecedor(),
      ...f,
      id: uid(),
      criadoEm: new Date().toISOString(),
    }));
    setFornecedores((prev) => [...prev, ...novos.map((f) => ({ ...f, synced: false }))].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    novos.forEach((f) => {
      saveRow("fornecedores", user.id, f)
        .then(() => setFornecedores((prev) => prev.map((x) => (x.id === f.id ? { ...x, synced: true } : x))))
        .catch(() => setError(`"${f.nome}" foi importado na tela, mas nao sincronizou ainda. Use o botao de sincronizar depois.`));
    });
  }

  function handleSaveIndicacao(indicacao) {
    if (!indicacao.nomeIndicado?.trim()) return { ok: false, error: "Da o nome da pessoa indicada." };
    const id = indicacao.id || uid();
    const toSave = { ...indicacao, id, criadoEm: indicacao.criadoEm || new Date().toISOString() };
    setIndicacoes((prev) => {
      const others = prev.filter((i) => i.id !== id);
      return [...others, { ...toSave, synced: false }].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    });
    saveRow("indicacoes", user.id, toSave)
      .then(() => setIndicacoes((prev) => prev.map((i) => (i.id === id ? { ...i, synced: true } : i))))
      .catch((e) => setError(
        `Indicacao ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'indicacoes' ainda nao existe no seu Supabase, roda o schema_fase_indicacoes.sql no SQL Editor."
      ));
    return { ok: true };
  }

  async function handleDeleteIndicacao(id) {
    setIndicacoes((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteRow("indicacoes", id);
    } catch {
      // ja removida localmente
    }
  }

 function handleSaveAnuncio(anuncio) {
  if (!anuncio.aveId) return { ok: false, error: "Selecione a ave pra anunciar." };
  if (!anuncio.preco) return { ok: false, error: "Informe o preco do anuncio." };
  const id = anuncio.id || uid();
  const ehNovo = !anuncio.id;
  const toSave = { ...anuncio, id, criadoEm: anuncio.criadoEm || new Date().toISOString() };
  setAnuncios((prev) => {
    const others = prev.filter((a) => a.id !== id);
    // anuncio novo sempre comeca "pendente" (so entra no ar depois de aprovado)
    return [...others, { ...toSave, status: ehNovo ? "pendente" : toSave.status, synced: false }];
  });
    saveAnuncio(user.id, toSave)
      .then(() => setAnuncios((prev) => prev.map((a) => (a.id === id ? { ...a, synced: true } : a))))
      .catch((e) => setError(
        `Anuncio ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se as tabelas 'anuncios'/'perfil_criador' ainda nao existem no seu Supabase, roda o schema_fase_anuncios.sql no SQL Editor."
      ));
    return { ok: true };
    }

  function handleToggleAnuncioAtivo(anuncio) {
    handleSaveAnuncio({ ...anuncio, ativo: !anuncio.ativo });
  }

  async function handleDeleteAnuncio(id) {
    setAnuncios((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteAnuncio(id);
    } catch {
      // ja removido localmente
    }
  }

  function handleSavePerfil(novoPerfil) {
    setPerfil({ ...novoPerfil, synced: false });
    savePerfil(user.id, novoPerfil)
      .then(() => setPerfil({ ...novoPerfil, synced: true }))
      .catch((e) => setError(
        `Perfil ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'perfil_criador' ainda nao existe no seu Supabase, roda o schema_fase_anuncios.sql no SQL Editor."
      ));
  }

  async function handleModerarAnuncio(id, novoStatus) {
    setAnunciosAprovacao((prev) => prev.map((a) => (a.id === id ? { ...a, status: novoStatus } : a)));
    try {
      await updateAnuncioStatus(id, novoStatus);
    } catch (e) {
      setError(`Nao consegui atualizar o status desse anuncio (${e?.message || "erro desconhecido"}).`);
    }
  }

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

  const bySearch = aves.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (a.nome || "").toLowerCase().includes(q) ||
      (a.anilha || "").toLowerCase().includes(q) ||
      (a.especie || "").toLowerCase().includes(q)
    );
  });

  const filtered = bySearch.filter((a) => {
    if (!statusFilter) return true;
    if (statusFilter === "casais") return !!a.parceiroId || !!a.casalLabel?.trim();
    if (statusFilter === "solteiros") return !a.parceiroId && !a.casalLabel?.trim();
    if (statusFilter === "plantel") return STATUS_PLANTEL.includes(a.status);
    return a.status === statusFilter;
  });

  const casaisAgrupados = (() => {
    if (statusFilter !== "casais") return [];
    const usados = new Set();
    const pares = [];
    filtered.forEach((a) => {
      if (usados.has(a.id)) return;
      const parceiro = a.parceiroId ? aves.find((x) => x.id === a.parceiroId) : null;
      usados.add(a.id);
      if (parceiro) usados.add(parceiro.id);
      pares.push({ a, b: parceiro, label: a.casalLabel || parceiro?.casalLabel || "" });
    });
    return pares;
  })();

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
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "lista", label: "Aves", icon: Bird },
            { id: "form", label: "Cadastrar", icon: Plus },
            { id: "arvore", label: "Arvore", icon: GitBranch },
            { id: "placa", label: "Placa", icon: Tag },
            { id: "financeiro", label: "Financeiro", icon: DollarSign },
            { id: "clientes", label: "Clientes", icon: Users },
            { id: "fornecedores", label: "Fornecedores", icon: Truck },
            { id: "posvenda", label: "Pos-venda", icon: ClipboardCheck },
            { id: "indicacoes", label: "Indicacoes", icon: Handshake },
            { id: "anuncios", label: "Anuncios", icon: Megaphone },
            { id: "perfil", label: "Perfil", icon: UserCircle },
            ...(isAdminUser ? [{ id: "aprovacoes", label: "Aprovacoes", icon: ShieldCheck }] : []),


            { id: "mutacoes", label: "Genetica", icon: Dna },
          ].map(({ id, label: lbl, icon: Icon }) => (
            <button
              key={id}
              onClick={() => (id === "form" ? startNew() : id === "lista" ? goToLista(null) : setTab(id))}
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
          <button onClick={onLogout} className="ui-sans flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg self-start" style={{ color: "#b09a78" }}>
            <LogOut size={13} /> Sair
          </button>
        </div>
      </aside>

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
            {tab === "dashboard" && <DashboardTab aves={aves} despesas={despesas} setTab={setTab} goToLista={goToLista} />}

            {tab === "lista" && (
              <ListaTab
                aves={filtered} search={search} setSearch={setSearch}
                onEdit={startEdit} onDelete={handleDelete} onNew={startNew}
                onSync={handleSync} onExport={handleExport} onImport={handleImport}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                casaisAgrupados={casaisAgrupados}
              />
            )}

            {tab === "form" && (
              <FormTab
                form={form} setForm={setForm} onSave={handleSave} onPhoto={handlePhoto} saving={saving}
                machoOptions={machoOptions} femeaOptions={femeaOptions} parceiroOptions={parceiroOptions}
                mutacoes={mutacoes} clientes={clientes} fornecedores={fornecedores} onCancel={() => setTab("lista")}
              />
            )}

            {tab === "arvore" && (
              <ArvoreTab aves={aves} arvoreId={arvoreId} setArvoreId={setArvoreId} arvoreAve={arvoreAve} pai={pai} mae={mae} parceiro={parceiro} filhos={filhos} />
            )}

            {tab === "placa" && (
              <PlacaTab aves={aves} placaId={placaId} setPlacaId={setPlacaId} canvasRef={canvasRef} onDownload={downloadPlaca} />
            )}

            {tab === "financeiro" && (
              <FinanceiroTab aves={aves} despesas={despesas} onSaveDespesa={handleSaveDespesa} onDeleteDespesa={handleDeleteDespesa} />
            )}

            {tab === "mutacoes" && (
  <>
              <CalculadoraGenetica aves={aves} mutacoes={mutacoes} />

              <div className="my-8 h-px" style={{ background: "#e3d3b4" }} />

              <MutacoesTab
              mutacoes={mutacoes}
            onSave={handleSaveMutacao}
      onDelete={handleDeleteMutacao}
    />
  </>
            )}

            {tab === "clientes" && (
              <ClientesTab clientes={clientes} aves={aves} onSave={handleSaveCliente} onDelete={handleDeleteCliente} onImportar={handleImportarClientes} />
            )}

            {tab === "fornecedores" && (
              <FornecedoresTab fornecedores={fornecedores} aves={aves} onSave={handleSaveFornecedor} onDelete={handleDeleteFornecedor} onImportar={handleImportarFornecedores} />
            )}

            {tab === "posvenda" && (
              <PosVendaTab aves={aves} clientes={clientes} onUpdate={handleUpdatePosVenda} />
            )}

            {tab === "indicacoes" && (
              <IndicacoesTab indicacoes={indicacoes} clientes={clientes} onSave={handleSaveIndicacao} onDelete={handleDeleteIndicacao} />
            )}

            {tab === "anuncios" && (
              <AnunciosTab
                aves={aves} anuncios={anuncios} perfil={perfil}
                onSave={handleSaveAnuncio} onToggleAtivo={handleToggleAnuncioAtivo} onDelete={handleDeleteAnuncio}
                setTab={setTab}
              />
            )}

            {tab === "perfil" && (
              <PerfilTab perfil={perfil} onSave={handleSavePerfil} />
            )}


            {tab === "aprovacoes" && isAdminUser && (
              <AprovacoesTab anuncios={anunciosAprovacao} perfis={perfisPublicos} onModerar={handleModerarAnuncio} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UI compartilhada
// ---------------------------------------------------------------------------

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="mb-5" style={{ color: "#F1E6D2", fontSize: 24, fontWeight: 700 }}>{children}</h2>;
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

function Field({ label: lbl, children }) {
  return (
    <label className="flex flex-col gap-1.5 ui-sans">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8a7a63" }}>{lbl}</span>
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function StatCard({ label: lbl, value, tone = "default", onClick }) {
  const tones = {
    default: { bg: "#FAF3E6", color: "#2B241C" },
    bad: { bg: "#f0dad4", color: "#a6402b" },
    good: { bg: "#e4ead9", color: "#556b3f" },
    gold: { bg: "#f5e9c8", color: "#8a6f2e" },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      className="rounded-xl p-4 text-left w-full"
      style={{ background: t.bg, border: "1px solid #e3d3b4", cursor: onClick ? "pointer" : "default" }}
    >
      <div className="ui-mono text-[11px] uppercase tracking-wide mb-1" style={{ color: "#8a7a63" }}>{lbl}</div>
      <div className="text-2xl font-bold" style={{ color: t.color, fontFamily: "'Fraunces', serif" }}>{value}</div>
    </button>
  );
}

function DashboardTab({ aves, despesas, setTab, goToLista }) {
  const total = aves.length;
  const machos = aves.filter((a) => a.sexo === "Macho").length;
  const femeas = aves.filter((a) => a.sexo === "Femea").length;
  const indefinidos = aves.filter((a) => a.sexo === "Indefinido").length;

  const paresPorParceiro = new Set();
  aves.forEach((a) => { if (a.parceiroId) paresPorParceiro.add([a.id, a.parceiroId].sort().join("-")); });
  const casaisSoLabel = aves.filter((a) => !a.parceiroId && a.casalLabel?.trim()).length;
  const casais = paresPorParceiro.size + casaisSoLabel;
  const solteiros = aves.filter((a) => !a.parceiroId && !a.casalLabel?.trim()).length;

  const plantel = aves.filter((a) => STATUS_PLANTEL.includes(a.status)).length;
  const disponiveis = aves.filter((a) => a.status === "A venda").length;
  const vendidas = aves.filter((a) => a.status === "Vendida").length;
  const falecidas = aves.filter((a) => a.status === "Falecida").length;
  const semSexagem = aves.filter((a) => !a.sexado).length;
  const naoSincronizadas = aves.filter((a) => a.synced === false).length;

  const fin = computeFinanceiro(aves, despesas);

  const ultimasCadastradas = [...aves]
    .sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || ""))
    .slice(0, 5);

  return (
    <div>
      <SectionTitle>Dashboard</SectionTitle>

      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <StatCard label="Total de aves" value={total} onClick={() => goToLista(null)} />
        <StatCard label="Plantel" value={plantel} tone="gold" onClick={() => goToLista("plantel")} />
        <StatCard label="Machos" value={machos} />
        <StatCard label="Femeas" value={femeas} />
        <StatCard label="Sexo indefinido" value={indefinidos} />
        <StatCard label="Casais" value={casais} onClick={() => goToLista("casais")} />
        <StatCard label="Solteiros" value={solteiros} onClick={() => goToLista("solteiros")} />
        <StatCard label="A venda" value={disponiveis} tone="gold" onClick={() => goToLista("A venda")} />
        <StatCard label="Vendidas" value={vendidas} tone="good" onClick={() => goToLista("Vendida")} />
        <StatCard label="Falecidas" value={falecidas} tone="bad" onClick={() => goToLista("Falecida")} />
      </div>

      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <StatCard label="Total investido" value={money(fin.totalInvestido)} tone="bad" onClick={() => setTab("financeiro")} />
        <StatCard label="Total vendido" value={money(fin.totalVendas)} tone="good" onClick={() => setTab("financeiro")} />
        <StatCard label={fin.lucro >= 0 ? "Lucro" : "Prejuizo"} value={money(Math.abs(fin.lucro))} tone={fin.lucro >= 0 ? "good" : "bad"} onClick={() => setTab("financeiro")} />
      </div>

      {(semSexagem > 0 || naoSincronizadas > 0) && (
        <Card className="p-4 mb-6">
          <div className="ui-mono text-xs mb-2" style={{ color: "#8a7a63" }}>ALERTAS</div>
          <div className="flex flex-col gap-1 ui-sans text-sm" style={{ color: "#2B241C" }}>
            {semSexagem > 0 && <div>⚠️ {semSexagem} {semSexagem === 1 ? "ave esta" : "aves estao"} sem laudo de sexagem.</div>}
            {naoSincronizadas > 0 && <div>⚠️ {naoSincronizadas} {naoSincronizadas === 1 ? "ave nao sincronizou" : "aves nao sincronizaram"} com o banco ainda.</div>}
          </div>
        </Card>
      )}

      <div className="ui-mono text-xs mb-3" style={{ color: "#F1E6D2" }}>ULTIMAS CADASTRADAS</div>
      {ultimasCadastradas.length === 0 ? (
        <Card className="p-6 text-center ui-sans" style={{ color: "#8a7a63" }}>Nenhuma ave cadastrada ainda.</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {ultimasCadastradas.map((a) => (
            <Card key={a.id} className="p-3 flex items-center gap-3 ui-sans">
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
                {a.foto ? <img src={a.foto} className="w-full h-full object-cover" alt="" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{a.nome}</div>
                <div className="text-xs" style={{ color: "#8a7a63" }}>{a.especie} - {a.status}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lista
// ---------------------------------------------------------------------------

function AveCard({ a, onEdit, onDelete, onSync }) {
  return (
    <Card className="overflow-hidden flex">
      <div className="w-24 shrink-0" style={{ background: "#3a2a1c" }}>
        {a.foto ? <img src={a.foto} alt={a.nome} className="w-full h-full object-cover" /> : (
          <div className="w-full h-full flex items-center justify-center"><Bird size={22} color="#8a7a63" /></div>
        )}
      </div>
      <div className="flex-1 p-3 ui-sans min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold truncate" style={{ color: "#2B241C" }}>{a.nome}</div>
          <span className="ui-mono text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: a.sexado ? "#e4ead9" : "#f0e6d2", color: a.sexado ? "#556b3f" : "#8a6f2e" }}>
            {a.sexado ? "SEXADO" : "S/ SEXAGEM"}
          </span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: "#7a6a52" }}>{a.especie} - {a.sexo}</div>
        <div className="text-xs" style={{ color: "#7a6a52" }}>{a.corMutacao || "sem mutacao"}</div>
        <div className="ui-mono text-[11px] mt-1" style={{ color: "#a6402b" }}>{a.anilha || "sem anilha"}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded ui-mono" style={{ background: "#e3d3b4", color: "#5a4a30" }}>{a.status || "No plantel"}</span>
          {a.status === "Vendida" && a.valorVenda && <span className="text-[10px] ui-mono" style={{ color: "#556b3f" }}>R$ {a.valorVenda}</span>}
        </div>
        {a.synced === false && <div className="text-[10px] mt-1 font-semibold" style={{ color: "#a6402b" }}>NAO SINCRONIZADO</div>}
        <div className="flex flex-wrap gap-2 mt-2">
          <button onClick={() => onEdit(a)} className="text-xs px-2 py-1 rounded" style={{ background: "#e3d3b4", color: "#2B241C" }}>Editar</button>
          <button onClick={() => onDelete(a.id)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "#f0dad4", color: "#a6402b" }}><Trash2 size={12} /> Remover</button>
          {a.synced === false && <button onClick={() => onSync(a)} className="text-xs px-2 py-1 rounded" style={{ background: "#e4ead9", color: "#556b3f" }}>Sincronizar</button>}
        </div>
      </div>
    </Card>
  );
}

const FILTER_LABELS = {
  "A venda": "Aves a venda",
  Vendida: "Aves vendidas",
  Falecida: "Aves falecidas",
  casais: "Casais",
  solteiros: "Solteiros (sem parceiro)",
  plantel: "Plantel (sob sua responsabilidade)",
};

function ListaTab({ aves, search, setSearch, onEdit, onDelete, onNew, onSync, onExport, onImport, statusFilter, setStatusFilter, casaisAgrupados }) {
  const pendentes = aves.filter((a) => a.synced === false).length;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <SectionTitle>Minhas Aves</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <button onClick={onNew} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shrink-0" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            <Plus size={16} /> Nova ave
          </button>
          <button onClick={onExport} className="ui-sans flex items-center gap-2 px-3 py-2 rounded-lg text-sm shrink-0" style={{ background: "#e3d3b4", color: "#2B241C" }}>
            <Download size={15} /> Backup
          </button>
          <label className="ui-sans flex items-center gap-2 px-3 py-2 rounded-lg text-sm shrink-0 cursor-pointer" style={{ background: "#e3d3b4", color: "#2B241C" }}>
            <Upload size={15} /> Importar
            <input type="file" accept="application/json" className="hidden" onChange={onImport} />
          </label>
        </div>
      </div>

      {statusFilter && (
        <div className="ui-sans mb-4 px-4 py-2 rounded-lg text-sm flex items-center justify-between gap-3" style={{ background: "#f5e9c8", color: "#8a6f2e", border: "1px solid #d6c39a" }}>
          <span>Filtrando por: <strong>{FILTER_LABELS[statusFilter] || statusFilter}</strong> ({statusFilter === "casais" ? casaisAgrupados.length : aves.length})</span>
          <button onClick={() => setStatusFilter(null)} className="ui-sans px-2 py-1 rounded text-xs font-semibold" style={{ background: "#2B1D14", color: "#F1E6D2" }}>Limpar filtro</button>
        </div>
      )}

      {pendentes > 0 && (
        <div className="ui-sans mb-4 px-4 py-2 rounded-lg text-sm" style={{ background: "#f0e6d2", color: "#8a6f2e", border: "1px solid #d6c39a" }}>
          {pendentes} {pendentes === 1 ? "ave salva so neste aparelho" : "aves salvas so neste aparelho"} (nao sincronizou na nuvem ainda). Use "Sincronizar" no card, ou baixe o backup pra guardar num lugar seguro.
        </div>
      )}

      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8a7a63" }} />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, anilha ou especie..."
          className="ui-sans w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", color: "#2B241C" }}
        />
      </div>

      {aves.length === 0 ? (
        <Card className="p-8 text-center ui-sans" style={{ color: "#8a7a63" }}>
          {statusFilter ? "Nenhuma ave nesse filtro." : "Nenhuma ave encontrada. Cadastre a primeira pra comecar a preencher a arvore genealogica e gerar placas."}
        </Card>
      ) : statusFilter === "casais" ? (
        <div className="flex flex-col gap-4">
          {casaisAgrupados.map(({ a, b, label: casalLabel }) => (
            <Card key={a.id} className="p-4">
              {casalLabel && <div className="ui-mono text-xs mb-2" style={{ color: "#8a6f2e" }}>{casalLabel}</div>}
              <div className="grid gap-3" style={{ gridTemplateColumns: b ? "1fr 1fr" : "1fr" }}>
                <AveCard a={a} onEdit={onEdit} onDelete={onDelete} onSync={onSync} />
                {b && <AveCard a={b} onEdit={onEdit} onDelete={onDelete} onSync={onSync} />}
                {!b && <div className="ui-sans text-xs flex items-center justify-center" style={{ color: "#8a7a63" }}>Parceiro nao identificado no sistema</div>}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {aves.map((a) => <AveCard key={a.id} a={a} onEdit={onEdit} onDelete={onDelete} onSync={onSync} />)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulario de ave
// ---------------------------------------------------------------------------

function SeletorComprador({ form, setForm, clientes }) {
  const [modo, setModo] = useState("existente"); // "existente" | "novo"
  const [busca, setBusca] = useState("");

  const resultados = busca.trim()
    ? clientes.filter((c) => {
        const q = busca.trim().toLowerCase();
        return (c.nome || "").toLowerCase().includes(q) || (c.telefone || "").includes(q);
      })
    : clientes;

  function selecionar(c) {
    setForm((f) => ({ ...f, compradorNome: c.nome, compradorTelefone: c.telefone, compradorEndereco: c.endereco, clienteId: c.id }));
    setBusca(`${c.nome}${c.telefone ? " - " + c.telefone : ""}`);
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setModo("existente")}
          className="ui-sans text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: modo === "existente" ? "#556b3f" : "#e3d3b4", color: modo === "existente" ? "#F1E6D2" : "#2B241C" }}
        >
          ­🔎 Selecionar cliente existente
        </button>
        <button
          type="button"
          onClick={() => setModo("novo")}
          className="ui-sans text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: modo === "novo" ? "#556b3f" : "#e3d3b4", color: modo === "novo" ? "#F1E6D2" : "#2B241C" }}
        >
          + Novo cliente
        </button>
      </div>

      {modo === "existente" && (
        <div className="mb-2">
          {clientes.length === 0 ? (
            <div className="ui-sans text-xs" style={{ color: "#8a7a63" }}>
              Voce ainda nao tem clientes cadastrados. Cadastre em "Clientes", ou usa "+ Novo cliente" aqui do lado.
            </div>
          ) : (
            <>
              <input
                style={inputStyle}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente por nome ou telefone..."
                className="w-full mb-2"
              />
              {busca.trim() && resultados.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {resultados.slice(0, 6).map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => selecionar(c)}
                        className="ui-sans text-left text-sm px-3 py-2 rounded-lg flex items-center justify-between gap-2"
                        style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", color: "#2B241C" }}
                      >
                        <span>{c.nome}</span>
                        {c.telefone && <span className="ui-mono text-xs" style={{ color: "#8a7a63" }}>{c.telefone}</span>}
                      </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SeletorFornecedor({ form, setForm, fornecedores }) {
  const [modo, setModo] = useState("existente");
  const [busca, setBusca] = useState("");

  const resultados = busca.trim()
    ? fornecedores.filter((f) => {
        const q = busca.trim().toLowerCase();
        return (f.nome || "").toLowerCase().includes(q) || (f.telefone || "").includes(q);
      })
    : fornecedores;

  function selecionar(f) {
    setForm((form) => ({ ...form, fornecedorNome: f.nome, fornecedorTelefone: f.telefone, fornecedorEndereco: f.endereco, fornecedorId: f.id }));
    setBusca(`${f.nome}${f.telefone ? " - " + f.telefone : ""}`);
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setModo("existente")}
          className="ui-sans text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: modo === "existente" ? "#556b3f" : "#e3d3b4", color: modo === "existente" ? "#F1E6D2" : "#2B241C" }}
        >
          ­🔎 Selecionar fornecedor existente
        </button>
        <button
          type="button"
          onClick={() => setModo("novo")}
          className="ui-sans text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: modo === "novo" ? "#556b3f" : "#e3d3b4", color: modo === "novo" ? "#F1E6D2" : "#2B241C" }}
        >
          + Novo fornecedor
        </button>
      </div>

      {modo === "existente" && (
        <div className="mb-2">
          {fornecedores.length === 0 ? (
            <div className="ui-sans text-xs" style={{ color: "#8a7a63" }}>
              Voce ainda nao tem fornecedores cadastrados. Cadastre em "Fornecedores", ou usa "+ Novo fornecedor" aqui do lado.
            </div>
          ) : (
            <>
              <input
                style={inputStyle}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar fornecedor por nome ou telefone..."
                className="w-full mb-2"
              />
              {busca.trim() && resultados.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {resultados.slice(0, 6).map((f) => (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => selecionar(f)}
                        className="ui-sans text-left text-sm px-3 py-2 rounded-lg flex items-center justify-between gap-2"
                        style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", color: "#2B241C" }}
                      >
                        <span>{f.nome}</span>
                        {f.telefone && <span className="ui-mono text-xs" style={{ color: "#8a7a63" }}>{f.telefone}</span>}
                      </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function FormTab({ form, setForm, onSave, onPhoto, saving, machoOptions, femeaOptions, parceiroOptions, mutacoes, clientes, fornecedores, onCancel }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.type === "checkbox" ? e.target.checked : e.target.value }));
  // Editar manualmente os campos do comprador desfaz o vinculo com o cliente
  // selecionado (senao ficaria um clienteId apontando pra dado errado).
  const setComprador = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, clienteId: "" }));
  const setFornecedor = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, fornecedorId: "" }));

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
              <button type="button" onClick={() => setForm((f) => ({ ...f, foto: "" }))} className="absolute top-1 right-1 p-1 rounded-full" style={{ background: "#A6402B" }} title="Remover foto">
                <X size={12} color="#fff" />
              </button>
            )}
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome"><input style={inputStyle} value={form.nome} onChange={set("nome")} placeholder="ex: Princesa" /></Field>
            <Field label="Especie">
              <select style={inputStyle} value={form.especie} onChange={set("especie")}>{ESPECIES.map((e) => <option key={e}>{e}</option>)}</select>
            </Field>
            <Field label="Sexo">
              <select style={inputStyle} value={form.sexo} onChange={set("sexo")}>{SEXOS.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
            <Field label="Mutacao / Cor">
  <select
    style={inputStyle}
    value={form.corMutacao}
    onChange={set("corMutacao")}
  >
    <option value="">-- selecione --</option>
    {form.corMutacao && !mutacoes.some((m) => m.nome === form.corMutacao) && (
      <option value={form.corMutacao}>{form.corMutacao} (nao cadastrada no Banco de Genetica)</option>
    )}
        {mutacoes.map((m) => (
      <option key={m.id} value={m.nome}>{m.nome}</option>
    ))}

    </select>

    {mutacoes.length === 0 && (
      <div className="ui-sans text-xs mt-1" style={{ color: "#8a7a63" }}>
        Nenhuma mutacao cadastrada ainda — cadastre em Genetica &gt; Mutacoes primeiro.
      </div>
    )}

</Field>

<Field label="Portador de">
  <div
    className="rounded-xl p-3"
    style={{
      background: "#fffaf0",
      border: "1px solid #d8c6a5",
    }}
  >
    {mutacoes.length === 0 ? (
      <div className="text-sm" style={{ color: "#8a7a63" }}>
        Nenhuma mutacao cadastrada.
      </div>
    ) : (
      <div className="space-y-2">
        {mutacoes.map((mutacao) => {
          const selecionado = (form.portadores || []).includes(mutacao.nome);

          return (
            <label
              key={mutacao.id}
              className="flex items-center gap-2 text-sm cursor-pointer"
              style={{ color: "#4f4336" }}
            >
              <input
                type="checkbox"
                checked={selecionado}
                onChange={(e) => {
                  const atuais = form.portadores || [];

                  const novos = e.target.checked
                    ? [...new Set([...atuais, mutacao.nome])]
                    : atuais.filter((nome) => nome !== mutacao.nome);

                  setForm({
                    ...form,
                    portadores: novos,
                  });
                }}
              />

              <span>{mutacao.nome}</span>
            </label>
          );
        })}
      </div>
    )}
  </div>

  <p className="text-xs mt-2" style={{ color: "#8a7a63" }}>
    Marque as mutacoes que a ave carrega sem apresentar visualmente.
  </p>
</Field>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Numero da anilha"><input style={inputStyle} value={form.anilha} onChange={set("anilha")} placeholder="ex: FOB 0080" /></Field>
          <Field label="Cor da anilha"><input style={inputStyle} value={form.corAnilha} onChange={set("corAnilha")} placeholder="ex: azul 2024" /></Field>
          <Field label="Nascimento"><input style={inputStyle} value={form.nascimento} onChange={set("nascimento")} placeholder="ex: Ago/2024" /></Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="De onde veio (origem)"><input style={inputStyle} value={form.origem} onChange={set("origem")} placeholder="ex: Nascido no criatorio / comprado de..." /></Field>
          <Field label="Criador"><input style={inputStyle} value={form.criador} onChange={set("criador")} /></Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field label="CTF"><input style={inputStyle} value={form.ctf} onChange={set("ctf")} placeholder="opcional" /></Field>
          <Field label="Sexagem">
            <div className="flex items-center gap-2 h-full pt-1.5">
              <input type="checkbox" checked={form.sexado} onChange={set("sexado")} />
              <span className="text-sm ui-sans" style={{ color: "#2B241C" }}>Ja tem laudo de sexagem</span>
            </div>
          </Field>
          <Field label="Nota do laudo"><input style={inputStyle} value={form.laudoNota} onChange={set("laudoNota")} placeholder="opcional" /></Field>
        </div>

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>STATUS E PLANTEL</div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={set("status")}>{STATUS_AVE.map((s) => <option key={s}>{s}</option>)}</select>
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
          <select style={{ ...inputStyle, maxWidth: 280 }} value={form.origemTipo} onChange={set("origemTipo")}>{ORIGEM_TIPOS.map((o) => <option key={o}>{o}</option>)}</select>
        </Field>

        {form.origemTipo === "Comprada" && (
          <div className="mt-4">
            <SeletorFornecedor form={form} setForm={setForm} fornecedores={fornecedores} />
            {form.fornecedorId && (
              <div className="ui-sans text-xs mt-2 mb-2 px-3 py-1.5 rounded-lg inline-block" style={{ background: "#e4ead9", color: "#556b3f" }}>
                ✓ Vinculado ao cadastro do fornecedor
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Field label="Nome de quem vendeu"><input style={inputStyle} value={form.fornecedorNome} onChange={setFornecedor("fornecedorNome")} /></Field>
              <Field label="Telefone do vendedor"><input style={inputStyle} value={form.fornecedorTelefone} onChange={setFornecedor("fornecedorTelefone")} /></Field>
              <Field label="Endereco do vendedor"><input style={inputStyle} value={form.fornecedorEndereco} onChange={setFornecedor("fornecedorEndereco")} /></Field>
              <Field label="Valor pago (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valorCompra} onChange={set("valorCompra")} /></Field>
              <Field label="Data da compra"><input style={inputStyle} type="date" value={form.dataCompra} onChange={set("dataCompra")} /></Field>
            </div>
          </div>
        )}

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>VENDA</div>

        {form.status === "Vendida" ? (
          <div>
            <SeletorComprador form={form} setForm={setForm} clientes={clientes} />
            {form.clienteId && (
              <div className="ui-sans text-xs mt-2 px-3 py-1.5 rounded-lg inline-block" style={{ background: "#e4ead9", color: "#556b3f" }}>
                ✓ Vinculado ao cadastro do cliente
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label="Nome do comprador"><input style={inputStyle} value={form.compradorNome} onChange={setComprador("compradorNome")} /></Field>
              <Field label="Telefone do comprador"><input style={inputStyle} value={form.compradorTelefone} onChange={setComprador("compradorTelefone")} /></Field>
              <Field label="Endereco do comprador"><input style={inputStyle} value={form.compradorEndereco} onChange={setComprador("compradorEndereco")} /></Field>
              <Field label="Valor vendido (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valorVenda} onChange={set("valorVenda")} /></Field>
              <Field label="Data da venda"><input style={inputStyle} type="date" value={form.dataVenda} onChange={set("dataVenda")} /></Field>
            </div>
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
          <Field label="Pai (se nao estiver no sistema)"><input style={inputStyle} value={form.paiExterno} onChange={set("paiExterno")} placeholder="ex: desconhecido / de outro criador" /></Field>
          <Field label="Mae (se estiver cadastrada)">
            <select style={inputStyle} value={form.maeId} onChange={set("maeId")}>
              <option value="">-- nenhuma --</option>
              {femeaOptions.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <Field label="Mae (se nao estiver no sistema)"><input style={inputStyle} value={form.maeExterno} onChange={set("maeExterno")} placeholder="ex: emprestada do Anderson" /></Field>
          <Field label="Parceiro(a) / casal">
            <select style={inputStyle} value={form.parceiroId} onChange={set("parceiroId")}>
              <option value="">-- nenhum --</option>
              {parceiroOptions.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <Field label="Identificacao do casal"><input style={inputStyle} value={form.casalLabel} onChange={set("casalLabel")} placeholder="ex: Casal 04" /></Field>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onSave} disabled={saving} className="ui-sans flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar
          </button>
          <button onClick={onCancel} className="ui-sans px-5 py-2.5 rounded-lg text-sm" style={{ background: "#e3d3b4", color: "#2B241C" }}>Cancelar</button>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Arvore Genealogica
// ---------------------------------------------------------------------------

function TreeCard({ ave }) {
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
        <select style={{ ...inputStyle, maxWidth: 320 }} value={arvoreId} onChange={(e) => setArvoreId(e.target.value)}>
          <option value="">-- selecione --</option>
          {aves.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
      </Field>

      {arvoreAve && (
        <Card className="p-8 mt-6">
          <div className="flex flex-col items-center gap-6 ui-sans">
            <div className="ui-mono text-xs" style={{ color: "#8a7a63" }}>PAIS</div>
            <div className="flex gap-4 flex-wrap justify-center">
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
              {parceiro && (<><span className="text-xs" style={{ color: "#8a7a63" }}>x</span><TreeCard ave={parceiro} /></>)}
            </div>

            {filhos.length > 0 && (
              <>
                <div className="h-6 w-px" style={{ background: "#e3d3b4" }} />
                <div className="ui-mono text-xs" style={{ color: "#8a7a63" }}>FILHOS ({filhos.length})</div>
                <div className="flex flex-wrap gap-3 justify-center">{filhos.map((f) => <TreeCard key={f.id} ave={f} />)}</div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placa
// ---------------------------------------------------------------------------

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
// Financeiro
// ---------------------------------------------------------------------------

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
  const [inicio, setInicio] = useState(primeiroDiaMesISO());
  const [fim, setFim] = useState(hojeISO());

  const finTotal = computeFinanceiro(aves, despesas);
  const finPeriodo = computeFinanceiroPeriodo(aves, despesas, inicio, fim);

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

      <div className="ui-mono text-xs mb-3" style={{ color: "#F1E6D2" }}>SALDO TOTAL (DESDE O INICIO)</div>
      <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <SummaryCard label="Gasto com compras de aves" value={money(finTotal.totalCompras)} />
        <SummaryCard label="Gasto com despesas (racao, vet...)" value={money(finTotal.totalDespesas)} />
        <SummaryCard label="Total investido" value={money(finTotal.totalInvestido)} tone="bad" />
        <SummaryCard label={`Total vendido (${finTotal.avesVendidas} aves)`} value={money(finTotal.totalVendas)} tone="good" />
        <SummaryCard label={finTotal.lucro >= 0 ? "Lucro" : "Prejuizo"} value={money(Math.abs(finTotal.lucro))} tone={finTotal.lucro >= 0 ? "good" : "bad"} />
      </div>

      <div className="ui-mono text-xs mb-3" style={{ color: "#F1E6D2" }}>RESUMO POR PERIODO</div>
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
      {finPeriodo.semData > 0 && (
        <div className="ui-sans text-xs mb-8" style={{ color: "#b09a78" }}>
          ⚠️ {finPeriodo.semData} {finPeriodo.semData === 1 ? "registro (compra/venda/despesa) esta" : "registros (compra/venda/despesa) estao"} sem data preenchida e por isso nao entram no filtro por periodo, so no saldo total.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div>
          <div className="ui-mono text-xs mb-2" style={{ color: "#F1E6D2" }}>DESPESAS NO PERIODO ({finPeriodo.despesasPeriodo.length})</div>
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
          <div className="ui-mono text-xs mb-2" style={{ color: "#F1E6D2" }}>COMPRAS NO PERIODO ({finPeriodo.comprasPeriodo.length})</div>
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
          <div className="ui-mono text-xs mb-2" style={{ color: "#F1E6D2" }}>VENDAS NO PERIODO ({finPeriodo.vendasPeriodo.length})</div>
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

      <div className="my-8 h-px" style={{ background: "#4a2c18" }} />

      <div className="ui-mono text-xs mb-3" style={{ color: "#F1E6D2" }}>DESPESAS DO PLANTEL (racao, veterinario, equipamentos...)</div>

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
// Banco de Genetica
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Motor genetico multi-loci - usado pela CalculadoraGenetica
// Suporta: Autossomica recessiva/dominante, Codominante, Ligada ao sexo
// (recessiva/dominante). Assume loci independentes entre si (aproximacao
// padrao usada em calculadoras de criadores - nao modela ligacao fisica
// entre genes no mesmo cromossomo).
// ---------------------------------------------------------------------------

function normTxtGen(s) {
  return (s || "").trim().toLowerCase();
}

function alelosAutossomico(ave, mutNome, dominante) {
  const expressa = normTxtGen(ave.corMutacao) === normTxtGen(mutNome);
  const carrega = (ave.portadores || []).some((p) => normTxtGen(p) === normTxtGen(mutNome));
  if (dominante) return expressa ? ["M", "N"] : ["N", "N"];
  if (expressa) return ["m", "m"];
  if (carrega) return ["N", "m"];
  return ["N", "N"];
}

function classificarAutossomico(par, dominante, codominante) {
  const countMut = par.filter((a) => a === "M" || a === "m").length;
  if (codominante) {
    if (countMut === 2) return "visual (duplo fator)";
    if (countMut === 1) return "visual (fator simples)";
    return "normal";
  }
  if (dominante) return countMut >= 1 ? "visual" : "normal";
  if (countMut === 2) return "visual";
  if (countMut === 1) return "portador";
  return "normal";
}

function alelosZ(ave, mutNome, dominante) {
  const expressa = normTxtGen(ave.corMutacao) === normTxtGen(mutNome);
  const carrega = (ave.portadores || []).some((p) => normTxtGen(p) === normTxtGen(mutNome));
  const alvo = dominante ? "M" : "m";
  if (ave.sexo === "Macho") {
    if (expressa) return [alvo, alvo];
    if (carrega) return [alvo, "N"];
    return ["N", "N"];
  }
  // Femea e hemizigota (so um Z) - nao existe estado "portador" pra ela
  return expressa ? [alvo] : ["N"];
}

function classificarSexLigado(sexoFilho, alelos, dominante) {
  const alvo = dominante ? "M" : "m";
  const countMut = alelos.filter((a) => a === alvo).length;
  if (sexoFilho === "Macho") {
    if (dominante) return countMut >= 1 ? "visual" : "normal";
    if (countMut === 2) return "visual";
    if (countMut === 1) return "portador";
    return "normal";
  }
  return countMut >= 1 ? "visual" : "normal";
}

// Calcula o cruzamento considerando todos os loci relevantes (mutacoes que
// pai OU mae expressam ou carregam), usando o tipo de heranca cadastrado
// no Banco de Genetica pra cada uma.
function calcularCruzamentoGenetico(pai, mae, mutacoes) {
  const relevantes = mutacoes
    .filter((m) => m.tipoHeranca !== "Cor base (selvagem)")
    .filter((m) => {
      const envolve = (ave) =>
        normTxtGen(ave.corMutacao) === normTxtGen(m.nome) ||
        (ave.portadores || []).some((p) => normTxtGen(p) === normTxtGen(m.nome));
      return envolve(pai) || envolve(mae);
    });

  const naoRegistradas = [pai.corMutacao, mae.corMutacao]
    .filter(Boolean)
    .filter((nome, i, arr) => arr.indexOf(nome) === i)
    .filter((nome) => !mutacoes.some((m) => normTxtGen(m.nome) === normTxtGen(nome)));

  if (relevantes.length === 0) {
    return { semLociRelevantes: true, naoRegistradas };
  }

  const autossomicos = relevantes.filter((m) =>
    ["Autossomica recessiva", "Autossomica dominante", "Codominante"].includes(m.tipoHeranca)
  );
  const sexLigados = relevantes.filter((m) =>
    ["Ligada ao sexo (recessiva)", "Ligada ao sexo (dominante)"].includes(m.tipoHeranca)
  );
  const naoDefinidos = relevantes
    .filter((m) => !autossomicos.includes(m) && !sexLigados.includes(m))
    .map((m) => m.nome);

  // combinacoes: cada item = { prob, partes: [descricoes de locus], sexo }
  let combinacoes = [{ prob: 1, partes: [], sexo: null }];

  autossomicos.forEach((m) => {
    const dominante = m.tipoHeranca === "Autossomica dominante";
    const codominante = m.tipoHeranca === "Codominante";
    const aPai = alelosAutossomico(pai, m.nome, dominante);
    const aMae = alelosAutossomico(mae, m.nome, dominante);
    const porClasse = new Map();
    aPai.forEach((p) =>
      aMae.forEach((mm) => {
        const cls = classificarAutossomico([p, mm], dominante, codominante);
        porClasse.set(cls, (porClasse.get(cls) || 0) + 0.25);
      })
    );
    const novas = [];
    combinacoes.forEach((comb) => {
      porClasse.forEach((prob, cls) => {
        novas.push({
          prob: comb.prob * prob,
          partes: cls === "normal" ? comb.partes : [...comb.partes, `${cls} ${m.nome}`],
          sexo: comb.sexo,
        });
      });
    });
    combinacoes = novas;
  });

  const sexos = [{ sexo: "Macho", prob: 0.5 }, { sexo: "Femea", prob: 0.5 }];

  if (sexLigados.length > 0) {
    const novas = [];
    combinacoes.forEach((comb) => {
      sexos.forEach(({ sexo, prob: probSexo }) => {
        let subCombos = [{ prob: 1, partes: [] }];
        sexLigados.forEach((m) => {
          const dominante = m.tipoHeranca === "Ligada ao sexo (dominante)";
          const zPai = alelosZ(pai, m.nome, dominante);
          const zMae = alelosZ(mae, m.nome, dominante);
          const novosSub = [];
          subCombos.forEach((sub) => {
            zPai.forEach((pz) => {
              const alelosFilho = sexo === "Macho" ? [pz, zMae[0]] : [pz];
              const cls = classificarSexLigado(sexo, alelosFilho, dominante);
              novosSub.push({
                prob: sub.prob * 0.5,
                partes: cls === "normal" ? sub.partes : [...sub.partes, `${cls} ${m.nome}`],
              });
            });
          });
          subCombos = novosSub;
        });
        subCombos.forEach((sub) => {
          novas.push({
            prob: comb.prob * probSexo * sub.prob,
            partes: [...comb.partes, ...sub.partes],
            sexo,
          });
        });
      });
    });
    combinacoes = novas;
  } else {
    const novas = [];
    combinacoes.forEach((comb) => {
      sexos.forEach(({ sexo, prob }) => {
        novas.push({ ...comb, prob: comb.prob * prob, sexo });
      });
    });
    combinacoes = novas;
  }

  const agrupado = new Map();
  combinacoes.forEach((c) => {
    const desc = c.partes.length ? c.partes.join(", ") : "Normal (sem mutacoes visiveis conhecidas)";
    const key = `${c.sexo}|${desc}`;
    agrupado.set(key, (agrupado.get(key) || 0) + c.prob);
  });

  const resultadoFinal = Array.from(agrupado.entries())
    .map(([key, prob]) => {
      const [sexo, desc] = key.split("|");
      return { sexo, descricao: desc, percentual: prob * 100 };
    })
    .sort((a, b) => b.percentual - a.percentual);

  return {
    semLociRelevantes: false,
    naoDefinidos,
    naoRegistradas,
    lociConsiderados: [...autossomicos, ...sexLigados].map((m) => m.nome),
    resultadoFinal,
  };
}

function CalculadoraGenetica({ aves, mutacoes }) {
  const [paiId, setPaiId] = useState("");
  const [maeId, setMaeId] = useState("");
  const [resultado, setResultado] = useState(null);

  const machos = aves.filter((a) => a.sexo === "Macho");
  const femeas = aves.filter((a) => a.sexo === "Femea");

  const pai = aves.find((a) => a.id === paiId);
  const mae = aves.find((a) => a.id === maeId);

  function calcular() {
    if (!pai || !mae) {
      setResultado({
        tipo: "erro",
        mensagem: "Selecione o pai e a mae para calcular.",
      });
      return;
    }

    const calc = calcularCruzamentoGenetico(pai, mae, mutacoes);

    if (calc.semLociRelevantes) {
      setResultado({
        tipo: "erro",
        mensagem:
          "Nenhuma mutacao conhecida (cadastrada no Banco de Genetica) foi encontrada nesse casal. " +
          (calc.naoRegistradas.length
            ? `Cadastre "${calc.naoRegistradas.join('", "')}" em Genetica > Mutacoes pra calcular.`
            : "Cadastre as mutacoes envolvidas em Genetica > Mutacoes."),
      });
      return;
    }

    const possibilidades = calc.resultadoFinal.map((r) => ({
      nome: r.descricao,
      percentual: `${r.percentual.toFixed(1).replace(/\.0$/, "")}%`,
      detalhe: r.sexo,
    }));

    let observacao =
      "Calculo considera os loci registrados no Banco de Genetica (autossomicos e ligados ao sexo), " +
      "tratando cada mutacao como independente das demais.";
    if (calc.naoDefinidos.length) {
      observacao += ` As mutacoes "${calc.naoDefinidos.join('", "')}" ainda estao com tipo de heranca "Nao definido" e nao entraram no calculo.`;
    }
    if (calc.naoRegistradas.length) {
      observacao += ` "${calc.naoRegistradas.join('", "')}" nao esta cadastrada no Banco de Genetica e foi ignorada.`;
    }

    setResultado({
      tipo: "sucesso",
      titulo: "Resultado do cruzamento",
      cruzamento: `${pai.corMutacao || "Sem mutacao"} x ${mae.corMutacao || "Sem mutacao"}`,
      genotipos: `Loci considerados: ${calc.lociConsiderados.join(", ") || "-"}`,
      possibilidades,
      observacao,
    });
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-5"
        style={{
          background: "#FAF3E6",
          border: "1px solid #e3d3b4",
        }}
      >
        <div className="ui-mono text-xs mb-2" style={{ color: "#8a7a63" }}>
          CALCULADORA GENETICA
        </div>

        <h2
          className="text-2xl font-semibold mb-2"
          style={{ color: "#2B241C" }}
        >
          Cruzamento de Ring Neck
        </h2>

        <p className="text-sm" style={{ color: "#6f6254" }}>
          Selecione o pai e a mae cadastrados para calcular as possibilidades
          conhecidas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#FAF3E6",
            border: "1px solid #e3d3b4",
          }}
        >
          <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>
            PAI
          </div>

          <select
            className="w-full rounded-xl px-3 py-3"
            style={{
              border: "1px solid #d8c6a5",
              background: "#fffaf0",
              color: "#2B241C",
            }}
            value={paiId}
            onChange={(e) => {
              setPaiId(e.target.value);
              setResultado(null);
            }}
          >
            <option value="">-- selecione o pai --</option>

            {machos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} - {a.corMutacao || "Sem mutacao"}
              </option>
            ))}
          </select>

          {pai && (
            <div className="mt-4 text-sm" style={{ color: "#5e5143" }}>
              <strong>{pai.nome}</strong>
              <br />
              Mutacao: {pai.corMutacao || "Nao informada"}
              <br />
              Portador de:{" "}
              {(pai.portadores || []).length > 0
                ? pai.portadores.join(", ")
                : "Nenhuma informada"}
            </div>
          )}
        </div>

        <div
          className="rounded-2xl p-5"
          style={{
            background: "#FAF3E6",
            border: "1px solid #e3d3b4",
          }}
        >
          <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>
            MAE
          </div>

          <select
            className="w-full rounded-xl px-3 py-3"
            style={{
              border: "1px solid #d8c6a5",
              background: "#fffaf0",
              color: "#2B241C",
            }}
            value={maeId}
            onChange={(e) => {
              setMaeId(e.target.value);
              setResultado(null);
            }}
          >
            <option value="">-- selecione a mae --</option>

            {femeas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} - {a.corMutacao || "Sem mutacao"}
              </option>
            ))}
          </select>

          {mae && (
            <div className="mt-4 text-sm" style={{ color: "#5e5143" }}>
              <strong>{mae.nome}</strong>
              <br />
              Mutacao: {mae.corMutacao || "Nao informada"}
              <br />
              Portador de:{" "}
              {(mae.portadores || []).length > 0
                ? mae.portadores.join(", ")
                : "Nenhuma informada"}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={calcular}
        className="px-5 py-3 rounded-xl font-semibold"
        style={{
          background: "#C69A2E",
          color: "#2B241C",
        }}
      >
        Calcular cruzamento
      </button>

      {resultado && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#FAF3E6",
            border: "1px solid #e3d3b4",
          }}
        >
          {resultado.tipo === "erro" && (
            <div style={{ color: "#A6402B" }}>
              {resultado.mensagem}
            </div>
          )}

          {resultado.tipo === "sucesso" && (
            <>
              <div
                className="ui-mono text-xs mb-2"
                style={{ color: "#8a7a63" }}
              >
                {resultado.titulo}
              </div>

              <div
                className="text-xl font-semibold"
                style={{ color: "#2B241C" }}
              >
                {resultado.cruzamento}
              </div>

              <div
                className="mt-2 text-sm"
                style={{ color: "#8a7a63" }}
              >
                Genotipo considerado: {resultado.genotipos}
              </div>

              <div className="mt-4 space-y-3">
                {resultado.possibilidades.map((item, index) => (
                  <div
                    key={`${item.nome}-${item.detalhe}-${index}`}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      background: "#f2e8d4",
                      border: "1px solid #dfcba7",
                    }}
                  >
                    <div>
                      <div className="font-semibold">
                        {item.nome}
                      </div>

                      <div
                        className="text-xs mt-1"
                        style={{ color: "#8a7a63" }}
                      >
                        {item.detalhe}
                      </div>
                    </div>

                    <span className="font-semibold">
                      {item.percentual}
                    </span>
                  </div>
                ))}
              </div>

              <p
                className="mt-4 text-sm"
                style={{ color: "#6f6254" }}
              >
                {resultado.observacao}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
function MutacoesTab({ mutacoes, onSave, onDelete }) {
  const [nova, setNova] = useState(emptyMutacao());
  const [editId, setEditId] = useState(null);

  function submit() {
    if (!nova.nome.trim()) return;
    onSave({ ...nova, id: editId });
    setNova(emptyMutacao());
    setEditId(null);
  }

  function editar(m) {
    setNova(m);
    setEditId(m.id);
  }

  return (
    <div>
      <SectionTitle>Banco de Genetica</SectionTitle>
      <p className="ui-sans text-sm mb-5" style={{ color: "#F1E6D2" }}>
        Cadastro das mutacoes que voce trabalha. Essa base vai alimentar a calculadora genetica na proxima fase.
      </p>

      <Card className="p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Nome da mutacao"><input style={inputStyle} value={nova.nome} onChange={(e) => setNova((m) => ({ ...m, nome: e.target.value }))} placeholder="ex: Pallid Azul Turquesa" /></Field>
          <Field label="Nome alternativo"><input style={inputStyle} value={nova.nomeAlternativo} onChange={(e) => setNova((m) => ({ ...m, nomeAlternativo: e.target.value }))} placeholder="opcional" /></Field>
          <Field label="Tipo de heranca">
            <select style={inputStyle} value={nova.tipoHeranca} onChange={(e) => setNova((m) => ({ ...m, tipoHeranca: e.target.value }))}>{TIPOS_HERANCA.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="Combina com (outras mutacoes)"><input style={inputStyle} value={nova.combinaCom} onChange={(e) => setNova((m) => ({ ...m, combinaCom: e.target.value }))} placeholder="ex: Azul, Turquesa, Violeta (possivel)" /></Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Como identificar visualmente"><input style={inputStyle} value={nova.comoIdentificar} onChange={(e) => setNova((m) => ({ ...m, comoIdentificar: e.target.value }))} placeholder="ex: penas com tom diluido, olhos claros" /></Field>
          <Field label="Observacoes"><input style={inputStyle} value={nova.observacoes} onChange={(e) => setNova((m) => ({ ...m, observacoes: e.target.value }))} placeholder="opcional" /></Field>
        </div>
        <div className="flex gap-3">
          <button onClick={submit} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            <Plus size={15} /> {editId ? "Salvar edicao" : "Adicionar mutacao"}
          </button>
          {editId && (
            <button onClick={() => { setNova(emptyMutacao()); setEditId(null); }} className="ui-sans px-4 py-2 rounded-lg text-sm" style={{ background: "#e3d3b4", color: "#2B241C" }}>
              Cancelar
            </button>
          )}
        </div>
      </Card>

      {mutacoes.length === 0 ? (
        <Card className="p-6 text-center ui-sans" style={{ color: "#8a7a63" }}>Nenhuma mutacao cadastrada ainda.</Card>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {mutacoes.map((m) => (
            <Card key={m.id} className="p-4 ui-sans">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-semibold" style={{ color: "#2B241C" }}>{m.nome}</div>
                {m.synced === false && <span className="text-[10px] font-semibold shrink-0" style={{ color: "#a6402b" }}>NAO SINCRONIZADO</span>}
              </div>
              {m.nomeAlternativo && <div className="text-xs mb-1" style={{ color: "#8a7a63" }}>tambem chamada: {m.nomeAlternativo}</div>}
              <div className="text-xs mb-1 ui-mono" style={{ color: "#a6402b" }}>{m.tipoHeranca}</div>
              {m.combinaCom && <div className="text-xs mb-1" style={{ color: "#556b3f" }}>Combina com: {m.combinaCom}</div>}
              {m.comoIdentificar && <div className="text-xs mb-1" style={{ color: "#7a6a52" }}>{m.comoIdentificar}</div>}
              {m.observacoes && <div className="text-xs italic mb-2" style={{ color: "#7a6a52" }}>{m.observacoes}</div>}
              <div className="flex gap-2 mt-2">
                <button onClick={() => editar(m)} className="text-xs px-2 py-1 rounded" style={{ background: "#e3d3b4", color: "#2B241C" }}>Editar</button>
                <button onClick={() => onDelete(m.id)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "#f0dad4", color: "#a6402b" }}><Trash2 size={12} /> Remover</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Clientes (Fase 1)
// ---------------------------------------------------------------------------

function ClienteCard({ c, historico, onOpen, onEdit }) {
  return (
    <Card className="p-4 ui-sans">
      <div className="cursor-pointer" onClick={() => onOpen(c.id)}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-semibold" style={{ color: "#2B241C" }}>{c.nome}</div>
          {c.synced === false && <span className="text-[10px] font-semibold shrink-0" style={{ color: "#a6402b" }}>NAO SINCRONIZADO</span>}
        </div>
        {c.telefone && (
          <div className="text-xs flex items-center gap-1 mb-1" style={{ color: "#8a7a63" }}>
            <Phone size={11} /> {c.telefone}
          </div>
        )}
        <div className="flex gap-3 mt-2">
          <span className="text-xs ui-mono" style={{ color: "#556b3f" }}>{historico.totalAves} {historico.totalAves === 1 ? "compra" : "compras"}</span>
          <span className="text-xs ui-mono" style={{ color: "#a6402b" }}>{money(historico.totalGasto)}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => onEdit(c)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "#e3d3b4", color: "#2B241C" }}>
          <Pencil size={12} /> Editar
        </button>
        <button onClick={() => onOpen(c.id)} className="text-xs px-2 py-1 rounded" style={{ background: "#f0e6d2", color: "#8a6f2e" }}>
          Ver historico
        </button>
      </div>
    </Card>
  );
}

function ClienteForm({ inicial, onSave, onCancel, error }) {
  const [c, setC] = useState(inicial);
  const set = (k) => (e) => setC((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Card className="p-4 sm:p-6 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field label="Nome"><input style={inputStyle} value={c.nome} onChange={set("nome")} placeholder="ex: Joao da Silva" /></Field>
        <Field label="Telefone"><input style={inputStyle} value={c.telefone} onChange={set("telefone")} placeholder="ex: (11) 99999-9999" /></Field>
      </div>
      <div className="grid grid-cols-1 gap-4 mb-4">
        <Field label="Endereco"><input style={inputStyle} value={c.endereco} onChange={set("endereco")} placeholder="opcional" /></Field>
        <Field label="Observacoes"><input style={inputStyle} value={c.observacoes} onChange={set("observacoes")} placeholder="opcional" /></Field>
      </div>
      {error && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
      <div className="flex gap-3">
        <button onClick={() => onSave(c)} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          <Save size={15} /> Salvar
        </button>
        <button onClick={onCancel} className="ui-sans px-4 py-2 rounded-lg text-sm" style={{ background: "#e3d3b4", color: "#2B241C" }}>Cancelar</button>
      </div>
    </Card>
  );
}

function ClienteDetalhe({ cliente, historico, onBack, onEdit, onDelete }) {
  const [mostrarIndicacao, setMostrarIndicacao] = useState(false);

  const primeiroNome = (cliente.nome || "").trim().split(" ")[0] || cliente.nome;
  const ultimaAve = historico.compras[0]?.nome;
  const mensagemPadrao =
    `Oi, ${primeiroNome}! Tudo bem? ­😊\n\n` +
    `Queria saber como ${ultimaAve ? `o(a) ${ultimaAve} esta` : "a ave esta"} se adaptando a nova casa.\n\n` +
    `Ficamos muito felizes em fazer parte desse momento! ­ƒÉª­ƒÆÖ\n\n` +
    `Se voce estiver satisfeito com nosso atendimento e conhecer alguem procurando uma ave, pode indicar o Criatorio Dantas. Sera um prazer atender sua indicacao!`;

  const [mensagem, setMensagem] = useState(mensagemPadrao);

  return (
    <div>
      <button onClick={onBack} className="ui-sans text-xs mb-4 px-3 py-1.5 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>← Voltar pra lista</button>
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-xl font-bold ui-sans" style={{ color: "#2B241C" }}>{cliente.nome}</div>
            {cliente.telefone && <div className="text-sm flex items-center gap-1 mt-1" style={{ color: "#8a7a63" }}><Phone size={13} /> {cliente.telefone}</div>}
            {cliente.endereco && <div className="text-sm mt-1 ui-sans" style={{ color: "#8a7a63" }}>{cliente.endereco}</div>}
            {cliente.observacoes && <div className="text-sm mt-1 italic ui-sans" style={{ color: "#8a7a63" }}>{cliente.observacoes}</div>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => onEdit(cliente)} className="text-xs px-2 py-1 rounded ui-sans" style={{ background: "#e3d3b4", color: "#2B241C" }}>Editar</button>
            <button onClick={() => onDelete(cliente.id)} className="text-xs px-2 py-1 rounded flex items-center gap-1 ui-sans" style={{ background: "#f0dad4", color: "#a6402b" }}><Trash2 size={12} /> Remover</button>
          </div>
        </div>

        {cliente.telefone ? (
          <div className="flex flex-wrap gap-2 mb-4">
            <a
              href={whatsappUrl(cliente.telefone)}
              target="_blank" rel="noopener noreferrer"
              className="ui-sans flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "#556b3f", color: "#F1E6D2" }}
            >
              <MessageCircle size={15} /> Falar com cliente
            </a>
            <button
              onClick={() => setMostrarIndicacao((v) => !v)}
              className="ui-sans flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "#C69A2E", color: "#2B1D14" }}
            >
              ­🤝 Pedir indicacao
            </button>
          </div>
        ) : (
          <div className="ui-sans text-xs mb-4" style={{ color: "#8a7a63" }}>
            Cadastra um telefone pra esse cliente pra poder falar por WhatsApp direto daqui.
          </div>
        )}

        {mostrarIndicacao && cliente.telefone && (
          <div className="mb-2 p-3 rounded-lg" style={{ background: "#f5f0e4", border: "1px solid #e3d3b4" }}>
            <div className="ui-mono text-xs mb-2" style={{ color: "#8a7a63" }}>MENSAGEM (edite antes de enviar)</div>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={6}
              className="ui-sans w-full rounded-lg p-2 text-sm"
              style={{ background: "#fff", border: "1px solid #e3d3b4", color: "#2B241C", resize: "vertical" }}
            />
            <div className="flex gap-2 mt-2">
              <a
                href={whatsappUrl(cliente.telefone, mensagem)}
                target="_blank" rel="noopener noreferrer"
                className="ui-sans flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "#556b3f", color: "#F1E6D2" }}
              >
                <MessageCircle size={15} /> Abrir WhatsApp com essa mensagem
              </a>
              <button
                onClick={() => setMensagem(mensagemPadrao)}
                className="ui-sans text-xs px-3 py-2 rounded-lg"
                style={{ background: "#e3d3b4", color: "#2B241C" }}
              >
                Restaurar sugestao
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-3 mb-2 mt-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <SummaryCard label="Total de aves compradas" value={historico.totalAves} />
          <SummaryCard label="Total gasto" value={money(historico.totalGasto)} tone="good" />
          <SummaryCard label="Ultima compra" value={historico.ultimaCompra || "-"} />
        </div>
      </Card>

      <div className="ui-mono text-xs mb-3" style={{ color: "#F1E6D2" }}>HISTORICO DE COMPRAS</div>
      {historico.compras.length === 0 ? (
        <Card className="p-6 text-center ui-sans" style={{ color: "#8a7a63" }}>
          Nenhuma compra encontrada com esse telefone ainda. Se esse cliente ja comprou uma ave, confere se o telefone bate com o que foi preenchido na venda.
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
                <div className="text-xs" style={{ color: "#8a7a63" }}>{a.dataVenda || "sem data"}</div>
              </div>
              <div className="text-sm font-semibold" style={{ color: "#556b3f" }}>{money(a.valorVenda)}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientesTab({ clientes, aves, onSave, onDelete, onImportar }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalheId, setDetalheId] = useState(null);
  const [formError, setFormError] = useState("");

  const candidatos = clientesCandidatosDeVendas(aves, clientes);

  const filtrados = clientes.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (c.nome || "").toLowerCase().includes(q) || (c.telefone || "").includes(q);
  });

  function salvar(cliente) {
    const result = onSave(cliente);
    if (result?.ok) {
      setShowForm(false);
      setEditando(null);
      setFormError("");
    } else {
      setFormError(result?.error || "Nao consegui salvar.");
    }
  }

  const clienteDetalhe = detalheId ? clientes.find((c) => c.id === detalheId) : null;
  if (clienteDetalhe) {
    const historico = historicoCliente(clienteDetalhe, aves);
    return (
      <div>
        <SectionTitle>Clientes</SectionTitle>
        <ClienteDetalhe
          cliente={clienteDetalhe}
          historico={historico}
          onBack={() => setDetalheId(null)}
          onEdit={(c) => { setDetalheId(null); setEditando(c); setShowForm(true); setFormError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          onDelete={(id) => { onDelete(id); setDetalheId(null); }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <SectionTitle>Clientes</SectionTitle>
        {!showForm && (
          <button
            onClick={() => { setEditando(emptyCliente()); setShowForm(true); setFormError(""); }}
            className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "#C69A2E", color: "#2B1D14" }}
          >
            <Plus size={16} /> Novo cliente
          </button>
        )}
      </div>

      {showForm && (
        <ClienteForm
          inicial={editando || emptyCliente()}
          onSave={salvar}
          onCancel={() => { setShowForm(false); setEditando(null); setFormError(""); }}
          error={formError}
        />
      )}

      {candidatos.length > 0 && !showForm && (
        <Card className="p-4 mb-6">
          <div className="ui-sans text-sm mb-3" style={{ color: "#2B241C" }}>
            Encontramos <strong>{candidatos.length}</strong> {candidatos.length === 1 ? "comprador" : "compradores"} em vendas ja cadastradas que ainda {candidatos.length === 1 ? "nao esta" : "nao estao"} na lista de clientes:
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {candidatos.map((c, i) => (
              <span key={i} className="ui-mono text-xs px-2 py-1 rounded" style={{ background: "#f0e6d2", color: "#8a6f2e" }}>
                {c.nome}{c.telefone ? ` - ${c.telefone}` : ""}
              </span>
            ))}
          </div>
          <button
            onClick={() => onImportar(candidatos)}
            className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "#556b3f", color: "#F1E6D2" }}
          >
            <Users size={15} /> Importar {candidatos.length === 1 ? "esse comprador" : "todos como clientes"}
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
          Nenhum cliente cadastrado ainda. Cadastre pelo nome/telefone de quem ja comprou (ou vai comprar) uma ave.
        </Card>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {filtrados.map((c) => (
            <ClienteCard
              key={c.id}
              c={c}
              historico={historicoCliente(c, aves)}
              onOpen={setDetalheId}
              onEdit={(cli) => { setEditando(cli); setShowForm(true); setFormError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fornecedores (espelha Clientes, so que do lado da compra)
// ---------------------------------------------------------------------------

function FornecedorCard({ f, historico, onOpen, onEdit }) {
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

function FornecedorForm({ inicial, onSave, onCancel, error }) {
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

function FornecedorDetalhe({ fornecedor, historico, onBack, onEdit, onDelete }) {
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

      <div className="ui-mono text-xs mb-3" style={{ color: "#F1E6D2" }}>HISTORICO DE COMPRAS</div>
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

function FornecedoresTab({ fornecedores, aves, onSave, onDelete, onImportar }) {
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

function PosVendaCard({ ave, cliente, onUpdate }) {
  const tone = POSVENDA_TONS[ave.statusPosVenda] || "default";
  const tones = {
    default: "#e3d3b4",
    gold: "#f0dab0",
    good: "#c8dcb8",
  };
  return (
    <Card className="p-4 ui-sans">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
            {ave.foto ? <img src={ave.foto} className="w-full h-full object-cover" alt="" /> : null}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{ave.nome}</div>
            <div className="text-xs truncate" style={{ color: "#8a7a63" }}>
              {cliente ? cliente.nome : (ave.compradorNome || "comprador nao identificado")}
              {(cliente?.telefone || ave.compradorTelefone) ? ` - ${cliente?.telefone || ave.compradorTelefone}` : ""}
            </div>
            <div className="text-xs" style={{ color: "#8a7a63" }}>Vendida em {ave.dataVenda || "data nao informada"}</div>
          </div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded ui-mono shrink-0" style={{ background: tones[tone], color: "#2B241C" }}>{ave.statusPosVenda}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <Field label="Status do pos-venda">
          <select style={inputStyle} value={ave.statusPosVenda} onChange={(e) => onUpdate(ave.id, { statusPosVenda: e.target.value })}>
            {STATUS_POSVENDA.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Cliente satisfeito">
          <select style={inputStyle} value={ave.clienteSatisfeito || "Pendente"} onChange={(e) => onUpdate(ave.id, { clienteSatisfeito: e.target.value })}>
            {SATISFACAO_OPCOES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Data da entrega">
          <input style={inputStyle} type="date" value={ave.dataEntrega || ""} onChange={(e) => onUpdate(ave.id, { dataEntrega: e.target.value })} />
        </Field>
        <Field label="Data do ultimo contato">
          <input style={inputStyle} type="date" value={ave.dataUltimoContato || ""} onChange={(e) => onUpdate(ave.id, { dataUltimoContato: e.target.value })} />
        </Field>
      </div>
      <Field label="Observacoes">
        <input style={inputStyle} value={ave.obsPosVenda || ""} onChange={(e) => onUpdate(ave.id, { obsPosVenda: e.target.value })} placeholder="ex: pediu dica de alimentacao, tudo bem" />
      </Field>
      {ave.synced === false && <div className="text-[10px] mt-2 font-semibold" style={{ color: "#a6402b" }}>NAO SINCRONIZADO</div>}
    </Card>
  );
}

function PosVendaTab({ aves, clientes, onUpdate }) {
  const [filtroStatus, setFiltroStatus] = useState("");
  const vendidas = aves
    .filter((a) => a.status === "Vendida")
    .filter((a) => !filtroStatus || (a.statusPosVenda || "Venda realizada") === filtroStatus)
    .sort((a, b) => (b.dataVenda || "").localeCompare(a.dataVenda || ""));

  const pendentes = aves.filter((a) => a.status === "Vendida" && (a.clienteSatisfeito || "Pendente") === "Pendente").length;

  return (
    <div>
      <SectionTitle>Pos-venda</SectionTitle>

      {pendentes > 0 && (
        <div className="ui-sans mb-4 px-4 py-2 rounded-lg text-sm" style={{ background: "#f5e9c8", color: "#8a6f2e", border: "1px solid #d6c39a" }}>
          {pendentes} {pendentes === 1 ? "venda esta" : "vendas estao"} com acompanhamento pendente.
        </div>
      )}

      <Field label="Filtrar por status">
        <select style={{ ...inputStyle, maxWidth: 280 }} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">-- todos --</option>
          {STATUS_POSVENDA.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>

      <div className="mt-4">
        {vendidas.length === 0 ? (
          <Card className="p-8 text-center ui-sans" style={{ color: "#8a7a63" }}>Nenhuma venda encontrada com esse filtro.</Card>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {vendidas.map((a) => (
              <PosVendaCard key={a.id} ave={a} cliente={clientes.find((c) => c.id === a.clienteId)} onUpdate={onUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Indicacoes (Fase 6)
// ---------------------------------------------------------------------------

const INDICACAO_TONS = {
  Nova: "gold",
  "Em atendimento": "gold",
  "Venda realizada": "good",
  "Nao converteu": "bad",
};

function IndicacaoCard({ indicacao, cliente, onUpdate, onDelete }) {
  const tone = INDICACAO_TONS[indicacao.status] || "default";
  const tones = { default: "#e3d3b4", gold: "#f0dab0", good: "#c8dcb8", bad: "#f0c9c0" };
  return (
    <Card className="p-4 ui-sans">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-semibold text-sm" style={{ color: "#2B241C" }}>{indicacao.nomeIndicado}</div>
          {indicacao.telefoneIndicado && (
            <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "#8a7a63" }}>
              <Phone size={11} /> {indicacao.telefoneIndicado}
            </div>
          )}
          <div className="text-xs mt-0.5" style={{ color: "#8a7a63" }}>
            Indicado por <strong>{cliente ? cliente.nome : "(cliente removido)"}</strong>{indicacao.data ? ` em ${indicacao.data}` : ""}
          </div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded ui-mono shrink-0" style={{ background: tones[tone], color: "#2B241C" }}>{indicacao.status}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
        <Field label="Status">
          <select style={inputStyle} value={indicacao.status} onChange={(e) => onUpdate(indicacao.id, { status: e.target.value })}>
            {STATUS_INDICACAO.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Observacoes">
          <input style={inputStyle} value={indicacao.observacoes || ""} onChange={(e) => onUpdate(indicacao.id, { observacoes: e.target.value })} placeholder="opcional" />
        </Field>
      </div>

      <div className="flex items-center justify-between mt-2">
        {indicacao.synced === false && <div className="text-[10px] font-semibold" style={{ color: "#a6402b" }}>NAO SINCRONIZADO</div>}
        <button onClick={() => onDelete(indicacao.id)} className="text-xs px-2 py-1 rounded flex items-center gap-1 ml-auto" style={{ background: "#f0dad4", color: "#a6402b" }}>
          <Trash2 size={12} /> Remover
        </button>
      </div>
    </Card>
  );
}

function NovaIndicacaoForm({ clientes, onSave }) {
  const [form, setForm] = useState(emptyIndicacao());
  const [error, setError] = useState("");

  function submit() {
    if (!form.clienteIndicouId) { setError("Escolhe quem fez a indicacao."); return; }
    const result = onSave({ ...form, data: form.data || hojeISO() });
    if (result?.ok) {
      setForm(emptyIndicacao());
      setError("");
    } else {
      setError(result?.error || "Nao consegui salvar.");
    }
  }

  return (
    <Card className="p-4 sm:p-6 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field label="Cliente que indicou">
          <select style={inputStyle} value={form.clienteIndicouId} onChange={(e) => setForm((f) => ({ ...f, clienteIndicouId: e.target.value }))}>
            <option value="">-- selecione --</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Data da indicacao">
          <input style={inputStyle} type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field label="Nome da pessoa indicada">
          <input style={inputStyle} value={form.nomeIndicado} onChange={(e) => setForm((f) => ({ ...f, nomeIndicado: e.target.value }))} placeholder="ex: Marcos" />
        </Field>
        <Field label="Telefone da pessoa indicada">
          <input style={inputStyle} value={form.telefoneIndicado} onChange={(e) => setForm((f) => ({ ...f, telefoneIndicado: e.target.value }))} placeholder="opcional" />
        </Field>
      </div>
      <Field label="Observacoes">
        <input style={inputStyle} value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} placeholder="opcional" />
      </Field>
      {error && <div className="ui-sans text-sm mt-3 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
      <button onClick={submit} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold mt-4" style={{ background: "#C69A2E", color: "#2B1D14" }}>
        <Plus size={15} /> Registrar indicacao
      </button>
    </Card>
  );
}

// Ranking e metricas de indicacao - tudo calculado na hora a partir do que
// ja existe em `indicacoes`, sem nenhum campo ou tabela nova.
function metricasIndicacoes(indicacoes, clientes) {
  const total = indicacoes.length;
  const convertidas = indicacoes.filter((i) => i.status === "Venda realizada").length;
  const naoConverteu = indicacoes.filter((i) => i.status === "Nao converteu").length;
  const taxaConversao = total > 0 ? (convertidas / total) * 100 : 0;

  const contagem = new Map(); // clienteId -> count
  indicacoes.forEach((i) => {
    if (!i.clienteIndicouId) return;
    contagem.set(i.clienteIndicouId, (contagem.get(i.clienteIndicouId) || 0) + 1);
  });

  const ranking = Array.from(contagem.entries())
    .map(([clienteId, count]) => ({ cliente: clientes.find((c) => c.id === clienteId), count }))
    .filter((r) => r.cliente)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { total, convertidas, naoConverteu, taxaConversao, ranking };
}

function RankingIndicacoes({ indicacoes, clientes }) {
  const m = metricasIndicacoes(indicacoes, clientes);
  const medalhas = ["­🏆", "­🥈", "­🥉"];

  return (
    <div className="mb-6">
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <SummaryCard label="Total de indicacoes" value={m.total} />
        <SummaryCard label="Viraram venda" value={m.convertidas} tone="good" />
        <SummaryCard label="Nao converteram" value={m.naoConverteu} tone="bad" />
        <SummaryCard label="Taxa de conversao" value={`${m.taxaConversao.toFixed(0)}%`} />
      </div>

      {m.ranking.length > 0 && (
        <Card className="p-4">
          <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>QUEM MAIS INDICA</div>
          <div className="flex flex-col gap-2">
            {m.ranking.map((r, i) => (
              <div key={r.cliente.id} className="flex items-center justify-between ui-sans text-sm">
                <span style={{ color: "#2B241C" }}>
                  {medalhas[i] || `${i + 1}º`} {r.cliente.nome}
                </span>
                <span className="ui-mono" style={{ color: "#8a6f2e" }}>{r.count} {r.count === 1 ? "indicacao" : "indicacoes"}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function IndicacoesTab({ indicacoes, clientes, onSave, onDelete }) {
  const [filtroStatus, setFiltroStatus] = useState("");

  const filtradas = indicacoes.filter((i) => !filtroStatus || i.status === filtroStatus);

  return (
    <div>
      <SectionTitle>Indicacoes</SectionTitle>

      <RankingIndicacoes indicacoes={indicacoes} clientes={clientes} />

      <NovaIndicacaoForm clientes={clientes} onSave={onSave} />

      <Field label="Filtrar por status">
        <select style={{ ...inputStyle, maxWidth: 280 }} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">-- todos --</option>
          {STATUS_INDICACAO.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>

      <div className="mt-4">
        {filtradas.length === 0 ? (
          <Card className="p-8 text-center ui-sans" style={{ color: "#8a7a63" }}>
            {indicacoes.length === 0 ? "Nenhuma indicacao registrada ainda." : "Nenhuma indicacao com esse filtro."}
          </Card>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {filtradas.map((i) => (
              <IndicacaoCard
                key={i.id}
                indicacao={i}
                cliente={clientes.find((c) => c.id === i.clienteIndicouId)}
                onUpdate={(id, patch) => onSave({ ...indicacoes.find((x) => x.id === id), ...patch })}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Perfil do Criador (Fase 8C)
// ---------------------------------------------------------------------------

const UF_LISTA = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function PerfilTab({ perfil, onSave }) {
  const [form, setForm] = useState(perfil);
  const [salvo, setSalvo] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit() {
    onSave(form);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div className="max-w-xl">
      <SectionTitle>Perfil do Criador</SectionTitle>
      <p className="ui-sans text-sm mb-5" style={{ color: "#F1E6D2" }}>
        Essas informacoes aparecem publicamente em todos os seus anuncios, pra quem se interessar saber quem e voce e como falar com voce.
      </p>
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Nome do criatorio"><input style={inputStyle} value={form.nomeCriatorio} onChange={set("nomeCriatorio")} placeholder="ex: Criatorio Dantas" /></Field>
          <Field label="WhatsApp de contato"><input style={inputStyle} value={form.whatsapp} onChange={set("whatsapp")} placeholder="ex: (11) 99999-9999" /></Field>
          <Field label="Cidade"><input style={inputStyle} value={form.cidade} onChange={set("cidade")} placeholder="ex: Barueri" /></Field>
          <Field label="UF">
            <select style={inputStyle} value={form.uf} onChange={set("uf")}>
              <option value="">--</option>
              {UF_LISTA.map((u) => <option key={u}>{u}</option>)}
            </select>
          </Field>
        </div>
        {form.synced === false && <div className="ui-sans text-xs mb-3" style={{ color: "#a6402b" }}>Salvando no banco...</div>}
        {salvo && <div className="ui-sans text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#e4ead9", color: "#556b3f" }}>Perfil salvo.</div>}
        <button onClick={submit} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          <Save size={15} /> Salvar perfil
        </button>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Anuncios (Fase 8C)
// ---------------------------------------------------------------------------

function NovoAnuncioForm({ ave, onSave, onCancel }) {
  const [form, setForm] = useState({
    ...emptyAnuncio(),
    aveId: ave.id,
    nomeAve: ave.nome,
    especie: ave.especie,
    corMutacao: ave.corMutacao,
    sexo: ave.sexo,
    nascimento: ave.nascimento,
    foto: ave.foto,
  });
  const [error, setError] = useState("");

  function submit() {
    const result = onSave(form);
    if (!result?.ok) setError(result?.error || "Nao consegui salvar.");
  }

  return (
    <Card className="p-4 mb-3">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
          {ave.foto ? <img src={ave.foto} className="w-full h-full object-cover" alt="" /> : null}
        </div>
        <div className="ui-sans font-semibold text-sm" style={{ color: "#2B241C" }}>{ave.nome}</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <Field label="Preco (R$)">
          <input style={inputStyle} type="number" step="0.01" value={form.preco} onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))} />
        </Field>
        <Field label="Descricao">
          <input style={inputStyle} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="ex: dócil, já desmamado" />
        </Field>
      </div>
      {error && <div className="ui-sans text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
      <div className="flex gap-2">
        <button onClick={submit} className="ui-sans text-sm px-4 py-2 rounded-lg font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>Publicar anuncio</button>
        <button onClick={onCancel} className="ui-sans text-sm px-4 py-2 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>Cancelar</button>
      </div>
    </Card>
  );
}


       const STATUS_ANUNCIO_TONS = { pendente: "#f0dab0", aprovado: "#c8dcb8", rejeitado: "#f0c9c0" };
       const STATUS_ANUNCIO_LABEL = { pendente: "EM ANALISE", aprovado: "APROVADO", rejeitado: "REJEITADO" };

 function AnuncioCard({ anuncio, onToggleAtivo, onDelete }) {
       const status = anuncio.status || "pendente";
  return (
    <Card className="p-3 flex items-center gap-3 ui-sans">
      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
        {anuncio.foto ? <img src={anuncio.foto} className="w-full h-full object-cover" alt="" /> : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{anuncio.nomeAve}</div>
        <div className="text-xs" style={{ color: "#8a7a63" }}>{anuncio.especie} - {anuncio.corMutacao || "sem mutacao"}</div>
        <div className="text-sm font-semibold" style={{ color: "#556b3f" }}>{money(anuncio.preco)}</div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-[10px] px-2 py-1 rounded ui-mono" style={{ background: STATUS_ANUNCIO_TONS[status], color: "#2B241C" }}>
          {STATUS_ANUNCIO_LABEL[status]}
        </span>
        <span className="text-[10px] px-2 py-1 rounded ui-mono" style={{ background: anuncio.ativo ? "#c8dcb8" : "#e3d3b4", color: "#2B241C" }}>
          {anuncio.ativo ? "NO AR" : "PAUSADO"}
        </span>
        <div className="flex gap-1">
          <button onClick={() => onToggleAtivo(anuncio)} className="text-xs px-2 py-1 rounded" style={{ background: "#e3d3b4", color: "#2B241C" }}>
            {anuncio.ativo ? "Pausar" : "Reativar"}
          </button>
          <button onClick={() => onDelete(anuncio.id)} className="text-xs px-2 py-1 rounded" style={{ background: "#f0dad4", color: "#a6402b" }}><Trash2 size={12} /></button>
        </div>
      </div>
    </Card>
  );
}

function AnunciosTab({ aves, anuncios, perfil, onSave, onToggleAtivo, onDelete, setTab }) {
  const [criandoParaId, setCriandoParaId] = useState(null);

  const avesAnunciaveis = aves.filter((a) => a.status === "A venda" && !anuncios.some((an) => an.aveId === a.id));
  const perfilIncompleto = !perfil.whatsapp?.trim();

  return (
    <div>
      <SectionTitle>Anuncios</SectionTitle>

      {perfilIncompleto && (
        <div className="ui-sans mb-4 px-4 py-3 rounded-lg text-sm flex items-center justify-between gap-3" style={{ background: "#f5e9c8", color: "#8a6f2e", border: "1px solid #d6c39a" }}>
          <span>Preenche seu WhatsApp no Perfil do Criador antes de publicar, pra quem se interessar saber como falar com voce.</span>
          <button onClick={() => setTab("perfil")} className="ui-sans px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0" style={{ background: "#2B1D14", color: "#F1E6D2" }}>Ir pro Perfil</button>
        </div>
      )}

      <div className="ui-mono text-xs mb-3" style={{ color: "#F1E6D2" }}>AVES DISPONIVEIS PRA ANUNCIAR</div>
      {avesAnunciaveis.length === 0 ? (
        <Card className="p-4 mb-6 ui-sans text-sm" style={{ color: "#8a7a63" }}>
          Nenhuma ave nova pra anunciar (marca uma ave como "A venda" no cadastro pra ela aparecer aqui).
        </Card>
      ) : (
        <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {avesAnunciaveis.map((a) =>
            criandoParaId === a.id ? (
              <div key={a.id} className="sm:col-span-2">
                <NovoAnuncioForm ave={a} onSave={(form) => { const r = onSave(form); if (r?.ok) setCriandoParaId(null); return r; }} onCancel={() => setCriandoParaId(null)} />
              </div>
            ) : (
              <Card key={a.id} className="p-3 flex items-center gap-3 ui-sans">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
                  {a.foto ? <img src={a.foto} className="w-full h-full object-cover" alt="" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{a.nome}</div>
                  <div className="text-xs" style={{ color: "#8a7a63" }}>{a.especie}</div>
                </div>
                <button onClick={() => setCriandoParaId(a.id)} className="text-xs px-2 py-1 rounded font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>Anunciar</button>
              </Card>
            )
          )}
        </div>
      )}

      <div className="ui-mono text-xs mb-3" style={{ color: "#F1E6D2" }}>MEUS ANUNCIOS ({anuncios.length})</div>
      {anuncios.length === 0 ? (
        <Card className="p-6 text-center ui-sans" style={{ color: "#8a7a63" }}>Nenhum anuncio publicado ainda.</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {anuncios.map((an) => <AnuncioCard key={an.id} anuncio={an} onToggleAtivo={onToggleAtivo} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Aprovacoes (Fase 8D) - so visivel/carregado pra quem esta na tabela admins
// ---------------------------------------------------------------------------

function AprovacaoCard({ anuncio, criador, onModerar }) {
  return (
    <Card className="p-4 ui-sans">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
          {anuncio.foto ? <img src={anuncio.foto} className="w-full h-full object-cover" alt="" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm" style={{ color: "#2B241C" }}>{anuncio.nomeAve}</div>
          <div className="text-xs" style={{ color: "#8a7a63" }}>{anuncio.especie} - {anuncio.corMutacao || "sem mutacao"} - {anuncio.sexo}</div>
          <div className="text-sm font-semibold" style={{ color: "#556b3f" }}>{money(anuncio.preco)}</div>
          {anuncio.descricao && <div className="text-xs italic mt-1" style={{ color: "#7a6a52" }}>{anuncio.descricao}</div>}
        </div>
      </div>
      <div className="text-xs mb-3 ui-mono" style={{ color: "#8a7a63" }}>
        Criador: {criador?.nomeCriatorio || "(perfil nao preenchido)"} {criador?.whatsapp ? `- ${criador.whatsapp}` : ""} {criador?.cidade ? `- ${criador.cidade}/${criador.uf || ""}` : ""}
      </div>
      {anuncio.status === "pendente" ? (
        <div className="flex gap-2">
          <button onClick={() => onModerar(anuncio.id, "aprovado")} className="ui-sans text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1" style={{ background: "#556b3f", color: "#F1E6D2" }}>
            <Check size={13} /> Aprovar
          </button>
          <button onClick={() => onModerar(anuncio.id, "rejeitado")} className="ui-sans text-xs px-3 py-2 rounded-lg font-semibold" style={{ background: "#f0dad4", color: "#a6402b" }}>
            Rejeitar
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-[10px] px-2 py-1 rounded ui-mono" style={{ background: STATUS_ANUNCIO_TONS[anuncio.status], color: "#2B241C" }}>
            {STATUS_ANUNCIO_LABEL[anuncio.status]}
          </span>
          <button onClick={() => onModerar(anuncio.id, "pendente")} className="text-xs underline" style={{ color: "#8a7a63" }}>Voltar pra analise</button>
        </div>
      )}
    </Card>
  );
}

function AprovacoesTab({ anuncios, perfis, onModerar }) {
  const [filtro, setFiltro] = useState("pendente");
  const perfisPorUser = new Map(perfis.map((p) => [p.userId, p]));
  const filtrados = anuncios.filter((a) => (a.status || "pendente") === filtro);

  return (
    <div>
      <SectionTitle>Aprovacoes</SectionTitle>
      <p className="ui-sans text-sm mb-5" style={{ color: "#F1E6D2" }}>
        Painel administrativo - aqui voce ve anuncios de todos os criadores da plataforma, nao so os seus.
      </p>

      <div className="flex gap-2 mb-5">
        {["pendente", "aprovado", "rejeitado"].map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className="ui-sans text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: filtro === s ? "#C69A2E" : "#3a2314", color: filtro === s ? "#2B1D14" : "#b09a78" }}
          >
            {STATUS_ANUNCIO_LABEL[s]} ({anuncios.filter((a) => (a.status || "pendente") === s).length})
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <Card className="p-8 text-center ui-sans" style={{ color: "#8a7a63" }}>Nenhum anuncio nesse status.</Card>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {filtrados.map((a) => (
            <AprovacaoCard key={a.id} anuncio={a} criador={perfisPorUser.get(a.userId)} onModerar={onModerar} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Autenticacao
// ---------------------------------------------------------------------------

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#2B1D14" }}>
        <Loader2 className="animate-spin" color="#C69A2E" size={28} />
      </div>
    );
  }

  if (!session) return <AuthPage />;

  return <AppInner user={session.user} onLogout={() => supabase.auth.signOut()} />;
}
