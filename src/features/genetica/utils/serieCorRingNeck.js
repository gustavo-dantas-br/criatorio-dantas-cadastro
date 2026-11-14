// Modelo de alelos da serie de cor em Ring Neck (Psittacula krameri).
// Referencia de trabalho: G = verde, T = turquoise, B = blue.
// G domina T e B; T domina B. O fenotipo depende do par de alelos.
// Este modulo ainda NAO esta conectado a calculadora de producao.

export const ALELOS_SERIE_COR = Object.freeze({
  GREEN: "G",
  TURQUOISE: "T",
  BLUE: "B",
});

const ORDEM = ["G", "T", "B"];

export function normalizarGenotipoSerie(genotipo) {
  if (!Array.isArray(genotipo) || genotipo.length !== 2) {
    throw new Error("Informe dois alelos para o locus da serie de cor.");
  }
  const alelos = genotipo.map((alelo) => String(alelo).toUpperCase());
  if (alelos.some((alelo) => !ORDEM.includes(alelo))) {
    throw new Error("Alelo invalido. Use G, T ou B.");
  }
  return alelos.sort((a, b) => ORDEM.indexOf(a) - ORDEM.indexOf(b));
}

export function fenotipoSerieCor(genotipo) {
  const [a, b] = normalizarGenotipoSerie(genotipo);
  if (a === "G" && b === "G") return { nome: "Green (Verde)", genotipo: "G/G", visual: "Green", portador: null };
  if (a === "G" && b === "T") return { nome: "Green split Turquoise", genotipo: "G/T", visual: "Green", portador: "Turquoise" };
  if (a === "G" && b === "B") return { nome: "Green split Blue", genotipo: "G/B", visual: "Green", portador: "Blue" };
  if (a === "T" && b === "T") return { nome: "Turquoise (Turquesa)", genotipo: "T/T", visual: "Turquoise", portador: null };
  if (a === "T" && b === "B") return { nome: "Turquoise Blue (Azul Turquesa)", genotipo: "T/B", visual: "Turquoise Blue", portador: null };
  return { nome: "Blue (Azul)", genotipo: "B/B", visual: "Blue", portador: null };
}

export function cruzarSerieCor(genotipoPai, genotipoMae) {
  const pai = normalizarGenotipoSerie(genotipoPai);
  const mae = normalizarGenotipoSerie(genotipoMae);
  const resultados = new Map();

  for (const aleloPai of pai) {
    for (const aleloMae of mae) {
      const fenotipo = fenotipoSerieCor([aleloPai, aleloMae]);
      const atual = resultados.get(fenotipo.genotipo) || { ...fenotipo, probabilidade: 0 };
      atual.probabilidade += 25;
      resultados.set(fenotipo.genotipo, atual);
    }
  }

  return [...resultados.values()]
    .map(({ probabilidade, ...fenotipo }) => ({ ...fenotipo, percentual: probabilidade }))
    .sort((a, b) => b.percentual - a.percentual || a.genotipo.localeCompare(b.genotipo));
}

export const NOTAS_SERIE_COR = [
  "A cor visivel nem sempre revela o genotipo: aves verdes podem carregar alelos azul ou turquesa.",
  "Turquoise Blue e representado aqui pelo heterozigoto T/B.",
  "A hierarquia de dominancia e uma regra de trabalho para o locus parblue; validar cada nomenclatura regional antes de liberar previsoes.",
  "Dark Factor e Violet Factor sao modificadores separados e ainda nao entram neste modulo.",
];
