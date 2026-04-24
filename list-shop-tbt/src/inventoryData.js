export const APP_STORAGE_KEY = 'tbt-stock-suite:auth:v3'

export const TOLERANCE_RULES = {
  normal: 0.02,
  alert: 0.05,
}

export const USER_ROLES = {
  OWNER: 'owner',
  STORE: 'store',
}

export const ROLE_META = {
  [USER_ROLES.OWNER]: {
    label: 'Dono',
    shortLabel: 'Dono da base',
  },
  [USER_ROLES.STORE]: {
    label: 'Pizzaria',
    shortLabel: 'Responsavel do estoque',
  },
}

export const PAGE_META = {
  dashboard: {
    label: 'Inicio',
    eyebrow: 'Operacao',
    title: 'Painel da base',
    description:
      'Veja o que falta configurar e acompanhe os ultimos movimentos sem abrir tudo ao mesmo tempo.',
  },
  products: {
    label: 'Produtos',
    eyebrow: 'Cadastro',
    title: 'Produtos controlados',
    description:
      'Cadastre apenas os itens que realmente vao entrar no controle do estoque.',
  },
  access: {
    label: 'Pizzarias',
    eyebrow: 'Acessos',
    title: 'Usuarios por unidade',
    description:
      'O dono cria as pizzarias da base e entrega usuario e senha so para quem fecha o estoque.',
  },
  central: {
    label: 'Central',
    eyebrow: 'Movimento',
    title: 'Entrada e envio',
    description:
      'A central registra o que entrou e o que saiu para cada pizzaria.',
  },
  stores: {
    label: 'Fechamento',
    eyebrow: 'Contagem',
    title: 'Fechamento diario',
    description:
      'A pizzaria informa o estoque real contado e o sistema gera o ajuste automaticamente.',
  },
  adjustments: {
    label: 'Ajustes',
    eyebrow: 'Controle',
    title: 'Correcao manual',
    description:
      'Use ajuste com motivo quando precisar corrigir estoque sem reabrir o passado.',
  },
}

export const PAGE_ORDER_BY_ROLE = {
  [USER_ROLES.OWNER]: [
    'dashboard',
    'products',
    'access',
    'central',
    'stores',
    'adjustments',
  ],
  [USER_ROLES.STORE]: ['stores'],
}

export const DEFAULT_PAGE_BY_ROLE = {
  [USER_ROLES.OWNER]: 'dashboard',
  [USER_ROLES.STORE]: 'stores',
}

export const PRODUCT_TYPE_OPTIONS = [
  {
    value: 'package',
    label: 'Pacote',
    shortLabel: 'pacote',
    allowDecimals: false,
  },
  {
    value: 'bundle',
    label: 'Fardo',
    shortLabel: 'fardo',
    allowDecimals: false,
  },
  {
    value: 'box',
    label: 'Caixa',
    shortLabel: 'caixa',
    allowDecimals: false,
  },
  {
    value: 'unit',
    label: 'Unidade',
    shortLabel: 'unidade',
    allowDecimals: false,
  },
  {
    value: 'tube',
    label: 'Bisnaga',
    shortLabel: 'bisnaga',
    allowDecimals: false,
  },
  {
    value: 'dozen',
    label: 'Duzia',
    shortLabel: 'duzia',
    allowDecimals: false,
  },
  {
    value: 'kg',
    label: 'Kg',
    shortLabel: 'kg',
    allowDecimals: true,
  },
]

export const ADJUSTMENT_REASONS = [
  'Perda operacional',
  'Produto vencido',
  'Erro de lancamento',
  'Correcao de contagem',
  'Avaria na transferencia',
]
