import React, { useState, useEffect, useRef, useCallback } from "react";
import { StatCard, TreeCard } from "./features/dashboard/components/CardsDashboard";
const AveCard = React.lazy(() => import("./features/plantel/components/AveCard"));
import { Card, SectionTitle, inputStyle, Field } from "./components/ui/SharedUI";
import SuporteWhatsApp from "./components/SuporteWhatsApp";
import { compressPhoto } from "./features/plantel/utils/comprimirFoto";
import { emptyAve, emptyDespesa, emptyMutacao, emptyIndicacao, emptyAnuncio, emptyPerfilCriador, emptyPerfilPrivado, emptyCliente, emptyFornecedor } from "./lib/modelos";
import { hojeISO, primeiroDiaMesISO, ultimoDiaMesISO, primeiroDiaAnoISO, money } from "./lib/formatadores";
import { normalizeTelefone, whatsappUrl } from "./lib/telefone";
import { computeFinanceiro, computeFinanceiroPeriodo } from "./features/financeiro/utils/calcularFinanceiro";
import { drawPlaque } from "./features/plantel/utils/desenharPlaca";
import {
  Bird, Plus, Search, GitBranch, Tag, Upload, Trash2, X, Loader2, Save, ChevronLeft, ChevronRight, Menu, CalendarDays,
  Download, Feather, DollarSign, LogOut, LayoutDashboard, Dna, Users, Phone, Pencil, ClipboardCheck, Truck, MessageCircle, Handshake, Megaphone, UserCircle, ShieldCheck, Check, Bell, Eye, MousePointerClick, Egg, BookOpen,
} from "lucide-react";

import { supabase } from "./supabaseClient";

import {
  listRows, saveRow, deleteRow, uid, getPerfil, savePerfil, getPerfilPrivado, savePerfilPrivado, listAnuncios, saveAnuncio, deleteAnuncio,
  checkIsAdmin, listTodosAnunciosParaAdmin, updateAnuncioStatus, listPerfisPublicos,
  listPerdidas, savePerdida, deletePerdida, buscarPerdidaPorAnilha,
  listAchadosAnilha, atualizarStatusAchado,
  listAnunciosAvesPerdidasAdmin, atualizarStatusAnuncioAvePerdida,
} from "./lib/db";

import AuthPage from "./components/AuthPage";
import { checkIsMaster } from "./lib/masterAccess";
const MasterApp = React.lazy(() => import("./features/master/MasterApp"));
import RequiredPasswordChange from "./components/RequiredPasswordChange";
import NotificationsCenter from "./components/NotificationsCenter";
const PerdiUmaAve = React.lazy(() => import("./features/aves-perdidas").then((m) => ({ default: m.PerdiUmaAve })));
const ConteudoAdmin = React.lazy(() => import("./conteudo/ConteudoAdmin"));
const AdminCampanhas = React.lazy(() => import("./features/campanhas").then((m) => ({ default: m.AdminCampanhas })));
const ModeracaoAvesPerdidasTab = React.lazy(() => import("./features/aves-perdidas/components/ModeracaoAvesPerdidasTab"));
const AchadosTab = React.lazy(() => import("./features/aves-perdidas/components/AchadosTab"));
const AprovacoesTab = React.lazy(() => import("./features/anuncios/components/AprovacoesTab"));
const CalculadoraGenetica = React.lazy(() => import("./features/genetica/components/CalculadoraGenetica"));
const ListaTab = React.lazy(() => import("./features/plantel/components/ListaTab"));
const ReservasTab = React.lazy(() => import("./features/reservas/ReservasTab"));
const DashboardTab = React.lazy(() => import("./features/dashboard/components/DashboardTab"));
const FinanceiroTab = React.lazy(() => import("./features/financeiro/components/FinanceiroTab"));
const ReproducaoTab = React.lazy(() => import("./features/reproducao/components/ReproducaoTab"));
const ClientesTab = React.lazy(() => import("./features/clientes/ClientesTab"));
const FornecedoresTab = React.lazy(() => import("./features/fornecedores/FornecedoresTab"));
const PosVendaTab = React.lazy(() => import("./features/pos-venda/PosVendaTab"));
const IndicacoesTab = React.lazy(() => import("./features/indicacoes/IndicacoesTab"));
const PerfilTab = React.lazy(() => import("./features/perfil/PerfilTab"));
const AnunciosTab = React.lazy(() => import("./features/anuncios/AnunciosTab"));
const FormTab = React.lazy(() => import("./features/plantel/FormTab"));
const SeletorComprador = React.lazy(() => import("./features/plantel/components/SeletoresCadastro").then((m) => ({ default: m.SeletorComprador })));
const SeletorFornecedor = React.lazy(() => import("./features/plantel/components/SeletoresCadastro").then((m) => ({ default: m.SeletorFornecedor })));
const PesoHistorico = React.lazy(() => import("./features/plantel/PesoHistorico"));
const ArvoreTab = React.lazy(() => import("./features/plantel/ArvoreTab"));
const PlacaTab = React.lazy(() => import("./features/plantel/PlacaTab"));
const MutacoesTab = React.lazy(() => import("./features/genetica/MutacoesTab"));
import { usePath } from "./publico/roteador";

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
const STATUS_ANUNCIO_TONS = { pendente: "#f0dab0", aprovado: "#c8dcb8", rejeitado: "#f0c9c0" };
const STATUS_ANUNCIO_LABEL = { pendente: "EM ANALISE", aprovado: "APROVADO", rejeitado: "REJEITADO" };

// ---------- Compressao de foto ----------
// Historico do cliente e sempre CALCULADO na hora, cruzando pelo telefone com
// as aves ja vendidas. Nao grava nada de novo nas aves, nao duplica dado.
// Historico do fornecedor: espelha historicoCliente, so que olhando pro lado
// da COMPRA (origemTipo === "Comprada") em vez da venda.
// ---------------------------------------------------------------------------

function AppInner({ user, onLogout }) {
  const [aves, setAves] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [reservasFinanceiro, setReservasFinanceiro] = useState([]);
  const [pagamentosReservasFinanceiro, setPagamentosReservasFinanceiro] = useState([]);
  const [mutacoes, setMutacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [indicacoes, setIndicacoes] = useState([]);
  const [posturas, setPosturas] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [perfil, setPerfil] = useState(emptyPerfilCriador());
  const [perfilPrivado, setPerfilPrivado] = useState(emptyPerfilPrivado());
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [anunciosAprovacao, setAnunciosAprovacao] = useState([]);
  const [perfisPublicos, setPerfisPublicos] = useState([]);
  const [achados, setAchados] = useState([]);
  const [anunciosPerdidasAdmin, setAnunciosPerdidasAdmin] = useState([]);
  const [perdidas, setPerdidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyAve());
  const [saving, setSaving] = useState(false);
  const [placaId, setPlacaId] = useState("");
  const [arvoreId, setArvoreId] = useState("");
  const [statusFilter, setStatusFilter] = useState("plantel"); // categoria inicial do Meu plantel
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

  const loadReservasFinanceiro = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([
        supabase.from("reservas_aves").select("id, cliente_id, ave_id, valor_total, status, data_reserva, updated_at").eq("user_id", user.id).eq("status", "concluida"),
        supabase.from("reserva_pagamentos").select("id, reserva_id, valor, data_pagamento, status, descricao, forma_pagamento").eq("user_id", user.id),
      ]);
      if (r.error) throw r.error;
      if (p.error) throw p.error;
      setReservasFinanceiro(r.data || []);
      setPagamentosReservasFinanceiro(p.data || []);
    } catch (e) {
      setError("Não foi possível atualizar os recebimentos das reservas (" + (e?.message || "erro desconhecido") + ").");
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
      const [p, privado] = await Promise.all([getPerfil(user.id), getPerfilPrivado(user.id)]);
      setPerfilPrivado({ ...emptyPerfilPrivado(), ...privado });
      if (p) {
        setPerfil({ ...emptyPerfilCriador(), ...p, synced: true });
        return;
      }

      // Dados do cadastro ficam no Auth metadata ate o primeiro acesso.
      const metadata = user.user_metadata || {};
      const nome = (metadata.nome || "").trim();
      const sobrenome = (metadata.sobrenome || "").trim();
      const telefone = (metadata.telefone || metadata.whatsapp || "").trim();
      if (nome || sobrenome || telefone) {
        const perfilInicial = {
          ...emptyPerfilCriador(),
          nome,
          sobrenome,
          nomeCompleto: [nome, sobrenome].filter(Boolean).join(" "),
          telefone,
          whatsapp: telefone,
        };
        await savePerfil(user.id, perfilInicial);
        setPerfil({ ...perfilInicial, synced: true });
      }
    } catch {
      // Mantem o cadastro funcional mesmo se a tabela de perfil estiver indisponivel.
    }
  }, [user.id, user.user_metadata]);

  const loadAdminStatus = useCallback(async () => {
    try {
      const admin = await checkIsAdmin(user.id);
      setIsAdminUser(admin);

      if (admin) {
        const [todos, perfis, achadosData, perdidasData] = await Promise.all([
          listTodosAnunciosParaAdmin(),
          listPerfisPublicos(),
          listAchadosAnilha().catch(() => []),
          listAnunciosAvesPerdidasAdmin().catch(() => []),
        ]);

        setAnunciosAprovacao(todos);
        setPerfisPublicos(perfis);
        setAchados(achadosData);
        setAnunciosPerdidasAdmin(perdidasData);
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

  const loadPosturas = useCallback(async () => {
    try {
      const items = await listRows("posturas", user.id);
      setPosturas(items.map((p) => ({ ...p, synced: true })));
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, so fica vazio
    }
  }, [user.id]);

  useEffect(() => {
    loadAves();
    loadDespesas();
    loadReservasFinanceiro();
    loadMutacoes();
    loadClientes();
    loadFornecedores();
    loadIndicacoes();
    loadAnuncios();
    loadPerfil();
    loadAdminStatus();
    loadPerdidas();
    loadPosturas();
  }, [loadAves, loadDespesas, loadReservasFinanceiro, loadMutacoes, loadClientes, loadFornecedores, loadIndicacoes, loadAnuncios, loadPerfil, loadAdminStatus, loadPerdidas, loadPosturas]);

  function startNew() {
    setForm(emptyAve());
    setTab("form");
  }

  function goToLista(filter) {
    setStatusFilter(filter || "plantel");
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
    if (!form.id && form.status === "A venda" && !(Number(form.anuncioPreco) > 0)) {
      setError("Informe o preco do anuncio para cadastrar uma ave ja a venda.");
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
      if (!form.id && toSave.status === "A venda" && Number(toSave.anuncioPreco) > 0) {
        handleSaveAnuncio({
          ...emptyAnuncio(), aveId: id, nomeAve: toSave.nome, especie: toSave.especie,
          corMutacao: toSave.corMutacao, sexo: toSave.sexo, nascimento: toSave.nascimento,
          foto: toSave.foto, preco: toSave.anuncioPreco, descricao: toSave.anuncioDescricao || "",
        });
      }
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
      return true;
    } catch (e) {
      setError(
        `Mutacao ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'mutacoes' ainda nao existe no seu Supabase, roda o schema_fase2.sql no SQL Editor."
      );
      return false;
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

  function handleSavePostura(postura) {
    const { synced, ...limpa } = postura;
    const id = limpa.id || uid();
    const toSave = { ...limpa, id, criadoEm: limpa.criadoEm || new Date().toISOString() };
    setPosturas((prev) => {
      const others = prev.filter((p) => p.id !== id);
      return [...others, { ...toSave, synced: false }];
    });
    saveRow("posturas", user.id, toSave)
      .then(() => setPosturas((prev) => prev.map((p) => (p.id === id ? { ...p, synced: true } : p))))
      .catch((e) => setError(
        `Postura ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'posturas' ainda nao existe no seu Supabase, roda o schema_fase_posturas.sql no SQL Editor."
      ));
  }

  async function handleDeletePostura(id) {
    setPosturas((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteRow("posturas", id);
    } catch {
      // ja removida localmente
    }
  }

  // Cria a ave filhote (so quando o usuario clica) e liga o ovo a ela.
  async function handleRegistrarNascimento(postura, numeroOvo, { nome, dataEclosao }) {
    const pai = aves.find((a) => a.id === postura.paiId);
    const mae = aves.find((a) => a.id === postura.maeId);
    const aveId = uid();
    const nascimento = formatarDataBR(dataEclosao);
    const novaAve = {
      ...emptyAve(),
      id: aveId,
      nome: (nome || "").trim() || `Filhote ${nascimento.slice(0, 5)}`,
      especie: pai?.especie || mae?.especie || "Ring Neck",
      sexo: "Indefinido",
      nascimento,
      paiId: postura.paiId || "",
      maeId: postura.maeId || "",
      status: "No plantel",
      origemTipo: "Nasceu no plantel",
      criador: pai?.criador || mae?.criador || "Dantas",
      criadoEm: new Date().toISOString(),
    };
    setAves((prev) => [...prev, { ...novaAve, synced: false }].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    handleSavePostura({
      ...postura,
      ovos: (postura.ovos || []).map((o) => (o.n === numeroOvo ? { ...o, status: "Nasceu", aveId, dataEclosao } : o)),
    });
    try {
      await saveRow("aves", user.id, novaAve);
      setAves((prev) => prev.map((a) => (a.id === aveId ? { ...a, synced: true } : a)));
    } catch (e) {
      setError(`O filhote "${novaAve.nome}" ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). Use o botao Sincronizar no card dele.`);
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
    return [...others, { ...toSave, status: ehNovo ? (isAdminUser ? "aprovado" : "pendente") : toSave.status, synced: false }];
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

  async function handleSavePerfil(novoPerfil) {
    setPerfil({ ...novoPerfil, synced: false });
    try {
      const { email, ...publico } = novoPerfil;
      await savePerfil(user.id, publico);
      setPerfil({ ...novoPerfil, synced: true });
    } catch (e) {
      setError(
        `Nao foi possivel salvar o perfil no banco (${e?.message || "erro desconhecido"}). ` +
        "Confira se a tabela 'perfil_criador' esta disponivel."
      );
      throw e;
    }
  }

  async function handleSavePerfilPrivado(dados) {
    try {
      await savePerfilPrivado(user.id, dados);
      setPerfilPrivado(dados);
    } catch (e) {
      setError("Nao foi possivel salvar o endereco privado (" + (e?.message || "erro desconhecido") + ").");
      throw e;
    }
  }

  async function handleUpdateEmail(novoEmail) {
    const { error: authError } = await supabase.auth.updateUser({ email: novoEmail });
    if (authError) throw new Error("Nao foi possivel solicitar a troca de e-mail: " + authError.message);
    return "A solicitacao de troca de e-mail foi enviada; confirme pelo link recebido para concluir a alteracao.";
  }

  async function handleModerarAnuncio(id, novoStatus) {
    setAnunciosAprovacao((prev) => prev.map((a) => (a.id === id ? { ...a, status: novoStatus } : a)));
    try {
      await updateAnuncioStatus(id, novoStatus);
    } catch (e) {
      setError(`Nao consegui atualizar o status desse anuncio (${e?.message || "erro desconhecido"}).`);
    }
  }

  async function handleModerarAvePerdida(id, novoStatus) {
    const anterior = anunciosPerdidasAdmin;
    setAnunciosPerdidasAdmin((prev) => prev.map((a) => a.id === id ? { ...a, status: novoStatus } : a));
    try {
      await atualizarStatusAnuncioAvePerdida(id, novoStatus);
    } catch (e) {
      setAnunciosPerdidasAdmin(anterior);
      setError(`Nao consegui moderar esse anuncio (${e?.message || "erro desconhecido"}).`);
    }
  }

  async function handleAtualizarAchado(id, novoStatus) {
    setAchados((prev) => prev.map((a) => (a.id === id ? { ...a, status: novoStatus } : a)));
    try {
      await atualizarStatusAchado(id, novoStatus);
    } catch (e) {
      setError(`Nao consegui atualizar esse achado (${e?.message || "erro desconhecido"}).`);
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

  // Backup completo: todas as tabelas do criador num unico arquivo ("versao: 2").
  // O formato antigo (so uma lista de aves) continua sendo aceito na importacao.
  function handleExport() {
    const backup = {
      app: "avespet",
      versao: 2,
      exportadoEm: new Date().toISOString(),
      dados: {
        aves: aves.map(semSynced),
        despesas: despesas.map(semSynced),
        mutacoes: mutacoes.map(semSynced),
        clientes: clientes.map(semSynced),
        fornecedores: fornecedores.map(semSynced),
        indicacoes: indicacoes.map(semSynced),
        posturas: posturas.map(semSynced),
        anuncios: anuncios.map(semSynced),
        perdidas: perdidas.map(semSynced),
        perfil: Object.values(semSynced(perfil)).some(Boolean) ? semSynced(perfil) : null,
      },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_avespet_${hojeLocalISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Restaura GRAVANDO no banco (antes so ia pra tela do aparelho). Mescla por id:
  // registros com o mesmo id sao sobrescritos pelos do arquivo, nada e apagado.
  // Pode importar o mesmo arquivo de novo sem duplicar.
  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      const dados = Array.isArray(imported) ? { aves: imported } : imported?.dados;
      if (!dados || typeof dados !== "object") throw new Error("arquivo invalido");
      const lista = (nome) => (Array.isArray(dados[nome]) ? dados[nome].filter((r) => r && r.id) : []);
      const perfilImp = dados.perfil && typeof dados.perfil === "object" && !Array.isArray(dados.perfil) ? dados.perfil : null;

      const rotulos = {
        aves: "aves", despesas: "despesas", mutacoes: "mutacoes", clientes: "clientes", fornecedores: "fornecedores",
        indicacoes: "indicacoes", posturas: "posturas", anuncios: "anuncios", perdidas: "aves perdidas",
      };
      const resumo = Object.keys(rotulos).map((k) => [rotulos[k], lista(k).length]).filter(([, n]) => n > 0);
      if (!resumo.length && !perfilImp) throw new Error("backup vazio");
      const linhas = resumo.map(([nome, n]) => `- ${n} ${nome}`).concat(perfilImp ? ["- seu perfil de criador"] : []).join("\\n");
      if (!confirm(`Restaurar este backup?

${linhas}

Registros com o mesmo ID serao sobrescritos pelos do arquivo. Nada e apagado.`)) return;

      const tarefas = [];
      ["aves", "despesas", "mutacoes", "clientes", "fornecedores", "indicacoes", "posturas"].forEach((tabela) =>
        lista(tabela).forEach((r) => tarefas.push({ chave: `${tabela}:${r.id}`, run: () => saveRow(tabela, user.id, semSynced(r)) }))
      );
      lista("anuncios").forEach((r) => tarefas.push({ chave: `anuncios:${r.id}`, run: () => saveAnuncio(user.id, semSynced(r)) }));
      lista("perdidas").forEach((r) => tarefas.push({ chave: `perdidas:${r.id}`, run: () => savePerdida(user.id, semSynced(r)) }));
      if (perfilImp) tarefas.push({ chave: "perfil", run: () => savePerfil(user.id, semSynced(perfilImp)) });

      const gravados = new Set();
      let falhas = 0;
      for (let i = 0; i < tarefas.length; i += 5) {
        const lote = tarefas.slice(i, i + 5);
        const resultados = await Promise.allSettled(lote.map((tarefa) => tarefa.run()));
        resultados.forEach((r, j) => {
          if (r.status === "fulfilled") gravados.add(lote[j].chave);
          else falhas++;
        });
      }

      const mesclar = (tabela, prev) => {
        const porId = new Map(prev.map((r) => [r.id, r]));
        lista(tabela).forEach((r) => porId.set(r.id, { ...r, synced: gravados.has(`${tabela}:${r.id}`) }));
        return Array.from(porId.values());
      };
      const porNome = (a, b) => (a.nome || "").localeCompare(b.nome || "");
      setAves((p) => mesclar("aves", p).sort(porNome));
      setDespesas((p) => mesclar("despesas", p).sort((a, b) => (a.data || "").localeCompare(b.data || "")));
      setMutacoes((p) => mesclar("mutacoes", p).sort(porNome));
      setClientes((p) => mesclar("clientes", p).sort(porNome));
      setFornecedores((p) => mesclar("fornecedores", p).sort(porNome));
      setIndicacoes((p) => mesclar("indicacoes", p).sort((a, b) => (b.data || "").localeCompare(a.data || "")));
      setPosturas((p) => mesclar("posturas", p));
      setPerdidas((p) => mesclar("perdidas", p));
      if (perfilImp) setPerfil({ ...emptyPerfilCriador(), ...perfilImp, synced: gravados.has("perfil") });
      // anuncios: o banco decide o status (criador comum volta pra analise), entao recarrega de la
      if (lista("anuncios").length) await loadAnuncios();

      const gravadosOk = tarefas.length - falhas;
      setError(
        falhas === 0
          ? `Backup restaurado: ${gravadosOk} ${gravadosOk === 1 ? "registro gravado" : "registros gravados"} no banco.${lista("anuncios").length && !isAdminUser ? " Os anuncios voltam para analise." : ""}`
          : `Backup restaurado em parte: ${gravadosOk} de ${tarefas.length} gravados no banco, ${falhas} ${falhas === 1 ? "falhou" : "falharam"}. Importe o mesmo arquivo de novo para tentar outra vez (nada e duplicado).`
      );
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

  const navGroups = [
    { title: "CONTA", items: [{ id: "perfil", label: "Meu perfil", icon: UserCircle }] },
    { title: "VISÃO GERAL", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }] },
    { title: "MEU CRIATÓRIO", items: [
      { id: "lista", label: "Meu plantel", icon: Bird },
      { id: "reservas", label: "Reservas", icon: CalendarDays },
      { id: "form", label: "Cadastrar", icon: Plus },
      { id: "arvore", label: "Árvore genealógica", icon: GitBranch },
      { id: "reproducao", label: "Reprodução", icon: Egg },
      { id: "mutacoes", label: "Genética", icon: Dna },
      { id: "placa", label: "Placa", icon: Tag },
    ] },
    { title: "GESTÃO", items: [
      { id: "financeiro", label: "Financeiro", icon: DollarSign },
      { id: "clientes", label: "Clientes", icon: Users },
      { id: "fornecedores", label: "Fornecedores", icon: Truck },
      { id: "posvenda", label: "Pós-venda", icon: ClipboardCheck },
      { id: "indicacoes", label: "Indicações", icon: Handshake },
    ] },
    { title: "AVESPET", items: [
      { id: "anuncios", label: "Anúncios", icon: Megaphone },
      { id: "perdi-uma-ave", label: "Ave perdida", icon: Bird },
    ] },
    ...(isAdminUser ? [{ title: "ADMINISTRAÇÃO", items: [
      { id: "aprovacoes", label: "Aprovações", icon: ShieldCheck },
      { id: "achados", label: "Achados", icon: Bell },
      { id: "aves-perdidas-admin", label: "Aves perdidas", icon: Bird },
      { id: "campanhas-admin", label: "Campanhas", icon: Megaphone },
      { id: "conteudo", label: "Conteúdo", icon: BookOpen },
    ] }] : []),
  ];

  const renderNav = (compact = false, mobile = false) => navGroups.map((group) => (
    <div key={group.title} className="mb-3">
      {!compact && <div className="ui-sans px-3 pt-3 pb-2 text-[10px] font-bold tracking-[0.14em]" style={{ color: "#526A5B" }}>{group.title}</div>}
      <div className="flex flex-col gap-1">
        {group.items.map(({ id, label: lbl, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              if (id === "form") startNew();
              else if (id === "lista") goToLista(null);
              else setTab(id);
              if (mobile) setMobileMenuOpen(false);
            }}
            title={compact ? lbl : undefined}
            aria-label={lbl}
            className={`ui-sans w-full flex items-center ${compact ? "justify-center px-2" : "gap-3 px-3"} py-2.5 rounded-xl text-sm text-left transition-colors`}
            style={{
              background: tab === id ? "#E5F2E9" : "transparent",
              color: tab === id ? "#176B45" : "#52665B",
              fontWeight: tab === id ? 700 : 500,
              minHeight: 42,
            }}
          >
            <Icon size={18} />
            {!compact && <span className="truncate">{lbl}</span>}
            {!compact && tab === id && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: "#23935F" }} />}
          </button>
        ))}
      </div>
    </div>
  ));

  return (
    <div className="min-h-screen w-full flex" style={{ background: "#F3F7F4", fontFamily: "'Inter', sans-serif", color: "#20352A" }}>
      <style>{`
        .ui-sans { font-family: 'Inter', sans-serif; }
        .ui-mono { font-family: 'IBM Plex Mono', monospace; }
        ::selection { background: #CDE8D6; color: #174C34; }
        .avespet-workspace { min-width: 0; }
        @media (max-width: 767px) { .avespet-workspace { width: 100%; } }
      `}</style>

      <aside
        className={`hidden md:flex fixed inset-y-0 left-0 z-30 flex-col border-r transition-[width] duration-200 ${sidebarCollapsed ? "w-[76px]" : "w-[264px]"}`}
        style={{ background: "#FFFFFF", borderColor: "#E2EBE4", boxShadow: "4px 0 24px rgba(31, 73, 48, 0.035)" }}
      >
        <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"} px-4 py-5 border-b`} style={{ borderColor: "#EDF2EE", minHeight: 76 }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: "#E5F2E9", color: "#1D754B" }}><Feather size={21} /></div>
            {!sidebarCollapsed && <div className="min-w-0">
              <div className="text-lg font-extrabold tracking-tight" style={{ color: "#1D3B2B" }}>Aves<span style={{ color: "#26945F" }}>pet</span></div>
              <div className="text-[10px] font-semibold tracking-[0.12em]" style={{ color: "#526A5B" }}>ÁREA DO CRIADOR</div>
            </div>}
            {!sidebarCollapsed && perfil.logoUrl && <img src={perfil.logoUrl} alt="Logo do criatório" className="h-10 w-10 shrink-0 rounded-xl border border-[#E2EBE4] bg-white object-contain p-0.5" />}
          </div>
          {!sidebarCollapsed && <button onClick={() => setSidebarCollapsed(true)} aria-label="Recolher menu" title="Recolher menu" className="rounded-lg p-2 hover:bg-[#F1F6F2]" style={{ color: "#3F5D49" }}><ChevronLeft size={18} /></button>}
          {sidebarCollapsed && <button onClick={() => setSidebarCollapsed(false)} aria-label="Expandir menu" title="Expandir menu" className="absolute -right-3 top-7 rounded-full border bg-white p-1.5 shadow-sm" style={{ borderColor: "#E2EBE4", color: "#267A50" }}><ChevronRight size={16} /></button>}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">{renderNav(sidebarCollapsed)}</nav>
        <div className={`border-t p-3 ${sidebarCollapsed ? "text-center" : ""}`} style={{ borderColor: "#EDF2EE" }}>
          {!sidebarCollapsed && <div className="mb-2 truncate px-2 text-[11px]" style={{ color: "#526A5B" }}>{aves.length} {aves.length === 1 ? "ave cadastrada" : "aves cadastradas"}</div>}
          <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-2"}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: "#E5F2E9", color: "#267A50" }}>{(perfil.nome || user.email || "C").slice(0,1).toUpperCase()}</div>
            {!sidebarCollapsed && <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold" style={{ color: "#294536" }}>{perfil.nome || "Minha conta"}</div><div className="truncate text-[10px]" style={{ color: "#526A5B" }}>{user.email}</div></div>}
            <button onClick={onLogout} title="Sair" aria-label="Sair" className="rounded-lg p-2 hover:bg-[#FCEFED]" style={{ color: "#9B625B" }}><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <div className={`avespet-workspace min-h-screen flex-1 flex flex-col transition-[margin] duration-200 ${sidebarCollapsed ? "md:ml-[76px]" : "md:ml-[264px]"}`}>
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b bg-white/95 px-4 py-3 backdrop-blur md:px-7" style={{ borderColor: "#D7E4DA", minHeight: 68, boxShadow: "0 2px 10px rgba(28, 67, 43, 0.04)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu" className="md:hidden rounded-xl p-2" style={{ background: "#EAF4ED", color: "#267A50" }}><Menu size={21} /></button>
            <div className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#E5F2E9", color: "#1D754B" }}><Feather size={19} /></div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold md:text-base" style={{ color: "#234332" }}>{navGroups.flatMap((g) => g.items).find((item) => item.id === tab)?.label || "Painel do criador"}</div>
              <div className="hidden text-[11px] sm:block" style={{ color: "#526A5B" }}>Gestão do seu criatório</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-right"><div className="text-xs font-semibold" style={{ color: "#345442" }}>{perfil.nome || "Criador"}</div><div className="text-[10px]" style={{ color: "#526A5B" }}>Área do criador</div></div>
            {perfil.logoUrl && <img src={perfil.logoUrl} alt="Logo do criatório" className="h-9 w-9 rounded-lg border border-[#D7E4DA] bg-white object-contain p-0.5" />}
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold" style={{ background: "#E5F2E9", color: "#267A50" }}>{(perfil.nome || user.email || "C").slice(0,1).toUpperCase()}</div>
          </div>
        </header>

        {mobileMenuOpen && <div className="fixed inset-0 z-50 md:hidden">
          <button aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-y-0 left-0 flex w-[min(86vw,340px)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-4" style={{ borderColor: "#E5EDE7" }}>
              <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#E5F2E9", color: "#1D754B" }}><Feather size={19} /></div><div className="font-extrabold" style={{ color: "#1D3B2B" }}>Aves<span style={{ color: "#26945F" }}>pet</span></div>{perfil.logoUrl && <img src={perfil.logoUrl} alt="Logo do criatório" className="h-9 w-9 rounded-lg border border-[#E2EBE4] bg-white object-contain p-0.5" />}</div>
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu" className="rounded-lg p-2" style={{ color: "#3F5D49" }}><X size={20} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3">{renderNav(false, true)}</nav>
            <div className="border-t p-4" style={{ borderColor: "#EDF2EE" }}>
              <div className="mb-3 truncate text-xs" style={{ color: "#526A5B" }}>{user.email}</div>
              <button onClick={onLogout} className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: "#FCEFED", color: "#9B5148" }}><LogOut size={17} /> Sair da conta</button>
            </div>
          </div>
        </div>}

        <main className="flex-1 p-4 md:p-7 lg:p-8 overflow-y-auto w-full min-w-0" style={{ minHeight: "60vh" }}>
        <NotificationsCenter userId={user.id} isAdmin={isAdminUser} onNavigate={setTab} />
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
            <React.Suspense fallback={<div className="flex items-center gap-2 ui-sans py-6" style={{ color: "#F1E6D2" }}><Loader2 className="animate-spin" size={18} /> Carregando funcionalidade...</div>}>
            {tab === "dashboard" && <DashboardTab aves={aves} despesas={despesas} clientes={clientes} indicacoes={indicacoes} posturas={posturas} setTab={setTab} goToLista={goToLista} STATUS_PLANTEL={STATUS_PLANTEL} SectionTitle={SectionTitle} StatCard={StatCard} money={money} Card={Card} />}

            {tab === "reproducao" && (
              <ReproducaoTab aves={aves} posturas={posturas} onSave={handleSavePostura} onDelete={handleDeletePostura} onNascimento={handleRegistrarNascimento} Card={Card} Field={Field} inputStyle={inputStyle} SectionTitle={SectionTitle} />
            )}

            {tab === "reservas" && <ReservasTab userId={user.id} perfil={perfil} clientes={clientes} aves={aves} posturas={posturas} onReservaConcluida={loadAves} onFinanceiroAtualizado={loadReservasFinanceiro} Card={Card} SectionTitle={SectionTitle} />}

            {tab === "lista" && (
              <ListaTab
                aves={filtered} todasAves={aves} search={search} setSearch={setSearch}
                onEdit={startEdit} onDelete={handleDelete} onNew={startNew}
                onSync={handleSync} onExport={handleExport} onImport={handleImport}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                casaisAgrupados={casaisAgrupados}
                Card={Card} SectionTitle={SectionTitle} AveCard={AveCard} FILTER_LABELS={FILTER_LABELS}
              />
            )}

            {tab === "form" && (
              <FormTab
                form={form} setForm={setForm} onSave={handleSave} onPhoto={handlePhoto} saving={saving}
                machoOptions={machoOptions} femeaOptions={femeaOptions} parceiroOptions={parceiroOptions}
                mutacoes={mutacoes} clientes={clientes} fornecedores={fornecedores} onCancel={() => setTab("lista")}
                Card={Card} Field={Field} SectionTitle={SectionTitle} inputStyle={inputStyle}
                ESPECIES={ESPECIES} SEXOS={SEXOS} STATUS_AVE={STATUS_AVE} ORIGEM_TIPOS={ORIGEM_TIPOS}
                SeletorComprador={SeletorComprador} SeletorFornecedor={SeletorFornecedor} PesoHistorico={PesoHistorico}
              />
            )}

            {tab === "arvore" && (
              <ArvoreTab aves={aves} arvoreId={arvoreId} setArvoreId={setArvoreId} arvoreAve={arvoreAve} pai={pai} mae={mae} parceiro={parceiro} filhos={filhos} SectionTitle={SectionTitle} Field={Field} inputStyle={inputStyle} Card={Card} />
            )}

            {tab === "placa" && (
              <PlacaTab aves={aves} placaId={placaId} setPlacaId={setPlacaId} canvasRef={canvasRef} onDownload={downloadPlaca} SectionTitle={SectionTitle} Field={Field} inputStyle={inputStyle} Card={Card} />
            )}

            {tab === "financeiro" && (
              <FinanceiroTab aves={aves} despesas={despesas} reservasFinanceiro={reservasFinanceiro} pagamentosReservasFinanceiro={pagamentosReservasFinanceiro} clientes={clientes} onSaveDespesa={handleSaveDespesa} onDeleteDespesa={handleDeleteDespesa} emptyDespesa={emptyDespesa} primeiroDiaMesISO={primeiroDiaMesISO} hojeISO={hojeISO} ultimoDiaMesISO={ultimoDiaMesISO} primeiroDiaAnoISO={primeiroDiaAnoISO} computeFinanceiro={computeFinanceiro} computeFinanceiroPeriodo={computeFinanceiroPeriodo} money={money} DESPESA_TIPOS={DESPESA_TIPOS} inputStyle={inputStyle} SectionTitle={SectionTitle} Card={Card} Field={Field} />
            )}

            {tab === "mutacoes" && (
  <>
              <CalculadoraGenetica aves={aves} mutacoes={mutacoes} />
              {isAdminUser && <div className="my-8 h-px" style={{ background: "#e3d3b4" }} />}

              <MutacoesTab
                mutacoes={mutacoes}
                onSave={handleSaveMutacao}
                onDelete={handleDeleteMutacao}
                emptyMutacao={emptyMutacao}
                TIPOS_HERANCA={TIPOS_HERANCA}
                SectionTitle={SectionTitle}
                Field={Field}
                inputStyle={inputStyle}
                Card={Card}
              />
  </>
            )}

            {tab === "clientes" && (
              <ClientesTab clientes={clientes} aves={aves} onSave={handleSaveCliente} onDelete={handleDeleteCliente} onImportar={handleImportarClientes} Card={Card} Field={Field} SectionTitle={SectionTitle} SummaryCard={StatCard} money={money} whatsappUrl={whatsappUrl} emptyCliente={emptyCliente} inputStyle={inputStyle} />
            )}

            {tab === "fornecedores" && (
              <FornecedoresTab fornecedores={fornecedores} aves={aves} onSave={handleSaveFornecedor} onDelete={handleDeleteFornecedor} onImportar={handleImportarFornecedores} Card={Card} Field={Field} SectionTitle={SectionTitle} SummaryCard={StatCard} money={money} whatsappUrl={whatsappUrl} emptyFornecedor={emptyFornecedor} inputStyle={inputStyle} />
            )}

            {tab === "posvenda" && (
              <PosVendaTab aves={aves} clientes={clientes} onUpdate={handleUpdatePosVenda} Card={Card} Field={Field} SectionTitle={SectionTitle} inputStyle={inputStyle} STATUS_POSVENDA={STATUS_POSVENDA} SATISFACAO_OPCOES={SATISFACAO_OPCOES} />
            )}

            {tab === "indicacoes" && (
              <IndicacoesTab indicacoes={indicacoes} clientes={clientes} onSave={handleSaveIndicacao} onDelete={handleDeleteIndicacao} Card={Card} Field={Field} SectionTitle={SectionTitle} SummaryCard={StatCard} inputStyle={inputStyle} STATUS_INDICACAO={STATUS_INDICACAO} emptyIndicacao={emptyIndicacao} hojeISO={hojeISO} />
            )}

            {tab === "perdi-uma-ave" && <PerdiUmaAve userId={user.id} />}

            {tab === "anuncios" && (
              <AnunciosTab
                aves={aves} anuncios={anuncios} perfil={perfil}
                onSave={handleSaveAnuncio} onToggleAtivo={handleToggleAnuncioAtivo} onDelete={handleDeleteAnuncio}
                setTab={setTab}
                Card={Card} Field={Field} SectionTitle={SectionTitle}
                inputStyle={inputStyle} emptyAnuncio={emptyAnuncio} money={money}
              />
            )}

            {tab === "perfil" && (
              <PerfilTab perfil={perfil} privado={perfilPrivado} email={user.email} onSave={handleSavePerfil} onSavePrivado={handleSavePerfilPrivado} onUpdateEmail={handleUpdateEmail} Card={Card} Field={Field} SectionTitle={SectionTitle} inputStyle={inputStyle} />
            )}


            {tab === "aprovacoes" && isAdminUser && (
              <AprovacoesTab anuncios={anunciosAprovacao} perfis={perfisPublicos} onModerar={handleModerarAnuncio} Card={Card} SectionTitle={SectionTitle} money={money} STATUS_ANUNCIO_TONS={STATUS_ANUNCIO_TONS} STATUS_ANUNCIO_LABEL={STATUS_ANUNCIO_LABEL} />
            )}

            {tab === "achados" && isAdminUser && (
              <AchadosTab achados={achados} perfis={perfisPublicos} anuncios={anunciosPerdidasAdmin} onAtualizar={handleAtualizarAchado} />
            )}

            {tab === "aves-perdidas-admin" && isAdminUser && (
              <ModeracaoAvesPerdidasTab anuncios={anunciosPerdidasAdmin} onModerar={handleModerarAvePerdida} />
            )}

            {tab === "campanhas-admin" && isAdminUser && <AdminCampanhas />}

            {tab === "conteudo" && isAdminUser && <ConteudoAdmin />}
            </React.Suspense>
          </>
        )}
      </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UI compartilhada
// ---------------------------------------------------------------------------

// Dashboard
// ---------------------------------------------------------------------------

const FILTER_LABELS = {
  "A venda": "Aves a venda",
  Vendida: "Aves vendidas",
  Falecida: "Aves falecidas",
  casais: "Casais",
  solteiros: "Solteiros (sem parceiro)",
  plantel: "Plantel (sob sua responsabilidade)",
};

// ---------------------------------------------------------------------------
// Placa
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Financeiro
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

// ---------------------------------------------------------------------------
// Clientes (Fase 1)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Fornecedores (espelha Clientes, so que do lado da compra)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Indicacoes (Fase 6)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Perfil do Criador (Fase 8C)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Aprovacoes (Fase 8D) - so visivel/carregado pra quem esta na tabela admins
// ---------------------------------------------------------------------------

// Reproducao: posturas, ovos e nascimentos
// ---------------------------------------------------------------------------

export default function App() {
  const [session, setSession] = useState(undefined);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [passwordGate, setPasswordGate] = useState("checking");
  const [passwordCheckRetry, setPasswordCheckRetry] = useState(0);
  const [masterAccess, setMasterAccess] = useState(null);
  const [masterAccessError, setMasterAccessError] = useState(false);
  const [masterRetry, setMasterRetry] = useState(0);
  const caminho = usePath();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Confere no banco a exigência de troca de senha; não depende do app_metadata possivelmente antigo da sessão.
  useEffect(() => {
    if (session === undefined) {
      setPasswordGate("checking");
      return;
    }
    if (!session?.user?.id) {
      setPasswordGate("clear");
      return;
    }

    let active = true;
    setPasswordGate("checking");
    supabase.functions.invoke("master-manage-creator", {
      body: { action: "check_password_change_required" },
    }).then(({ data, error }) => {
      if (!active) return;
      if (error || data?.error || typeof data?.required !== "boolean") {
        setPasswordGate("error");
        return;
      }
      setPasswordGate(data.required ? "required" : "clear");
    }).catch(() => {
      if (active) setPasswordGate("error");
    });

    return () => { active = false; };
  }, [session?.user?.id, passwordCheckRetry]);

  // A verificacao de acesso Master acontece somente na rota administrativa /adm.
  const isMasterRoute = caminho === "/adm" || caminho.startsWith("/adm/");

  useEffect(() => {
    if (session === undefined) return;
    if (!isMasterRoute || !session?.user?.id) {
      setMasterAccess(false);
      setMasterAccessError(false);
      return;
    }

    let active = true;
    setMasterAccess(null);
    setMasterAccessError(false);
    checkIsMaster(session.user.id)
      .then((allowed) => {
        if (active) setMasterAccess(allowed);
      })
      .catch(() => {
        // Falha na consulta nunca deve liberar o painel administrativo.
        if (active) {
          setMasterAccess(null);
          setMasterAccessError(true);
        }
      });

    return () => { active = false; };
  }, [session?.user?.id, masterRetry, isMasterRoute]);

  if (session === undefined) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#2B1D14" }}>
        <Loader2 className="animate-spin" color="#C69A2E" size={28} />
      </div>
    );
  }

  if (passwordRecovery) {
    return <AuthPage logado={!!session} redefinirSenha onSenhaAtualizada={() => setPasswordRecovery(false)} />;
  }

  if (session?.user?.id && passwordGate === "checking") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#2B1D14" }}>
        <Loader2 className="animate-spin" color="#C69A2E" size={28} />
      </div>
    );
  }

  if (session?.user?.id && passwordGate === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "#2B1D14" }}>
        <div className="w-full max-w-md rounded-2xl p-6 text-center" style={{ background: "#FAF3E6", color: "#2B241C" }}>
          <ShieldCheck size={30} className="mx-auto mb-3" color="#A6402B" />
          <h1 className="text-xl font-bold">Não foi possível validar sua senha</h1>
          <p className="mt-2 text-sm">Por segurança, o acesso ficará bloqueado até a verificação ser concluída.</p>
          <button type="button" onClick={() => setPasswordCheckRetry((value) => value + 1)} className="w-full mt-5 rounded-lg px-4 py-3 font-semibold" style={{ background: "#2B1D14", color: "#FAF3E6" }}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  if (session?.user?.id && passwordGate === "required") {
    return <RequiredPasswordChange onComplete={(nextSession) => { setSession(nextSession); setPasswordCheckRetry((value) => value + 1); }} />;
  }

// Visitante ve a area publica; quem esta logado tambem, mas so quando abre um guia/video (links compartilhados).
const emConteudo = /^\/(guias|videos)(\/|$)/.test(caminho);
if (!session || emConteudo) {
  return (
    <>
      <AuthPage logado={!!session} />
      <SuporteWhatsApp />
    </>
  );
}

if (masterAccessError) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "#2B1D14" }}>
      <div className="w-full max-w-md rounded-2xl p-6 text-center" style={{ background: "#FAF3E6", color: "#2B241C" }}>
        <ShieldCheck size={30} className="mx-auto mb-3" color="#A6402B" />
        <h1 className="text-xl font-bold">Não foi possível validar suas permissões</h1>
        <p className="mt-2 text-sm">Por segurança, o acesso ao painel ficará bloqueado até que a verificação seja concluída.</p>
        <button
          type="button"
          onClick={() => setMasterRetry((value) => value + 1)}
          className="w-full mt-5 rounded-lg px-4 py-3 font-semibold"
          style={{ background: "#2B1D14", color: "#FAF3E6" }}
        >
          Tentar novamente
        </button>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="w-full mt-2 rounded-lg px-4 py-3 text-sm"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}

if (masterAccess === null) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#2B1D14" }}>
      <Loader2 className="animate-spin" color="#C69A2E" size={28} />
    </div>
  );
}

if (!isMasterRoute) {
  return (
    <>
      <AppInner
        user={session.user}
        onLogout={() => supabase.auth.signOut()}
      />
      <SuporteWhatsApp />
    </>
  );
}

if (masterAccess) {
  return (
    <React.Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#2B1D14" }}><Loader2 className="animate-spin" color="#C69A2E" size={28} /></div>}>
      <MasterApp user={session.user} onLogout={() => supabase.auth.signOut()} />
    </React.Suspense>
  );
}

return (
  <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "#182b45" }}>
    <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-xl">
      <ShieldCheck size={34} className="mx-auto mb-3" color="#a27b2e" />
      <h1 className="text-xl font-bold text-slate-900">Acesso administrativo restrito</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Esta conta não possui autorização para acessar o painel Master do Avespet.</p>
      <a href="/" className="mt-5 block w-full rounded-lg px-4 py-3 text-sm font-semibold text-white" style={{ background: "#182b45" }}>Voltar ao Avespet</a>
      <button
        type="button"
        onClick={() => supabase.auth.signOut()}
        className="mt-2 w-full rounded-lg px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
      >
        Sair da conta
      </button>
    </div>
  </div>
);
}