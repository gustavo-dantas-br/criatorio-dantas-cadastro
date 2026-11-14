import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
const UF_LISTA = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function PerfilTab({ perfil, privado, email, onSave, onSavePrivado, onUpdateEmail, Card, Field, SectionTitle, inputStyle }) {
  const [form, setForm] = useState(perfil);
  const [endereco, setEndereco] = useState(privado);
  const [novoEmail, setNovoEmail] = useState(email || "");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  useEffect(() => setForm(perfil), [perfil]);
  useEffect(() => setEndereco(privado || {}), [privado]);
  useEffect(() => setNovoEmail(email || ""), [email]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function carregarLogo(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Escolha um arquivo de imagem."); return; }
    if (file.size > 8 * 1024 * 1024) { alert("A imagem deve ter no máximo 8 MB."); return; }
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const escala = Math.min(1, 600 / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.width * escala));
            canvas.height = Math.max(1, Math.round(img.height * escala));
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          };
          img.onerror = reject;
          img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setForm((f) => ({ ...f, logoUrl: dataUrl }));
    } catch { alert("Não foi possível carregar essa imagem. Tente outro arquivo."); }
  }

  async function submit() {
    if (salvando) return;
    setSalvando(true);
    setMensagem("");
    setErro("");
    try {
      await Promise.all([
        onSave({ ...form, email: novoEmail }),
        onSavePrivado(endereco),
      ]);
      let retorno = "Perfil e endereço salvos com sucesso.";
      const emailSolicitado = novoEmail.trim();
      if (emailSolicitado && emailSolicitado !== email) {
        const respostaEmail = await onUpdateEmail(emailSolicitado);
        if (respostaEmail) retorno += " " + respostaEmail;
      }
      setMensagem(retorno);
    } catch (e) {
      setErro(e?.message || "Não foi possível salvar o perfil. Confira a conexão e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-xl">
      <SectionTitle>Perfil do Criador</SectionTitle>
      <p className="ui-sans text-sm mb-5" style={{ color: "#334155" }}>
        Nome do criatorio, cidade, UF e WhatsApp podem aparecer nos anuncios. Seu endereco completo e seu e-mail ficam privados.
      </p>
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Nome"><input style={inputStyle} value={form.nome || ""} onChange={set("nome")} /></Field>
          <Field label="Sobrenome"><input style={inputStyle} value={form.sobrenome || ""} onChange={set("sobrenome")} /></Field>
          <Field label="Nome do criatório"><input style={inputStyle} value={form.nomeCriatorio} onChange={set("nomeCriatorio")} placeholder="ex: Criatório Avespet" /></Field>
          <Field label="WhatsApp de contato"><input style={inputStyle} value={form.whatsapp} onChange={set("whatsapp")} placeholder="ex: (11) 99999-9999" /></Field>
          <Field label="Cidade"><input style={inputStyle} value={form.cidade} onChange={set("cidade")} placeholder="ex: Barueri" /></Field>
          <Field label="E-mail da conta (privado)"><input style={inputStyle} type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} /></Field>
          <Field label="UF">
            <select style={inputStyle} value={form.uf} onChange={set("uf")}>
              <option value="">--</option>
              {UF_LISTA.map((u) => <option key={u}>{u}</option>)}
            </select>
          </Field>
        </div>
        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-sans text-sm font-semibold mb-2" style={{ color: "#2B241C" }}>Logo do criatório</div>
        <p className="ui-sans text-xs mb-3" style={{ color: "#756B5E" }}>Essa imagem será usada no comprovante de reserva para identificar seu criatório.</p>
        <div className="flex flex-wrap items-center gap-4 mb-5">
          {form.logoUrl ? <img src={form.logoUrl} alt="Logo do criatório" className="h-20 w-20 rounded-xl border object-contain p-1" style={{ borderColor: "#e3d3b4", background: "#fff" }} /> : <div className="h-20 w-20 rounded-xl border flex items-center justify-center text-xs text-center px-2" style={{ borderColor: "#e3d3b4", color: "#8b806f" }}>Sem logo</div>}
          <div className="flex flex-wrap gap-2">
            <label className="ui-sans cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "#e4ead9", color: "#405a35" }}>Escolher imagem<input type="file" accept="image/*" className="hidden" onChange={e => { carregarLogo(e.target.files?.[0]); e.target.value = ""; }} /></label>
            {form.logoUrl && <button type="button" onClick={() => setForm(f => ({ ...f, logoUrl: "" }))} className="ui-sans rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#e3d3b4", color: "#8b4b3c" }}>Remover logo</button>}
          </div>
        </div>
        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-sans text-sm font-semibold mb-3" style={{ color: "#2B241C" }}>Endereco completo (privado)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {["cep", "endereco", "numero", "complemento", "bairro", "cidade", "uf"].map((campo) => (
            <Field key={campo} label={campo === "uf" ? "UF do endereco" : campo[0].toUpperCase() + campo.slice(1)}>
              <input style={inputStyle} value={endereco[campo] || ""} onChange={(e) => setEndereco((p) => ({ ...p, [campo]: e.target.value }))} />
            </Field>
          ))}
        </div>
        {form.synced === false && <div className="ui-sans text-xs mb-3" style={{ color: "#a6402b" }}>Salvando no banco...</div>}
        {mensagem && <div role="status" className="ui-sans text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#e4ead9", color: "#556b3f" }}>{mensagem}</div>}
        {erro && <div role="alert" className="ui-sans text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#f5dfda", color: "#8b3d30" }}>{erro}</div>}
        <button onClick={submit} disabled={salvando} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          <Save size={15} /> {salvando ? "Salvando..." : "Salvar perfil"}
        </button>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Anuncios (Fase 8C)
// ---------------------------------------------------------------------------

