import { useState } from 'react'
import {
  CATALOG,
  buildCatalogProductPayload,
  groupProductsByCatalogSections,
} from './catalog'
import { PRODUCT_TYPE_OPTIONS } from './inventoryData'
import { getProductTypeLabel } from './inventoryLogic'

function StatusPill({ tone, children }) {
  return <span className={`status-pill tone-${tone}`}>{children}</span>
}

export default function ProductsPage({ products, onCreateProduct }) {
  const [form, setForm] = useState({
    name: '',
    unitType: PRODUCT_TYPE_OPTIONS[0].value,
    catalogCategory: '',
  })
  const [formError, setFormError] = useState('')
  const productGroups = groupProductsByCatalogSections(products)
  const registeredProductNames = new Set(
    products.map((product) => product.name.trim().toLowerCase()),
  )

  function handleSubmit(event) {
    event.preventDefault()
    const result = onCreateProduct(form)

    if (!result.ok) {
      setFormError(result.message)
      return
    }

    setFormError('')
    setForm({
      name: '',
      unitType: PRODUCT_TYPE_OPTIONS[0].value,
      catalogCategory: '',
    })
  }

  function handleAddCatalogItem(categoryTitle, item) {
    const result = onCreateProduct(buildCatalogProductPayload(categoryTitle, item))

    if (!result.ok) {
      setFormError(result.message)
      return
    }

    setFormError('')
  }

  function handleAddCatalogSection(category) {
    const availableItems = category.items.filter(
      (item) => !registeredProductNames.has(item.name.trim().toLowerCase()),
    )

    availableItems.forEach((item) => {
      onCreateProduct(buildCatalogProductPayload(category.title, item))
    })

    if (availableItems.length) {
      setFormError('')
    }
  }

  return (
    <div className="page-grid products-grid">
      <section className="panel panel-wide">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Ordem real de uso</p>
            <h2>Cadastre primeiro os produtos que entram no controle</h2>
          </div>

          <StatusPill tone="muted">Base comeca vazia</StatusPill>
        </div>

        <div className="guide-grid">
          <article className="guide-card compact">
            <span className="guide-number">1</span>
            <div>
              <strong>Adicione os produtos</strong>
              <p>Cadastre so os itens importantes para a operacao.</p>
            </div>
          </article>

          <article className="guide-card compact">
            <span className="guide-number">2</span>
            <div>
              <strong>Defina o tipo</strong>
              <p>Escolha se o item sera contado em pacote, caixa, unidade ou kg.</p>
            </div>
          </article>

          <article className="guide-card compact">
            <span className="guide-number">3</span>
            <div>
              <strong>Depois use a operacao</strong>
              <p>So depois disso a central e o fechamento fazem sentido.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Novo produto</p>
            <h2>Adicionar item controlado</h2>
          </div>

          <StatusPill tone="accent">Obrigatorio antes dos lancamentos</StatusPill>
        </div>

        <form className="form-grid" data-tour="products-form" onSubmit={handleSubmit}>
          <label className="field field-span">
            <span>Nome do produto</span>
            <input
              type="text"
              placeholder="Ex: Mussarela"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </label>

          <label className="field field-span">
            <span>Tipo do produto</span>
            <select
              value={form.unitType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  unitType: event.target.value,
                }))
              }
            >
              {PRODUCT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field field-span">
            <span>Sessao da lista base</span>
            <select
              value={form.catalogCategory}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  catalogCategory: event.target.value,
                }))
              }
            >
              <option value="">Outros itens</option>
              {CATALOG.map((category) => (
                <option key={category.title} value={category.title}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>

          {formError ? <p className="form-error field-span">{formError}</p> : null}

          <div className="form-actions field-span">
            <button type="submit" className="primary-button">
              Adicionar produto
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Lista atual</p>
            <h2>Produtos cadastrados</h2>
          </div>

          <StatusPill tone={products.length ? 'success' : 'warning'}>
            {products.length ? `${products.length} produtos` : 'Nenhum produto'}
          </StatusPill>
        </div>

        <div className="catalog-section-stack" data-tour="products-list">
          {productGroups.length ? (
            productGroups.map((group) => (
              <article key={group.title} className="catalog-section-card">
                <header className="catalog-section-head">
                  <div>
                    <strong>{group.title}</strong>
                    <p>{group.products.length} produtos</p>
                  </div>
                </header>

                <div className="list-stack">
                  {group.products.map((product) => (
                    <article key={product.id} className="list-row">
                      <div>
                        <strong>{product.name}</strong>
                        <p>Tipo de contagem: {getProductTypeLabel(product.unitType)}</p>
                      </div>

                      <StatusPill tone="muted">
                        {getProductTypeLabel(product.unitType)}
                      </StatusPill>
                    </article>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-mini">
              Nenhum produto foi cadastrado ainda. Comece pelo formulario ao lado.
            </div>
          )}
        </div>
      </section>

      <section className="panel panel-wide">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Lista base</p>
            <h2>Adicionar itens por sessao</h2>
          </div>

          <StatusPill tone="accent">Modelo da lista antiga</StatusPill>
        </div>

        <div className="catalog-section-stack">
          {CATALOG.map((category) => {
            const missingItems = category.items.filter(
              (item) => !registeredProductNames.has(item.name.trim().toLowerCase()),
            )

            return (
              <article key={category.title} className="catalog-section-card">
                <header className="catalog-section-head">
                  <div>
                    <strong>{category.title}</strong>
                    <p>
                      {category.items.length - missingItems.length} de{' '}
                      {category.items.length} cadastrados
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button compact-button"
                    disabled={!missingItems.length}
                    onClick={() => handleAddCatalogSection(category)}
                  >
                    Adicionar sessao
                  </button>
                </header>

                <div className="catalog-chip-grid">
                  {category.items.map((item) => {
                    const isRegistered = registeredProductNames.has(
                      item.name.trim().toLowerCase(),
                    )

                    return (
                      <button
                        key={item.name}
                        type="button"
                        className={`catalog-chip${isRegistered ? ' is-added' : ''}`}
                        disabled={isRegistered}
                        onClick={() => handleAddCatalogItem(category.title, item)}
                      >
                        <span>{item.name}</span>
                        <small>{isRegistered ? 'Cadastrado' : item.unit ?? 'Pacote'}</small>
                      </button>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
