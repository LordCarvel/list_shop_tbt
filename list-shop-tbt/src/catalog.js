export const CATALOG = [
  {
    title: 'Refrigerantes',
    items: [
      { name: 'Coca 2L', unit: 'Fardo' },
      { name: 'Coca 2L Zero', unit: 'Fardo' },
      { name: 'Kuat Guaraná 2L', unit: 'Fardo' },
      { name: 'Fanta Uva 2L', unit: 'Fardo' },
      { name: 'Fanta Laranja 2L', unit: 'Fardo' },
      { name: 'Pepsi 2L', unit: 'Fardo' },
      { name: 'Sprite 2L', unit: 'Fardo' },
      { name: 'Guaraná Antarctica 2L', unit: 'Fardo' },
      { name: 'Coca 600ml', unit: 'Fardo' },
      { name: 'Coca 600ml Zero', unit: 'Fardo' },
      { name: 'Coca Lata', unit: 'Fardo' },
      { name: 'Coca Lata Zero', unit: 'Fardo' },
      { name: 'Pepsi Lata', unit: 'Fardo' },
      { name: 'Água 500ml', unit: 'Fardo' },
    ],
  },
  {
    title: 'Mercearia & Diversos',
    items: [
      { name: 'Açúcar' },
      { name: 'Sal' },
      { name: 'Fubá' },
      { name: 'Fermento' },
      { name: 'Óleo' },
      { name: 'Manjericão' },
      { name: 'Pimenta Calabresa' },
      { name: 'Palmito' },
      { name: 'Milho / Ervilha' },
      { name: 'Atum' },
      { name: 'Leite Ninho' },
      { name: 'Abacaxi' },
      { name: 'Ovomaltine' },
      { name: 'Creme de Leite' },
      { name: 'Coco Ralado' },
      { name: 'Confetes' },
      { name: 'Granulado' },
      { name: 'Alho Frito' },
      { name: 'Orégano' },
      { name: 'Parmesão' },
      { name: 'Copos', unit: 'Pct' },
      { name: 'Guardanapos', unit: 'Pct' },
      { name: 'Saquinho de Alimentos', unit: 'Pct' },
      { name: 'Veneno de Barata' },
    ],
  },
  {
    title: 'Hortifruti',
    items: [
      { name: 'Tomates', unit: 'Kg' },
      { name: 'Cebola (encomenda p/ Quinta)', unit: 'Kg' },
      { name: 'Morangos', unit: 'Cx' },
      { name: 'Bananas', unit: 'Kg' },
      { name: 'Ovos', unit: 'Dúzia' },
    ],
  },
  {
    title: 'Frios',
    items: [
      { name: 'Gorgonzola' },
      { name: 'Peito de Peru' },
      { name: 'Peito de Frango' },
      { name: 'Salame Italiano' },
    ],
  },
  {
    title: 'Limpeza',
    items: [
      { name: 'Detergente' },
      { name: 'Esponjas', unit: 'Pct' },
      { name: 'Qboa' },
      { name: 'Sacos de Lixo', unit: 'Pct' },
      { name: 'Papel Higiênico', unit: 'Fardo' },
    ],
  },
  {
    title: 'Materiais de Escritório',
    items: [
      { name: 'Bobinas / Bloquinhos' },
      { name: 'Caneta / Canetão / Grampos' },
      { name: 'Etiquetas Lacres' },
      { name: 'Envelopes de Esfihas' },
    ],
  },
  {
    title: 'Embalagens',
    items: [
      { name: 'Caixas 50 cm', unit: 'Pct' },
      { name: 'Caixas 45 cm', unit: 'Pct' },
      { name: 'Caixas 40 cm', unit: 'Pct' },
      { name: 'Caixas 35 cm', unit: 'Pct' },
      { name: 'Caixas 30 cm', unit: 'Pct' },
      { name: 'Caixas 25 cm', unit: 'Pct' },
      { name: 'Caixas 20 cm', unit: 'Pct' },
      { name: 'Mesinhas / Galão de Água' },
    ],
  },
  {
    title: 'SB (Mussarela)',
    items: [
      { name: 'Mussarela' },
      { name: 'Presunto' },
      { name: 'Bacon' },
      { name: 'Provolone' },
      { name: 'Champignon' },
      { name: 'Azeitonas' },
      { name: 'Batata Palha' },
      { name: 'Catupiry Original' },
      { name: 'Cream Cheese' },
      { name: 'Requeijão' },
      { name: 'Cheddar' },
      { name: 'Brócolis' },
      { name: 'Barbecue' },
      { name: 'Molho de Tomate' },
      { name: 'Chocolate ao Leite', unit: 'Bisnaga' },
      { name: 'Chocolate Branco', unit: 'Bisnaga' },
      { name: 'Creme de Avelã', unit: 'Bisnaga' },
      { name: 'Sachês', unit: 'Cx' },
    ],
  },
  {
    title: 'Copal',
    items: [{ name: 'Carne de Costela' }, { name: 'Carne Seca' }],
  },
  {
    title: 'Farinha',
    items: [{ name: 'Pedidos p/ Quinta' }],
  },
  {
    title: 'Irene',
    items: [{ name: 'Frango' }],
  },
  {
    title: 'Açougue',
    items: [{ name: 'Kit Carne / Cebola / Tomate / Limão' }],
  },
  {
    title: 'Sílvio Frios',
    items: [
      { name: 'Calabresa' },
      { name: 'Lombo' },
      { name: 'Pepperoni' },
      { name: 'Linguiça Blumenau' },
    ],
  },
]

function normalizeCatalogText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function getCatalogUnitType(unit) {
  const normalizedUnit = normalizeCatalogText(unit)

  if (normalizedUnit === 'fardo') {
    return 'bundle'
  }

  if (normalizedUnit === 'cx') {
    return 'box'
  }

  if (normalizedUnit === 'kg') {
    return 'kg'
  }

  if (normalizedUnit === 'bisnaga') {
    return 'tube'
  }

  if (normalizedUnit === 'duzia') {
    return 'dozen'
  }

  return 'package'
}

const CATALOG_LOOKUP = new Map(
  CATALOG.flatMap((category) =>
    category.items.map((item) => [
      normalizeCatalogText(item.name),
      {
        categoryTitle: category.title,
        item,
      },
    ]),
  ),
)

export function buildCatalogProductPayload(categoryTitle, item) {
  return {
    name: item.name,
    unitType: getCatalogUnitType(item.unit),
    catalogCategory: categoryTitle,
  }
}

export function getCatalogMatchForProduct(product) {
  return CATALOG_LOOKUP.get(normalizeCatalogText(product.name)) ?? null
}

export function getProductSectionTitle(product) {
  return (
    product.catalogCategory ||
    getCatalogMatchForProduct(product)?.categoryTitle ||
    'Outros itens'
  )
}

export function groupProductsByCatalogSections(products) {
  const groupedProducts = CATALOG.map((category) => ({
    title: category.title,
    products: [],
  }))
  const groupedByTitle = new Map(
    groupedProducts.map((group) => [normalizeCatalogText(group.title), group]),
  )
  const otherGroup = {
    title: 'Outros itens',
    products: [],
  }

  products.forEach((product) => {
    const sectionTitle = getProductSectionTitle(product)
    const sectionKey = normalizeCatalogText(sectionTitle)
    const group = groupedByTitle.get(sectionKey) ?? otherGroup

    group.products.push(product)
  })

  return [...groupedProducts.filter((group) => group.products.length), otherGroup]
    .filter((group) => group.products.length)
}
