import React, { useState } from "react";
import { Bird, Upload, X, Loader2, Save } from "lucide-react";
export default function FormTab({ form, setForm, onSave, onPhoto, saving, machoOptions, femeaOptions, parceiroOptions, mutacoes, clientes, fornecedores, onCancel, Card, Field, SectionTitle, inputStyle, ESPECIES, SEXOS, STATUS_AVE, ORIGEM_TIPOS, SeletorComprador, SeletorFornecedor, PesoHistorico }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.type === "checkbox" ? e.target.checked : e.target.value }));
  // Editar manualmente os campos do comprador desfaz o vinculo com o cliente
  // selecionado (senao ficaria um clienteId apontando pra dado errado).
  const setComprador = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, clienteId: "" }));
  const setFornecedor = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, fornecedorId: "" }));
  // Se a ave ja tem uma mutacao que nao bate com nenhuma cadastrada no Banco
  // de Genetica, assume que foi digitada livre ("Outra") e mantem o campo aberto.
  const [mutacaoLivre, setMutacaoLivre] = useState(
    () => !!form.corMutacao && !mutacoes.some((m) => m.nome === form.corMutacao)
  );

  return (
    <div className="max-w-3xl">
      <SectionTitle>{form.id ? `Editando ${form.nome || "ave"}` : "Nova ave"}</SectionTitle>
      <div className="rounded-xl p-3 mb-4" style={{ background: "#f5e9c8", border: "1px solid #dfcba7" }}>
        <p className="text-sm" style={{ color: "#5e5143" }}>
          Preencha o básico: nome, espécie e sexo. Escolha a cor ou aparência se souber. O restante é opcional e pode ser completado depois.
        </p>
      </div>
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-lg overflow-hidden flex items-center justify-center relative mx-auto sm:mx-0" style={{ background: "#f1e6d2", border: "1px dashed #d6c39a" }}>
            {form.foto ? <img src={form.foto} className="w-full h-full object-cover" alt="" /> : <Bird size={28} color="#b09a78" />}
            <label className="absolute bottom-1 right-1 p-1.5 rounded-full cursor-pointer" style={{ background: "#C69A2E" }}>
              <Upload size={13} color="#2B1D14" />
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
            {form.foto && (
              <button type="button" onClick={() => setForm((f) => ({ ...f, foto: "" }))} className="absolute top-1 right-1 p-1 rounded-full" style={{ background: "#A6402B" }} title="Remover foto">
                <X size={12} color="#fff" />
              </button>
            )}
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome"><input style={inputStyle} value={form.nome} onChange={set("nome")} placeholder="ex: Princesa" /></Field>
            <Field label="Especie">
              <select style={inputStyle} value={form.especie} onChange={set("especie")}>{ESPECIES.map((e) => <option key={e}>{e}</option>)}</select>
            </Field>
            <Field label="Sexo">
              <select style={inputStyle} value={form.sexo} onChange={set("sexo")}>{SEXOS.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
            <Field label="Cor / aparência da ave">
              <select
                style={inputStyle}
                value={
                  form.corMutacao === "Ino"
                    ? (String(form.corBase || "").toLowerCase().includes("blue") ? "popular|Albino" : "popular|Lutino")
                    : form.corMutacao === "Cremino"
                      ? "popular|Cremino"
                      : form.corMutacao
                        ? (mutacaoLivre ? "__outra__" : form.corMutacao)
                      : form.corBase || ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "__outra__") {
                    setMutacaoLivre(true);
                    setForm((f) => ({ ...f, corMutacao: "" }));
                    return;
                  }
                  setMutacaoLivre(false);
                  if (value.startsWith("popular|")) {
                    const popular = value.split("|")[1];
                    setForm((f) => ({
                      ...f,
                      corMutacao: popular === "Lutino" || popular === "Albino" ? "Ino" : popular,
                      corBase: popular === "Lutino" ? "Green (Verde)" : popular === "Albino" ? "Blue (Azul)" : f.corBase || "",
                    }));
                  } else if (["Green (Verde)", "Blue (Azul)", "Turquoise (Turquesa)", "Turquoise Blue (Azul Turquesa)"].includes(value)) {
                    setForm((f) => ({ ...f, corBase: value, corMutacao: "" }));
                  } else {
                    setForm((f) => ({ ...f, corMutacao: value }));
                  }
                }}
              >
                <option value="">Selecione se souber</option>
                <optgroup label="Cores">
                  <option value="Green (Verde)">Verde</option>
                  <option value="Blue (Azul)">Azul</option>
                  <option value="Turquoise (Turquesa)">Turquesa</option>
                  <option value="Turquoise Blue (Azul Turquesa)">Azul turquesa</option>
                </optgroup>
                <optgroup label="Aparências conhecidas">
                  <option value="popular|Lutino">Lutino</option>
                  <option value="popular|Albino">Albino</option>
                  <option value="popular|Cremino">Cremino</option>
                  {mutacoes.filter((m) => !["Ino", "Pallid (Palido)"].includes(m.nome)).map((m) => (
                    <option key={m.id || m.nome} value={m.nome}>{m.nome}</option>
                  ))}
                </optgroup>
                <option value="__outra__">Outra (digitar)</option>
              </select>
              {mutacaoLivre && (
                <input
                  style={{ ...inputStyle, marginTop: 8 }}
                  value={form.corMutacao || ""}
                  onChange={(e) => setForm((f) => ({ ...f, corMutacao: e.target.value, corBase: "" }))}
                  placeholder="Digite a cor ou mutação"
                />
              )}
              <p className="text-xs mt-1" style={{ color: "#8a7a63" }}>
                Escolha o nome que você usa para identificar a ave. Se não souber, deixe em branco.
              </p>
            </Field>

            <div className="sm:col-span-2 rounded-xl p-3" style={{ background: "#fffaf0", border: "1px solid #d8c6a5" }}>
              <p className="cursor-pointer text-sm font-semibold" style={{ color: "#5e5143" }}>
                Informações genéticas adicionais (opcional)
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Cor de base (se souber)">
                  <select style={inputStyle} value={form.corBase || ""} onChange={set("corBase")}>
                    <option value="">Não informada</option>
                    <option value="Green (Verde)">Verde</option>
                    <option value="Blue (Azul)">Azul</option>
                    <option value="Turquoise (Turquesa)">Turquesa</option>
                    <option value="Turquoise Blue (Azul Turquesa)">Azul turquesa</option>
                  </select>
                </Field>
                <Field label="Genótipo da série de cor (se confirmado)">
                  <select style={inputStyle} value={form.serieCorGenotipo || ""} onChange={set("serieCorGenotipo")}>
                    <option value="">Não informado / não confirmado</option>
                    <option value="G/G">G/G — Verde</option>
                    <option value="G/T">G/T — Verde split Turquoise (Turquesa)</option>
                    <option value="G/B">G/B — Verde split Blue (Azul)</option>
                    <option value="T/T">T/T — Turquoise (Turquesa)</option>
                    <option value="T/B">T/B — Turquoise Blue (Azul Turquesa)</option>
                    <option value="B/B">B/B — Blue (Azul)</option>
                  </select>
                  <p className="text-xs mt-1" style={{ color: "#8a7a63" }}>Não presuma G/G pela aparência verde. Informe apenas com histórico ou descendência confirmada.</p>
                </Field>
                <Field label="Fator escuro (opcional)">
                  <select style={inputStyle} value={form.fatoresGeneticos?.darkFactor || ""} onChange={(e) => setForm((f) => ({ ...f, fatoresGeneticos: { ...(f.fatoresGeneticos || {}), darkFactor: e.target.value } }))}>
                    <option value="">Não informado</option><option value="NONE">Sem fator (confirmado)</option><option value="SF">Simples (SF)</option><option value="DF">Duplo (DF)</option>
                  </select>
                  <p className="text-xs mt-1" style={{ color: "#8a7a63" }}>Modifica a intensidade da cor.</p>
                </Field>
                <Field label="Fator violeta (opcional)">
                  <select style={inputStyle} value={form.fatoresGeneticos?.violetFactor || ""} onChange={(e) => setForm((f) => ({ ...f, fatoresGeneticos: { ...(f.fatoresGeneticos || {}), violetFactor: e.target.value } }))}>
                    <option value="">Não informado</option><option value="SF">Simples (SF)</option><option value="DF">Duplo (DF)</option>
                  </select>
                  <p className="text-xs mt-1" style={{ color: "#8a7a63" }}>Modifica a tonalidade; não é uma cor-base.</p>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Portadora de (somente se tiver certeza)">
                    <div className="rounded-xl p-3" style={{ background: "#fffaf0", border: "1px solid #d8c6a5" }}>
                      {mutacoes.filter((m) => m.permitePortador !== false && m.categoria !== "cor_base" && (!m.especie || m.especie === form.especie)).map((mutacao) => {
                        const selecionado = (form.portadores || []).includes(mutacao.nome);
                        return <label key={mutacao.id || mutacao.nome} className="flex items-center gap-2 text-sm py-1" style={{ color: "#4f4336" }}>
                          <input type="checkbox" checked={selecionado} disabled={form.sexo === "Femea" && (mutacao.tipoHeranca || "").startsWith("Ligada ao sexo")} onChange={(e) => {
                            const atuais = form.portadores || [];
                            const novos = e.target.checked ? [...new Set([...atuais, mutacao.nome])] : atuais.filter((nome) => nome !== mutacao.nome);
                            setForm((f) => ({ ...f, portadores: novos }));
                          }} />
                          <span>{mutacao.nome}</span>
                        </label>;
                      })}
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#8a7a63" }}>Se não souber, não marque nada.</p>
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Outras características visuais (opcional)">
                    <div className="rounded-xl p-3 max-h-48 overflow-y-auto" style={{ background: "#fffaf0", border: "1px solid #d8c6a5" }}>
                      {mutacoes.filter((m) => (!m.especie || m.especie === form.especie) && m.categoria !== "cor_base" && m.nome !== form.corMutacao).map((m) => {
                        const marcado = (form.mutacoesVisuais || []).includes(m.nome);
                        return <label key={m.id || m.nome} className="flex items-start gap-2 py-1.5 text-sm" style={{ color: "#4f4336" }}>
                          <input type="checkbox" checked={marcado} onChange={(e) => setForm((f) => ({
                            ...f,
                            mutacoesVisuais: e.target.checked
                              ? [...new Set([...(f.mutacoesVisuais || []), m.nome])]
                              : (f.mutacoesVisuais || []).filter((nome) => nome !== m.nome),
                          }))} />
                          <span>{m.nome}</span>
                        </label>;
                      })}
                    </div>
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl p-4" style={{ background: "#fffaf0", border: "1px solid #d8c6a5" }}>
          <p className="cursor-pointer font-semibold text-sm" style={{ color: "#5e5143" }}>
            Outras informações da ave (opcional)
          </p>
          <div className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Numero da anilha"><input style={inputStyle} value={form.anilha} onChange={set("anilha")} placeholder="ex: FOB 0080" /></Field>
          <Field label="Cor da anilha"><input style={inputStyle} value={form.corAnilha} onChange={set("corAnilha")} placeholder="ex: azul 2024" /></Field>
          <Field label="Nascimento"><input style={inputStyle} value={form.nascimento} onChange={set("nascimento")} placeholder="ex: Ago/2024" /></Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="De onde veio (origem)"><input style={inputStyle} value={form.origem} onChange={set("origem")} placeholder="ex: Nascido no criatorio / comprado de..." /></Field>
          <Field label="Criador"><input style={inputStyle} value={form.criador} onChange={set("criador")} /></Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field label="CTF"><input style={inputStyle} value={form.ctf} onChange={set("ctf")} placeholder="opcional" /></Field>
          <Field label="Sexagem">
            <div className="flex items-center gap-2 h-full pt-1.5">
              <input type="checkbox" checked={form.sexado} onChange={set("sexado")} />
              <span className="text-sm ui-sans" style={{ color: "#2B241C" }}>Ja tem laudo de sexagem</span>
            </div>
          </Field>
          <Field label="Nota do laudo"><input style={inputStyle} value={form.laudoNota} onChange={set("laudoNota")} placeholder="opcional" /></Field>
        </div>

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>STATUS E PLANTEL</div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={set("status")}>{STATUS_AVE.map((s) => <option key={s}>{s}</option>)}</select>
          </Field>
          <Field label="Ninhadas ja geradas (se reprodutora)">
            <input style={inputStyle} type="number" min="0" value={form.ninhadasGeradas} onChange={set("ninhadasGeradas")} placeholder="0" />
          </Field>
          <Field label="Garantia de saude (dias)">
            <input style={inputStyle} type="number" min="0" value={form.garantiaDias} onChange={set("garantiaDias")} placeholder="ex: 7" />
          </Field>
        </div>

        {form.status === "A venda" && !form.id && (
          <div className="mt-4 rounded-lg p-4" style={{ background: "#f5e9c8", border: "1px solid #d6c39a" }}>
            <div className="ui-sans text-sm font-semibold mb-3" style={{ color: "#2B241C" }}>Dados do anuncio</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Preco anunciado (R$)"><input style={inputStyle} type="number" min="0.01" step="0.01" value={form.anuncioPreco || ""} onChange={set("anuncioPreco")} placeholder="Ex.: 1500" /></Field>
              <Field label="Descricao para o anuncio"><input style={inputStyle} value={form.anuncioDescricao || ""} onChange={set("anuncioDescricao")} placeholder="Informacoes para interessados" /></Field>
            </div>
            <p className="ui-sans text-xs mt-2" style={{ color: "#725b32" }}>Ao salvar a ave, o anuncio sera criado separadamente e enviado para aprovacao.</p>
          </div>
        )}

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>AQUISICAO (COMPRA)</div>

        <Field label="Como essa ave chegou no plantel">
          <select style={{ ...inputStyle, maxWidth: 280 }} value={form.origemTipo} onChange={set("origemTipo")}>{ORIGEM_TIPOS.map((o) => <option key={o}>{o}</option>)}</select>
        </Field>

        {form.origemTipo === "Comprada" && (
          <div className="mt-4">
            <SeletorFornecedor form={form} setForm={setForm} fornecedores={fornecedores} inputStyle={inputStyle} />
            {form.fornecedorId && (
              <div className="ui-sans text-xs mt-2 mb-2 px-3 py-1.5 rounded-lg inline-block" style={{ background: "#e4ead9", color: "#556b3f" }}>
                ✓ Vinculado ao cadastro do fornecedor
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Field label="Nome de quem vendeu"><input style={inputStyle} value={form.fornecedorNome} onChange={setFornecedor("fornecedorNome")} /></Field>
              <Field label="Telefone do vendedor"><input style={inputStyle} value={form.fornecedorTelefone} onChange={setFornecedor("fornecedorTelefone")} /></Field>
              <Field label="Endereco do vendedor"><input style={inputStyle} value={form.fornecedorEndereco} onChange={setFornecedor("fornecedorEndereco")} /></Field>
              <Field label="Valor pago (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valorCompra} onChange={set("valorCompra")} /></Field>
              <Field label="Data da compra"><input style={inputStyle} type="date" value={form.dataCompra} onChange={set("dataCompra")} /></Field>
            </div>
          </div>
        )}

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>VENDA</div>

        {form.status === "Vendida" ? (
          <div>
            <SeletorComprador form={form} setForm={setForm} clientes={clientes} inputStyle={inputStyle} />
            {form.clienteId && (
              <div className="ui-sans text-xs mt-2 px-3 py-1.5 rounded-lg inline-block" style={{ background: "#e4ead9", color: "#556b3f" }}>
                ✓ Vinculado ao cadastro do cliente
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label="Nome do comprador"><input style={inputStyle} value={form.compradorNome} onChange={setComprador("compradorNome")} /></Field>
              <Field label="Telefone do comprador"><input style={inputStyle} value={form.compradorTelefone} onChange={setComprador("compradorTelefone")} /></Field>
              <Field label="Endereco do comprador"><input style={inputStyle} value={form.compradorEndereco} onChange={setComprador("compradorEndereco")} /></Field>
              <Field label="Valor vendido (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valorVenda} onChange={set("valorVenda")} /></Field>
              <Field label="Data da venda"><input style={inputStyle} type="date" value={form.dataVenda} onChange={set("dataVenda")} /></Field>
            </div>
          </div>
        ) : (
          <div className="text-xs ui-sans" style={{ color: "#8a7a63" }}>Muda o status pra "Vendida" acima pra preencher os dados do comprador.</div>
        )}

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>GENEALOGIA E CASAL</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Pai (se estiver cadastrado)">
            <select style={inputStyle} value={form.paiId} onChange={set("paiId")}>
              <option value="">-- nenhum --</option>
              {machoOptions.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <Field label="Pai (se nao estiver no sistema)"><input style={inputStyle} value={form.paiExterno} onChange={set("paiExterno")} placeholder="ex: desconhecido / de outro criador" /></Field>
          <Field label="Mae (se estiver cadastrada)">
            <select style={inputStyle} value={form.maeId} onChange={set("maeId")}>
              <option value="">-- nenhuma --</option>
              {femeaOptions.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <Field label="Mae (se nao estiver no sistema)"><input style={inputStyle} value={form.maeExterno} onChange={set("maeExterno")} placeholder="ex: emprestada do Anderson" /></Field>
          <Field label="Parceiro(a) / casal">
            <select style={inputStyle} value={form.parceiroId} onChange={set("parceiroId")}>
              <option value="">-- nenhum --</option>
              {parceiroOptions.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <Field label="Identificacao do casal"><input style={inputStyle} value={form.casalLabel} onChange={set("casalLabel")} placeholder="ex: Casal 04" /></Field>
        </div>

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>HISTORICO DE PESO</div>
        <PesoHistorico inputStyle={inputStyle} pesos={form.pesos} onChange={(pesos) => setForm((f) => ({ ...f, pesos }))} />

          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onSave} disabled={saving} className="ui-sans flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar
          </button>
          <button onClick={onCancel} className="ui-sans px-5 py-2.5 rounded-lg text-sm" style={{ background: "#e3d3b4", color: "#2B241C" }}>Cancelar</button>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Arvore Genealogica
// ---------------------------------------------------------------------------

