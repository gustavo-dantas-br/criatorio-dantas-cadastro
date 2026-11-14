import React, { useMemo, useState } from "react";
import { Phone, Users } from "lucide-react";

const STATUS_ACHADO_LABEL = { novo: "NOVO", contatado: "CONTATADO", resolvido: "RESOLVIDO" };
const STATUS_ACHADO_TONS = { novo: "#f0dab0", contatado: "#c9dcee", resolvido: "#c8dcb8" };

function normalizarAnilha(valor) {
  return (valor || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function AchadoCard({ achado, possiveisTitulares = [], onAtualizar }) {
  return (
    <article className="rounded-xl p-4 ui-sans" style={{ background: "#FAF3E6", color: "#2B241C" }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="ui-mono text-xs" style={{ color: "#8a7a63" }}>{achado.anilha_buscada === "SEM ANILHA" ? "REGISTRO SEM ANILHA" : "ANILHA BUSCADA"}</div>
          <div className="font-semibold text-sm">{achado.anilha_buscada}</div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded ui-mono shrink-0" style={{ background: STATUS_ACHADO_TONS[achado.status] || "#e3d3b4", color: "#2B241C" }}>
          {STATUS_ACHADO_LABEL[achado.status] || achado.status}
        </span>
      </div>

      <div className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: "#8a7a63" }}>
        <Users size={13} />
        Possíveis titulares (conferir antes de confirmar)
      </div>
      {possiveisTitulares.length > 0 ? (
        <div className="text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#e4ead9", color: "#405438" }}>
          {achado.ave_nome && <div className="mb-1">Ave: <strong>{achado.ave_nome}</strong></div>}
          {possiveisTitulares.map((p, i) => (
            <div key={p.userId || i} className={i ? "mt-2 pt-2 border-t border-green-900/10" : ""}>
              <strong>{p.nomeCriatorio || p.nomeCompleto || [p.nome, p.sobrenome].filter(Boolean).join(" ") || (p.perfilCadastrado === false ? "Perfil não cadastrado" : "Perfil sem nome de criador")}</strong>
              {p.whatsapp && <div className="text-xs flex items-center gap-1 mt-1"><Phone size={11} /> {p.whatsapp}</div>}
              {!p.whatsapp && <div className="text-xs">{p.perfilCadastrado === false ? "Solicite ao criador que entre no site e complete seu cadastro." : "Telefone não informado no perfil"}</div>}
              <div className="text-[11px] mt-1 opacity-75">Anúncio aprovado com esta numeração</div>
            </div>
          ))}
          {possiveisTitulares.length > 1 && <p className="text-xs mt-2">Há mais de um anúncio aprovado com essa anilha. A equipe deve confirmar a titularidade manualmente.</p>}
        </div>
      ) : (
        <div className="text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#8f3828" }}>
          Nenhum anúncio aprovado localizado com essa anilha. O possível titular ainda pode cadastrar a ave.
        </div>
      )}

      <div className="text-xs mb-1 font-semibold" style={{ color: "#8a7a63" }}>Pessoa que encontrou a ave</div>
      <div className="text-sm font-semibold">{achado.nome_encontrador || "Nome não informado"}</div>
      <div className="text-xs flex items-center gap-1 mb-2" style={{ color: "#8a7a63" }}><Phone size={11} /> {achado.telefone_encontrador || "Telefone não informado"}</div>
      {achado.endereco && <div className="text-xs mb-2">📍 Encontrada em: {achado.endereco}</div>}
      {achado.mensagem && <div className="text-xs italic mb-2" style={{ color: "#7a6a52" }}>"{achado.mensagem}"</div>}
      {achado.foto && <img src={achado.foto} alt="Foto da ave encontrada" className="w-full max-w-[200px] rounded-lg mb-3" />}
      <div className="flex flex-wrap gap-2">
        {achado.status !== "contatado" && <button type="button" onClick={() => onAtualizar(achado.id, "contatado")} className="text-xs px-2 py-2 rounded" style={{ background: "#c9dcee", color: "#1c3a5c" }}>Marcar contatado</button>}
        {achado.status !== "resolvido" && <button type="button" onClick={() => onAtualizar(achado.id, "resolvido")} className="text-xs px-2 py-2 rounded" style={{ background: "#c8dcb8", color: "#2B241C" }}>Marcar resolvido</button>}
      </div>
    </article>
  );
}

export default function AchadosTab({ achados = [], perfis = [], anuncios = [], onAtualizar }) {
  const [filtro, setFiltro] = useState("novo");
  const perfisPorUser = new Map(perfis.map((p) => [p.userId, p]));
  const anunciosAprovados = useMemo(
    () => anuncios.filter((a) => a.status === "aprovado"),
    [anuncios]
  );
  const filtrados = achados.filter((a) => a.status === filtro);

  function localizarPossiveisTitulares(achado) {
    const chave = normalizarAnilha(achado.anilha_buscada);
    if (!chave || achado.anilha_buscada === "SEM ANILHA") return [];

    // owner_user_id identifica uma associação do registro, mas não comprova
    // a titularidade nem deve impedir a exibição de outros anúncios aprovados.
    const ids = [...new Set(anunciosAprovados
      .filter((a) => normalizarAnilha(a.data?.anilha) === chave && a.user_id)
      .map((a) => a.user_id))];
    return ids.map((userId) => {
      const perfil = perfisPorUser.get(userId);
      return perfil ? { userId, ...perfil, perfilCadastrado: true } : { userId, perfilCadastrado: false };
    });
  }

  return (
    <section>
      <h2 className="mb-2" style={{ color: "#173D29", fontSize: 24, fontWeight: 700 }}>Achados por Anilha</h2>
      <p className="ui-sans text-sm mb-5" style={{ color: "#334155" }}>
        A equipe administrativa vê os dados reservados de quem encontrou, as fotos e as características informadas. Nos registros com anilha, também aparecem possíveis titulares dos anúncios aprovados. Nos casos sem anilha, a equipe faz a análise manual.
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {["novo", "contatado", "resolvido"].map((status) => (
          <button key={status} type="button" onClick={() => setFiltro(status)} className="ui-sans text-xs px-3 py-2 rounded-lg font-semibold"
            style={{ background: filtro === status ? "#C69A2E" : "#3a2314", color: filtro === status ? "#2B1D14" : "#b09a78" }}>
            {STATUS_ACHADO_LABEL[status]} ({achados.filter((a) => a.status === status).length})
          </button>
        ))}
      </div>
      {filtrados.length === 0 ? (
        <div className="rounded-xl p-8 text-center ui-sans" style={{ background: "#FAF3E6", color: "#8a7a63" }}>Nenhum registro nesse status.</div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {filtrados.map((achado) => (
            <AchadoCard
              key={achado.id}
              achado={achado}
              possiveisTitulares={localizarPossiveisTitulares(achado)}
              onAtualizar={onAtualizar}
            />
          ))}
        </div>
      )}
    </section>
  );
}
