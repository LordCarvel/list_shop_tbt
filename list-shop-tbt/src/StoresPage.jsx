import { useEffect, useMemo, useState } from 'react'
import { groupProductsByCatalogSections } from './catalog'
import {
  createClosingDraft,
  findClosing,
  formatDateLabel,
  formatFriendlyQuantity,
  formatPercent,
  getLatestClosingDate,
  getProductById,
  getProductTypeLabel,
  getStockSnapshot,
  getUnitById,
  getUnitStockAtDate,
  isStoreLocked,
  parseUserQuantity,
  toEditableQuantity,
} from './inventoryLogic'

function StatusPill({ tone, children }) {
  return <span className={`status-pill tone-${tone}`}>{children}</span>
}

function makeEmptyCounts(products) {
  return Object.fromEntries(products.map((product) => [product.id, '']))
}

function ProductInputSections({ groups, children }) {
  return (
    <div className="product-section-stack">
      {groups.map((group) => (
        <article key={group.title} className="product-section-card">
          <header className="product-section-head">
            <div>
              <strong>{group.title}</strong>
              <p>{group.products.length} itens</p>
            </div>
          </header>

          <div className="closing-grid product-section-grid">
            {group.products.map((product) => children(product))}
          </div>
        </article>
      ))}
    </div>
  )
}

function buildEditorState(products, closing) {
  if (!closing) {
    return {
      counts: makeEmptyCounts(products),
      note: '',
    }
  }

  return {
    counts: Object.fromEntries(
      closing.items.map((item) => {
        const product = getProductById(products, item.productId)

        return [
          item.productId,
          toEditableQuantity(item.actual, product?.unitType ?? 'unit'),
        ]
      }),
    ),
    note: closing.note,
  }
}

export default function StoresPage({
  previousDate,
  products,
  referenceDate,
  shipmentRequests = [],
  stores,
  units,
  systemState,
  onCloseDay,
  onCreateShipmentRequest,
  isRestrictedView = false,
}) {
  const initialStoreId = stores[0]?.id ?? ''
  const initialClosing = initialStoreId
    ? findClosing(systemState, initialStoreId, previousDate)
    : null
  const initialEditorState = buildEditorState(products, initialClosing)

  const [activeStoreId, setActiveStoreId] = useState(initialStoreId)
  const [closingDate, setClosingDate] = useState(previousDate)
  const [counts, setCounts] = useState(initialEditorState.counts)
  const [note, setNote] = useState(initialEditorState.note)
  const [formError, setFormError] = useState('')
  const [requestQuantities, setRequestQuantities] = useState(makeEmptyCounts(products))
  const [requestDeliveryDate, setRequestDeliveryDate] = useState(referenceDate)
  const [requestNote, setRequestNote] = useState('')
  const [requestError, setRequestError] = useState('')
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

  const hasStores = stores.length > 0
  const hasProducts = products.length > 0
  const resolvedActiveStoreId = stores.some((store) => store.id === activeStoreId)
    ? activeStoreId
    : stores[0]?.id ?? ''
  const activeStore = getUnitById(units, resolvedActiveStoreId)
  const snapshot = useMemo(
    () => getStockSnapshot(systemState, units, products),
    [systemState, units, products],
  )
  const currentStock = resolvedActiveStoreId ? snapshot[resolvedActiveStoreId] ?? {} : {}
  const expectedStock = resolvedActiveStoreId
    ? getUnitStockAtDate(
        systemState,
        units,
        products,
        resolvedActiveStoreId,
        closingDate,
        {
          excludeClosingDate: closingDate,
          excludeClosingUnitId: resolvedActiveStoreId,
        },
      )
    : {}
  const latestClosingDate = resolvedActiveStoreId
    ? getLatestClosingDate(systemState, resolvedActiveStoreId)
    : null
  const selectedClosing = resolvedActiveStoreId
    ? findClosing(systemState, resolvedActiveStoreId, closingDate)
    : null
  const lockedPastDay =
    resolvedActiveStoreId &&
    isStoreLocked(systemState, units, resolvedActiveStoreId, closingDate) &&
    !selectedClosing
  const pendingYesterday =
    resolvedActiveStoreId &&
    !findClosing(systemState, resolvedActiveStoreId, previousDate)
  const activeStoreRequests = shipmentRequests
    .filter((request) => request.unitId === resolvedActiveStoreId)
    .sort((left, right) => (right.createdAt ?? '').localeCompare(left.createdAt ?? ''))
    .slice(0, 4)
  const productGroups = useMemo(
    () => groupProductsByCatalogSections(products),
    [products],
  )
  const requestItemsCount = products.filter(
    (product) => parseUserQuantity(requestQuantities[product.id], product.unitType) > 0,
  ).length

  useEffect(() => {
    if (!isRequestModalOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsRequestModalOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isRequestModalOpen])

  function syncEditor(nextStoreId, nextDate) {
    const nextClosing = nextStoreId
      ? findClosing(systemState, nextStoreId, nextDate)
      : null
    const nextEditorState = buildEditorState(products, nextClosing)

    setCounts(nextEditorState.counts)
    setNote(nextEditorState.note)
    setFormError('')
    setRequestError('')
    setRequestQuantities(makeEmptyCounts(products))
    setRequestNote('')
    setIsRequestModalOpen(false)
  }

  function handleStoreChange(storeId) {
    setActiveStoreId(storeId)
    syncEditor(storeId, closingDate)
  }

  function handleDateChange(nextDate) {
    setClosingDate(nextDate)
    syncEditor(resolvedActiveStoreId, nextDate)
  }

  function handleCopyExpected() {
    setCounts(
      Object.fromEntries(
        products.map((product) => [
          product.id,
          toEditableQuantity(expectedStock[product.id] ?? 0, product.unitType),
        ]),
      ),
    )
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!resolvedActiveStoreId) {
      setFormError('Nenhuma pizzaria selecionada.')
      return
    }

    const missingProducts = products.filter((product) => !counts[product.id]?.trim())

    if (missingProducts.length) {
      setFormError('Preencha a contagem real de todos os produtos controlados.')
      return
    }

    const numericCounts = Object.fromEntries(
      products.map((product) => [
        product.id,
        parseUserQuantity(counts[product.id], product.unitType),
      ]),
    )
    const draft = createClosingDraft(
      systemState,
      units,
      products,
      resolvedActiveStoreId,
      closingDate,
      numericCounts,
    )

    if (draft.requiresObservation && !note.trim()) {
      setFormError('Divergencia acima de 5% exige observacao obrigatoria.')
      return
    }

    const result = onCloseDay({
      unitId: resolvedActiveStoreId,
      date: closingDate,
      counts: numericCounts,
      note,
    })

    if (!result.ok) {
      setFormError(result.message)
      return
    }

    setFormError('')
  }

  function handleRequestSubmit(event) {
    event.preventDefault()

    if (!resolvedActiveStoreId) {
      setRequestError('Nenhuma pizzaria selecionada.')
      return
    }

    if (!requestDeliveryDate) {
      setRequestError('Informe a data desejada para envio.')
      return
    }

    const items = products
      .map((product) => ({
        productId: product.id,
        quantity: parseUserQuantity(requestQuantities[product.id], product.unitType),
      }))
      .filter((item) => item.quantity > 0)

    if (!items.length) {
      setRequestError('Informe pelo menos um produto para reposicao.')
      return
    }

    const result = onCreateShipmentRequest({
      unitId: resolvedActiveStoreId,
      deliveryDate: requestDeliveryDate,
      items,
      note: requestNote,
    })

    if (!result.ok) {
      setRequestError(result.message)
      return
    }

    setRequestError('')
    setRequestQuantities(makeEmptyCounts(products))
    setRequestNote('')
    setIsRequestModalOpen(false)
  }

  return (
    <div className="page-grid stores-grid">
      {isRestrictedView ? (
        <nav className="mobile-quick-actions" aria-label="Acoes rapidas da pizzaria">
          <a href="#store-closing-section">Fechamento</a>
          <a href="#store-request-section">Pedido</a>
          <a href="#store-stock-section">Estoque</a>
        </nav>
      ) : null}

      <section className="panel panel-wide" data-tour="store-guide">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Como a pizzaria usa</p>
            <h2>
              {isRestrictedView
                ? 'O responsavel da loja usa apenas esta tela'
                : 'O dono acompanha e a loja fecha por aqui'}
            </h2>
          </div>

          <StatusPill tone="muted">Sem registrar consumo por pizza</StatusPill>
        </div>

        <div className="guide-grid">
          <article className="guide-card compact">
            <span className="guide-number">1</span>
            <div>
              <strong>Escolha a data</strong>
              <p>Normalmente a pizzaria fecha o dia anterior no fim da operacao.</p>
            </div>
          </article>

          <article className="guide-card compact">
            <span className="guide-number">2</span>
            <div>
              <strong>Conte o estoque real</strong>
              <p>Digite o que sobrou de verdade, e nao o que o sistema esperava.</p>
            </div>
          </article>

          <article className="guide-card compact">
            <span className="guide-number">3</span>
            <div>
              <strong>Peca reposicao</strong>
              <p>Informe para a base o que precisa chegar no proximo envio.</p>
            </div>
          </article>
        </div>
      </section>

      {!isRestrictedView ? (
        <section className="panel store-selector-panel">
          <div className="panel-head">
            <div>
              <p className="panel-eyebrow">Pizzarias</p>
              <h2>Selecionar unidade</h2>
            </div>

            <StatusPill tone={hasStores ? 'success' : 'warning'}>
              {hasStores ? `${stores.length} unidades` : 'Nenhuma unidade'}
            </StatusPill>
          </div>

          {hasStores ? (
            <div className="unit-switcher">
              {stores.map((store) => {
                const hasPending = !findClosing(systemState, store.id, previousDate)

                return (
                  <button
                    key={store.id}
                    type="button"
                    className={`unit-switch${
                      resolvedActiveStoreId === store.id ? ' is-active' : ''
                    }`}
                    onClick={() => handleStoreChange(store.id)}
                  >
                    <div>
                      <strong>{store.name}</strong>
                      <p>
                        Ultimo fechamento:{' '}
                        {getLatestClosingDate(systemState, store.id)
                          ? formatDateLabel(getLatestClosingDate(systemState, store.id))
                          : 'nenhum'}
                      </p>
                    </div>

                    <StatusPill tone={hasPending ? 'warning' : 'success'}>
                      {hasPending ? 'Pendente' : 'Em dia'}
                    </StatusPill>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="empty-mini">
              O dono ainda precisa criar a primeira pizzaria na area de acessos.
            </div>
          )}
        </section>
      ) : null}

      <section className="panel store-summary-panel">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">
              {isRestrictedView ? 'Minha pizzaria' : 'Resumo da unidade'}
            </p>
            <h2>{activeStore?.name ?? 'Pizzaria nao configurada'}</h2>
          </div>

          <label className="field-inline" data-tour="store-date">
            <span>Data do fechamento</span>
            <input
              type="date"
              value={closingDate}
              disabled={!hasStores}
              onChange={(event) => handleDateChange(event.target.value)}
            />
          </label>
        </div>

        <div className="metric-row compact">
          <article className="metric-card neutral">
            <span className="metric-label">Pendencia de ontem</span>
            <strong>{pendingYesterday ? 'Sim' : 'Nao'}</strong>
            <p>Referencia {formatDateLabel(previousDate)}</p>
          </article>

          <article className="metric-card accent">
            <span className="metric-label">Produtos controlados</span>
            <strong>{products.length}</strong>
            <p>Itens que precisam ser contados no fechamento.</p>
          </article>

          <article className="metric-card dark">
            <span className="metric-label">Ultimo fechamento</span>
            <strong>
              {latestClosingDate ? formatDateLabel(latestClosingDate) : 'Nenhum'}
            </strong>
            <p>Dia travado apos o fechamento.</p>
          </article>
        </div>
      </section>

      <section
        id="store-closing-section"
        className="panel panel-wide store-closing-panel"
        data-tour="store-closing"
      >
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Fechamento</p>
            <h2>
              {selectedClosing
                ? `Dia ${formatDateLabel(closingDate)} fechado`
                : `Fechar dia ${formatDateLabel(closingDate)}`}
            </h2>
          </div>

          {!selectedClosing && !lockedPastDay && hasStores && hasProducts ? (
            <button
              type="button"
              className="secondary-button"
              onClick={handleCopyExpected}
            >
              Copiar esperado
            </button>
          ) : null}
        </div>

        {!hasStores ? (
          <div className="locked-state">
            <strong>Nenhuma pizzaria esta pronta para fechamento.</strong>
            <p>
              O dono precisa criar a unidade e entregar o login ao responsavel do
              estoque.
            </p>
          </div>
        ) : !hasProducts ? (
          <div className="locked-state">
            <strong>Nenhum produto cadastrado para a contagem.</strong>
            <p>
              Antes de fechar o dia, o dono precisa cadastrar os produtos da base.
            </p>
          </div>
        ) : lockedPastDay ? (
          <div className="locked-state">
            <strong>Esse dia ja esta travado por fechamento posterior.</strong>
            <p>Para corrigir, use ajuste manual. O historico nao volta no tempo.</p>
          </div>
        ) : selectedClosing ? (
          <div className="closing-summary">
            <div className="summary-banner">
              <StatusPill
                tone={
                  selectedClosing.highestSeverity === 'observation'
                    ? 'danger'
                    : selectedClosing.highestSeverity === 'alert'
                      ? 'warning'
                      : 'success'
                }
              >
                {selectedClosing.highestSeverity === 'observation'
                  ? 'Observacao registrada'
                  : selectedClosing.highestSeverity === 'alert'
                    ? 'Fechamento com alerta'
                    : 'Fechamento normal'}
              </StatusPill>
              <span>
                {selectedClosing.changedItemsCount} itens ajustados automaticamente
              </span>
            </div>

            <div className="closing-grid">
              {selectedClosing.items.map((item) => {
                const product = getProductById(products, item.productId)

                return (
                  <article key={item.productId} className="closing-card">
                    <strong>{product?.name ?? 'Produto removido'}</strong>
                    <p>
                      Esperado{' '}
                      {product
                        ? formatFriendlyQuantity(item.expected, product.unitType)
                        : item.expected}
                    </p>
                    <p>
                      Real{' '}
                      {product
                        ? formatFriendlyQuantity(item.actual, product.unitType)
                        : item.actual}
                    </p>
                    <StatusPill
                      tone={
                        item.severity === 'observation'
                          ? 'danger'
                          : item.severity === 'alert'
                            ? 'warning'
                            : 'muted'
                      }
                    >
                      {item.difference === 0
                        ? 'Sem ajuste'
                        : `${item.difference > 0 ? '+' : ''}${
                            product
                              ? formatFriendlyQuantity(item.difference, product.unitType)
                              : item.difference
                          }`}
                    </StatusPill>
                    <small>Desvio {formatPercent(item.deviationRate || 0)}</small>
                  </article>
                )
              })}
            </div>

            {selectedClosing.note ? (
              <div className="note-box">{selectedClosing.note}</div>
            ) : null}
          </div>
        ) : (
          <form className="closing-form" onSubmit={handleSubmit}>
            <ProductInputSections groups={productGroups}>
              {(product) => (
                <label key={product.id} className="closing-card input-card">
                  <strong>{product.name}</strong>
                  <p>
                    Esperado{' '}
                    {formatFriendlyQuantity(expectedStock[product.id] ?? 0, product.unitType)}
                  </p>
                  <span className="input-label">
                    Real ({getProductTypeLabel(product.unitType)})
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={counts[product.id] ?? ''}
                    onChange={(event) =>
                      setCounts((current) => ({
                        ...current,
                        [product.id]: event.target.value,
                      }))
                    }
                  />
                </label>
              )}
            </ProductInputSections>

            <label className="field">
              <span>Observacao do fechamento</span>
              <textarea
                rows="3"
                placeholder="Obrigatorio quando houver divergencia acima de 5%."
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>

            {formError ? <p className="form-error">{formError}</p> : null}

            <div className="form-actions">
              <button type="submit" className="primary-button">
                Fechar dia e gerar ajustes
              </button>
            </div>
          </form>
        )}
      </section>

      <section
        id="store-request-section"
        className="panel panel-wide store-request-panel"
        data-tour="store-request"
      >
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Reposicao</p>
            <h2>Solicitar envio da base</h2>
          </div>

          <StatusPill tone="accent">Pedido nao altera estoque</StatusPill>
        </div>

        {!hasStores ? (
          <div className="locked-state">
            <strong>Nenhuma pizzaria esta pronta para pedir reposicao.</strong>
            <p>Crie a unidade antes de mandar solicitacoes para a base.</p>
          </div>
        ) : !hasProducts ? (
          <div className="locked-state">
            <strong>Nenhum produto cadastrado para pedir reposicao.</strong>
            <p>Cadastre os produtos para a pizzaria informar as quantidades.</p>
          </div>
        ) : (
          <div className="request-launch-card">
            <div>
              <p className="panel-eyebrow">Proximo envio</p>
              <h2>{activeStore?.name ?? 'Pizzaria'}</h2>
              <p>
                {requestItemsCount
                  ? `${requestItemsCount} itens preenchidos para ${formatDateLabel(
                      requestDeliveryDate,
                    )}`
                  : 'Abra a lista completa para preencher as quantidades por sessao.'}
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={() => setIsRequestModalOpen(true)}
            >
              Abrir lista de pedido
            </button>
          </div>
        )}

        {isRequestModalOpen && hasStores && hasProducts ? (
          <div
            className="request-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsRequestModalOpen(false)
              }
            }}
          >
            <form
              className="request-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="request-modal-title"
              onSubmit={handleRequestSubmit}
            >
              <div className="request-modal-head">
                <div>
                  <p className="panel-eyebrow">Lista de pedido</p>
                  <h2 id="request-modal-title">{activeStore?.name ?? 'Pizzaria'}</h2>
                </div>

                <button
                  type="button"
                  className="secondary-button compact-button"
                  onClick={() => setIsRequestModalOpen(false)}
                >
                  Fechar
                </button>
              </div>

              <div className="request-modal-body">
                <div className="panel-head">
                  <div>
                    <p className="panel-eyebrow">Itens por sessao</p>
                    <h2>{requestItemsCount} itens no pedido</h2>
                  </div>

                  <label className="field-inline">
                    <span>Data desejada</span>
                    <input
                      type="date"
                      value={requestDeliveryDate}
                      onChange={(event) => setRequestDeliveryDate(event.target.value)}
                    />
                  </label>
                </div>

                <ProductInputSections groups={productGroups}>
                  {(product) => (
                    <label key={product.id} className="closing-card input-card">
                      <strong>{product.name}</strong>
                      <p>
                        Saldo atual{' '}
                        {formatFriendlyQuantity(
                          currentStock[product.id] ?? 0,
                          product.unitType,
                        )}
                      </p>
                      <span className="input-label">
                        Pedir ({getProductTypeLabel(product.unitType)})
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0"
                        value={requestQuantities[product.id] ?? ''}
                        onChange={(event) =>
                          setRequestQuantities((current) => ({
                            ...current,
                            [product.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  )}
                </ProductInputSections>

                <label className="field">
                  <span>Observacao para a base</span>
                  <textarea
                    rows="3"
                    placeholder="Ex: mandar no primeiro envio da manha."
                    value={requestNote}
                    onChange={(event) => setRequestNote(event.target.value)}
                  />
                </label>

                {requestError ? <p className="form-error">{requestError}</p> : null}
              </div>

              <div className="request-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsRequestModalOpen(false)}
                >
                  Voltar
                </button>

                <button type="submit" className="primary-button">
                  Enviar solicitacao para a base
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="list-stack">
          <div className="panel-head">
            <div>
              <p className="panel-eyebrow">Historico da unidade</p>
              <h2>Ultimas solicitacoes</h2>
            </div>
          </div>

          {activeStoreRequests.length ? (
            activeStoreRequests.map((request) => (
              <article key={request.id} className="request-card">
                <div className="request-card-head">
                  <div>
                    <strong>Envio de {formatDateLabel(request.deliveryDate)}</strong>
                    <p>Pedido enviado em {formatDateLabel(request.requestDate)}</p>
                  </div>

                  <StatusPill
                    tone={request.status === 'fulfilled' ? 'success' : 'warning'}
                  >
                    {request.status === 'fulfilled' ? 'Atendido' : 'Pendente'}
                  </StatusPill>
                </div>

                <div className="request-item-list">
                  {request.items.map((item) => {
                    const product = getProductById(products, item.productId)

                    return (
                      <span key={item.productId} className="request-item">
                        {product?.name ?? 'Produto removido'}:{' '}
                        {product
                          ? formatFriendlyQuantity(item.quantity, product.unitType)
                          : item.quantity}
                      </span>
                    )
                  })}
                </div>

                {request.note ? <p>{request.note}</p> : null}
              </article>
            ))
          ) : (
            <div className="empty-mini">
              Nenhuma solicitacao de reposicao enviada por esta pizzaria ainda.
            </div>
          )}
        </div>
      </section>

      <section
        id="store-stock-section"
        className="panel panel-wide store-stock-panel"
        data-tour="store-stock"
      >
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Posicao atual</p>
            <h2>Estoque calculado da pizzaria</h2>
          </div>

          <StatusPill tone="muted">Baseado nos movimentos e ajustes</StatusPill>
        </div>

        <div className="table-shell">
          <table className="data-table stock-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Saldo atual</th>
              </tr>
            </thead>
            <tbody>
              {hasProducts ? (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{getProductTypeLabel(product.unitType)}</td>
                    <td>
                      {formatFriendlyQuantity(currentStock[product.id] ?? 0, product.unitType)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">
                    <div className="table-empty-state">
                      Nenhum produto cadastrado ainda para mostrar no estoque da unidade.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
