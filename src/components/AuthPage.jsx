import React, { useState } from "react";
import { Feather, Loader2, Camera, GitBranch, DollarSign, Tag, ClipboardCheck, Handshake } from "lucide-react";
import { supabase } from "../supabaseClient";

const inputStyle = { background: "#fff", border: "1px solid #e3d3b4", color: "#2B241C", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", width: "100%" };

const RECURSOS = [
  { icon: Camera, texto: "Cadastro de cada ave com foto" },
  { icon: GitBranch, texto: "Arvore genealogica automatica" },
  { icon: DollarSign, texto: "Controle financeiro de compra e venda" },
  { icon: Tag, texto: "Gerador de placa de identificacao" },
  { icon: ClipboardCheck, texto: "Acompanhamento de pos-venda" },
  { icon: Handshake, texto: "Clientes, fornecedores e indicacoes" },
];

function Apresentacao() {
  return (
    <div className="max-w-md w-full ui-sans mb-8 md:mb-0 md:mr-10 text-center md:text-left">
      <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
        <Feather size={26} color="#C69A2E" />
        <div style={{ color: "#F1E6D2", fontWeight: 700, fontSize: 22, fontFamily: "'Fraunces', serif" }}>Avespet</div>
      </div>
      <h1 style={{ color: "#F1E6D2", fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 700, lineHeight: 1.25 }} className="mb-3">
        Organize o cadastro do seu plantel, de graca.
      </h1>
      <p style={{ color: "#b09a78" }} className="text-sm mb-6">
        Sistema completo pra criadores de aves cuidarem do cadastro, financeiro e identificacao do plantel — cada criador com o proprio espaco, privado e gratuito.
      </p>
      <div className="flex flex-col gap-2.5">
        {RECURSOS.map(({ icon: Icon, texto }) => (
          <div key={texto} className="flex items-center gap-2.5 justify-center md:justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "#3a2314" }}>
              <Icon size={14} color="#C69A2E" />
            </div>
            <span className="text-sm" style={{ color: "#d8c8b0" }}>{texto}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuthPage() {
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
    <div
      className="min-h-screen w-full flex flex-col md:flex-row items-center justify-center p-6 md:p-10"
      style={{ background: "#2B1D14", fontFamily: "'Fraunces', serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
        .ui-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      <Apresentacao />

      <div className="w-full max-w-sm rounded-xl p-6 sm:p-8" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
        <h2 className="text-center ui-sans font-semibold mb-6" style={{ color: "#2B241C" }}>{mode === "login" ? "Entrar na sua conta" : "Criar conta gratuita"}</h2>
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
