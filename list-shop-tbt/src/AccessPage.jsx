import {
  countConfiguredProducts,
  countConfiguredStores,
  countStoreUsers,
  getStoreUserForUnit,
} from './authLogic'

function StatusPill({ tone, children }) {
  return <span className={`status-pill tone-${tone}`}>{children}</span>
}

function StoreAccessCard({ store, user, onSave }) {
  function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    onSave({
      unitId: store.id,
      userId: user?.id,
      storeName: String(formData.get('storeName') ?? ''),
      responsibleName: String(formData.get('responsibleName') ?? ''),
      username: String(formData.get('username') ?? ''),
      password: String(formData.get('password') ?? ''),
    })
  }

  return (
    <article className="access-card">
      <div className="panel-head">
        <div>
          <p className="panel-eyebrow">Pizzaria</p>
          <h2>{store.name}</h2>
        </div>

        <StatusPill tone={user ? 'success' : 'warning'}>
          {user ? 'Login configurado' : 'Sem login'}
        </StatusPill>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nome da pizzaria</span>
          <input type="text" name="storeName" defaultValue={store.name} />
        </label>

        <label className="field">
          <span>Responsavel do estoque</span>
          <input
            type="text"
            name="responsibleName"
            defaultValue={user?.name ?? ''}
            placeholder="Nome do responsavel"
          />
        </label>

        <label className="field">
          <span>Usuario</span>
          <input
            type="text"
            name="username"
            defaultValue={user?.username ?? ''}
            placeholder="usuario-loja"
          />
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            type="text"
            name="password"
            defaultValue={user?.password ?? ''}
            placeholder="senha-loja"
          />
        </label>

        <div className="form-actions field-span">
          <button type="submit" className="secondary-button">
            Salvar
          </button>
        </div>
      </form>
    </article>
  )
}

export default function AccessPage({ base, onCreateOrUpdateStoreAccess }) {
  const stores = base.units.filter((unit) => unit.type === 'store')

  function handleNewStoreSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const result = onCreateOrUpdateStoreAccess({
      storeName: String(formData.get('storeName') ?? ''),
      responsibleName: String(formData.get('responsibleName') ?? ''),
      username: String(formData.get('username') ?? ''),
      password: String(formData.get('password') ?? ''),
    })

    if (result.ok) {
      event.currentTarget.reset()
    }
  }

  return (
    <div className="page-grid access-grid">
      <section className="metric-row">
        <article className="metric-card neutral">
          <span className="metric-label">Base</span>
          <strong>{base.name}</strong>
          <p>Codigo de acesso: {base.code}</p>
        </article>

        <article className="metric-card warm">
          <span className="metric-label">Produtos</span>
          <strong>{countConfiguredProducts(base)}</strong>
          <p>Itens cadastrados para controle.</p>
        </article>

        <article className="metric-card accent">
          <span className="metric-label">Pizzarias</span>
          <strong>{countConfiguredStores(base)}</strong>
          <p>Unidades cadastradas nessa base.</p>
        </article>

        <article className="metric-card dark">
          <span className="metric-label">Usuarios de loja</span>
          <strong>{countStoreUsers(base)}</strong>
          <p>Logins ativos para as pizzarias.</p>
        </article>
      </section>

      <section className="panel panel-wide">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Fluxo do dono</p>
            <h2>Crie a pizzaria e entregue o acesso ao responsavel</h2>
          </div>

          <StatusPill tone="muted">A pizzaria nao acessa a parte de gestao</StatusPill>
        </div>

        <div className="guide-grid">
          <article className="guide-card compact">
            <span className="guide-number">1</span>
            <div>
              <strong>Cadastre a unidade</strong>
              <p>Crie cada pizzaria com o nome que a rede usa no dia a dia.</p>
            </div>
          </article>

          <article className="guide-card compact">
            <span className="guide-number">2</span>
            <div>
              <strong>Defina usuario e senha</strong>
              <p>Essas credenciais ficam so com quem fecha o estoque da unidade.</p>
            </div>
          </article>

          <article className="guide-card compact">
            <span className="guide-number">3</span>
            <div>
              <strong>Revise quando precisar</strong>
              <p>Se trocar o responsavel, atualize por aqui sem mexer no historico.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Nova pizzaria</p>
            <h2>Criar unidade com login</h2>
          </div>

          <StatusPill tone="accent">Passo 2 da implantacao</StatusPill>
        </div>

        <form className="form-grid" data-tour="access-form" onSubmit={handleNewStoreSubmit}>
          <label className="field field-span">
            <span>Nome da pizzaria</span>
            <input
              type="text"
              name="storeName"
              placeholder="Ex: Pizzaria Centro"
            />
          </label>

          <label className="field">
            <span>Responsavel do estoque</span>
            <input
              type="text"
              name="responsibleName"
              placeholder="Nome do responsavel"
            />
          </label>

          <label className="field">
            <span>Usuario</span>
            <input type="text" name="username" placeholder="usuario-loja" />
          </label>

          <label className="field field-span">
            <span>Senha</span>
            <input type="text" name="password" placeholder="senha-loja" />
          </label>

          <div className="form-actions field-span">
            <button type="submit" className="primary-button">
              Criar pizzaria com acesso
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Pizzarias da base</p>
            <h2>Usuarios ja configurados</h2>
          </div>

          <StatusPill tone={stores.length ? 'success' : 'warning'}>
            {stores.length ? `${stores.length} pizzarias` : 'Nenhuma pizzaria'}
          </StatusPill>
        </div>

        <div className="access-grid-list" data-tour="access-list">
          {stores.length ? (
            stores.map((store) => (
              <StoreAccessCard
                key={`${store.id}-${getStoreUserForUnit(base, store.id)?.username ?? 'novo'}`}
                store={store}
                user={getStoreUserForUnit(base, store.id)}
                onSave={onCreateOrUpdateStoreAccess}
              />
            ))
          ) : (
            <div className="empty-mini">
              Nenhuma pizzaria foi criada ainda. Cadastre a primeira unidade neste
              painel.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
