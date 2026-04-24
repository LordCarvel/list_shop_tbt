import { startTransition, useEffect, useMemo, useState } from 'react'
import AccessPage from './AccessPage'
import AdjustmentsPage from './AdjustmentsPage'
import AuthPage from './AuthPage'
import CentralPage from './CentralPage'
import DashboardPage from './DashboardPage'
import GuidedTour from './GuidedTour'
import ProductsPage from './ProductsPage'
import StoresPage from './StoresPage'
import {
  authenticate,
  canAccessPage,
  createBase,
  getAllowedPages,
  getDefaultPageForUser,
  getRoleLabel,
  getVisibleStoresForUser,
  normalizeBaseCode,
  normalizeUsername,
  upsertStoreAccess,
  validateBasePayload,
  validateStoreAccessPayload,
} from './authLogic'
import {
  ADJUSTMENT_REASONS,
  APP_STORAGE_KEY,
  PAGE_META,
  USER_ROLES,
} from './inventoryData'
import {
  appendClosingToState,
  buildAdjustmentMovement,
  buildEntryMovement,
  buildProduct,
  buildShipmentRequest,
  buildTransferMovement,
  createClosingDraft,
  findClosing,
  formatDateLabel,
  getMovementTimeline,
  getPendingClosings,
  getPendingShipmentRequests,
  getRecentAlerts,
  getStockSnapshot,
  getTodayIso,
  getUnitById,
  getUnitStockAtDate,
  normalizeSystemState,
  isStoreLocked,
  shiftIsoDate,
  validateProductPayload,
} from './inventoryLogic'
import './App.css'

const TOUR_STEPS = {
  authOwner: [
    {
      id: 'auth-owner-login',
      selector: '[data-tour="auth-owner-login"]',
      title: 'Login do dono',
      body: 'Depois da base criada, o dono entra por este formulario usando codigo da base, usuario e senha principal.',
    },
    {
      id: 'auth-create-toggle',
      selector: '[data-tour="auth-create-toggle"]',
      title: 'Base nova',
      body: 'Se ainda nao existe base, use este atalho para abrir o cadastro inicial do dono.',
    },
    {
      id: 'auth-base-data',
      selector: '[data-tour="auth-base-data"]',
      title: 'Criar a base',
      body: 'O dono cria o nome e o codigo da base. O sistema comeca sem produtos, sem pizzarias e sem movimentos.',
    },
    {
      id: 'auth-owner-credentials',
      selector: '[data-tour="auth-owner-credentials"]',
      title: 'Credenciais do dono',
      body: 'Aqui ficam o nome do dono e o usuario principal da base. Esse login acessa todas as areas de gestao.',
    },
  ],
  authStore: [
    {
      id: 'auth-store-login',
      selector: '[data-tour="auth-store-login"]',
      title: 'Login da pizzaria',
      body: 'O responsavel do estoque da unidade usa este formulario com o usuario e a senha que o dono entregou.',
    },
  ],
  owner: [
    {
      id: 'owner-checklist',
      pageId: 'dashboard',
      selector: '[data-tour="owner-checklist"]',
      title: 'Ordem correta de implantacao',
      body: 'O dono monta o sistema nesta ordem: produtos, pizzarias, central e depois fechamento. Isso evita telas confusas e processo quebrado.',
    },
    {
      id: 'products-form',
      pageId: 'products',
      selector: '[data-tour="products-form"]',
      title: 'Cadastro de produtos',
      body: 'Cadastre um produto por vez e escolha o tipo dele. O sistema nao vem com nenhum item pronto.',
    },
    {
      id: 'products-list',
      pageId: 'products',
      selector: '[data-tour="products-list"]',
      title: 'Lista de controle',
      body: 'Aqui voce revisa os produtos que realmente entraram no controle. Foque nos itens importantes da operacao.',
    },
    {
      id: 'access-form',
      pageId: 'access',
      selector: '[data-tour="access-form"]',
      title: 'Criacao das pizzarias',
      body: 'Cada pizzaria precisa do proprio nome, responsavel, usuario e senha. So o dono cria esse acesso.',
    },
    {
      id: 'access-list',
      pageId: 'access',
      selector: '[data-tour="access-list"]',
      title: 'Revisao dos acessos',
      body: 'Depois de criar a unidade, voce revisa os logins por aqui e atualiza credenciais quando trocar o responsavel.',
    },
    {
      id: 'central-entry',
      pageId: 'central',
      selector: '[data-tour="central-entry"]',
      title: 'Entrada do central',
      body: 'A central registra o que chegou de verdade. Nada de pedido teorico: o sistema grava so o recebido real.',
    },
    {
      id: 'central-transfer',
      pageId: 'central',
      selector: '[data-tour="central-transfer"]',
      title: 'Transferencia para a loja',
      body: 'Depois da entrada, a central registra o envio real para cada pizzaria. O pedido da loja ajuda a separar as quantidades.',
    },
    {
      id: 'central-requests',
      pageId: 'central',
      selector: '[data-tour="central-requests"]',
      title: 'Pedidos das pizzarias',
      body: 'Aqui aparecem as solicitacoes de reposicao enviadas pelas pizzarias para o proximo envio da base.',
    },
    {
      id: 'central-stock',
      pageId: 'central',
      selector: '[data-tour="central-stock"]',
      title: 'Saldo atual do central',
      body: 'Esta tabela mostra o estoque calculado do central com base em entradas, transferencias e ajustes.',
    },
    {
      id: 'store-closing',
      pageId: 'stores',
      selector: '[data-tour="store-closing"]',
      title: 'Fechamento diario da pizzaria',
      body: 'No fim do dia, a loja digita o estoque real. O sistema calcula a diferenca e cria os ajustes automaticamente.',
    },
    {
      id: 'adjustment-form',
      pageId: 'adjustments',
      selector: '[data-tour="adjustment-form"]',
      title: 'Ajuste manual',
      body: 'Quando precisar corrigir algo fora do fechamento, use ajuste manual com motivo. O passado continua travado.',
    },
  ],
  store: [
    {
      id: 'store-guide',
      pageId: 'stores',
      selector: '[data-tour="store-guide"]',
      title: 'Painel da pizzaria',
      body: 'A pizzaria usa apenas esta area. Nao existe acesso a produtos, central, acessos ou ajustes da base inteira.',
    },
    {
      id: 'store-date',
      pageId: 'stores',
      selector: '[data-tour="store-date"]',
      title: 'Data do fechamento',
      body: 'Escolha a data que esta sendo fechada. Em geral a contagem do dia anterior e feita no fim da operacao.',
    },
    {
      id: 'store-closing',
      pageId: 'stores',
      selector: '[data-tour="store-closing"]',
      title: 'Contagem real',
      body: 'A unidade informa apenas o que sobrou de verdade. Se houver diferenca, o sistema ajusta sozinho ao fechar.',
    },
    {
      id: 'store-request',
      pageId: 'stores',
      selector: '[data-tour="store-request"]',
      title: 'Solicitacao de reposicao',
      body: 'Depois de conferir o estoque, a pizzaria informa quanto quer receber no proximo envio da base.',
    },
    {
      id: 'store-stock',
      pageId: 'stores',
      selector: '[data-tour="store-stock"]',
      title: 'Saldo calculado',
      body: 'Aqui a pizzaria enxerga o estoque calculado atual da propria unidade e confere o que ja esta registrado.',
    },
  ],
}

const TOUR_COMPLETION_STORAGE_KEY = `${APP_STORAGE_KEY}:guided-tour:v1`
const TOUR_MODES = Object.keys(TOUR_STEPS)
const ADMIN_DEFAULT_PASSWORD = 'admin'
const AUTH_TOUR_MODE_BY_ACCESS_MODE = {
  owner: 'authOwner',
  store: 'authStore',
}

function createEmptyAppState() {
  return {
    bases: [],
    session: null,
  }
}

function createEmptyTourCompletion() {
  return TOUR_MODES.reduce(
    (completion, mode) => ({
      ...completion,
      [mode]: false,
    }),
    {},
  )
}

function readStoredTourCompletion() {
  if (typeof window === 'undefined') {
    return createEmptyTourCompletion()
  }

  try {
    const rawState = window.localStorage.getItem(TOUR_COMPLETION_STORAGE_KEY)

    if (!rawState) {
      return createEmptyTourCompletion()
    }

    const parsedState = JSON.parse(rawState)

    return TOUR_MODES.reduce(
      (completion, mode) => ({
        ...completion,
        [mode]: Boolean(parsedState?.[mode]),
      }),
      {},
    )
  } catch {
    return createEmptyTourCompletion()
  }
}

function readStoredAppState() {
  if (typeof window === 'undefined') {
    return createEmptyAppState()
  }

  try {
    const rawState = window.localStorage.getItem(APP_STORAGE_KEY)

    if (!rawState) {
      return createEmptyAppState()
    }

    const parsedState = JSON.parse(rawState)

    if (Array.isArray(parsedState?.bases)) {
      return {
        bases: parsedState.bases,
        session: parsedState.session ?? null,
      }
    }
  } catch {
    return createEmptyAppState()
  }

  return createEmptyAppState()
}

function createNotice(tone, text) {
  return {
    id: `${tone}-${Date.now()}`,
    tone,
    text,
  }
}

function getGuideModeForUser(user) {
  return user.role === USER_ROLES.OWNER ? 'owner' : 'store'
}

function getAuthGuideMode(accessMode) {
  return AUTH_TOUR_MODE_BY_ACCESS_MODE[accessMode] ?? null
}

function getInitialSessionUser(appState) {
  if (!appState.session) {
    return null
  }

  const base =
    appState.bases.find((item) => item.id === appState.session.baseId) ?? null

  if (!base) {
    return null
  }

  return base.users.find((user) => user.id === appState.session.userId) ?? null
}

function getInitialTourRun(appState, tourCompletion) {
  const sessionUser = getInitialSessionUser(appState)

  if (!sessionUser) {
    return null
  }

  const guideMode = getGuideModeForUser(sessionUser)

  return tourCompletion[guideMode]
    ? null
    : { mode: guideMode, isAutomatic: true }
}

function getInitialActivePage(appState, tourCompletion) {
  const sessionUser = getInitialSessionUser(appState)

  if (!sessionUser) {
    return 'dashboard'
  }

  const initialTourRun = getInitialTourRun(appState, tourCompletion)
  const pageId = TOUR_STEPS[initialTourRun?.mode]?.[0]?.pageId

  if (pageId && canAccessPage(sessionUser, pageId)) {
    return pageId
  }

  return getDefaultPageForUser(sessionUser)
}

function getUniqueBaseCode(bases, seed) {
  const fallback = `base-${bases.length + 1}`
  const baseCode = normalizeBaseCode(seed || fallback) || fallback
  let candidate = baseCode
  let suffix = 2

  while (bases.some((base) => base.code === candidate)) {
    candidate = `${baseCode}-${suffix}`
    suffix += 1
  }

  return candidate
}

function getUniqueUsername(users, seed) {
  const fallback = `usuario${users.length + 1}`
  const baseUsername = normalizeUsername(seed || fallback) || fallback
  let candidate = baseUsername
  let suffix = 2

  while (users.some((user) => user.username === candidate)) {
    candidate = `${baseUsername}${suffix}`
    suffix += 1
  }

  return candidate
}

function Sidebar({
  activePage,
  allowedPages,
  currentBase,
  currentUser,
  onNavigate,
  onOpenGuide,
  onSignOut,
  previousDate,
}) {
  return (
    <aside className="sidebar">
      <div className="brand-card">
        <p className="brand-eyebrow">TBT Estoque</p>
        <h1>{currentBase.name}</h1>
        <p>
          Base <strong>{currentBase.code}</strong> | {getRoleLabel(currentUser.role)}
        </p>
      </div>

      <div className="sidebar-card">
        <strong>Usuario atual</strong>
        <p>{currentUser.name}</p>
        <div className="sidebar-stat-row">
          <span>{currentUser.username}</span>
          <button type="button" className="link-button" onClick={onSignOut}>
            Sair
          </button>
        </div>
      </div>

      <nav className="nav-stack" aria-label="Areas do sistema">
        {allowedPages.map((pageId) => {
          const page = PAGE_META[pageId]
          const isActive = activePage === pageId

          return (
            <button
              key={pageId}
              type="button"
              className={`nav-item${isActive ? ' is-active' : ''}`}
              onClick={() => onNavigate(pageId)}
            >
              <span>{page.label}</span>
              <small>{page.eyebrow}</small>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-card">
        <strong>Rotina</strong>
        <p>
          Ontem: {formatDateLabel(previousDate)}. Pizzaria sem fechamento segue
          pendente ate regularizar.
        </p>
      </div>

      <div className="sidebar-actions">
        <button type="button" className="secondary-button" onClick={onOpenGuide}>
          Repetir passo a passo
        </button>
      </div>
    </aside>
  )
}

function Header({
  currentBase,
  currentUser,
  inventoryState,
  notice,
  onDismiss,
  onOpenGuide,
  page,
  previousDate,
  referenceDate,
}) {
  return (
    <header className="page-header">
      <div className="page-title-block">
        <p className="page-eyebrow">{page.eyebrow}</p>
        <h2>{page.title}</h2>
        <p>{page.description}</p>
      </div>

      <div className="header-meta">
        <span className="header-chip">{currentBase.name}</span>
        <span className="header-chip">{getRoleLabel(currentUser.role)}</span>
        <span className="header-chip">Base {formatDateLabel(referenceDate)}</span>
        <span className="header-chip">Ontem {formatDateLabel(previousDate)}</span>
        <span className="header-chip">
          {inventoryState.movements.length} movimentos
        </span>
        <button type="button" className="secondary-button header-help" onClick={onOpenGuide}>
          Repetir passo a passo
        </button>
      </div>

      {notice ? (
        <div className={`notice-banner tone-${notice.tone}`}>
          <span>{notice.text}</span>
          <button type="button" onClick={onDismiss}>
            Fechar
          </button>
        </div>
      ) : null}
    </header>
  )
}

function StoreWorkspace({
  currentBase,
  currentUser,
  notice,
  onDismiss,
  onOpenGuide,
  onSignOut,
  page,
  previousDate,
  referenceDate,
  children,
}) {
  return (
    <div className="store-layout">
      <aside className="store-rail">
        <div className="store-card">
          <p className="brand-eyebrow">Painel da pizzaria</p>
          <h1>{currentUser.name}</h1>
          <p>
            {currentBase.name} | {currentUser.username}
          </p>
        </div>

        <div className="store-card">
          <strong>Unidade vinculada</strong>
          <p>{getUnitById(currentBase.units, currentUser.unitId)?.name ?? 'Nao encontrada'}</p>
        </div>

        <div className="store-card">
          <strong>Rotina de uso</strong>
          <ul className="rule-list">
            <li>Conferir a data que sera fechada.</li>
            <li>Informar o estoque real contado.</li>
            <li>Pedir a reposicao para o proximo envio.</li>
            <li>Fechar o dia e registrar observacao quando necessario.</li>
          </ul>
        </div>

        <div className="sidebar-actions">
          <button type="button" className="secondary-button" onClick={onOpenGuide}>
            Repetir passo a passo
          </button>
          <button type="button" className="secondary-button" onClick={onSignOut}>
            Sair da pizzaria
          </button>
        </div>
      </aside>

      <main className="store-content">
        <header className="store-header">
          <div className="page-title-block">
            <p className="page-eyebrow">{page.eyebrow}</p>
            <h2>{page.title}</h2>
            <p>{page.description}</p>
          </div>

          <div className="header-meta">
            <span className="header-chip">{currentBase.name}</span>
            <span className="header-chip">
              {getUnitById(currentBase.units, currentUser.unitId)?.shortName}
            </span>
            <span className="header-chip">Base {formatDateLabel(referenceDate)}</span>
            <span className="header-chip">Ontem {formatDateLabel(previousDate)}</span>
          </div>

          {notice ? (
            <div className={`notice-banner tone-${notice.tone}`}>
              <span>{notice.text}</span>
              <button type="button" onClick={onDismiss}>
                Fechar
              </button>
            </div>
          ) : null}
        </header>

        <section className="page-content">{children}</section>
      </main>
    </div>
  )
}

function App() {
  const initialAppState = useMemo(() => readStoredAppState(), [])
  const initialTourCompletion = useMemo(() => readStoredTourCompletion(), [])
  const initialTourRun = useMemo(
    () => getInitialTourRun(initialAppState, initialTourCompletion),
    [initialAppState, initialTourCompletion],
  )
  const [appState, setAppState] = useState(initialAppState)
  const [activePage, setActivePage] = useState(() =>
    getInitialActivePage(initialAppState, initialTourCompletion),
  )
  const [notice, setNotice] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [tourCompletion, setTourCompletion] = useState(initialTourCompletion)
  const [tourRun, setTourRun] = useState(initialTourRun)
  const [tourIndex, setTourIndex] = useState(0)

  const referenceDate = getTodayIso()
  const previousDate = shiftIsoDate(referenceDate, -1)
  const currentBase = appState.session
    ? appState.bases.find((base) => base.id === appState.session.baseId) ?? null
    : null
  const currentUser =
    currentBase && appState.session
      ? currentBase.users.find((user) => user.id === appState.session.userId) ?? null
      : null

  const inventoryState = normalizeSystemState(currentBase?.inventory)
  const baseUnits = currentBase?.units ?? []
  const baseStores = baseUnits.filter((unit) => unit.type === 'store')
  const baseProducts = currentBase?.products ?? []
  const visibleStores =
    currentBase && currentUser
      ? getVisibleStoresForUser(currentBase, currentUser)
      : []
  const allowedPages = currentUser ? getAllowedPages(currentUser) : []
  const baseResolvedActivePage =
    currentUser && !canAccessPage(currentUser, activePage)
      ? getDefaultPageForUser(currentUser)
      : activePage
  const tourMode = tourRun?.mode ?? null
  const isAuthTourMode = tourMode === 'authOwner' || tourMode === 'authStore'
  const currentTourSteps = tourMode ? TOUR_STEPS[tourMode] ?? [] : []
  const currentTourStep = currentTourSteps[tourIndex] ?? null
  const guidedPage =
    currentUser &&
    currentTourStep?.pageId &&
    canAccessPage(currentUser, currentTourStep.pageId)
      ? currentTourStep.pageId
      : null
  const resolvedActivePage = guidedPage ?? baseResolvedActivePage
  const page = currentUser ? PAGE_META[resolvedActivePage] : null

  const pendingClosings = currentBase
    ? getPendingClosings(inventoryState, baseUnits, previousDate)
    : []
  const pendingShipmentRequests = currentBase
    ? getPendingShipmentRequests(inventoryState)
    : []
  const recentAlerts = currentBase
    ? getRecentAlerts(inventoryState, baseUnits, baseProducts, 6)
    : []
  const allMovements = currentBase
    ? getMovementTimeline(inventoryState, inventoryState.movements.length)
    : []
  const recentMovements = currentBase ? getMovementTimeline(inventoryState, 8) : []
  const snapshot = currentBase
    ? getStockSnapshot(inventoryState, baseUnits, baseProducts)
    : null

  const centralRows = currentBase
    ? baseProducts.map((product) => ({
        product,
        current: snapshot?.central?.[product.id] ?? 0,
      }))
    : []

  const recentCentralMovements = allMovements
    .filter(
      (movement) =>
        movement.type === 'entry' ||
        movement.fromUnitId === 'central' ||
        movement.unitId === 'central',
    )
    .slice(0, 6)

  useEffect(() => {
    try {
      window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appState))
    } catch {
      return
    }
  }, [appState])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        TOUR_COMPLETION_STORAGE_KEY,
        JSON.stringify(tourCompletion),
      )
    } catch {
      return
    }
  }, [tourCompletion])

  useEffect(() => {
    if (!notice) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setNotice(null), 4200)

    return () => window.clearTimeout(timeoutId)
  }, [notice])

  function replaceCurrentBase(updater) {
    if (!currentBase) {
      return
    }

    setAppState((current) => ({
      ...current,
      bases: current.bases.map((base) =>
        base.id === currentBase.id ? updater(base) : base,
      ),
    }))
  }

  function navigate(pageId) {
    if (!currentUser || !canAccessPage(currentUser, pageId)) {
      return
    }

    startTransition(() => {
      setActivePage(pageId)
    })
  }

  function syncTourPage(mode, stepIndex, user = currentUser) {
    const pageId = TOUR_STEPS[mode]?.[stepIndex]?.pageId

    if (user && pageId && canAccessPage(user, pageId)) {
      setActivePage(pageId)
    }
  }

  function startGuide(mode, options = {}) {
    if (!TOUR_STEPS[mode]?.length) {
      return
    }

    const requestedIndex =
      options.initialStepId === undefined
        ? 0
        : TOUR_STEPS[mode].findIndex((step) => step.id === options.initialStepId)
    const nextIndex = Math.max(0, requestedIndex)

    setTourRun({ mode, isAutomatic: Boolean(options.isAutomatic) })
    setTourIndex(nextIndex)
    syncTourPage(mode, nextIndex, options.user)
  }

  function startAuthGuide(accessMode, options = {}) {
    const guideMode = getAuthGuideMode(accessMode)

    if (!guideMode) {
      return
    }

    if (options.isAutomatic && tourCompletion[guideMode]) {
      return
    }

    startGuide(guideMode, options)
  }

  function resetTour() {
    setTourRun(null)
    setTourIndex(0)
  }

  function markTourCompleted(mode) {
    setTourCompletion((current) => {
      if (!mode || current[mode]) {
        return current
      }

      return {
        ...current,
        [mode]: true,
      }
    })
  }

  function finishTourRun() {
    if (tourRun?.isAutomatic) {
      markTourCompleted(tourRun.mode)
    }

    resetTour()
  }

  function handleNextTourStep() {
    if (!tourMode || !currentTourSteps.length) {
      return
    }

    if (tourIndex >= currentTourSteps.length - 1) {
      finishTourRun()
      return
    }

    const nextIndex = tourIndex + 1
    setTourIndex(nextIndex)
    syncTourPage(tourMode, nextIndex)
  }

  function handlePreviousTourStep() {
    if (!tourMode) {
      return
    }

    const nextIndex = Math.max(0, tourIndex - 1)
    setTourIndex(nextIndex)
    syncTourPage(tourMode, nextIndex)
  }

  function handleCloseTour() {
    finishTourRun()
  }

  function handleLogin(payload) {
    const result = authenticate(appState, payload)

    if (!result.ok) {
      setLoginError(result.message)
      return { ok: false, message: result.message }
    }

    setLoginError('')
    setAppState((current) => ({
      ...current,
      session: {
        baseId: result.base.id,
        userId: result.user.id,
      },
    }))
    setActivePage(getDefaultPageForUser(result.user))
    setNotice(
      createNotice(
        'success',
        `Acesso liberado para ${result.base.name} como ${getRoleLabel(result.user.role)}.`,
      ),
    )

    if (
      (tourRun?.mode === 'authOwner' || tourRun?.mode === 'authStore') &&
      tourRun.isAutomatic
    ) {
      markTourCompleted(tourRun.mode)
    }

    const nextGuideMode = getGuideModeForUser(result.user)

    if (tourCompletion[nextGuideMode]) {
      resetTour()
    } else {
      startGuide(nextGuideMode, { isAutomatic: true, user: result.user })
    }

    return { ok: true }
  }

  function handleCreateBase(payload) {
    const validation = validateBasePayload(appState, payload)

    if (!validation.ok) {
      return validation
    }

    const base = createBase(validation.normalized)
    const ownerUser = base.users[0]

    setLoginError('')
    setAppState((current) => ({
      ...current,
      bases: [...current.bases, base],
      session: {
        baseId: base.id,
        userId: ownerUser.id,
      },
    }))
    setActivePage('dashboard')
    setNotice(
      createNotice(
        'success',
        `Base ${base.name} criada. Agora cadastre produtos e pizzarias.`,
      ),
    )

    if (tourRun?.mode === 'authOwner' && tourRun.isAutomatic) {
      markTourCompleted('authOwner')
    }

    if (tourCompletion.owner) {
      resetTour()
    } else {
      startGuide('owner', { isAutomatic: true, user: ownerUser })
    }

    return { ok: true }
  }

  function handleSignOut() {
    setAppState((current) => ({
      ...current,
      session: null,
    }))
    setActivePage('dashboard')
    setLoginError('')
    setNotice(null)

    resetTour()
  }

  function handleAdminCreateBase(payload) {
    const baseName = String(payload.baseName ?? '').trim() || `Base teste ${appState.bases.length + 1}`
    const baseCode = getUniqueBaseCode(appState.bases, payload.baseCode || baseName)
    const ownerName = String(payload.ownerName ?? '').trim() || 'Admin'
    const ownerUsername = getUniqueUsername([], payload.ownerUsername || ownerName)
    const validation = validateBasePayload(appState, {
      baseName,
      baseCode,
      ownerName,
      ownerUsername,
      ownerPassword: ADMIN_DEFAULT_PASSWORD,
    })

    if (!validation.ok) {
      return validation
    }

    const base = createBase(validation.normalized)

    setAppState((current) => ({
      ...current,
      bases: [...current.bases, base],
    }))
    setNotice(createNotice('success', `Base ${base.name} criada pelo painel admin.`))

    return { ok: true, base }
  }

  function handleAdminCreateStore(baseId, payload) {
    const base = appState.bases.find((item) => item.id === baseId)

    if (!base) {
      return { ok: false, message: 'Escolha uma base valida.' }
    }

    const storeCount = base.units.filter((unit) => unit.type === 'store').length
    const storeName =
      String(payload.storeName ?? '').trim() || `Pizzaria teste ${storeCount + 1}`
    const responsibleName =
      String(payload.responsibleName ?? '').trim() || `Responsavel ${storeName}`
    const username = getUniqueUsername(
      base.users,
      payload.username || storeName,
    )
    const validation = validateStoreAccessPayload(base, {
      storeName,
      responsibleName,
      username,
      password: ADMIN_DEFAULT_PASSWORD,
    })

    if (!validation.ok) {
      return validation
    }

    setAppState((current) => ({
      ...current,
      bases: current.bases.map((currentBase) =>
        currentBase.id === base.id
          ? upsertStoreAccess(currentBase, validation.normalized)
          : currentBase,
      ),
    }))
    setNotice(createNotice('success', `Pizzaria ${storeName} criada pelo painel admin.`))

    return { ok: true }
  }

  function handleAdminEnter(baseId, userId) {
    const base = appState.bases.find((item) => item.id === baseId)
    const user = base?.users.find((item) => item.id === userId)

    if (!base || !user) {
      return { ok: false, message: 'Acesso admin nao encontrado.' }
    }

    setLoginError('')
    setAppState((current) => ({
      ...current,
      session: {
        baseId: base.id,
        userId: user.id,
      },
    }))
    setActivePage(getDefaultPageForUser(user))
    setNotice(
      createNotice(
        'success',
        `Acesso admin liberado para ${base.name} como ${getRoleLabel(user.role)}.`,
      ),
    )
    resetTour()

    return { ok: true }
  }

  function handleCreateProduct(payload) {
    if (!currentBase || !currentUser || currentUser.role !== USER_ROLES.OWNER) {
      const message = 'Apenas o dono pode cadastrar produtos.'
      setNotice(createNotice('error', message))
      return { ok: false, message }
    }

    const validation = validateProductPayload(baseProducts, payload)

    if (!validation.ok) {
      setNotice(createNotice('error', validation.message))
      return validation
    }

    replaceCurrentBase((base) => ({
      ...base,
      products: [...base.products, buildProduct(validation.normalized)],
    }))
    setNotice(createNotice('success', 'Produto cadastrado com sucesso.'))
    return { ok: true }
  }

  function handleCreateOrUpdateStoreAccess(payload) {
    if (!currentBase || !currentUser || currentUser.role !== USER_ROLES.OWNER) {
      const message = 'Apenas o dono da base pode configurar acessos.'
      setNotice(createNotice('error', message))
      return { ok: false, message }
    }

    const validation = validateStoreAccessPayload(currentBase, payload)

    if (!validation.ok) {
      setNotice(createNotice('error', validation.message))
      return validation
    }

    replaceCurrentBase((base) => upsertStoreAccess(base, validation.normalized))
    setNotice(createNotice('success', 'Acesso da pizzaria salvo com sucesso.'))
    return { ok: true }
  }

  function handleCreateEntry(payload) {
    if (!currentBase || !currentUser || currentUser.role !== USER_ROLES.OWNER) {
      return { ok: false, message: 'Apenas o dono pode registrar entrada.' }
    }

    if (!baseProducts.some((product) => product.id === payload.productId)) {
      return { ok: false, message: 'Produto nao encontrado.' }
    }

    if (!payload.date) {
      return { ok: false, message: 'Informe uma data para a entrada.' }
    }

    if (!payload.quantity || payload.quantity <= 0) {
      return { ok: false, message: 'Informe uma quantidade maior que zero.' }
    }

    replaceCurrentBase((base) => ({
      ...base,
      inventory: {
        ...base.inventory,
        movements: [...base.inventory.movements, buildEntryMovement(payload)],
      },
    }))
    setNotice(createNotice('success', 'Entrada registrada no estoque central.'))
    return { ok: true }
  }

  function handleCreateTransfer(payload) {
    if (!currentBase || !currentUser || currentUser.role !== USER_ROLES.OWNER) {
      return { ok: false, message: 'Apenas o dono pode transferir estoque.' }
    }

    if (!baseProducts.some((product) => product.id === payload.productId)) {
      return { ok: false, message: 'Produto nao encontrado.' }
    }

    if (!payload.date) {
      return { ok: false, message: 'Informe uma data para a transferencia.' }
    }

    if (!payload.destinationId) {
      return { ok: false, message: 'Informe a pizzaria de destino.' }
    }

    if (isStoreLocked(inventoryState, baseUnits, payload.destinationId, payload.date)) {
      return {
        ok: false,
        message:
          'Essa pizzaria ja fechou esse dia. Use outra data ou corrija com ajuste.',
      }
    }

    const centralStockAtDate =
      getUnitStockAtDate(
        inventoryState,
        baseUnits,
        baseProducts,
        'central',
        payload.date,
      )[payload.productId] ?? 0

    if (centralStockAtDate < payload.quantity) {
      return {
        ok: false,
        message: 'Quantidade maior que o estoque calculado do central nessa data.',
      }
    }

    replaceCurrentBase((base) => ({
      ...base,
      inventory: {
        ...base.inventory,
        movements: [...base.inventory.movements, buildTransferMovement(payload)],
      },
    }))
    setNotice(createNotice('success', 'Transferencia registrada para a pizzaria.'))
    return { ok: true }
  }

  function handleCreateShipmentRequest(payload) {
    if (!currentBase || !currentUser) {
      return { ok: false, message: 'Sessao invalida.' }
    }

    if (
      currentUser.role === USER_ROLES.STORE &&
      payload.unitId !== currentUser.unitId
    ) {
      return {
        ok: false,
        message: 'Essa pizzaria so pode pedir reposicao para a propria unidade.',
      }
    }

    if (!baseUnits.some((unit) => unit.id === payload.unitId && unit.type === 'store')) {
      return { ok: false, message: 'Pizzaria nao encontrada.' }
    }

    if (!payload.deliveryDate) {
      return { ok: false, message: 'Informe a data desejada para envio.' }
    }

    const validItems = payload.items.filter(
      (item) =>
        item.quantity > 0 &&
        baseProducts.some((product) => product.id === item.productId),
    )

    if (!validItems.length) {
      return {
        ok: false,
        message: 'Informe pelo menos um item com quantidade para reposicao.',
      }
    }

    replaceCurrentBase((base) => {
      const normalizedInventory = normalizeSystemState(base.inventory)

      return {
        ...base,
        inventory: {
          ...normalizedInventory,
          shipmentRequests: [
            ...normalizedInventory.shipmentRequests,
            buildShipmentRequest({
              unitId: payload.unitId,
              requestDate: referenceDate,
              deliveryDate: payload.deliveryDate,
              items: validItems,
              note: payload.note,
            }),
          ],
        },
      }
    })
    setNotice(createNotice('success', 'Solicitacao de reposicao enviada para a base.'))

    return { ok: true }
  }

  function handleCompleteShipmentRequest(requestId) {
    if (!currentBase || !currentUser || currentUser.role !== USER_ROLES.OWNER) {
      return { ok: false, message: 'Apenas o dono pode concluir solicitacoes.' }
    }

    if (!inventoryState.shipmentRequests.some((request) => request.id === requestId)) {
      return { ok: false, message: 'Solicitacao nao encontrada.' }
    }

    replaceCurrentBase((base) => {
      const normalizedInventory = normalizeSystemState(base.inventory)

      return {
        ...base,
        inventory: {
          ...normalizedInventory,
          shipmentRequests: normalizedInventory.shipmentRequests.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  status: 'fulfilled',
                  fulfilledAt: new Date().toISOString(),
                }
              : request,
          ),
        },
      }
    })
    setNotice(createNotice('success', 'Solicitacao marcada como atendida.'))

    return { ok: true }
  }

  function handleCreateAdjustment(payload) {
    if (!currentBase || !currentUser || currentUser.role !== USER_ROLES.OWNER) {
      return { ok: false, message: 'Apenas o dono pode criar ajustes manuais.' }
    }

    if (!baseProducts.some((product) => product.id === payload.productId)) {
      return { ok: false, message: 'Produto nao encontrado.' }
    }

    if (!payload.date) {
      return { ok: false, message: 'Informe uma data para o ajuste.' }
    }

    if (!payload.quantity) {
      return { ok: false, message: 'Ajuste precisa ser diferente de zero.' }
    }

    if (isStoreLocked(inventoryState, baseUnits, payload.unitId, payload.date)) {
      return {
        ok: false,
        message:
          'Essa pizzaria ja fechou o dia informado. Ajuste retroativo nao e permitido.',
      }
    }

    replaceCurrentBase((base) => ({
      ...base,
      inventory: {
        ...base.inventory,
        movements: [...base.inventory.movements, buildAdjustmentMovement(payload)],
      },
    }))
    setNotice(createNotice('success', 'Ajuste manual registrado com motivo.'))
    return { ok: true }
  }

  function handleCloseDay(payload) {
    if (!currentBase || !currentUser) {
      return { ok: false, message: 'Sessao invalida.' }
    }

    if (!baseProducts.length) {
      return { ok: false, message: 'Cadastre produtos antes de fechar o dia.' }
    }

    if (currentUser.role === USER_ROLES.STORE && payload.unitId !== currentUser.unitId) {
      return {
        ok: false,
        message: 'Esse usuario so pode fechar a propria pizzaria.',
      }
    }

    if (!payload.date) {
      return { ok: false, message: 'Informe a data do fechamento.' }
    }

    if (findClosing(inventoryState, payload.unitId, payload.date)) {
      return { ok: false, message: 'Essa pizzaria ja fechou esse dia.' }
    }

    if (isStoreLocked(inventoryState, baseUnits, payload.unitId, payload.date)) {
      return {
        ok: false,
        message:
          'Esse dia ja esta travado por um fechamento posterior. Use ajuste manual.',
      }
    }

    const draft = createClosingDraft(
      inventoryState,
      baseUnits,
      baseProducts,
      payload.unitId,
      payload.date,
      payload.counts,
    )

    if (draft.requiresObservation && !payload.note.trim()) {
      return {
        ok: false,
        message: 'Fechamento acima de 5% precisa de observacao obrigatoria.',
      }
    }

    replaceCurrentBase((base) => ({
      ...base,
      inventory: appendClosingToState(
        base.inventory,
        base.units,
        base.products,
        payload,
      ),
    }))
    setNotice(
      createNotice(
        'success',
        `Fechamento concluido com ${draft.changedItemsCount} ajustes automaticos.`,
      ),
    )
    return { ok: true }
  }

  function renderPage() {
    if (!currentBase || !currentUser) {
      return (
        <AuthPage
          baseCount={appState.bases.length}
          bases={appState.bases}
          loginError={loginError}
          onAdminCreateBase={handleAdminCreateBase}
          onAdminCreateStore={handleAdminCreateStore}
          onAdminEnter={handleAdminEnter}
          onCreateBase={handleCreateBase}
          onLogin={handleLogin}
          onResetLoginError={() => setLoginError('')}
          onStartProfileGuide={startAuthGuide}
          tourStepId={isAuthTourMode ? currentTourStep?.id : null}
        />
      )
    }

    if (resolvedActivePage === 'dashboard') {
      return (
        <DashboardPage
          previousDate={previousDate}
          products={baseProducts}
          stores={baseStores}
          units={baseUnits}
          pendingClosings={pendingClosings}
          pendingShipmentRequests={pendingShipmentRequests}
          recentAlerts={recentAlerts}
          recentMovements={recentMovements}
          onNavigate={navigate}
        />
      )
    }

    if (resolvedActivePage === 'products') {
      return (
        <ProductsPage products={baseProducts} onCreateProduct={handleCreateProduct} />
      )
    }

    if (resolvedActivePage === 'access') {
      return (
        <AccessPage
          base={currentBase}
          onCreateOrUpdateStoreAccess={handleCreateOrUpdateStoreAccess}
        />
      )
    }

    if (resolvedActivePage === 'central') {
      return (
        <CentralPage
          referenceDate={referenceDate}
          products={baseProducts}
          stores={baseStores}
          units={baseUnits}
          centralRows={centralRows}
          pendingShipmentRequests={pendingShipmentRequests}
          recentCentralMovements={recentCentralMovements}
          onCreateEntry={handleCreateEntry}
          onCompleteShipmentRequest={handleCompleteShipmentRequest}
          onCreateTransfer={handleCreateTransfer}
        />
      )
    }

    if (resolvedActivePage === 'stores') {
      return (
        <StoresPage
          previousDate={previousDate}
          products={baseProducts}
          referenceDate={referenceDate}
          shipmentRequests={inventoryState.shipmentRequests}
          stores={visibleStores}
          units={baseUnits}
          systemState={inventoryState}
          onCloseDay={handleCloseDay}
          onCreateShipmentRequest={handleCreateShipmentRequest}
          isRestrictedView={currentUser.role === USER_ROLES.STORE}
        />
      )
    }

    return (
      <AdjustmentsPage
        adjustmentReasons={ADJUSTMENT_REASONS}
        closings={inventoryState.closings}
        movements={allMovements}
        products={baseProducts}
        referenceDate={referenceDate}
        units={baseUnits}
        onCreateAdjustment={handleCreateAdjustment}
      />
    )
  }

  if (!currentBase || !currentUser) {
    return (
      <div className="app-shell">
        <div className="auth-layout">{renderPage()}</div>
        <GuidedTour
          isOpen={Boolean(currentTourStep && isAuthTourMode)}
          step={currentTourStep}
          stepIndex={tourIndex}
          stepCount={currentTourSteps.length}
          onNext={handleNextTourStep}
          onPrev={handlePreviousTourStep}
          onSkip={handleCloseTour}
        />
      </div>
    )
  }

  const guideMode = getGuideModeForUser(currentUser)

  if (currentUser.role === USER_ROLES.STORE) {
    return (
      <div className="app-shell">
        <StoreWorkspace
          currentBase={currentBase}
          currentUser={currentUser}
          notice={notice}
          onDismiss={() => setNotice(null)}
          onOpenGuide={() => startGuide('store')}
          onSignOut={handleSignOut}
          page={PAGE_META.stores}
          previousDate={previousDate}
          referenceDate={referenceDate}
        >
          {renderPage()}
        </StoreWorkspace>
        <GuidedTour
          isOpen={Boolean(currentTourStep && tourMode === 'store')}
          step={currentTourStep}
          stepIndex={tourIndex}
          stepCount={currentTourSteps.length}
          onNext={handleNextTourStep}
          onPrev={handlePreviousTourStep}
          onSkip={handleCloseTour}
        />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="app-layout">
        <Sidebar
          activePage={resolvedActivePage}
          allowedPages={allowedPages}
          currentBase={currentBase}
          currentUser={currentUser}
          onNavigate={navigate}
          onOpenGuide={() => startGuide(guideMode)}
          onSignOut={handleSignOut}
          previousDate={previousDate}
        />

        <main className="content-shell">
          <Header
            currentBase={currentBase}
            currentUser={currentUser}
            inventoryState={inventoryState}
            notice={notice}
            onDismiss={() => setNotice(null)}
            onOpenGuide={() => startGuide(guideMode)}
            page={page}
            previousDate={previousDate}
            referenceDate={referenceDate}
          />

          <section className="page-content">{renderPage()}</section>
        </main>
      </div>

      <GuidedTour
        isOpen={Boolean(currentTourStep && tourMode === 'owner')}
        step={currentTourStep}
        stepIndex={tourIndex}
        stepCount={currentTourSteps.length}
        onNext={handleNextTourStep}
        onPrev={handlePreviousTourStep}
        onSkip={handleCloseTour}
      />
    </div>
  )
}

export default App
