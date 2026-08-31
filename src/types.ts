export type DamageLevel = 'pequena' | 'media' | 'grande' | 'troca' | 'apenas_pintura' | 'apenas_funilaria';

export type PaintType = 'solida' | 'metalica' | 'perolizada' | 'tricote_especial';

export type QuoteStatus = 'pendente' | 'aprovado' | 'em_servico' | 'finalizado' | 'cancelado';

export interface MaterialInsumo {
  id: string;
  nome: string;
  categoria: 'preparacao' | 'pintura' | 'acabamento' | 'complementar';
  embalagemComercial: string; // ex: 'Lata 900ml', 'Pote 1000g', 'Rolo 50m'
  unidadeBase: 'ml' | 'g' | 'un' | 'm';
  quantidadeEmbalagem: number; // ex: 900
  precoEmbalagem: number; // ex: 130.00
  // Custo fracionado unitário calculado: precoEmbalagem / quantidadeEmbalagem
  consumoPadraoPorPeca: {
    pequena: number;
    media: number;
    grande: number;
    troca: number;
    apenas_pintura: number;
    apenas_funilaria: number;
  };
}

export interface BodyPartItem {
  id: string;
  nome: string;
  areaRelativa: number; // multiplicador de área (1.0 padrão, 1.5 teto, 0.4 retrovisor)
  horasFunilariaPadrao: {
    pequena: number;
    media: number;
    grande: number;
    troca: number;
    apenas_pintura: number;
    apenas_funilaria: number;
  };
  horasPinturaPadrao: {
    pequena: number;
    media: number;
    grande: number;
    troca: number;
    apenas_pintura: number;
    apenas_funilaria: number;
  };
}

export interface QuoteItem {
  id: string;
  pecaId: string;
  nomePeca: string;
  avaria: DamageLevel;
  observacoes?: string;
  valorMaoDeObraFunilaria: number;
  valorMaoDeObraPintura: number;
  valorInsumosFracionados: number;
  custoPecaReposicao: number;
  valorTotalItem: number;
  detalhesInsumos: {
    materialNome: string;
    quantidadeGasta: number;
    unidade: string;
    custoFracionado: number;
  }[];
}

export interface VehicleInfo {
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  cor: string;
  tipoPintura: PaintType;
  km?: string;
  chassi?: string;
}

export interface ClientInfo {
  nome: string;
  telefone: string;
  email?: string;
  documento?: string; // CPF ou CNPJ
}

export interface WorkshopProfile {
  nomeOficina: string;
  razaoSocial?: string;
  cnpj?: string;
  telefoneWhatsApp: string;
  telefoneFixo?: string;
  endereco: string;
  cidadeUf: string;
  logotipoUrl: string;
  chavePix: string;
  tipoChavePix: 'cpf' | 'cnpj' | 'telefone' | 'email' | 'aleatoria';
  titularPix: string;
  margemLucroPadrao: number; // Porcentagem (ex: 35%)
  valorHoraFunilaria: number; // R$ por hora
  valorHoraPintura: number; // R$ por hora
  textoGarantia: string;
  prazoValidadeDias: number;
}

export interface Quote {
  id: string;
  numero: string;
  dataCriacao: string;
  dataValidade: string;
  status: QuoteStatus;
  cliente: ClientInfo;
  veiculo: VehicleInfo;
  itens: QuoteItem[];
  
  // Totais calculados
  subtotalMaoDeObra: number;
  subtotalInsumosFracionados: number;
  subtotalPecasReposicao: number;
  margemLucroAplicada: number;
  valorLucro: number;
  desconto: number;
  valorTotal: number;
  
  // Condições de pagamento
  valorSinal50: number;
  valorRestante50: number;
  prazoExecucaoDias: number;
  observacoesGerais: string;
}

export interface UserAccount {
  email: string;
  nome: string;
  licencaAtiva: boolean;
  chaveAtivacao?: string;
  dataAtivacao?: string;
}
