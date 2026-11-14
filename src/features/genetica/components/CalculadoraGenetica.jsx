import React, { useMemo, useState } from "react";
import { calcularCruzamentoGenetico } from "../utils/calcularCruzamentoGenetico";

const campo = {
  border: "1px solid #d8c6a5",
  background: "#fffaf0",
  color: "#2B241C",
};

const CORES_BASE = [
  { value: "Green (Verde)", label: "Verde" },
  { value: "Blue (Azul)", label: "Azul" },
  { value: "Turquoise (Turquesa)", label: "Turquesa" },
  { value: "Turquoise Blue (Azul Turquesa)", label: "Azul turquesa" },
];

function novaAve(nome) {
  return {
    nome,
    corMutacao: "",
    corBase: "",
    mutacoesVisuais: [],
    portadores: [],
    fatoresGeneticos: { darkFactor: "", violetFactor: "" },
  };
}

export default function CalculadoraGenetica({ aves, mutacoes }) {
  const [modoPai, setModoPai] = useState("cadastro");
  const [modoMae, setModoMae] = useState("cadastro");
  const [paiId, setPaiId] = useState("");
  const [maeId, setMaeId] = useState("");
  const [paiManual, setPaiManual] = useState(novaAve("Pai"));
  const [maeManual, setMaeManual] = useState(novaAve("Mãe"));
  const [resultado, setResultado] = useState(null);

  const machos = useMemo(() => aves.filter((a) => a.sexo === "Macho"), [aves]);
  const femeas = useMemo(() => aves.filter((a) => a.sexo === "Femea"), [aves]);
  const pai = modoPai === "cadastro" ? aves.find((a) => a.id === paiId) : { ...paiManual, sexo: "Macho" };
  const mae = modoMae === "cadastro" ? aves.find((a) => a.id === maeId) : { ...maeManual, sexo: "Femea" };
  const mutacoesRingNeck = mutacoes.filter((m) => (!m.especie || m.especie === "Ring Neck") && m.categoria !== "cor_base");

  function atualizarManual(setManual, campoNome, valor) {
    setManual((atual) => ({ ...atual, [campoNome]: valor }));
    setResultado(null);
  }

  function calcular() {
    if (!pai || !mae || (modoPai === "cadastro" && !paiId) || (modoMae === "cadastro" && !maeId)) {
      setResultado({ tipo: "erro", mensagem: "Escolha uma ave para o pai e outra para a mãe." });
      return;
    }
    const paiParaCalculo = { ...pai, corMutacao: pai.corMutacao || pai.corLivre || "" };
    const maeParaCalculo = { ...mae, corMutacao: mae.corMutacao || mae.corLivre || "" };
    const calc = calcularCruzamentoGenetico(paiParaCalculo, maeParaCalculo, mutacoesRingNeck);
    if (calc.semLociRelevantes) {
      const detalhes = [
        calc.bloqueadas?.length ? "Ainda estamos validando: " + calc.bloqueadas.join(", ") + "." : "",
        calc.naoDefinidos?.length ? "A regra genética ainda não está pronta para: " + calc.naoDefinidos.join(", ") + "." : "",
      ].filter(Boolean).join(" ");
      setResultado({
        tipo: "erro",
        mensagem: "Ainda não conseguimos calcular esse cruzamento com segurança. " + detalhes + " Você pode cadastrar as informações, mas elas não entram no cálculo até a regra ser validada.",
      });
      return;
    }
    const possibilidades = calc.resultadoFinal.map((r) => ({
      nome: r.descricao,
      percentual: `${r.percentual.toFixed(1).replace(/\.0$/, "")}%`,
      detalhe: r.sexo,
    }));
    const observacoes = [
      "O resultado é uma estimativa genética, não uma garantia do que vai nascer.",
      calc.bloqueadas?.length ? `Não incluídas porque ainda estão em validação: ${calc.bloqueadas.join(", ")}.` : "",
      calc.naoDefinidos?.length ? `Não calculadas porque a regra ainda está em estudo: ${calc.naoDefinidos.join(", ")}.` : "",
      calc.naoRegistradas?.length ? `Não encontradas no catálogo: ${calc.naoRegistradas.join(", ")}.` : "",
    ].filter(Boolean);

    const normalizarNome = (valor) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    const nomesEquivalentes = (mutacao) => [mutacao.nome, mutacao.nomeAlternativo].filter(Boolean).map(normalizarNome);
    const estadoDoGene = (ave, mutacao) => {
      const equivalentes = nomesEquivalentes(mutacao);
      const visuais = [ave.corMutacao, ...(ave.mutacoesVisuais || [])].filter(Boolean).map(normalizarNome);
      const portadores = (ave.portadores || []).map(normalizarNome);
      if (visuais.some((nome) => equivalentes.includes(nome))) return "apresenta visualmente";
      if (portadores.some((nome) => equivalentes.includes(nome))) return "foi informado como portador";
      return "não foi informado como portador nem como visual";
    };

    const explicacoes = calc.lociConsiderados.map((nome) => {
      const mutacao = mutacoesRingNeck.find((m) => nomesEquivalentes(m).includes(normalizarNome(nome)));
      if (!mutacao) return "";
      const heranca = mutacao.tipoHeranca || "";
      let motivo = "O filhote recebe uma combinação de genes dos dois pais.";
      if (heranca === "Autossomica recessiva") {
        motivo = "Para essa característica aparecer, o filhote precisa receber o gene dos dois pais. Se receber de apenas um, poderá ser portador sem mostrar a mutação.";
      } else if (heranca === "Ligada ao sexo (recessiva)") {
        motivo = "Essa característica é ligada ao sexo. Machos e fêmeas recebem combinações diferentes, por isso as possibilidades são separadas por sexo.";
      } else if (heranca === "Autossomica dominante" || heranca === "Ligada ao sexo (dominante)") {
        motivo = "Nessa herança, uma cópia do gene já pode ser suficiente para a característica aparecer.";
      } else if (heranca === "Codominante") {
        motivo = "Uma ou duas cópias desse fator podem produzir resultados visuais diferentes.";
      }
      return `${mutacao.nome}: ${motivo} Pai: ${estadoDoGene(paiParaCalculo, mutacao)}; mãe: ${estadoDoGene(maeParaCalculo, mutacao)}.`;
    }).filter(Boolean);
    setResultado({
      tipo: "sucesso",
      cruzamento: `${pai.nome || "Pai"} × ${mae.nome || "Mãe"}`,
      genotipos: calc.lociConsiderados.join(", "),
      possibilidades,
      explicacoes,
      observacoes,
    });
  }

  function renderGenitor(tipo) {
    const isPai = tipo === "pai";
    const modo = isPai ? modoPai : modoMae;
    const setModo = isPai ? setModoPai : setModoMae;
    const registro = isPai ? pai : mae;
    const manual = isPai ? paiManual : maeManual;
    const setManual = isPai ? setPaiManual : setMaeManual;
    const opcoes = isPai ? machos : femeas;
    const id = isPai ? paiId : maeId;
    const setId = isPai ? setPaiId : setMaeId;
    const titulo = isPai ? "Pai" : "Mãe";
    const extras = mutacoesRingNeck.filter((m) => m.permitePortador !== false);

    return (
      <section className="rounded-2xl p-5" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
        <h3 className="text-lg font-semibold mb-1" style={{ color: "#2B241C" }}>{titulo}</h3>
        <p className="text-xs mb-3" style={{ color: "#8a7a63" }}>{isPai ? "Reprodutor macho" : "Reprodutora fêmea"}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <button type="button" onClick={() => { setModo("cadastro"); setResultado(null); }} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: modo === "cadastro" ? "#C69A2E" : "#f2e8d4", color: "#2B241C" }}>Escolher do meu plantel</button>
          <button type="button" onClick={() => { setModo("manual"); setResultado(null); }} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: modo === "manual" ? "#C69A2E" : "#f2e8d4", color: "#2B241C" }}>Informar outra ave</button>
        </div>

        {modo === "cadastro" ? (
          <>
            <label className="block text-sm font-medium mb-1" style={{ color: "#5e5143" }}>Selecione {isPai ? "o macho" : "a fêmea"}</label>
            <select className="w-full rounded-xl px-3 py-3" style={campo} value={id} onChange={(e) => { setId(e.target.value); setResultado(null); }}>
              <option value="">Escolha uma ave cadastrada</option>
              {opcoes.map((a) => <option key={a.id} value={a.id}>{a.nome} — {a.corMutacao || a.corBase || "Cor não informada"}</option>)}
            </select>
            {registro && (
              <div className="mt-3 rounded-xl p-3 text-sm" style={{ background: "#fffaf0", color: "#5e5143" }}>
                <strong>{registro.nome}</strong>
                <p className="mt-1">Cor: {registro.corBase || "não informada"}</p>
                <p>Mutação visível: {[registro.corMutacao, ...(registro.mutacoesVisuais || [])].filter(Boolean).join(", ") || "não informada"}</p>
                <p>Portador de: {(registro.portadores || []).join(", ") || "não informado"}</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#5e5143" }}>Nome (opcional)</label>
              <input className="w-full rounded-xl px-3 py-3" style={campo} placeholder={titulo} value={manual.nome} onChange={(e) => atualizarManual(setManual, "nome", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#5e5143" }}>Qual é a cor ou aparência da ave?</label>
              <select
                className="w-full rounded-xl px-3 py-3"
                style={campo}
                value={
                  manual.aparenciaOutra
                    ? "__outra__"
                    : manual.corMutacao === "Ino"
                    ? (String(manual.corBase || "").toLowerCase().includes("blue") ? "popular|Albino" : "popular|Lutino")
                    : manual.corMutacao === "Cremino"
                      ? "popular|Cremino"
                      : manual.corMutacao
                        ? (extras.some((m) => m.nome === manual.corMutacao) ? manual.corMutacao : "__outra__")
                        : manual.corBase || ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "__outra__") {
                    setManual((atual) => ({ ...atual, corMutacao: "", corLivre: "", aparenciaOutra: true }));
                    setResultado(null);
                  } else if (value.startsWith("popular|")) {
                    const popular = value.split("|")[1];
                    setManual((atual) => ({
                      ...atual,
                      aparenciaOutra: false,
                      corLivre: "",
                      corMutacao: popular === "Lutino" || popular === "Albino" ? "Ino" : popular,
                      corBase: popular === "Lutino" ? "Green (Verde)" : popular === "Albino" ? "Blue (Azul)" : atual.corBase || "",
                    }));
                    setResultado(null);
                  } else if (CORES_BASE.some((c) => c.value === value)) {
                    setManual((atual) => ({ ...atual, corBase: value, corMutacao: "", corLivre: "", aparenciaOutra: false }));
                    setResultado(null);
                  } else {
                    setManual((atual) => ({
                      ...atual,
                      corMutacao: value,
                      corLivre: "",
                      aparenciaOutra: false,
                    }));
                    setResultado(null);
                  }
                }}
              >
                <option value="">Não sei informar</option>
                <optgroup label="Cores-base">
                  {CORES_BASE.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </optgroup>
                <optgroup label="Aparências conhecidas">
                  <option value="popular|Lutino">Lutino</option>
                  <option value="popular|Albino">Albino</option>
                  <option value="popular|Cremino">Cremino</option>
                  {mutacoesRingNeck.filter((m) => m.nome !== "Ino").map((m) => (
                    <option key={m.id || m.nome} value={m.nome}>{m.nome}</option>
                  ))}
                </optgroup>
                <option value="__outra__">Outra (digitar)</option>
              </select>
              {manual.aparenciaOutra && (
                <input
                  className="w-full rounded-xl px-3 py-3 mt-2"
                  style={campo}
                  placeholder="Digite a cor ou mutação"
                  value={manual.corLivre || ""}
                  onChange={(e) => atualizarManual(setManual, "corLivre", e.target.value)}
                />
              )}
            </div>
            <div className="rounded-xl p-3 text-xs" style={{ background: "#fffaf0", color: "#8a7a63" }}>
              A aparência principal já foi selecionada acima. Para informar outras mutações visíveis, abra “Se souber mais detalhes (opcional)”.
            </div>

            <details className="rounded-xl p-3" style={{ background: "#fffaf0", border: "1px solid #d8c6a5" }}>
              <summary className="cursor-pointer text-sm font-semibold" style={{ color: "#5e5143" }}>Se souber mais detalhes (opcional)</summary>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: "#5e5143" }}>Outras mutações que aparecem na aparência</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mutacoesRingNeck.filter((m) => m.nome !== manual.corMutacao && m.categoria !== "cor_base").map((m) => (
                      <label key={m.id || m.nome} className="flex gap-2 text-sm" style={{ color: "#5e5143" }}>
                        <input type="checkbox" checked={(manual.mutacoesVisuais || []).includes(m.nome)} onChange={(e) => {
                          const lista = e.target.checked ? [...new Set([...(manual.mutacoesVisuais || []), m.nome])] : (manual.mutacoesVisuais || []).filter((n) => n !== m.nome);
                          atualizarManual(setManual, "mutacoesVisuais", lista);
                        }} />
                        {m.nome}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-sm" style={{ color: "#5e5143" }}>Fator escuro
                    <select className="w-full rounded-xl px-3 py-2 mt-1" style={campo} value={manual.fatoresGeneticos?.darkFactor || ""} onChange={(e) => setManual((v) => ({ ...v, fatoresGeneticos: { ...(v.fatoresGeneticos || {}), darkFactor: e.target.value } }))}>
                      <option value="">Não sei</option><option value="SF">Simples (SF)</option><option value="DF">Duplo (DF)</option>
                    </select>
                  </label>
                  <label className="text-sm" style={{ color: "#5e5143" }}>Fator violeta
                    <select className="w-full rounded-xl px-3 py-2 mt-1" style={campo} value={manual.fatoresGeneticos?.violetFactor || ""} onChange={(e) => setManual((v) => ({ ...v, fatoresGeneticos: { ...(v.fatoresGeneticos || {}), violetFactor: e.target.value } }))}>
                      <option value="">Não sei</option><option value="SF">Simples (SF)</option><option value="DF">Duplo (DF)</option>
                    </select>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#5e5143" }}>A ave é portadora de alguma mutação?</label>
                  <input className="w-full rounded-xl px-3 py-3" style={campo} placeholder="Digite os nomes separados por vírgula" value={(manual.portadores || []).join(", ")} onChange={(e) => atualizarManual(setManual, "portadores", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
                  <p className="text-xs mt-1" style={{ color: "#8a7a63" }}>Portadora é a ave que carrega um gene sem mostrar essa cor. Se não tiver certeza, deixe em branco.</p>
                </div>
                {isPai ? null : <p className="text-xs" style={{ color: "#8a7a63" }}>Em algumas mutações ligadas ao sexo, a fêmea não pode ser portadora oculta. O sistema considera essa regra.</p>}
              </div>
            </details>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
        <div className="text-xs font-semibold mb-2" style={{ color: "#8a7a63" }}>CALCULADORA GENÉTICA</div>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: "#2B241C" }}>Quais filhotes esse casal pode gerar?</h2>
        <p className="text-sm" style={{ color: "#6f6254" }}>Escolha o pai e a mãe. Se eles não estiverem cadastrados, informe apenas o que você sabe. Os detalhes avançados são opcionais.</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-lg p-3" style={{ background: "#fffaf0" }}>
            <strong className="text-sm" style={{ color: "#2B241C" }}>Cor</strong>
            <p className="text-xs mt-1" style={{ color: "#6f6254" }}>É a cor que você vê na ave, como verde ou azul.</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: "#fffaf0" }}>
            <strong className="text-sm" style={{ color: "#2B241C" }}>Mutação</strong>
            <p className="text-xs mt-1" style={{ color: "#6f6254" }}>É uma característica genética que muda a aparência, como lutino ou albino.</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: "#fffaf0" }}>
            <strong className="text-sm" style={{ color: "#2B241C" }}>Portador</strong>
            <p className="text-xs mt-1" style={{ color: "#6f6254" }}>A ave carrega uma mutação, mas não mostra essa característica. Só informe se tiver certeza.</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{renderGenitor("pai")}{renderGenitor("mae")}</div>
      <button onClick={calcular} className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold" style={{ background: "#C69A2E", color: "#2B241C" }}>Ver possíveis filhotes</button>
      {resultado && <div className="rounded-2xl p-5" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
        {resultado.tipo === "erro" ? (
          <div style={{ color: "#A6402B" }}>
            <div className="font-semibold mb-1">Ainda não é possível calcular esse casal.</div>
            <p className="text-sm">{resultado.mensagem}</p>
          </div>
        ) : <>
          <div className="text-xs font-semibold mb-2" style={{ color: "#8a7a63" }}>POSSIBILIDADES TEÓRICAS</div>
          <div className="text-xl font-semibold" style={{ color: "#2B241C" }}>{resultado.cruzamento}</div>
          <div className="mt-2 text-sm" style={{ color: "#8a7a63" }}>Características consideradas: {resultado.genotipos || "—"}</div>
          <div className="mt-4 space-y-3">{resultado.possibilidades.map((item, index) => <div key={`${item.nome}-${item.detalhe}-${index}`} className="flex items-center justify-between rounded-xl px-4 py-3 gap-3" style={{ background: "#f2e8d4", border: "1px solid #dfcba7" }}>
            <div><div className="font-semibold">{item.nome}</div><div className="text-xs mt-1" style={{ color: "#8a7a63" }}>{item.detalhe}</div></div><span className="font-semibold">{item.percentual}</span>
          </div>)}</div>
          <div className="mt-5 rounded-xl p-4" style={{ background: "#f5e9c8", border: "1px solid #dfcba7" }}>
            <div className="font-semibold text-sm mb-2" style={{ color: "#2B241C" }}>Entenda o resultado</div>
            <div className="space-y-2 mb-3">
              {resultado.explicacoes?.length ? resultado.explicacoes.map((explicacao, i) => (
                <p key={i} className="text-sm" style={{ color: "#6f6254" }}>{explicacao}</p>
              )) : (
                <p className="text-sm" style={{ color: "#6f6254" }}>O sistema considerou as informações genéticas cadastradas para o pai e a mãe. Se alguma mutação ou condição de portador não foi informada, ela não pode ser presumida no cálculo.</p>
              )}
            </div>
            <p className="text-sm mb-2" style={{ color: "#6f6254" }}>As porcentagens mostram possibilidades para cada filhote, não uma garantia da quantidade que nascerá.</p>
            <p className="text-sm mb-2" style={{ color: "#6f6254" }}>Por exemplo, 25% significa que a expectativa estatística é cerca de 1 em cada 4 filhotes ao longo de muitas ninhadas. Cada filhote, porém, pode ser diferente.</p>
            <p className="text-sm mb-1" style={{ color: "#6f6254" }}><strong>Visual:</strong> o filhote apresenta a mutação na aparência.</p>
            <p className="text-sm mb-1" style={{ color: "#6f6254" }}><strong>Portador:</strong> o filhote pode carregar a mutação, mesmo sem mostrar essa cor.</p>
            <p className="text-sm" style={{ color: "#6f6254" }}><strong>Normal:</strong> não apresenta a mutação considerada no cálculo.</p>
          </div>
          <ul className="mt-3 space-y-1 text-xs" style={{ color: "#8a7a63" }}>{resultado.observacoes.map((obs, i) => <li key={i}>• {obs}</li>)}</ul>
        </>}
      </div>}
    </div>
  );
}
