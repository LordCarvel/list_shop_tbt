import { useDeferredValue, useState } from 'react'
import {
  formatDateLabel,
  formatFriendlyQuantity,
  getProductById,
  getProductTypeLabel,
  getUnitById,
  parseUserQuantity,
  toEditableQuantity,
} from './inventoryLogic'

function StatusPill({ tone, children }) {
  return <span className={`status-pill tone-${tone}`}>{children}</span>
}

export default function CentralPage({
  referenceDate,
  products,
  stores,
  units,
  centralRows,
  pendingShipmentRequests = [],
  recentCentralMovements,
  onCompleteShipmentRequest,
  onCreateEntry,
  onCreateTransfer,
}) {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [entryForm, setEntryForm] = useState({
    date: referenceDate,
    productId: '',
    quantity: '',
    partner: 'Fornecedor principal',
    note: '',
  })
  const [transferForm, setTransferForm] = useState({
    date: referenceDate,
    productId: '',
    quantity: '',
    destinationId: '',
    note: '',
  })
  const [entryError, setEntryError] = useState('')
  const [transferError, setTransferError] = useState('')
  const [requestError, setRequestError] = useState('')

  const resolvedEntryProductId = products.some(
    (product) => product.id === entryForm.productId,
  )
    ? entryForm.productId
    : products[0]?.id ?? ''
  const resolvedTransferProductId = products.some(
    (product) => product.id === transferForm.productId,
  )
    ? transferForm.productId
    : products[0]?.id ?? ''
  const resolvedDestinationId = stores.some(
    (store) => store.id === transferForm.destinationId,
  )
    ? transferForm.destinationId
    : stores[0]?.id ?? ''

  const selectedEntryProduct = getProductById(products, resolvedEntryProductId)
  const selectedTransferProduct = getProductById(products, resolvedTransferProductId)
  const entryDisabled = !products.length
  const transferDisabled = !products.length || !stores.length

  const visibleRows = centralRows.filter((row) => {
    const query = deferredSearch.trim().toLowerCase()

    if (!query) {
      return true
    }

    return (
      row.product.name.toLowerCase().includes(query) ||
      getProductTypeLabel(row.product.unitType).toLowerCase().includes(query)
    )
  })

  function handleEntrySubmit(event) {
    event.preventDefault()

    if (!selectedEntryProduct) {
      setEntryError('Cadastre pelo menos um produto antes de registrar entrada.')
      return
    }

    const quantity = parseUserQuantity(
      entryForm.quantity,
      selectedEntryProduct.unitType,
    )

    if (!quantity) {
      setEntryError('Informe uma quantidade valida para entrada.')
      return
    }

    const result = onCreateEntry({
      date: entryForm.date,
      productId: resolvedEntryProductId,
      quantity,
      partner: entryForm.partner,
      note: entryForm.note,
    })

    if (!result.ok) {
      setEntryError(result.message)
      return
    }

    setEntryError('')
    setEntryForm((current) => ({
      ...current,
      quantity: '',
      note: '',
    }))
  }

  function handleTransferSubmit(event) {
    event.preventDefault()

    if (!stores.length) {
      setTransferError('Cadastre pelo menos uma pizzaria antes de transferir.')
      return
    }

    if (!selectedTransferProduct) {
      setTransferError('Cadastre pelo menos um produto antes de transferir.')
      return
    }

    const quantity = parseUserQuantity(
      transferForm.quantity,
      selectedTransferProduct.unitType,
    )

    if (!quantity) {
      setTransferError('Informe uma quantidade valida para transferencia.')
      return
    }

    const result = onCreateTransfer({
      date: transferForm.date,
      productId: resolvedTransferProductId,
      quantity,
      destinationId: resolvedDestinationId,
      note: transferForm.note,
    })

    if (!result.ok) {
      setTransferError(result.message)
      return
    }

    setTransferError('')
    setTransferForm((current) => ({
      ...current,
      quantity: '',
      note: '',
    }))
  }

  function handleUseRequestItem(request, item) {
    const product = getProductById(products, item.productId)

    setTransferForm((current) => ({
      ...current,
      date: request.deliveryDate || referenceDate,
      destinationId: request.unitId,
      productId: item.productId,
      quantity: product
        ? toEditableQuantity(item.quantity, product.unitType)
        : String(item.quantity),
      note: `Solicitacao ${getUnitById(units, request.unitId)?.shortName ?? 'pizzaria'} - ${formatDateLabel(request.deliveryDate)}`,
    }))
    setTransferError('')
  }

  function handleCompleteRequest(requestId) {
    const result = onCompleteShipmentRequest(requestId)

    if (!result.ok) {
      setRequestError(result.message)
      return
    }

    setRequestError('')
  }

  return (
    <div className="page-grid central-grid">
      <nav className="mobile-quick-actions" aria-label="Acoes rapidas da central">
        <a href="#central-requests-section">Pedidos</a>
        <a href="#central-transfer-section">Transferir</a>
        <a href="#central-entry-section">Entrada</a>
      </nav>

      <section className="panel panel-wide central-guide-panel">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Fluxo da central</p>
            <h2>Primeiro entra, depois transfere</h2>
          </div>

          <StatusPill tone="muted">Pedidos ajudam a separar o envio</StatusPill>
        </div>

        <div className="guide-grid">
          <article className="guide-card compact">
            <span className="guide-number">1</span>
            <div>
              <strong>Entrada</strong>
              <p>Registre apenas o que chegou de verdade no estoque central.</p>
            </div>
          </article>

          <article className="guide-card compact">
            <span className="guide-number">2</span>
            <div>
              <strong>Transferencia</strong>
              <p>Envie para a pizzaria o que realmente foi separado.</p>
            </div>
          </article>

          <article className="guide-card compact">
            <span className="guide-number">3</span>
            <div>
              <strong>Conferencia</strong>
              <p>Use a tabela para conferir o saldo atual do central.</p>
            </div>
          </article>
        </div>
      </section>

      <section
        id="central-requests-section"
        className="panel panel-wide central-requests-panel"
        data-tour="central-requests"
      >
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Solicitacoes das pizzarias</p>
            <h2>Pedidos pendentes para envio</h2>
          </div>

          <StatusPill tone={pendingShipmentRequests.length ? 'warning' : 'success'}>
            {pendingShipmentRequests.length
              ? `${pendingShipmentRequests.length} pendentes`
              : 'Nada pendente'}
          </StatusPill>
        </div>

        {requestError ? <p className="form-error">{requestError}</p> : null}

        {pendingShipmentRequests.length ? (
          <div className="request-list">
            {pendingShipmentRequests.map((request) => {
              const store = getUnitById(units, request.unitId)

              return (
                <article key={request.id} className="request-card">
                  <div className="request-card-head">
                    <div>
                      <strong>{store?.name ?? 'Pizzaria removida'}</strong>
                      <p>
                        Envio solicitado para {formatDateLabel(request.deliveryDate)} |
                        pedido em {formatDateLabel(request.requestDate)}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleCompleteRequest(request.id)}
                    >
                      Marcar atendida
                    </button>
                  </div>

                  <div className="request-item-list">
                    {request.items.map((item) => {
                      const product = getProductById(products, item.productId)

                      return (
                        <button
                          key={item.productId}
                          type="button"
                          className="request-item-button"
                          onClick={() => handleUseRequestItem(request, item)}
                        >
                          <span>{product?.name ?? 'Produto removido'}</span>
                          <strong>
                            {product
                              ? formatFriendlyQuantity(item.quantity, product.unitType)
                              : item.quantity}
                          </strong>
                        </button>
                      )
                    })}
                  </div>

                  {request.note ? <p>{request.note}</p> : null}
                </article>
              )
            })}
          </div>
        ) : (
          <div className="empty-mini">
            Quando uma pizzaria pedir reposicao, o pedido aparece aqui antes do
            envio.
          </div>
        )}
      </section>

      <section id="central-entry-section" className="panel central-entry-panel">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Entrada</p>
            <h2>Recebimento do central</h2>
          </div>

          <span className="date-chip">Base {formatDateLabel(referenceDate)}</span>
        </div>

        <form className="form-grid" data-tour="central-entry" onSubmit={handleEntrySubmit}>
          <label className="field">
            <span>Data</span>
            <input
              type="date"
              value={entryForm.date}
              onChange={(event) =>
                setEntryForm((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
            />
          </label>

          <label className="field">
            <span>Produto</span>
            <select
              value={resolvedEntryProductId}
              disabled={entryDisabled}
              onChange={(event) =>
                setEntryForm((current) => ({
                  ...current,
                  productId: event.target.value,
                }))
              }
            >
              {products.length ? (
                products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} | {getProductTypeLabel(product.unitType)}
                  </option>
                ))
              ) : (
                <option value="">Cadastre um produto primeiro</option>
              )}
            </select>
          </label>

          <label className="field">
            <span>
              Quantidade
              {selectedEntryProduct
                ? ` (${getProductTypeLabel(selectedEntryProduct.unitType)})`
                : ''}
            </span>
            <input
              type="text"
              inputMode="decimal"
              disabled={entryDisabled}
              placeholder="Ex: 12"
              value={entryForm.quantity}
              onChange={(event) =>
                setEntryForm((current) => ({
                  ...current,
                  quantity: event.target.value,
                }))
              }
            />
          </label>

          <label className="field">
            <span>Fornecedor</span>
            <input
              type="text"
              disabled={entryDisabled}
              value={entryForm.partner}
              onChange={(event) =>
                setEntryForm((current) => ({
                  ...current,
                  partner: event.target.value,
                }))
              }
            />
          </label>

          <label className="field field-span">
            <span>Observacao</span>
            <textarea
              rows="3"
              disabled={entryDisabled}
              placeholder="Ex: chegou diferente do previsto."
              value={entryForm.note}
              onChange={(event) =>
                setEntryForm((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
            />
          </label>

          {!products.length ? (
            <div className="empty-mini field-span">
              Cadastre produtos antes de registrar a primeira entrada.
            </div>
          ) : null}

          {entryError ? <p className="form-error field-span">{entryError}</p> : null}

          <div className="form-actions field-span">
            <button type="submit" className="primary-button" disabled={entryDisabled}>
              Registrar entrada
            </button>
          </div>
        </form>
      </section>

      <section id="central-transfer-section" className="panel central-transfer-panel">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Transferencia</p>
            <h2>Envio para a pizzaria</h2>
          </div>

          <StatusPill tone="muted">A loja ajusta no fechamento se houver diferenca</StatusPill>
        </div>

        <form
          className="form-grid"
          data-tour="central-transfer"
          onSubmit={handleTransferSubmit}
        >
          <label className="field">
            <span>Data</span>
            <input
              type="date"
              value={transferForm.date}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
            />
          </label>

          <label className="field">
            <span>Destino</span>
            <select
              value={resolvedDestinationId}
              disabled={transferDisabled}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,
                  destinationId: event.target.value,
                }))
              }
            >
              {stores.length ? (
                stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))
              ) : (
                <option value="">Cadastre uma pizzaria primeiro</option>
              )}
            </select>
          </label>

          <label className="field">
            <span>Produto</span>
            <select
              value={resolvedTransferProductId}
              disabled={transferDisabled}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,
                  productId: event.target.value,
                }))
              }
            >
              {products.length ? (
                products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} | {getProductTypeLabel(product.unitType)}
                  </option>
                ))
              ) : (
                <option value="">Cadastre um produto primeiro</option>
              )}
            </select>
          </label>

          <label className="field">
            <span>
              Quantidade
              {selectedTransferProduct
                ? ` (${getProductTypeLabel(selectedTransferProduct.unitType)})`
                : ''}
            </span>
            <input
              type="text"
              inputMode="decimal"
              disabled={transferDisabled}
              placeholder="Ex: 6"
              value={transferForm.quantity}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,
                  quantity: event.target.value,
                }))
              }
            />
          </label>

          <label className="field field-span">
            <span>Observacao</span>
            <textarea
              rows="3"
              disabled={transferDisabled}
              placeholder="Ex: envio do turno da noite."
              value={transferForm.note}
              onChange={(event) =>
                setTransferForm((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
            />
          </label>

          {!products.length || !stores.length ? (
            <div className="empty-mini field-span">
              Para transferir, primeiro cadastre produtos e pelo menos uma pizzaria.
            </div>
          ) : null}

          {transferError ? (
            <p className="form-error field-span">{transferError}</p>
          ) : null}

          <div className="form-actions field-span">
            <button
              type="submit"
              className="primary-button"
              disabled={transferDisabled}
            >
              Transferir
            </button>
          </div>
        </form>
      </section>

      <section className="panel panel-wide central-stock-panel">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Saldo atual</p>
            <h2>Estoque calculado do central</h2>
          </div>

          <label className="search-field">
            <span>Buscar</span>
            <input
              type="search"
              placeholder="Produto ou tipo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="table-shell" data-tour="central-stock">
          <table className="data-table stock-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Saldo atual</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length ? (
                visibleRows.map((row) => (
                  <tr key={row.product.id}>
                    <td>{row.product.name}</td>
                    <td>{getProductTypeLabel(row.product.unitType)}</td>
                    <td>{formatFriendlyQuantity(row.current, row.product.unitType)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">
                    <div className="table-empty-state">
                      Nenhum produto cadastrado ainda para acompanhar no central.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel-wide">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Ultimos movimentos</p>
            <h2>Historico rapido da central</h2>
          </div>

          <StatusPill tone="muted">{recentCentralMovements.length} registros</StatusPill>
        </div>

        <div className="list-stack">
          {recentCentralMovements.length ? (
            recentCentralMovements.map((movement) => {
              const product = getProductById(products, movement.productId)
              return (
                <article key={movement.id} className="list-row">
                  <div>
                    <strong>
                      {product?.name ?? 'Produto removido'} |{' '}
                      {product
                        ? formatFriendlyQuantity(movement.quantity, product.unitType)
                        : movement.quantity}
                    </strong>
                    <p>
                      {formatDateLabel(movement.date)} |{' '}
                      {movement.type === 'entry'
                        ? movement.partner
                        : movement.type === 'transfer'
                          ? `Central para ${
                              getUnitById(units, movement.toUnitId)?.shortName ?? 'pizzaria'
                            }`
                          : movement.reason}
                    </p>
                  </div>

                  <StatusPill
                    tone={
                      movement.type === 'entry'
                        ? 'success'
                        : movement.type === 'transfer'
                          ? 'accent'
                          : 'warning'
                    }
                  >
                    {movement.type === 'entry'
                      ? 'Entrada'
                      : movement.type === 'transfer'
                        ? 'Transferencia'
                        : 'Ajuste'}
                  </StatusPill>
                </article>
              )
            })
          ) : (
            <div className="empty-mini">
              Ainda nao existe historico na central. Os registros vao aparecer aqui.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
