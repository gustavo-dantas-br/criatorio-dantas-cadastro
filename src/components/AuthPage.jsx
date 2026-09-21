import React, { useState, useEffect, useRef } from "react";
import { Feather, Loader2, Search, Phone, ArrowLeft, MessageCircle, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  buscarPerdidaPorAnilha, getPerfil, listAnunciosPublicos, listPerfisPublicos,
  incrementarVisualizacaoAnuncio, incrementarCliqueAnuncio, registrarAchadoAnilha,
} from "../lib/db";

const inputStyle = { background: "#fff", border: "1px solid #e3d3b4", color: "#2B241C", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", width: "100%" };

function money(n) {
  const v = parseFloat(n);
  if (isNaN(v)) return "R$ 0,00";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function whatsappUrl(telefone, mensagem) {
  let digitos = (telefone || "").replace(/\D/g, "");
  if (!digitos) return null;
  if (digitos.length <= 11) digitos = "55" + digitos;
  const base = `https://wa.me/${digitos}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

// ---------------------------------------------------------------------------
// Busca por anilha - achado direto (perdidas) ou registro mediado pelo admin
// ---------------------------------------------------------------------------

function BuscaAnilha() {
  const [anilha, setAnilha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultadosPerdidas, setResultadosPerdidas] = useState(null);
  const [perfisPorUser, setPerfisPorUser] = useState({});
  const [mostrarFormAchado, setMostrarFormAchado] = useState(false);
  const [formAchado, setFormAchado] = useState({ nome: "", telefone: "", mensagem: "" });
  const [enviado, setEnviado] = useState(false);

  async function buscar(e) {
    e.preventDefault();
    if (!anilha.trim()) return;
    setLoading(true);
    setError("");
    setResultadosPerdidas(null);
    setMostrarFormAchado(false);
    setEnviado(false);
    try {
      const achados = await buscarPerdidaPorAnilha(anilha);
      setResultadosPerdidas(achados);
      if (achados.length > 0) {
        const perfis = {};
        await Promise.all(
          [...new Set(achados.map((a) => a.userId))].map(async (uidUser) => {
            try {
              perfis[uidUser] = await getPerfil(uidUser);
            } catch {
              // segue sem contato desse criador se der erro
            }
          })
        );
        setPerfisPorUser(perfis);
      } else {
        setMostrarFormAchado(true);
      }
    } catch {
      setError("Nao foi possivel buscar agora. Tenta de novo em instantes.");
    } finally {
      setLoading(false);
    }
  }

  async function enviarAchado(e) {
    e.preventDefault();
    if (!formAchado.nome.trim() || !formAchado.telefone.trim()) return;
    setLoading(true);
    setError("");
    try {
      await registrarAchadoAnilha(anilha, formAchado.nome, formAchado.telefone, formAchado.mensagem);
      setEnviado(true);
    } catch {
      setError("Nao consegui registrar agora. Tenta de novo em instantes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto text-center ui-sans">
      <h1 style={{ color: "#F1E6D2", fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 700, lineHeight: 1.25 }} className="mb-3">
        Encontrou uma ave?
      </h1>
      <p style={{ color: "#b09a78" }} className="text-base mb-6">
        Digite o numero da anilha. Vamos verificar e, se for de algum criador cadastrado, entramos em contato pra devolver.
      </p>

      <form onSubmit={buscar} className="flex flex-col sm:flex-row gap-3 mb-6 max-w-md mx-auto">
        <input style={{ ...inputStyle, fontSize: 16, padding: "14px 16px" }} value={anilha} onChange={(e) => setAnilha(e.target.value)} placeholder="ex: FOB 0080" />
        <button type="submit" disabled={loading} className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} Buscar
        </button>
      </form>

      {error && <div className="text-sm mb-4 px-3 py-2 rounded-lg max-w-md mx-auto" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}

      {resultadosPerdidas && resultadosPerdidas.length > 0 && (
        <div className="flex flex-col gap-3 max-w-md mx-auto text-left">
          {resultadosPerdidas.map((r) => {
            const perfil = perfisPorUser[r.userId];
            return (
              <div key={r.id} className="rounded-lg p-3" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
                    {r.foto ? <img src={r.foto} className="w-full h-full object-cover" alt="" /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm" style={{ color: "#2B241C" }}>{r.nomeAve}</div>
                    <div className="text-xs" style={{ color: "#8a7a63" }}>{r.especie} - {r.corMutacao}</div>
                  </div>
                </div>
                <div className="text-[10px] px-2 py-0.5 rounded ui-mono inline-block mb-2" style={{ background: r.status === "perdida" ? "#f0dab0" : "#c8dcb8", color: "#2B241C" }}>
                  {r.status === "perdida" ? "AINDA PERDIDA" : "JA FOI ENCONTRADA"}
                </div>
                {perfil?.whatsapp && (
                  <a href={whatsappUrl(perfil.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg justify-center" style={{ background: "#556b3f", color: "#F1E6D2" }}>
                    <Phone size={14} /> Falar com {perfil.nomeCriatorio || "o criador"}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {mostrarFormAchado && !enviado && (
        <form onSubmit={enviarAchado} className="flex flex-col gap-3 max-w-md mx-auto text-left rounded-lg p-4" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
          <div className="text-sm" style={{ color: "#2B241C" }}>
            Essa anilha nao apareceu como perdida ainda, mas se voce achou essa ave, deixa seu contato que a gente verifica e retorna.
          </div>
          <input style={inputStyle} value={formAchado.nome} onChange={(e) => setFormAchado((f) => ({ ...f, nome: e.target.value }))} placeholder="Seu nome" required />
          <input style={inputStyle} value={formAchado.telefone} onChange={(e) => setFormAchado((f) => ({ ...f, telefone: e.target.value }))} placeholder="Seu telefone/WhatsApp" required />
          <input style={inputStyle} value={formAchado.mensagem} onChange={(e) => setFormAchado((f) => ({ ...f, mensagem: e.target.value }))} placeholder="Onde encontrou (opcional)" />
          <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            {loading && <Loader2 className="animate-spin" size={16} />} Enviar
          </button>
        </form>
      )}

      {enviado && (
        <div className="text-sm px-4 py-3 rounded-lg max-w-md mx-auto" style={{ background: "#e4ead9", color: "#556b3f" }}>
          Recebido! Vamos verificar e entrar em contato pelo telefone informado.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vitrine publica de anuncios
// ---------------------------------------------------------------------------

function AnuncioVitrineCard({ anuncio, perfil }) {
  async function handleInteresse() {
    try { await incrementarCliqueAnuncio(anuncio.id); } catch { /* nao bloqueia o usuario por isso */ }
    const msg = `Oi! Vi o anuncio ${anuncio.nomeAve ? `d${anuncio.sexo === "Femea" ? "a" : "o"} ${anuncio.nomeAve}` : "de uma ave"} no site e tenho interesse.`;
    const url = whatsappUrl(perfil?.whatsapp, msg);
    if (url) window.open(url, "_blank");
  }

  return (
    <div className="rounded-xl overflow-hidden ui-sans" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
      <div className="w-full aspect-square" style={{ background: "#3a2a1c" }}>
        {anuncio.foto ? <img src={anuncio.foto} className="w-full h-full object-cover" alt="" /> : null}
      </div>
      <div className="p-3">
        <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{anuncio.nomeAve}</div>
        <div className="text-xs mb-1" style={{ color: "#8a7a63" }}>{anuncio.especie} - {anuncio.corMutacao || "sem mutacao"}</div>
        <div className="text-base font-bold mb-2" style={{ color: "#556b3f" }}>{money(anuncio.preco)}</div>
        {anuncio.descricao && <div className="text-xs italic mb-2 line-clamp-2" style={{ color: "#7a6a52" }}>{anuncio.descricao}</div>}
        {perfil?.cidade && <div className="text-[11px] mb-2" style={{ color: "#8a7a63" }}>{perfil.cidade}{perfil.uf ? `/${perfil.uf}` : ""}</div>}
        <button onClick={handleInteresse} className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg" style={{ background: "#556b3f", color: "#F1E6D2" }}>
          <MessageCircle size={14} /> Tenho interesse
        </button>
      </div>
    </div>
  );
}

function VitrinePublica() {
  const [anuncios, setAnuncios] = useState([]);
  const [perfis, setPerfis] = useState({});
  const [loading, setLoading] = useState(true);
  const jaVistos = useRef(new Set());

  useEffect(() => {
    (async () => {
      try {
        const [listaAnuncios, listaPerfis] = await Promise.all([listAnunciosPublicos(), listPerfisPublicos()]);
        setAnuncios(listaAnuncios);
        const mapa = {};
        listaPerfis.forEach((p) => { mapa[p.userId] = p; });
        setPerfis(mapa);
        listaAnuncios.forEach((a) => {
          if (!jaVistos.current.has(a.id)) {
            jaVistos.current.add(a.id);
            incrementarVisualizacaoAnuncio(a.id).catch(() => {});
          }
        });
      } catch {
        // silencioso - se der erro, a vitrine so fica vazia
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin" color="#C69A2E" size={28} /></div>;
  }

  if (anuncios.length === 0) {
    return (
      <div className="text-center ui-sans text-sm py-8" style={{ color: "#b09a78" }}>
        Nenhuma ave disponivel pra venda no momento.
      </div>
    );
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
      {anuncios.map((a) => <AnuncioVitrineCard key={a.id} anuncio={a} perfil={perfis[a.userId]} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login / criar conta - agora um modal pequeno, acionado pelo canto
// ---------------------------------------------------------------------------

function LoginModal({ onFechar }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Conta criada! Verifica seu e-mail pra confirmar antes de entrar.");
      }
    } catch (err) {
      setError(err.message || "Nao foi possivel completar essa acao.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(20,12,6,0.6)" }} onClick={onFechar}>
      <div className="w-full max-w-sm rounded-xl p-6 sm:p-8 relative" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onFechar} className="absolute top-3 right-3" style={{ color: "#8a7a63" }}><X size={18} /></button>
        <div className="flex items-center gap-2 mb-5 justify-center">
          <Feather size={20} color="#A6402B" />
          <div style={{ color: "#2B241C", fontWeight: 700, fontSize: 16, fontFamily: "'Fraunces', serif" }}>Avespet</div>
        </div>
        <h2 className="text-center ui-sans font-semibold mb-5" style={{ color: "#2B241C" }}>{mode === "login" ? "Entrar na sua conta" : "Criar conta gratuita"}</h2>
        {error && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
        {message && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#e4ead9", color: "#556b3f" }}>{message}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="ui-sans flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase" style={{ color: "#8a7a63" }}>E-mail</span><input style={inputStyle} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="ui-sans flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase" style={{ color: "#8a7a63" }}>Senha</span><input style={inputStyle} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button type="submit" disabled={loading} className="ui-sans flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold mt-1" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            {loading && <Loader2 className="animate-spin" size={16} />}{mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>
        <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }} className="ui-sans text-xs mt-5 w-full text-center underline" style={{ color: "#8a7a63" }}>
          {mode === "login" ? "Nao tem conta? Criar uma gratuita" : "Ja tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagina publica principal
// ---------------------------------------------------------------------------

export default function AuthPage() {
  const [mostrarLogin, setMostrarLogin] = useState(false);

  return (
    <div className="min-h-screen w-full" style={{ background: "#2B1D14", fontFamily: "'Fraunces', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
        .ui-sans { font-family: 'Inter', sans-serif; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      {/* Cabecalho - marca a esquerda, login discreto no canto */}
      <header className="flex items-center justify-between px-5 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Feather size={22} color="#C69A2E" />
          <div style={{ color: "#F1E6D2", fontWeight: 700, fontSize: 18, fontFamily: "'Fraunces', serif" }}>Avespet</div>
        </div>
        <button
          onClick={() => setMostrarLogin(true)}
          className="ui-sans text-sm px-5 py-3 rounded-lg font-semibold"
          style={{ background: "#3a2314", color: "#C69A2E" }}
        >
          Entrar / Criar conta
        </button>
      </header>

      {/* Hero: busca por anilha, o principal da pagina */}
            {/* Hero principal */}
      <section className="px-5 pt-10 pb-8 md:pt-16 md:pb-10 max-w-5xl mx-auto text-center">
        <div className="ui-sans mb-3" style={{ color: "#C69A2E", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Avespet
        </div>

        <h1
          style={{
            color: "#F1E6D2",
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(34px, 5vw, 52px)",
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 18,
          }}
        >
          Organize o cadastro do seu plantel, de graça.
        </h1>

        <p
          className="ui-sans mx-auto"
          style={{
            color: "#b09a78",
            fontSize: 16,
            lineHeight: 1.7,
            maxWidth: 720,
            marginBottom: 30,
          }}
        >
          Sistema completo pra criadores de aves cuidarem do cadastro,
          financeiro e identificação do plantel — cada criador com o
          próprio espaço, privado e gratuito.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto text-left">
          {[
            "Cadastro de cada ave com foto",
            "Árvore genealógica automática",
            "Controle financeiro de compra e venda",
            "Gerador de placa de identificação",
            "Acompanhamento de pós-venda",
            "Clientes, fornecedores e indicações",
          ].map((item) => (
            <div
              key={item}
              className="ui-sans rounded-lg px-4 py-3"
              style={{
                background: "#3a2314",
                border: "1px solid #4b3523",
                color: "#F1E6D2",
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              <span style={{ color: "#C69A2E", marginRight: 7 }}>✓</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* Busca por anilha */}
      <section className="px-5 py-8 md:py-12">
        <BuscaAnilha />
      </section>
      {/* Vitrine publica de anuncios */}
      <section className="px-5 pb-16 max-w-6xl mx-auto">
        <h2 className="ui-sans text-center mb-6" style={{ color: "#F1E6D2", fontSize: 22, fontWeight: 700 }}>
          Aves disponiveis agora
        </h2>
        <VitrinePublica />
      </section>

      <footer className="text-center ui-sans text-xs py-6" style={{ color: "#6b5638" }}>
        Criador de aves? <button onClick={() => setMostrarLogin(true)} className="underline" style={{ color: "#C69A2E" }}>Cadastre seu plantel gratuitamente</button>
      </footer>

      {mostrarLogin && <LoginModal onFechar={() => setMostrarLogin(false)} />}
    </div>
  );
}
