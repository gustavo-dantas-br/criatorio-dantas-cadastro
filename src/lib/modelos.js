// Fabrica objetos iniciais usados nos formularios e cadastros.

function emptyAve() {
  return {
    id: null,
    nome: "",
    especie: "Ring Neck",
    sexo: "Indefinido",
    // Campos genéticos opcionais, mantendo compatibilidade com cadastros antigos.
    corBase: "",
    corMutacao: "",
    mutacoesVisuais: [],
    fatoresGeneticos: { darkFactor: "", violetFactor: "" },
    portadores: [],
    pesos: [],
    corAnilha: "",
    anilha: "",
    nascimento: "",
    origem: "",
    criador: "Dantas",
    ctf: "",
    sexado: false,
    laudoNota: "",
    paiId: "",
    paiExterno: "",
    maeId: "",
    maeExterno: "",
    parceiroId: "",
    casalLabel: "",
    foto: "",
    status: "No plantel",
    anuncioPreco: "",
    anuncioDescricao: "",
    ninhadasGeradas: "",
    garantiaDias: "",
    origemTipo: "Nasceu no plantel",
    fornecedorNome: "",
    fornecedorTelefone: "",
    fornecedorEndereco: "",
    fornecedorId: "",
    valorCompra: "",
    dataCompra: "",
    compradorNome: "",
    compradorTelefone: "",
    compradorEndereco: "",
    valorVenda: "",
    dataVenda: "",
    clienteId: "",
    dataEntrega: "",
    statusPosVenda: "Venda realizada",
    dataUltimoContato: "",
    obsPosVenda: "",
    clienteSatisfeito: "Pendente",
    criadoEm: "",
  };
}

function emptyDespesa() {
  return { id: null, tipo: "Racao", descricao: "", valor: "", data: "" };
}

function emptyMutacao() {
  return {
    id: null,
    nome: "",
    nomeAlternativo: "",
    gene: "",
    serie: "",
    tipoHeranca: "Autossomica recessiva",
    combinaCom: "",
    comoIdentificar: "",
    observacoes: "",
    categoria: "mutacao",
    especie: "Ring Neck",
    statusValidacao: "em_validacao",
    calculadoraAtiva: false,
    permitePortador: true,
    descricaoIniciante: "",
    grupoAlelico: "",
  };
}

function emptyIndicacao() {
  return {
    id: null,
    clienteIndicouId: "",
    nomeIndicado: "",
    telefoneIndicado: "",
    data: "",
    status: "Nova",
    observacoes: "",
    criadoEm: "",
  };
}

function emptyAnuncio() {
  return {
    id: null,
    aveId: "",
    nomeAve: "",
    especie: "",
    corMutacao: "",
    sexo: "",
    nascimento: "",
    foto: "",
    preco: "",
    descricao: "",
    ativo: true,
    criadoEm: "",
  };
}

function emptyPerfilCriador() {
  return { nomeCriatorio: "", nome: "", sobrenome: "", nomeCompleto: "", cidade: "", uf: "", whatsapp: "", email: "", logoUrl: "" };
}

function emptyPerfilPrivado() {
  return { endereco: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "", cep: "" };
}

function emptyCliente() {
  return { id: null, nome: "", telefone: "", endereco: "", observacoes: "", criadoEm: "" };
}

function emptyFornecedor() {
  return { id: null, nome: "", telefone: "", endereco: "", observacoes: "", criadoEm: "" };
}

export { emptyAve, emptyDespesa, emptyMutacao, emptyIndicacao, emptyAnuncio, emptyPerfilCriador, emptyPerfilPrivado, emptyCliente, emptyFornecedor };
