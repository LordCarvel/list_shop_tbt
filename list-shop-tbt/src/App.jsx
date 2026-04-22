import { useEffect, useState } from 'react'
import { CATALOG } from './catalog'
import './App.css'

const CONTACT_STORAGE_KEY = 'list-shop-tbt:contact'

const CATALOG_WITH_IDS = CATALOG.map((category, categoryIndex) => ({
  ...category,
  items: category.items.map((item, itemIndex) => ({
    ...item,
    id: `category-${categoryIndex}-item-${itemIndex}`,
  })),
}))

const TOTAL_ITEMS = CATALOG_WITH_IDS.reduce(
  (sum, category) => sum + category.items.length,
  0,
)

function createInitialSelections() {
  return Object.fromEntries(
    CATALOG_WITH_IDS.flatMap((category) =>
      category.items.map((item) => [
        item.id,
        {
          quantity: '',
        },
      ]),
    ),
  )
}

function readStoredContact() {
  if (typeof window === 'undefined') {
    return { storeName: 'TBT', phone: '' }
  }

  try {
    const raw = window.localStorage.getItem(CONTACT_STORAGE_KEY)

    if (!raw) {
      return { storeName: 'TBT', phone: '' }
    }

    const parsed = JSON.parse(raw)

    return {
      storeName:
        typeof parsed.storeName === 'string' && parsed.storeName.trim()
          ? parsed.storeName
          : 'TBT',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
    }
  } catch {
    return { storeName: 'TBT', phone: '' }
  }
}

function normalizePhone(phone) {
  return phone.replace(/\D/g, '')
}

function parseQuantity(quantity) {
  const normalizedQuantity = quantity.trim().replace(',', '.')

  if (!normalizedQuantity) {
    return 0
  }

  const numericQuantity = Number(normalizedQuantity)

  if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
    return 0
  }

  return numericQuantity
}

function hasRequestedQuantity(quantity) {
  return parseQuantity(quantity) > 0
}

function formatQuantity(quantity) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return ''
  }

  const roundedQuantity = Math.round(quantity * 1000) / 1000

  return (Number.isInteger(roundedQuantity)
    ? String(roundedQuantity)
    : roundedQuantity.toString()
  ).replace('.', ',')
}

function collectRequestedGroups(selections) {
  return CATALOG_WITH_IDS.reduce((groups, category) => {
    const items = category.items.reduce((requestedItems, item) => {
      const selection = selections[item.id]
      const quantity = selection?.quantity?.trim() ?? ''

      if (!hasRequestedQuantity(quantity)) {
        return requestedItems
      }

      requestedItems.push({
        name: item.name,
        quantity,
        unit: item.unit ?? '',
      })

      return requestedItems
    }, [])

    if (items.length > 0) {
      groups.push({
        title: category.title,
        items,
      })
    }

    return groups
  }, [])
}

function buildWhatsAppMessage(storeName, groups) {
  const normalizedStore = storeName.trim() || 'TBT'
  const lines = [`*LISTA ${normalizedStore.toUpperCase()}*`]

  groups.forEach((group) => {
    lines.push('', `*${group.title}*`)

    group.items.forEach((item) => {
      const quantityLabel = item.unit
        ? `${item.quantity} ${item.unit}`
        : item.quantity

      lines.push(`- ${quantityLabel} ${item.name}`)
    })
  })

  return lines.join('\n')
}

function App() {
  const [storeName, setStoreName] = useState(() => readStoredContact().storeName)
  const [phone, setPhone] = useState(() => readStoredContact().phone)
  const [search, setSearch] = useState('')
  const [selections, setSelections] = useState(createInitialSelections)

  useEffect(() => {
    try {
      window.localStorage.setItem(
        CONTACT_STORAGE_KEY,
        JSON.stringify({ storeName, phone }),
      )
    } catch {
      return
    }
  }, [storeName, phone])

  const query = search.trim().toLowerCase()

  const filteredCatalog = CATALOG_WITH_IDS.reduce((categories, category) => {
    const categoryMatches = category.title.toLowerCase().includes(query)
    const visibleItems =
      !query || categoryMatches
        ? category.items
        : category.items.filter((item) =>
            item.name.toLowerCase().includes(query),
          )

    if (visibleItems.length > 0) {
      categories.push({
        ...category,
        visibleItems,
      })
    }

    return categories
  }, [])

  const requestedGroups = collectRequestedGroups(selections)
  const requestedItemsCount = requestedGroups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  )
  const visibleItemsCount = filteredCatalog.reduce(
    (sum, category) => sum + category.visibleItems.length,
    0,
  )
  const sanitizedPhone = normalizePhone(phone)
  const messagePreview = requestedItemsCount
    ? buildWhatsAppMessage(storeName, requestedGroups)
    : ''
  const canSend = Boolean(requestedItemsCount && sanitizedPhone)

  function updateQuantity(itemId, quantity) {
    setSelections((currentSelections) => ({
      ...currentSelections,
      [itemId]: {
        quantity,
      },
    }))
  }

  function adjustQuantity(itemId, delta) {
    setSelections((currentSelections) => {
      const currentQuantity = parseQuantity(
        currentSelections[itemId]?.quantity ?? '',
      )
      const nextQuantity = Math.max(currentQuantity + delta, 0)

      return {
        ...currentSelections,
        [itemId]: {
          quantity: formatQuantity(nextQuantity),
        },
      }
    })
  }

  function clearCategory(items) {
    setSelections((currentSelections) => {
      const nextSelections = { ...currentSelections }

      items.forEach((item) => {
        nextSelections[item.id] = {
          quantity: '',
        }
      })

      return nextSelections
    })
  }

  function handleResetSelections() {
    setSelections(createInitialSelections())
  }

  function handleSendToWhatsApp() {
    if (!sanitizedPhone) {
      window.alert('Informe um numero de WhatsApp com DDD.')
      return
    }

    if (!requestedItemsCount) {
      window.alert('Preencha pelo menos uma quantidade maior que zero.')
      return
    }

    const url = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(messagePreview)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="app-shell">
      <div className="page-frame">
        <header className="topbar">
          <div className="topbar-copy">
            <p className="eyebrow">Lista TBT</p>
            <h1>Lista de compras</h1>
            <p className="topbar-note">
              Use os botoes de + e - ou digite a quantidade. O que for maior
              que zero entra no pedido.
            </p>
          </div>

          <div className="topbar-form">
            <label className="field">
              <span>Loja</span>
              <input
                type="text"
                placeholder="Opcional"
                value={storeName}
                onChange={(event) => setStoreName(event.target.value)}
              />
            </label>

            <label className="field">
              <span>WhatsApp</span>
              <input
                type="tel"
                placeholder="5588999999999"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Buscar</span>
              <input
                type="search"
                placeholder="Item ou categoria"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="topbar-meta">
            <span className="meta-chip">{requestedItemsCount} itens no pedido</span>
            <span className="meta-chip">
              {query
                ? `${visibleItemsCount} resultados`
                : `${TOTAL_ITEMS} itens disponiveis`}
            </span>
          </div>
        </header>

        <main className="catalog-grid" aria-label="Categorias da lista">
          {filteredCatalog.length ? (
            filteredCatalog.map((category) => {
              const requestedInCategory = category.items.filter((item) =>
                hasRequestedQuantity(selections[item.id]?.quantity ?? ''),
              ).length

              return (
                <article key={category.title} className="category-card">
                  <header className="category-header">
                    <div>
                      <h2>{category.title}</h2>
                      <p className="category-status">
                        {requestedInCategory} itens com quantidade
                      </p>
                    </div>

                    {requestedInCategory > 0 ? (
                      <button
                        type="button"
                        className="mini-button"
                        onClick={() => clearCategory(category.items)}
                      >
                        Zerar
                      </button>
                    ) : null}
                  </header>

                  <div className="item-stack">
                    {category.visibleItems.map((item) => {
                      const quantity = selections[item.id]?.quantity ?? ''
                      const numericQuantity = parseQuantity(quantity)
                      const isActive = hasRequestedQuantity(quantity)

                      return (
                        <div
                          key={item.id}
                          className={`item-row${isActive ? ' is-active' : ''}`}
                        >
                          <div className="item-copy">
                            <div className="item-title-row">
                              <span className="item-name">{item.name}</span>
                              {item.unit ? (
                                <span className="item-unit">{item.unit}</span>
                              ) : null}
                            </div>
                            <span className="item-hint">
                              {isActive
                                ? 'Entrara no pedido final.'
                                : 'Quantidade zero fica fora do pedido.'}
                            </span>
                          </div>

                          <div className="quantity-controls">
                            <button
                              type="button"
                              className="quantity-stepper-button"
                              aria-label={`Diminuir quantidade de ${item.name}`}
                              onClick={() => adjustQuantity(item.id, -1)}
                              disabled={numericQuantity <= 0}
                            >
                              -
                            </button>

                            <input
                              type="text"
                              inputMode="decimal"
                              aria-label={`Quantidade de ${item.name}`}
                              className="quantity-input"
                              placeholder="0"
                              value={quantity}
                              onChange={(event) =>
                                updateQuantity(item.id, event.target.value)
                              }
                            />

                            <button
                              type="button"
                              className="quantity-stepper-button"
                              aria-label={`Aumentar quantidade de ${item.name}`}
                              onClick={() => adjustQuantity(item.id, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </article>
              )
            })
          ) : (
            <section className="empty-state">
              <p className="eyebrow">Sem resultado</p>
              <h2>Nenhum item encontrado.</h2>
              <p>Revise a busca para voltar a ver as categorias.</p>
            </section>
          )}
        </main>

        <footer className="action-bar">
          <div className="action-copy">
            <strong>
              {requestedItemsCount
                ? `${requestedItemsCount} itens prontos para envio`
                : 'Nenhum item no pedido'}
            </strong>
            <span>
              {!requestedItemsCount
                ? 'Preencha as quantidades que precisam ser compradas.'
                : sanitizedPhone
                  ? `Mensagem pronta para ${sanitizedPhone}.`
                  : 'Informe o WhatsApp para liberar o envio.'}
            </span>
          </div>

          <div className="action-buttons">
            <button
              type="button"
              className="ghost-button"
              onClick={handleResetSelections}
              disabled={!requestedItemsCount}
            >
              Zerar tudo
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={handleSendToWhatsApp}
              disabled={!canSend}
            >
              Enviar no WhatsApp
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
