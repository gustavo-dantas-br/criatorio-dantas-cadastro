import React, { useState } from "react";

const STATUS_AVES_PERDIDAS = {
  pendente: "EM ANÁLISE",
  aprovado: "PUBLICADO",
  rejeitado: "REJEITADO",
  encerrado: "ENCERRADO",
};

export default function ModeracaoAvesPerdidasTab({ anuncios = [], onModerar }) {
  const [filtro, setFiltro] = useState("pendente");
  const filtrados = anuncios.filter((a) => a.status === filtro);

  return (
    <section>
      <h2 className="mb-2" style={{ color: "#173D29", fontSize: 24, fontWeight: 700 }}>
        Moderação — aves perdidas
      </h2>
      <p className="ui-sans text-sm mb-5" style={{ color: "#334155" }}>
        Revise os anúncios enviados gratuitamente. Só os aprovados aparecem na página pública.
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.keys(STATUS_AVES_PERDIDAS).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFiltro(status)}
            className="ui-sans text-xs px-3 py-2 rounded-lg font-semibold"
            style={{
              background: filtro === status ? "#C69A2E" : "#3a2314",
              color: filtro === status ? "#2B1D14" : "#b09a78",
            }}
          >
            {STATUS_AVES_PERDIDAS[status]} ({anuncios.filter((a) => a.status === status).length})
          </button>
        ))}
      </div>
      {filtrados.length === 0 ? (
        <div className="rounded-xl p-8 text-center ui-sans" style={{ background: "#FAF3E6", color: "#8a7a63" }}>
          Nenhum anúncio neste status.
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {filtrados.map((anuncio) => {
            const dados = anuncio.data || {};
            return (
              <article key={anuncio.id} className="rounded-xl p-4 ui-sans" style={{ background: "#FAF3E6", color: "#2B241C" }}>
                {dados.foto && <img src={dados.foto} alt={dados.nomeAve || "Ave perdida"} className="w-full aspect-video object-cover rounded-lg mb-3" />}
                <div className="font-semibold">{dados.nomeAve || dados.especie || "Ave sem nome"}</div>
                <div className="text-xs mt-1" style={{ color: "#8a7a63" }}>
                  {dados.especie || "Espécie não informada"} {dados.cor ? `• ${dados.cor}` : ""}
                </div>
                <div className="text-sm mt-2">
                  {dados.cidade || "Cidade não informada"}{dados.uf ? `/${dados.uf}` : ""}
                  {dados.dataPerda ? ` • ${new Date(dados.dataPerda + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
                </div>
                {dados.descricao && <p className="text-xs mt-2 whitespace-pre-wrap" style={{ color: "#7a6a52" }}>{dados.descricao}</p>}
                <div className="text-xs mt-3" style={{ color: "#8a7a63" }}>
                  Contato: {dados.contatoNome || "—"} • WhatsApp: {dados.whatsapp || "—"}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {anuncio.status !== "aprovado" && <button type="button" onClick={() => onModerar(anuncio.id, "aprovado")} className="text-xs px-3 py-2 rounded-lg font-semibold" style={{ background: "#556b3f", color: "#fff" }}>Aprovar e publicar</button>}
                  {anuncio.status !== "rejeitado" && <button type="button" onClick={() => onModerar(anuncio.id, "rejeitado")} className="text-xs px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>Rejeitar</button>}
                  {anuncio.status !== "encerrado" && <button type="button" onClick={() => onModerar(anuncio.id, "encerrado")} className="text-xs px-3 py-2 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>Encerrar</button>}
                  {anuncio.status !== "pendente" && <button type="button" onClick={() => onModerar(anuncio.id, "pendente")} className="text-xs px-3 py-2 rounded-lg" style={{ background: "#f0dab0", color: "#2B241C" }}>Voltar à análise</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
