import { useState } from 'react'

function emptyBaseForm() {
  return {
    baseName: '',
    baseCode: '',
    ownerName: '',
    ownerUsername: '',
    ownerPassword: '',
  }
}

function emptyAdminBaseForm() {
  return {
    baseName: '',
    baseCode: '',
    ownerName: '',
    ownerUsername: '',
  }
}

function emptyAdminStoreForm() {
  return {
    baseId: '',
    storeName: '',
    responsibleName: '',
    username: '',
  }
}

function ModeChoiceCard({ description, label, mode, onClick }) {
  const tourTarget =
    mode === 'owner'
      ? 'auth-mode-owner'
      : mode === 'store'
        ? 'auth-mode-store'
        : undefined

  return (
    <button
      type="button"
      className="auth-mode-card"
      data-tour={tourTarget}
      onClick={onClick}
    >
      <strong>{label}</strong>
      <span>{description}</span>
    </button>
  )
}

function AdminPanel({
  bases,
  onAdminCreateBase,
  onAdminCreateStore,
  onAdminEnter,
  onBack,
}) {
  const [adminBaseForm, setAdminBaseForm] = useState(emptyAdminBaseForm)
  const [adminStoreForm, setAdminStoreForm] = useState(emptyAdminStoreForm)
  const [baseError, setBaseError] = useState('')
  const [storeError, setStoreError] = useState('')
  const [accessError, setAccessError] = useState('')
  const selectedBaseId = bases.some((base) => base.id === adminStoreForm.baseId)
    ? adminStoreForm.baseId
    : bases[0]?.id ?? ''

  function updateBaseField(field, value) {
    setAdminBaseForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateStoreField(field, value) {
    setAdminStoreForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleAdminBaseSubmit(event) {
    event.preventDefault()

    const result = onAdminCreateBase(adminBaseForm)

    if (!result.ok) {
      setBaseError(result.message)
      return
    }

    setBaseError('')
    setAdminBaseForm(emptyAdminBaseForm())
    setAdminStoreForm((current) => ({
      ...current,
      baseId: result.base.id,
    }))
  }

  function handleAdminStoreSubmit(event) {
    event.preventDefault()

    const result = onAdminCreateStore(selectedBaseId, adminStoreForm)

    if (!result.ok) {
      setStoreError(result.message)
      return
    }

    setStoreError('')
    setAdminStoreForm((current) => ({
      baseId: current.baseId,
      storeName: '',
      responsibleName: '',
      username: '',
    }))
  }

  function handleAdminEnter(baseId, userId) {
    const result = onAdminEnter(baseId, userId)

    if (!result.ok) {
      setAccessError(result.message)
    }
  }

  return (
    <div className="auth-modal-body admin-panel">
      <div className="auth-mode-switch">
        <button type="button" className="secondary-button" onClick={onBack}>
          Voltar para escolha
        </button>
      </div>

      <section className="admin-section">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Bases</p>
            <h3>Criar base de teste</h3>
          </div>
        </div>

        <form className="admin-form-grid" onSubmit={handleAdminBaseSubmit}>
          <label className="field">
            <span>Nome da base</span>
            <input
              type="text"
              placeholder="Ex: Rede Centro"
              value={adminBaseForm.baseName}
              onChange={(event) => updateBaseField('baseName', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Codigo</span>
            <input
              type="text"
              placeholder="Opcional"
              value={adminBaseForm.baseCode}
              onChange={(event) => updateBaseField('baseCode', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Dono</span>
            <input
              type="text"
              placeholder="Admin"
              value={adminBaseForm.ownerName}
              onChange={(event) => updateBaseField('ownerName', event.target.value)}
            />
          </label>

          <label className="field">
            <span>Usuario</span>
            <input
              type="text"
              placeholder="Opcional"
              value={adminBaseForm.ownerUsername}
              onChange={(event) =>
                updateBaseField('ownerUsername', event.target.value)
              }
            />
          </label>

          {baseError ? <p className="form-error">{baseError}</p> : null}

          <div className="form-actions align-start">
            <button type="submit" className="primary-button">
              Criar base
            </button>
          </div>
        </form>
      </section>

      <section className="admin-section">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Pizzarias</p>
            <h3>Criar pizzaria em uma base</h3>
          </div>
        </div>

        <form className="admin-form-grid" onSubmit={handleAdminStoreSubmit}>
          <label className="field field-span">
            <span>Base</span>
            <select
              value={selectedBaseId}
              onChange={(event) => updateStoreField('baseId', event.target.value)}
              disabled={!bases.length}
            >
              {!bases.length ? <option value="">Nenhuma base</option> : null}
              {bases.map((base) => (
                <option key={base.id} value={base.id}>
                  {base.name} ({base.code})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Nome da pizzaria</span>
            <input
              type="text"
              placeholder="Ex: Loja Norte"
              value={adminStoreForm.storeName}
              onChange={(event) => updateStoreField('storeName', event.target.value)}
              disabled={!bases.length}
            />
          </label>

          <label className="field">
            <span>Responsavel</span>
            <input
              type="text"
              placeholder="Opcional"
              value={adminStoreForm.responsibleName}
              onChange={(event) =>
                updateStoreField('responsibleName', event.target.value)
              }
              disabled={!bases.length}
            />
          </label>

          <label className="field field-span">
            <span>Usuario</span>
            <input
              type="text"
              placeholder="Opcional"
              value={adminStoreForm.username}
              onChange={(event) => updateStoreField('username', event.target.value)}
              disabled={!bases.length}
            />
          </label>

          {storeError ? <p className="form-error">{storeError}</p> : null}

          <div className="form-actions align-start">
            <button type="submit" className="primary-button" disabled={!bases.length}>
              Criar pizzaria
            </button>
          </div>
        </form>
      </section>

      <section className="admin-section">
        <div className="panel-head">
          <div>
            <p className="panel-eyebrow">Entrar sem senha</p>
            <h3>Bases cadastradas</h3>
          </div>
        </div>

        {accessError ? <p className="form-error">{accessError}</p> : null}

        {bases.length ? (
          <div className="admin-base-list">
            {bases.map((base) => {
              const owners = base.users.filter((user) => user.role === 'owner')
              const stores = base.units.filter((unit) => unit.type === 'store')

              return (
                <article key={base.id} className="admin-base-card">
                  <div className="admin-base-head">
                    <div>
                      <strong>{base.name}</strong>
                      <span>Base {base.code}</span>
                    </div>
                    <span className="status-pill tone-accent">
                      {stores.length} pizzarias
                    </span>
                  </div>

                  <div className="admin-user-list">
                    {owners.map((owner) => (
                      <div key={owner.id} className="admin-user-row">
                        <div>
                          <strong>{owner.name}</strong>
                          <span>Dono | {owner.username}</span>
                        </div>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleAdminEnter(base.id, owner.id)}
                        >
                          Entrar como dono
                        </button>
                      </div>
                    ))}

                    {stores.map((store) => {
                      const storeUser = base.users.find(
                        (user) => user.role === 'store' && user.unitId === store.id,
                      )

                      return (
                        <div key={store.id} className="admin-user-row">
                          <div>
                            <strong>{store.name}</strong>
                            <span>
                              Pizzaria | {storeUser?.username ?? 'sem usuario'}
                            </span>
                          </div>

                          {storeUser ? (
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                handleAdminEnter(base.id, storeUser.id)
                              }
                            >
                              Entrar na pizzaria
                            </button>
                          ) : (
                            <span className="status-pill tone-warning">
                              Sem acesso
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="empty-mini">Nenhuma base criada ainda.</p>
        )}
      </section>
    </div>
  )
}

export default function AuthPage({
  baseCount,
  bases = [],
  loginError,
  onAdminCreateBase,
  onAdminCreateStore,
  onAdminEnter,
  onCreateBase,
  onLogin,
  onResetLoginError,
  onStartProfileGuide,
  tourStepId,
}) {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [accessMode, setAccessMode] = useState(null)
  const [showCreateBase, setShowCreateBase] = useState(false)
  const [loginForm, setLoginForm] = useState({
    baseCode: '',
    username: '',
    password: '',
  })
  const [baseForm, setBaseForm] = useState(emptyBaseForm)
  const [baseError, setBaseError] = useState('')

  const guidedAuthState =
    tourStepId === 'auth-owner-login' || tourStepId === 'auth-create-toggle'
        ? {
            isModalOpen: true,
            accessMode: 'owner',
            showCreateBase: false,
          }
        : tourStepId === 'auth-store-login'
          ? {
              isModalOpen: true,
              accessMode: 'store',
              showCreateBase: false,
            }
          : tourStepId === 'auth-base-data' ||
              tourStepId === 'auth-owner-credentials'
            ? {
                isModalOpen: true,
                accessMode: 'owner',
                showCreateBase: true,
              }
            : null

  const resolvedIsModalOpen = guidedAuthState?.isModalOpen ?? isModalOpen
  const resolvedAccessMode = guidedAuthState?.accessMode ?? accessMode
  const resolvedShowCreateBase = guidedAuthState?.showCreateBase ?? showCreateBase
  const canRepeatGuide =
    resolvedAccessMode === 'owner' || resolvedAccessMode === 'store'

  function openAccessModal() {
    setIsModalOpen(true)
    onResetLoginError()
  }

  function closeAccessModal() {
    setIsModalOpen(false)
    setAccessMode(null)
    setShowCreateBase(false)
    setBaseError('')
    onResetLoginError()
  }

  function handleModeSelection(mode) {
    setAccessMode(mode)
    setShowCreateBase(false)
    setBaseError('')
    onResetLoginError()
    onStartProfileGuide(mode, { isAutomatic: true })
  }

  function repeatCurrentGuide() {
    if (!resolvedAccessMode) {
      return
    }

    onStartProfileGuide(resolvedAccessMode, {
      initialStepId:
        resolvedAccessMode === 'owner' && resolvedShowCreateBase
          ? 'auth-base-data'
          : undefined,
    })
  }

  function handleLoginSubmit(event) {
    event.preventDefault()
    onLogin(loginForm)
  }

  function handleBaseSubmit(event) {
    event.preventDefault()
    const result = onCreateBase(baseForm)

    if (!result.ok) {
      setBaseError(result.message)
      return
    }

    setBaseError('')
    setBaseForm(emptyBaseForm())
  }

  return (
    <div className="auth-shell auth-shell-landing">
      <section className="auth-hero auth-hero-landing" data-tour="auth-entry-card">
        <div className="auth-hero-copy">
          <p className="page-eyebrow">TBT Estoque</p>
          <h1>Entrada guiada por perfil</h1>
          <p>
            O sistema agora comeca vazio. O dono monta a base, cadastra produtos,
            cria as pizzarias e so depois usa a operacao.
          </p>
        </div>

        <div className="auth-launch-row">
          <button type="button" className="primary-button" onClick={openAccessModal}>
            Abrir login
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              openAccessModal()
              setAccessMode('owner')
              setShowCreateBase(true)
              onStartProfileGuide('owner', {
                isAutomatic: true,
                initialStepId: 'auth-base-data',
              })
            }}
          >
            Criar base nova
          </button>
        </div>

        <div className="auth-points auth-points-compact">
          <div className="auth-point">
            <strong>{baseCount} bases cadastradas</strong>
            <span>Cada dono opera na propria base separada.</span>
          </div>

          <div className="auth-point">
            <strong>Dono</strong>
            <span>Configura produtos, pizzarias, central e ajustes.</span>
          </div>

          <div className="auth-point">
            <strong>Pizzaria</strong>
            <span>Entra so para contar o estoque e fechar o dia.</span>
          </div>
        </div>
      </section>

      {resolvedIsModalOpen ? (
        <div className="auth-modal-backdrop" role="dialog" aria-modal="true">
          <div className="auth-modal">
            <div className="auth-modal-header">
              <div>
                <p className="panel-eyebrow">Acesso</p>
                <h2>
                  {!resolvedAccessMode
                    ? 'Escolha como deseja entrar'
                    : resolvedAccessMode === 'admin'
                      ? 'Painel admin'
                    : resolvedAccessMode === 'owner'
                      ? resolvedShowCreateBase
                        ? 'Criar base do dono'
                        : 'Entrar como dono'
                      : 'Entrar como pizzaria'}
                </h2>
              </div>

              <div className="auth-modal-actions">
                {canRepeatGuide ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={repeatCurrentGuide}
                  >
                    Repetir passo a passo
                  </button>
                ) : null}

                <button
                  type="button"
                  className="auth-close-button"
                  onClick={closeAccessModal}
                >
                  Fechar
                </button>
              </div>
            </div>

            {!resolvedAccessMode ? (
              <div className="auth-mode-grid">
                <ModeChoiceCard
                  label="Sou dono"
                  mode="owner"
                  description="Crio a base, cadastro produtos, configuro pizzarias e lanco movimentos."
                  onClick={() => handleModeSelection('owner')}
                />

                <ModeChoiceCard
                  label="Sou pizzaria"
                  mode="store"
                  description="Uso apenas o painel da minha unidade para contagem e fechamento."
                  onClick={() => handleModeSelection('store')}
                />

                <ModeChoiceCard
                  label="Painel admin"
                  mode="admin"
                  description="Crio bases, pizzarias e entro direto nos testes salvos."
                  onClick={() => handleModeSelection('admin')}
                />
              </div>
            ) : resolvedAccessMode === 'admin' ? (
              <AdminPanel
                bases={bases}
                onAdminCreateBase={onAdminCreateBase}
                onAdminCreateStore={onAdminCreateStore}
                onAdminEnter={onAdminEnter}
                onBack={() => {
                  setAccessMode(null)
                  setBaseError('')
                  onResetLoginError()
                }}
              />
            ) : resolvedAccessMode === 'owner' && !resolvedShowCreateBase ? (
              <div className="auth-modal-body">
                <div className="auth-mode-switch">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleModeSelection('store')}
                  >
                    Trocar para pizzaria
                  </button>

                  <button
                    type="button"
                    className="link-button"
                    data-tour="auth-create-toggle"
                    onClick={() => {
                      setShowCreateBase(true)
                      setBaseError('')
                      onResetLoginError()
                    }}
                  >
                    Ainda nao tenho base
                  </button>
                </div>

                <form
                  className="auth-form"
                  data-tour="auth-owner-login"
                  onSubmit={handleLoginSubmit}
                >
                  <label className="field">
                    <span>Codigo da base</span>
                    <input
                      type="text"
                      placeholder="Ex: rede-centro"
                      value={loginForm.baseCode}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          baseCode: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Usuario do dono</span>
                    <input
                      type="text"
                      placeholder="Seu usuario"
                      value={loginForm.username}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Senha</span>
                    <input
                      type="password"
                      placeholder="Sua senha"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                    />
                  </label>

                  {loginError ? <p className="form-error">{loginError}</p> : null}

                  <div className="form-actions align-start">
                    <button type="submit" className="primary-button">
                      Entrar como dono
                    </button>
                  </div>
                </form>
              </div>
            ) : resolvedAccessMode === 'store' ? (
              <div className="auth-modal-body">
                <div className="auth-mode-switch">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleModeSelection('owner')}
                  >
                    Trocar para dono
                  </button>
                </div>

                <form
                  className="auth-form"
                  data-tour="auth-store-login"
                  onSubmit={handleLoginSubmit}
                >
                  <label className="field">
                    <span>Codigo da base</span>
                    <input
                      type="text"
                      placeholder="Ex: rede-centro"
                      value={loginForm.baseCode}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          baseCode: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Usuario da pizzaria</span>
                    <input
                      type="text"
                      placeholder="Usuario informado pelo dono"
                      value={loginForm.username}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Senha da pizzaria</span>
                    <input
                      type="password"
                      placeholder="Senha da unidade"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                    />
                  </label>

                  {loginError ? <p className="form-error">{loginError}</p> : null}

                  <div className="form-actions align-start">
                    <button type="submit" className="primary-button">
                      Entrar como pizzaria
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="auth-modal-body">
                <div className="auth-mode-switch">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setShowCreateBase(false)
                      setBaseError('')
                    }}
                  >
                    Voltar para login do dono
                  </button>
                </div>

                <form className="auth-form" onSubmit={handleBaseSubmit}>
                  <div className="form-grid">
                    <label className="field field-span" data-tour="auth-base-data">
                      <span>Nome da base</span>
                      <input
                        type="text"
                        placeholder="Ex: Rede TBT Centro"
                        value={baseForm.baseName}
                        onChange={(event) =>
                          setBaseForm((current) => ({
                            ...current,
                            baseName: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="field field-span">
                      <span>Codigo da base</span>
                      <input
                        type="text"
                        placeholder="Ex: rede-centro"
                        value={baseForm.baseCode}
                        onChange={(event) =>
                          setBaseForm((current) => ({
                            ...current,
                            baseCode: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="field" data-tour="auth-owner-credentials">
                      <span>Nome do dono</span>
                      <input
                        type="text"
                        placeholder="Ex: Carlos"
                        value={baseForm.ownerName}
                        onChange={(event) =>
                          setBaseForm((current) => ({
                            ...current,
                            ownerName: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="field">
                      <span>Usuario do dono</span>
                      <input
                        type="text"
                        placeholder="Ex: carlos"
                        value={baseForm.ownerUsername}
                        onChange={(event) =>
                          setBaseForm((current) => ({
                            ...current,
                            ownerUsername: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className="field field-span">
                      <span>Senha do dono</span>
                      <input
                        type="password"
                        placeholder="Crie a senha principal da base"
                        value={baseForm.ownerPassword}
                        onChange={(event) =>
                          setBaseForm((current) => ({
                            ...current,
                            ownerPassword: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  {baseError ? <p className="form-error">{baseError}</p> : null}

                  <div className="form-actions align-start">
                    <button type="submit" className="primary-button">
                      Criar base e entrar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
