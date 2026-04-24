import {
  formatDateLabel,
  formatFriendlyQuantity,
  formatPercent,
  getProductById,
  getUnitById,
} from './inventoryLogic'

function StatusPill({ tone, children }) {
  return <span className={`status-pill tone-${tone}`}>{children}</span>
}

function SetupStep({ done, index, title, description, onClick }) {
  return (
    <article className={`setup-card${done ? ' is-done' : ''}`}>
      <div className="setup-card-main">
        <span className="guide-number">{index}</span>
        <div>
          <strong>{title}</strong>
          <p>{description}</p>
        </div>
      </div>

      <button type="button" className="secondary-button" onClick={onClick}>
        Abrir
      </button>
    </article>
  )
}

function describeMovement(movement, products, units) {
  const product = getProductById(products, movement.productId)
  const quantity = product
    ? formatFriendlyQuantity(movement.quantity, product.unitType)
    : movement.quantity

  if (movement.type === 'entry') {
    return `${quantity} de ${product?.name ?? 'produto'} entraram no central`
  }

  if (movement.type === 'transfer') {
    return `${quantity} de ${product?.name ?? 'produto'} enviados para ${
      getUnitById(units, movement.toUnitId)?.shortName ?? 'pizzaria'
    }`
  }

  return `${quantity} de ${product?.name ?? 'produto'} ajustados em ${
    getUnitById(units, movement.unitId)?.shortName ?? 'unidade'
  }`
}

export default function DashboardPage({
  previousDate,
  products,
  stores,
  units,
  pendingClosings,
  pendingShipmentRequests = [],
  recentAlerts,
  recentMovements,
  onNavigate,
}) {
  const completedSteps = [products.length > 0, stores.length > 0].filter(Boolean).length

  return (
    <div className="page-grid dashboard-grid">
      <section className="panel panel-wide" data-tour="owner-checklist">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Passo a passo do dono</p>
            <h2>Monte a base nesta ordem para nao se perder</h2>
          </div>

          <StatusPill tone="muted">{completedSteps} de 2 etapas iniciais</StatusPill>
        </div>

        <div className="setup-grid">
          <SetupStep
            done={products.length > 0}
            index="1"
            title="Cadastre os produtos"
            description="Sem produto nao existe entrada, transferencia ou fechamento."
            onClick={() => onNavigate('products')}
          />

          <SetupStep
            done={stores.length > 0}
            index="2"
            title="Crie as pizzarias"
            description="Cada unidade precisa do proprio usuario e senha."
            onClick={() => onNavigate('access')}
          />

          <SetupStep
            done={products.length > 0}
            index="3"
            title="Use a central"
            description="Registre o que entrou e o que foi enviado para cada pizzaria."
            onClick={() => onNavigate('central')}
          />

          <SetupStep
            done={stores.length > 0 && products.length > 0}
            index="4"
            title="Fechamento das pizzarias"
            description="No fim do dia a loja informa o estoque real e trava a data."
            onClick={() => onNavigate('stores')}
          />
        </div>
      </section>

      <section className="metric-row">
        <article className="metric-card neutral">
          <span className="metric-label">Produtos</span>
          <strong>{products.length}</strong>
          <p>Itens hoje no controle do estoque.</p>
        </article>

        <article className="metric-card warm">
          <span className="metric-label">Pizzarias</span>
          <strong>{stores.length}</strong>
          <p>Unidades configuradas com acesso proprio.</p>
        </article>

        <article className="metric-card accent">
          <span className="metric-label">Movimentos</span>
          <strong>{recentMovements.length}</strong>
          <p>Ultimos registros feitos na base.</p>
        </article>

        <article className="metric-card dark">
          <span className="metric-label">Pendencias</span>
          <strong>{pendingClosings.length}</strong>
          <p>
            Fechamentos em {formatDateLabel(previousDate)}. Pedidos de reposicao:{' '}
            {pendingShipmentRequests.length}.
          </p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Estado da implantacao</p>
            <h2>O que ainda falta configurar</h2>
          </div>
        </div>

        <div className="list-stack">
          {!products.length ? (
            <article className="list-row emphasis">
              <div>
                <strong>Cadastre os produtos</strong>
                <p>Comece pela tela de produtos para liberar o restante do fluxo.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onNavigate('products')}
              >
                Abrir produtos
              </button>
            </article>
          ) : null}

          {!stores.length ? (
            <article className="list-row emphasis">
              <div>
                <strong>Crie a primeira pizzaria</strong>
                <p>Sem unidade cadastrada nao existe transferencia nem login de loja.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onNavigate('access')}
              >
                Abrir pizzarias
              </button>
            </article>
          ) : null}

          {products.length && stores.length ? (
            <div className="empty-mini">
              Configuracao inicial pronta. Agora a base ja pode operar normalmente.
            </div>
          ) : null}

          {pendingShipmentRequests.length ? (
            <article className="list-row emphasis">
              <div>
                <strong>
                  {pendingShipmentRequests.length} pedido(s) de reposicao pendente(s)
                </strong>
                <p>A central precisa separar os envios solicitados pelas pizzarias.</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onNavigate('central')}
              >
                Abrir central
              </button>
            </article>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Alertas recentes</p>
            <h2>Divergencias do fechamento</h2>
          </div>
        </div>

        <div className="list-stack">
          {recentAlerts.length ? (
            recentAlerts.map((alert) => (
              <article key={`${alert.closingId}-${alert.productId}`} className="list-row">
                <div>
                  <strong>
                    {alert.unitName} | {alert.productName}
                  </strong>
                  <p>
                    {formatDateLabel(alert.date)} | desvio de{' '}
                    {formatPercent(alert.deviationRate)}
                  </p>
                </div>

                <StatusPill
                  tone={alert.severity === 'observation' ? 'danger' : 'warning'}
                >
                  {alert.severity === 'observation'
                    ? 'Observacao obrigatoria'
                    : 'Alerta'}
                </StatusPill>
              </article>
            ))
          ) : (
            <div className="empty-mini">
              Nenhuma divergencia relevante foi registrada ainda.
            </div>
          )}
        </div>
      </section>

      <section className="panel panel-wide">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Ultimos registros</p>
            <h2>Movimentos recentes da base</h2>
          </div>
        </div>

        <div className="list-stack">
          {recentMovements.length ? (
            recentMovements.map((movement) => (
              <article key={movement.id} className="timeline-row">
                <div className="timeline-dot" />
                <div className="timeline-copy">
                  <strong>{describeMovement(movement, products, units)}</strong>
                  <p>
                    {formatDateLabel(movement.date)} |{' '}
                    {movement.type === 'entry'
                      ? movement.partner
                      : movement.type === 'transfer'
                        ? `Central para ${
                            getUnitById(units, movement.toUnitId)?.name ?? 'pizzaria'
                          }`
                        : `${getUnitById(units, movement.unitId)?.name ?? 'unidade'} | ${
                            movement.reason
                          }`}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-mini">
              Ainda nao existe nenhum movimento. Quando comecar a operar, os registros
              vao aparecer aqui.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
