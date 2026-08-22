import React, { useState } from "react";
import { Feather, Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";

const inputStyle = {
  background: "#fff",
  border: "1px solid #e3d3b4",
  color: "#2B241C",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  width: "100%",
};

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Conta criada! Verifica seu e-mail pra confirmar antes de entrar (dependendo da configuracao do projeto).");
      }
    } catch (err) {
      setError(err.message || "Nao foi possivel completar essa acao.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ background: "#2B1D14", fontFamily: "'Fraunces', serif" }}
    >
      <div className="w-full max-w-sm rounded-xl p-6 sm:p-8" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Feather size={22} color="#A6402B" />
          <div style={{ color: "#2B241C", fontWeight: 700, fontSize: 18 }}>Criatorio Dantas</div>
        </div>

        <h1 className="text-center ui-sans font-semibold mb-6" style={{ color: "#2B241C" }}>
          {mode === "login" ? "Entrar na sua conta" : "Criar conta"}
        </h1>

        {error && (
          <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>
            {error}
          </div>
        )}
        {message && (
          <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#e4ead9", color: "#556b3f" }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="ui-sans flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase" style={{ color: "#8a7a63" }}>E-mail</span>
            <input style={inputStyle} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="ui-sans flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase" style={{ color: "#8a7a63" }}>Senha</span>
            <input style={inputStyle} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="ui-sans flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold mt-1"
            style={{ background: "#C69A2E", color: "#2B1D14" }}
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}
          className="ui-sans text-xs mt-5 w-full text-center underline"
          style={{ color: "#8a7a63" }}
        >
          {mode === "login" ? "Nao tem conta? Criar uma" : "Ja tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
