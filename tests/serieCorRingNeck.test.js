import test from "node:test";
import assert from "node:assert/strict";
import { cruzarSerieCor, fenotipoSerieCor, normalizarGenotipoSerie } from "../src/features/genetica/utils/serieCorRingNeck.js";

test("classifica os seis genotipos da serie de cor", () => {
  assert.equal(fenotipoSerieCor(["G", "G"]).visual, "Green");
  assert.equal(fenotipoSerieCor(["G", "T"]).portador, "Turquoise");
  assert.equal(fenotipoSerieCor(["G", "B"]).portador, "Blue");
  assert.equal(fenotipoSerieCor(["T", "T"]).visual, "Turquoise");
  assert.equal(fenotipoSerieCor(["T", "B"]).visual, "Turquoise Blue");
  assert.equal(fenotipoSerieCor(["B", "B"]).visual, "Blue");
});

test("normaliza a ordem dos alelos e rejeita genotipos invalidos", () => {
  assert.deepEqual(normalizarGenotipoSerie(["B", "G"]), ["G", "B"]);
  assert.throws(() => normalizarGenotipoSerie(["G"]));
  assert.throws(() => normalizarGenotipoSerie(["G", "X"]));
});

test("G/G x B/B produz 100% G/B (verde split azul)", () => {
  assert.deepEqual(cruzarSerieCor(["G", "G"], ["B", "B"]).map((r) => [r.genotipo, r.percentual]), [["G/B", 100]]);
});

test("T/B x T/B produz 25% T/T, 50% T/B e 25% B/B", () => {
  const resultado = cruzarSerieCor(["T", "B"], ["T", "B"]);
  assert.deepEqual(resultado.map((r) => [r.genotipo, r.percentual]), [["T/B", 50], ["B/B", 25], ["T/T", 25]]);
});

test("G/T x B/B produz 50% G/B e 50% T/B", () => {
  const resultado = cruzarSerieCor(["G", "T"], ["B", "B"]);
  assert.deepEqual(resultado.map((r) => [r.genotipo, r.percentual]), [["G/B", 50], ["T/B", 50]]);
});
