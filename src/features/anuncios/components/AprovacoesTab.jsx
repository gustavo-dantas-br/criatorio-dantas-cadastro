import React, { useState } from "react";
import { Check } from "lucide-react";

function AprovacaoCard({ anuncio, criador, onModerar, Card, money, STATUS_ANUNCIO_TONS, STATUS_ANUNCIO_LABEL }) {
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

export default function AprovacoesTab({ anuncios, perfis, onModerar, Card, SectionTitle, money, STATUS_ANUNCIO_TONS, STATUS_ANUNCIO_LABEL }) {
  const [filtro, setFiltro] = useState("pendente");
  const perfisPorUser = new Map(perfis.map((p) => [p.userId, p]));
  const filtrados = anuncios.filter((a) => (a.status || "pendente") === filtro);

  return (
    <div>
      <SectionTitle>Aprovacoes</SectionTitle>
      <p className="ui-sans text-sm mb-5" style={{ color: "#334155" }}>
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
            <AprovacaoCard key={a.id} anuncio={a} criador={perfisPorUser.get(a.userId)} onModerar={onModerar} Card={Card} money={money} STATUS_ANUNCIO_TONS={STATUS_ANUNCIO_TONS} STATUS_ANUNCIO_LABEL={STATUS_ANUNCIO_LABEL} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
