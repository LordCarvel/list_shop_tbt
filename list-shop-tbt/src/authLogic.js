import {
  DEFAULT_PAGE_BY_ROLE,
  PAGE_ORDER_BY_ROLE,
  ROLE_META,
  USER_ROLES,
} from './inventoryData'
import { createEmptySystemState } from './inventoryLogic'

function createRuntimeId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function trimAndCollapse(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

export function normalizeBaseCode(value) {
  return trimAndCollapse(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function normalizeUsername(value) {
  return trimAndCollapse(value)
    .toLowerCase()
    .replace(/\s+/g, '')
}

export function getShortName(name) {
  const parts = trimAndCollapse(name).split(' ').filter(Boolean)

  if (!parts.length) {
    return 'Loja'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 12)
  }

  return `${parts[0]} ${parts[1].slice(0, 1)}.`.slice(0, 12)
}

export function createStoreUnit(name) {
  const trimmedName = trimAndCollapse(name)

  return {
    id: createRuntimeId('store'),
    name: trimmedName,
    shortName: getShortName(trimmedName),
    type: 'store',
  }
}

export function createBaseUnits() {
  return [
    {
      id: 'central',
      name: 'Estoque Central',
      shortName: 'Central',
      type: 'central',
    },
  ]
}

export function buildOwnerUser(payload) {
  return {
    id: createRuntimeId('user'),
    role: USER_ROLES.OWNER,
    name: trimAndCollapse(payload.ownerName),
    username: normalizeUsername(payload.ownerUsername),
    password: String(payload.ownerPassword ?? ''),
    createdAt: new Date().toISOString(),
  }
}

export function buildStoreUser(payload) {
  return {
    id: createRuntimeId('user'),
    role: USER_ROLES.STORE,
    unitId: payload.unitId,
    name: trimAndCollapse(payload.responsibleName),
    username: normalizeUsername(payload.username),
    password: String(payload.password ?? ''),
    createdAt: new Date().toISOString(),
  }
}

export function createBase(payload) {
  const ownerUser = buildOwnerUser(payload)

  return {
    id: createRuntimeId('base'),
    name: trimAndCollapse(payload.baseName),
    code: normalizeBaseCode(payload.baseCode),
    units: createBaseUnits(),
    users: [ownerUser],
    products: [],
    inventory: createEmptySystemState(),
    createdAt: new Date().toISOString(),
  }
}

export function getAllowedPages(user) {
  return PAGE_ORDER_BY_ROLE[user.role] ?? []
}

export function canAccessPage(user, pageId) {
  return getAllowedPages(user).includes(pageId)
}

export function getDefaultPageForUser(user) {
  return DEFAULT_PAGE_BY_ROLE[user.role] ?? 'dashboard'
}

export function getRoleLabel(role) {
  return ROLE_META[role]?.label ?? role
}

export function getStoreUserForUnit(base, unitId) {
  return base.users.find(
    (user) => user.role === USER_ROLES.STORE && user.unitId === unitId,
  )
}

export function getVisibleStoresForUser(base, user) {
  const stores = base.units.filter((unit) => unit.type === 'store')

  if (user.role === USER_ROLES.OWNER) {
    return stores
  }

  return stores.filter((unit) => unit.id === user.unitId)
}

export function validateBasePayload(appState, payload) {
  if (!trimAndCollapse(payload.baseName)) {
    return { ok: false, message: 'Informe o nome da base.' }
  }

  const baseCode = normalizeBaseCode(payload.baseCode)

  if (!baseCode) {
    return { ok: false, message: 'Informe um codigo de base valido.' }
  }

  if (appState.bases.some((base) => base.code === baseCode)) {
    return { ok: false, message: 'Esse codigo de base ja esta em uso.' }
  }

  if (!trimAndCollapse(payload.ownerName)) {
    return { ok: false, message: 'Informe o nome do dono.' }
  }

  const ownerUsername = normalizeUsername(payload.ownerUsername)

  if (!ownerUsername) {
    return { ok: false, message: 'Informe um usuario valido para o dono.' }
  }

  if (!String(payload.ownerPassword ?? '').trim()) {
    return { ok: false, message: 'Informe uma senha para o dono.' }
  }

  return {
    ok: true,
    normalized: {
      ...payload,
      baseCode,
      ownerUsername,
    },
  }
}

export function validateStoreAccessPayload(base, payload) {
  const storeName = trimAndCollapse(payload.storeName)
  const responsibleName = trimAndCollapse(payload.responsibleName)
  const username = normalizeUsername(payload.username)
  const password = String(payload.password ?? '').trim()

  if (!storeName) {
    return { ok: false, message: 'Informe o nome da pizzaria.' }
  }

  if (!responsibleName) {
    return { ok: false, message: 'Informe o nome do responsavel.' }
  }

  if (!username) {
    return { ok: false, message: 'Informe um usuario valido para a pizzaria.' }
  }

  if (!password) {
    return { ok: false, message: 'Informe uma senha para a pizzaria.' }
  }

  const duplicateUnit = base.units.find(
    (unit) =>
      unit.type === 'store' &&
      unit.name.toLowerCase() === storeName.toLowerCase() &&
      unit.id !== payload.unitId,
  )

  if (duplicateUnit) {
    return { ok: false, message: 'Ja existe outra pizzaria com esse nome.' }
  }

  const duplicateUser = base.users.find(
    (user) =>
      user.username === username &&
      (payload.userId ? user.id !== payload.userId : true),
  )

  if (duplicateUser) {
    return { ok: false, message: 'Esse usuario ja esta em uso na base.' }
  }

  return {
    ok: true,
    normalized: {
      ...payload,
      storeName,
      responsibleName,
      username,
      password,
    },
  }
}

export function upsertStoreAccess(base, payload) {
  const existingUnit = payload.unitId
    ? base.units.find((unit) => unit.id === payload.unitId)
    : null
  const unit = existingUnit ?? createStoreUnit(payload.storeName)
  const nextUnits = existingUnit
    ? base.units.map((currentUnit) =>
        currentUnit.id === existingUnit.id
          ? {
              ...currentUnit,
              name: payload.storeName,
              shortName: getShortName(payload.storeName),
            }
          : currentUnit,
      )
    : [...base.units, unit]

  const existingUser = payload.userId
    ? base.users.find((user) => user.id === payload.userId)
    : getStoreUserForUnit(base, unit.id)

  const nextUser = existingUser
    ? {
        ...existingUser,
        unitId: unit.id,
        name: payload.responsibleName,
        username: payload.username,
        password: payload.password,
      }
    : buildStoreUser({
        unitId: unit.id,
        responsibleName: payload.responsibleName,
        username: payload.username,
        password: payload.password,
      })

  const nextUsers = existingUser
    ? base.users.map((user) => (user.id === existingUser.id ? nextUser : user))
    : [...base.users, nextUser]

  return {
    ...base,
    units: nextUnits,
    users: nextUsers,
  }
}

export function authenticate(appState, payload) {
  const baseCode = normalizeBaseCode(payload.baseCode)
  const username = normalizeUsername(payload.username)
  const password = String(payload.password ?? '')

  const base = appState.bases.find((item) => item.code === baseCode)

  if (!base) {
    return { ok: false, message: 'Base nao encontrada.' }
  }

  const user = base.users.find(
    (item) => item.username === username && item.password === password,
  )

  if (!user) {
    return { ok: false, message: 'Usuario ou senha invalidos para essa base.' }
  }

  return {
    ok: true,
    base,
    user,
  }
}

export function countConfiguredStores(base) {
  return base.units.filter((unit) => unit.type === 'store').length
}

export function countStoreUsers(base) {
  return base.users.filter((user) => user.role === USER_ROLES.STORE).length
}

export function countConfiguredProducts(base) {
  return base.products.length
}
