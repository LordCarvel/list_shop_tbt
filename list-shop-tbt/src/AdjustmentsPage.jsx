import { useDeferredValue, useState } from 'react'
import {
  formatDateLabel,
  formatFriendlyQuantity,
  getProductById,
  getProductTypeLabel,
  getUnitById,
  parseUserQuantity,
} from './inventoryLogic'

function StatusPill({ tone, children }) {
  return <span className={`status-pill tone-${tone}`}>{children}</span>
}

export default function AdjustmentsPage({
  adjustmentReasons,
  closings,
  movements,
  products,
  referenceDate,
  units,
  onCreateAdjustment,
}) {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [form, setForm] = useState({
    date: referenceDate,
    unitId: units[0]?.id ?? 'central',
    productId: '',
    quantity: '',
    direction: 'negative',
    reason: adjustmentReasons[0],
    note: '',
  })
  const [formError, setFormError] = useState('')

  const resolvedProductId = products.some((product) => product.id === form.productId)
    ? form.productId
    : products[0]?.id ?? ''
  const selectedProduct = getProductById(products, resolvedProductId)
  const formDisabled = !products.length

  const visibleMovements = movements.filter((movement) => {
    const query = deferredSearch.trim().toLowerCase()

    if (!query) {
      return true
    }

    const product = getProductById(products, movement.productId)
    const unit =
      movement.type === 'transfer'
        ? `${getUnitById(units, movement.fromUnitId)?.name ?? ''} ${
            getUnitById(units, movement.toUnitId)?.name ?? ''
          }`
        : getUnitById(units, movement.unitId)?.name ?? ''

    return (
      (product?.name ?? '').toLowerCase().includes(query) ||
      unit.toLowerCase().includes(query) ||
      movement.type.toLowerCase().includes(query) ||
      (movement.reason ?? '').toLowerCase().includes(query)
    )
  })

  const recentClosings = [...closings]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 4)

  function handleSubmit(event) {
    event.preventDefault()

    if (!selectedProduct) {
      setFormError('Cadastre pelo menos um produto antes de ajustar estoque.')
      return
    }

    const parsedQuantity = parseUserQuantity(form.quantity, selectedProduct.unitType)

    if (!parsedQuantity) {
      setFormError('Informe uma quantidade valida para ajuste.')
      return
    }

    const signedQuantity =
      form.direction === 'negative' ? parsedQuantity * -1 : parsedQuantity
    const result = onCreateAdjustment({
      date: form.date,
      unitId: form.unitId,
      productId: resolvedProductId,
      quantity: signedQuantity,
      reason: form.reason,
      note: form.note,
    })

    if (!result.ok) {
      setFormError(result.message)
      return
    }

    setFormError('')
    setForm((current) => ({
      ...current,
      quantity: '',
      note: '',
    }))
  }

  return (
    <div className="page-grid adjustments-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Correcao manual</p>
            <h2>Novo ajuste</h2>
          </div>

          <StatusPill tone="muted">O historico nao e reaberto</StatusPill>
        </div>

        <form
          className="form-grid"
          data-tour="adjustment-form"
          onSubmit={handleSubmit}
        >
          <label className="field">
            <span>Data</span>
            <input
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
            />
          </label>

          <label className="field">
            <span>Unidade</span>
            <select
              value={form.unitId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  unitId: event.target.value,
                }))
              }
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Produto</span>
            <select
              value={resolvedProductId}
              disabled={formDisabled}
              onChange={(event) =>
                setForm((current) => ({
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
            <span>Direcao</span>
            <select
              value={form.direction}
              disabled={formDisabled}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  direction: event.target.value,
                }))
              }
            >
              <option value="negative">Baixar estoque</option>
              <option value="positive">Aumentar estoque</option>
            </select>
          </label>

          <label className="field">
            <span>
              Quantidade
              {selectedProduct ? ` (${getProductTypeLabel(selectedProduct.unitType)})` : ''}
            </span>
            <input
              type="text"
              inputMode="decimal"
              disabled={formDisabled}
              placeholder="Ex: 2"
              value={form.quantity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quantity: event.target.value,
                }))
              }
            />
          </label>

          <label className="field">
            <span>Motivo</span>
            <select
              value={form.reason}
              disabled={formDisabled}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
            >
              {adjustmentReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>

          <label className="field field-span">
            <span>Observacao</span>
            <textarea
              rows="3"
              disabled={formDisabled}
              placeholder="Ex: avaria, vencimento ou erro de lancamento."
              value={form.note}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
            />
          </label>

          {!products.length ? (
            <div className="empty-mini field-span">
              Cadastre produtos antes de usar ajuste manual.
            </div>
          ) : null}

          {formError ? <p className="form-error field-span">{formError}</p> : null}

          <div className="form-actions field-span">
            <button type="submit" className="primary-button" disabled={formDisabled}>
              Registrar ajuste
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Fechamentos</p>
            <h2>Ultimos dias travados</h2>
          </div>

          <StatusPill tone="muted">{recentClosings.length} fechamentos</StatusPill>
        </div>

        <div className="list-stack">
          {recentClosings.length ? (
            recentClosings.map((closing) => (
              <article key={closing.id} className="list-row">
                <div>
                  <strong>{getUnitById(units, closing.unitId)?.name ?? closing.unitId}</strong>
                  <p>
                    {formatDateLabel(closing.date)} | {closing.changedItemsCount} ajustes
                    automaticos
                  </p>
                </div>

                <StatusPill
                  tone={
                    closing.highestSeverity === 'observation'
                      ? 'danger'
                      : closing.highestSeverity === 'alert'
                        ? 'warning'
                        : 'success'
                  }
                >
                  {closing.highestSeverity === 'normal'
                    ? 'Normal'
                    : closing.highestSeverity === 'alert'
                      ? 'Alerta'
                      : 'Observacao'}
                </StatusPill>
              </article>
            ))
          ) : (
            <div className="empty-mini">
              Nenhum fechamento foi realizado ainda.
            </div>
          )}
        </div>
      </section>

      <section className="panel panel-wide">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Historico completo</p>
            <h2>Movimentos e ajustes</h2>
          </div>

          <label className="search-field">
            <span>Buscar</span>
            <input
              type="search"
              placeholder="Produto, unidade ou tipo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Destino / motivo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleMovements.length ? (
                visibleMovements.map((movement) => {
                  const product = getProductById(products, movement.productId)
                  const tone =
                    movement.type === 'entry'
                      ? 'success'
                      : movement.type === 'transfer'
                        ? 'accent'
                        : movement.source === 'closing'
                          ? 'warning'
                          : 'muted'

                  return (
                    <tr key={movement.id}>
                      <td>{formatDateLabel(movement.date)}</td>
                      <td>
                        {movement.type === 'entry'
                          ? 'Entrada'
                          : movement.type === 'transfer'
                            ? 'Transferencia'
                            : 'Ajuste'}
                      </td>
                      <td>{product?.name ?? 'Produto removido'}</td>
                      <td>
                        {movement.type === 'adjustment' && movement.quantity > 0 ? '+' : ''}
                        {product
                          ? formatFriendlyQuantity(movement.quantity, product.unitType)
                          : movement.quantity}
                      </td>
                      <td>
                        {movement.type === 'entry'
                          ? movement.partner
                          : movement.type === 'transfer'
                            ? `Central para ${
                                getUnitById(units, movement.toUnitId)?.name ?? 'pizzaria'
                              }`
                            : `${
                                getUnitById(units, movement.unitId)?.name ?? 'unidade'
                              } | ${movement.reason}`}
                      </td>
                      <td>
                        <StatusPill tone={tone}>
                          {movement.type === 'adjustment' && movement.source === 'closing'
                            ? 'Auto no fechamento'
                            : movement.type === 'adjustment'
                              ? 'Manual'
                              : movement.type === 'transfer'
                                ? 'Movimento'
                                : 'Recebimento'}
                        </StatusPill>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="table-empty-state">
                      Nenhum movimento foi registrado ainda.
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
