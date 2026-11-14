import test from "node:test";
import assert from "node:assert/strict";
import { calcularCruzamentoGenetico } from "../src/features/genetica/utils/calcularCruzamentoGenetico.js";

const cleartail = {
  nome: "Cleartail",
  tipoHeranca: "Autossomica recessiva",
  calculadoraAtiva: true,
};

function somarPorDescricao(resultado) {
  return resultado.resultadoFinal.reduce((acc, item) => {
    acc[item.descricao] = (acc[item.descricao] || 0) + item.percentual;
    return acc;
  }, {});
}

test("considera mutacao visual adicional no cruzamento autossomico", () => {
  const pai = { sexo: "Macho", corMutacao: "", mutacoesVisuais: ["Cleartail"], portadores: [] };
  const mae = { sexo: "Femea", corMutacao: "", mutacoesVisuais: [], portadores: ["Cleartail"] };
  const resultado = calcularCruzamentoGenetico(pai, mae, [cleartail]);
  const grupos = somarPorDescricao(resultado);

  assert.equal(resultado.semLociRelevantes, false);
  assert.equal(resultado.lociConsiderados.includes("Cleartail"), true);
  assert.equal(grupos["visual Cleartail"], 50);
  assert.equal(grupos["portador Cleartail"], 50);
});

test("considera varias mutacoes visuais e portadores no mesmo cruzamento", () => {
  const mutacoes = [
    cleartail,
    { nome: "Blue mutation", tipoHeranca: "Autossomica recessiva", calculadoraAtiva: true },
  ];
  const pai = { sexo: "Macho", mutacoesVisuais: ["Cleartail"], portadores: ["Blue mutation"] };
  const mae = { sexo: "Femea", mutacoesVisuais: [], portadores: ["Cleartail", "Blue mutation"] };
  const resultado = calcularCruzamentoGenetico(pai, mae, mutacoes);

  assert.deepEqual(new Set(resultado.lociConsiderados), new Set(["Cleartail", "Blue mutation"]));
  assert.ok(Math.abs(resultado.resultadoFinal.reduce((sum, item) => sum + item.percentual, 0) - 100) < 1e-9);
});

test("nao inclui no percentual mutacao marcada como pendente", () => {
  const pendente = { nome: "Pallid", tipoHeranca: "Ligada ao sexo (recessiva)", calculadoraAtiva: false };
  const pai = { sexo: "Macho", mutacoesVisuais: ["Pallid"], portadores: [] };
  const mae = { sexo: "Femea", mutacoesVisuais: [], portadores: [] };
  const resultado = calcularCruzamentoGenetico(pai, mae, [pendente]);

  assert.equal(resultado.semLociRelevantes, true);
  assert.deepEqual(resultado.bloqueadas, ["Pallid"]);
  assert.equal(resultado.resultadoFinal, undefined);
});

test("nao inventa resultado normal para heranca ainda nao implementada", () => {
  const emEstudo = { nome: "Dominant Edged", tipoHeranca: "Nao definido / em estudo", calculadoraAtiva: true };
  const pai = { sexo: "Macho", mutacoesVisuais: ["Dominant Edged"], portadores: [] };
  const mae = { sexo: "Femea", mutacoesVisuais: [], portadores: [] };
  const resultado = calcularCruzamentoGenetico(pai, mae, [emEstudo]);

  assert.equal(resultado.semLociRelevantes, true);
  assert.deepEqual(resultado.naoDefinidos, ["Dominant Edged"]);
  assert.equal(resultado.resultadoFinal, undefined);
});

test("reconhece nome alternativo da mutacao no cadastro", () => {
  const ino = {
    nome: "Ino (Lutino / Albino conforme a serie)",
    nomeAlternativo: "Ino",
    tipoHeranca: "Ligada ao sexo (recessiva)",
    calculadoraAtiva: false,
  };
  const pai = { sexo: "Macho", corMutacao: "Ino", portadores: [] };
  const mae = { sexo: "Femea", corMutacao: "", portadores: [] };
  const resultado = calcularCruzamentoGenetico(pai, mae, [ino]);

  assert.equal(resultado.semLociRelevantes, true);
  assert.deepEqual(resultado.bloqueadas, [ino.nome]);
  assert.deepEqual(resultado.naoRegistradas, []);
});
