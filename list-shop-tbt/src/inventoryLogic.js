import { PRODUCT_TYPE_OPTIONS, TOLERANCE_RULES } from './inventoryData'

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

const integerFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

const PRODUCT_TYPE_MAP = Object.fromEntries(
  PRODUCT_TYPE_OPTIONS.map((option) => [option.value, option]),
)

function pad(value) {
  return String(value).padStart(2, '0')
}

function createRuntimeId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function compareMovementsAscending(left, right) {
  if (left.date !== right.date) {
    return left.date.localeCompare(right.date)
  }

  return (left.createdAt ?? '').localeCompare(right.createdAt ?? '')
}

function compareMovementsDescending(left, right) {
  if (left.date !== right.date) {
    return right.date.localeCompare(left.date)
  }

  return (right.createdAt ?? '').localeCompare(left.createdAt ?? '')
}

function trimAndCollapse(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

function createEmptySnapshot(units, products) {
  return Object.fromEntries(
    units.map((unit) => [
      unit.id,
      Object.fromEntries(products.map((product) => [product.id, 0])),
    ]),
  )
}

function getSeverityFromRate(rate) {
  if (rate > TOLERANCE_RULES.alert) {
    return 'observation'
  }

  if (rate > TOLERANCE_RULES.normal) {
    return 'alert'
  }

  return 'normal'
}

export function createEmptySystemState() {
  return {
    movements: [],
    closings: [],
    shipmentRequests: [],
  }
}

export function normalizeSystemState(state) {
  return {
    ...createEmptySystemState(),
    ...(state ?? {}),
    movements: Array.isArray(state?.movements) ? state.movements : [],
    closings: Array.isArray(state?.closings) ? state.closings : [],
    shipmentRequests: Array.isArray(state?.shipmentRequests)
      ? state.shipmentRequests
      : [],
  }
}

export function getTodayIso(referenceDate = new Date()) {
  const date = new Date(referenceDate)

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-')
}

export function shiftIsoDate(isoDate, offsetDays) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  date.setDate(date.getDate() + offsetDays)

  return getTodayIso(date)
}

export function formatDateLabel(isoDate) {
  if (!isoDate) {
    return '--/--/----'
  }

  const [year, month, day] = isoDate.split('-')

  return `${day}/${month}/${year}`
}

export function normalizeProductName(value) {
  return trimAndCollapse(value)
}

export function getProductTypeMeta(type) {
  return PRODUCT_TYPE_MAP[type] ?? PRODUCT_TYPE_OPTIONS[0]
}

export function getProductTypeLabel(type) {
  return getProductTypeMeta(type).label
}

export function createProductSlug(name) {
  return normalizeProductName(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function buildProduct(payload, idFactory = createRuntimeId) {
  const name = normalizeProductName(payload.name)
  const slug = createProductSlug(name)
  const catalogCategory = normalizeProductName(payload.catalogCategory)

  return {
    id: slug || idFactory('product'),
    name,
    unitType: payload.unitType,
    catalogCategory,
    createdAt: new Date().toISOString(),
  }
}

export function validateProductPayload(products, payload) {
  const name = normalizeProductName(payload.name)
  const unitType = payload.unitType

  if (!name) {
    return { ok: false, message: 'Informe o nome do produto.' }
  }

  if (!PRODUCT_TYPE_MAP[unitType]) {
    return { ok: false, message: 'Escolha o tipo do produto.' }
  }

  if (
    products.some(
      (product) => product.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    return { ok: false, message: 'Ja existe um produto com esse nome.' }
  }

  return {
    ok: true,
    normalized: {
      name,
      unitType,
      catalogCategory: normalizeProductName(payload.catalogCategory),
    },
  }
}

export function getProductById(products, productId) {
  return products.find((product) => product.id === productId)
}

export function getUnitById(units, unitId) {
  return units.find((unit) => unit.id === unitId)
}

export function getStoreUnits(units) {
  return units.filter((unit) => unit.type === 'store')
}

export function parseUserQuantity(rawValue, unitType) {
  const normalizedValue = String(rawValue ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.')

  if (!normalizedValue) {
    return 0
  }

  const numericValue = Number(normalizedValue)

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0
  }

  if (getProductTypeMeta(unitType).allowDecimals) {
    return Number(numericValue.toFixed(2))
  }

  return Math.round(numericValue)
}

export function toEditableQuantity(quantity, unitType) {
  if (getProductTypeMeta(unitType).allowDecimals) {
    return numberFormatter.format(quantity)
  }

  return integerFormatter.format(Math.round(quantity))
}

export function formatFriendlyQuantity(quantity, unitType) {
  const prefix = quantity < 0 ? '-' : ''
  const absolute = Math.abs(quantity)
  const option = getProductTypeMeta(unitType)

  if (option.allowDecimals) {
    return `${prefix}${numberFormatter.format(absolute)} ${option.shortLabel}`
  }

  return `${prefix}${integerFormatter.format(Math.round(absolute))} ${option.shortLabel}`
}

export function formatPercent(rate) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(rate)
}

export function buildEntryMovement(
  payload,
  idFactory = createRuntimeId,
  createdAt,
) {
  return {
    id: idFactory('movement'),
    type: 'entry',
    date: payload.date,
    productId: payload.productId,
    quantity: payload.quantity,
    unitId: payload.unitId ?? 'central',
    partner: payload.partner?.trim() || 'Fornecedor avulso',
    note: payload.note?.trim() || '',
    createdAt: createdAt ?? new Date().toISOString(),
  }
}

export function buildTransferMovement(
  payload,
  idFactory = createRuntimeId,
  createdAt,
) {
  return {
    id: idFactory('movement'),
    type: 'transfer',
    date: payload.date,
    productId: payload.productId,
    quantity: payload.quantity,
    fromUnitId: payload.fromUnitId ?? 'central',
    toUnitId: payload.destinationId,
    note: payload.note?.trim() || '',
    createdAt: createdAt ?? new Date().toISOString(),
  }
}

export function buildShipmentRequest(
  payload,
  idFactory = createRuntimeId,
  createdAt,
) {
  return {
    id: idFactory('request'),
    unitId: payload.unitId,
    requestDate: payload.requestDate,
    deliveryDate: payload.deliveryDate,
    items: payload.items,
    note: payload.note?.trim() || '',
    status: 'pending',
    fulfilledAt: null,
    createdAt: createdAt ?? new Date().toISOString(),
  }
}

export function buildAdjustmentMovement(
  payload,
  idFactory = createRuntimeId,
  createdAt,
) {
  return {
    id: idFactory('movement'),
    type: 'adjustment',
    date: payload.date,
    productId: payload.productId,
    quantity: payload.quantity,
    unitId: payload.unitId,
    reason: payload.reason?.trim() || 'Correcao manual',
    note: payload.note?.trim() || '',
    source: payload.source ?? 'manual',
    closingId: payload.closingId ?? null,
    closingDate: payload.closingDate ?? null,
    createdAt: createdAt ?? new Date().toISOString(),
  }
}

export function getStockSnapshot(state, units, products, options = {}) {
  const { upToDate, excludeClosingUnitId, excludeClosingDate } = options
  const snapshot = createEmptySnapshot(units, products)
  const movements = [...state.movements].sort(compareMovementsAscending)

  movements.forEach((movement) => {
    if (upToDate && movement.date > upToDate) {
      return
    }

    if (
      movement.type === 'adjustment' &&
      movement.source === 'closing' &&
      movement.unitId === excludeClosingUnitId &&
      movement.closingDate === excludeClosingDate
    ) {
      return
    }

    if (movement.type === 'entry') {
      if (snapshot[movement.unitId]?.[movement.productId] === undefined) {
        return
      }

      snapshot[movement.unitId][movement.productId] += movement.quantity
      return
    }

    if (movement.type === 'transfer') {
      if (
        snapshot[movement.fromUnitId]?.[movement.productId] === undefined ||
        snapshot[movement.toUnitId]?.[movement.productId] === undefined
      ) {
        return
      }

      snapshot[movement.fromUnitId][movement.productId] -= movement.quantity
      snapshot[movement.toUnitId][movement.productId] += movement.quantity
      return
    }

    if (snapshot[movement.unitId]?.[movement.productId] === undefined) {
      return
    }

    snapshot[movement.unitId][movement.productId] += movement.quantity
  })

  return snapshot
}

export function getUnitStockAtDate(
  state,
  units,
  products,
  unitId,
  date,
  options = {},
) {
  const snapshot = getStockSnapshot(state, units, products, {
    upToDate: date,
    excludeClosingDate: options.excludeClosingDate,
    excludeClosingUnitId: options.excludeClosingUnitId,
  })

  return (
    snapshot[unitId] ??
    Object.fromEntries(products.map((product) => [product.id, 0]))
  )
}

export function findClosing(state, unitId, date) {
  return state.closings.find(
    (closing) => closing.unitId === unitId && closing.date === date,
  )
}

export function getLatestClosingDate(state, unitId) {
  const dates = state.closings
    .filter((closing) => closing.unitId === unitId)
    .map((closing) => closing.date)
    .sort()

  return dates.at(-1) ?? null
}

export function isStoreLocked(state, units, unitId, date) {
  const unit = getUnitById(units, unitId)

  if (!unit || unit.type !== 'store') {
    return false
  }

  const latestClosingDate = getLatestClosingDate(state, unitId)

  return Boolean(latestClosingDate && date <= latestClosingDate)
}

export function createClosingDraft(
  state,
  units,
  products,
  unitId,
  date,
  countsByProductId,
) {
  const expectedStock = getUnitStockAtDate(state, units, products, unitId, date, {
    excludeClosingDate: date,
    excludeClosingUnitId: unitId,
  })

  const items = products.map((product) => {
    const expected = expectedStock[product.id] ?? 0
    const actual = countsByProductId[product.id] ?? 0
    const difference = actual - expected
    const deviationRate =
      expected > 0 ? Math.abs(difference) / expected : actual > 0 ? 1 : 0
    const severity = getSeverityFromRate(deviationRate)

    return {
      productId: product.id,
      expected,
      actual,
      difference,
      deviationRate,
      severity,
    }
  })

  const totalAbsoluteDifference = items.reduce(
    (sum, item) => sum + Math.abs(item.difference),
    0,
  )
  const changedItemsCount = items.filter((item) => item.difference !== 0).length
  const highestSeverity = items.some((item) => item.severity === 'observation')
    ? 'observation'
    : items.some((item) => item.severity === 'alert')
      ? 'alert'
      : 'normal'

  return {
    items,
    totalAbsoluteDifference,
    changedItemsCount,
    highestSeverity,
    requiresObservation: highestSeverity === 'observation',
  }
}

export function appendClosingToState(
  state,
  units,
  products,
  payload,
  idFactory = createRuntimeId,
  createdAt,
) {
  const normalizedState = normalizeSystemState(state)
  const draft = createClosingDraft(
    normalizedState,
    units,
    products,
    payload.unitId,
    payload.date,
    payload.counts,
  )
  const closingId = idFactory('closing')
  const entryTimestamp = createdAt ?? new Date().toISOString()
  const movementIds = []

  const closingMovements = draft.items.reduce((movements, item) => {
    if (item.difference === 0) {
      return movements
    }

    const movement = buildAdjustmentMovement(
      {
        unitId: payload.unitId,
        date: payload.date,
        productId: item.productId,
        quantity: item.difference,
        reason: 'Fechamento diario',
        note: payload.note,
        source: 'closing',
        closingDate: payload.date,
        closingId,
      },
      idFactory,
      entryTimestamp,
    )

    movementIds.push(movement.id)
    movements.push(movement)
    return movements
  }, [])

  const closingRecord = {
    id: closingId,
    unitId: payload.unitId,
    date: payload.date,
    note: payload.note?.trim() || '',
    items: draft.items,
    totalAbsoluteDifference: draft.totalAbsoluteDifference,
    changedItemsCount: draft.changedItemsCount,
    highestSeverity: draft.highestSeverity,
    createdMovementIds: movementIds,
    createdAt: entryTimestamp,
  }

  return {
    ...normalizedState,
    movements: [...normalizedState.movements, ...closingMovements],
    closings: [...normalizedState.closings, closingRecord],
  }
}

export function getPendingClosings(state, units, date) {
  return getStoreUnits(units)
    .filter((unit) => !findClosing(state, unit.id, date))
    .map((unit) => ({
      ...unit,
      latestClosingDate: getLatestClosingDate(state, unit.id),
    }))
}

export function getShipmentRequests(state) {
  return normalizeSystemState(state).shipmentRequests
}

export function getPendingShipmentRequests(state) {
  return getShipmentRequests(state)
    .filter((request) => request.status === 'pending')
    .sort((left, right) => {
      if (left.deliveryDate !== right.deliveryDate) {
        return left.deliveryDate.localeCompare(right.deliveryDate)
      }

      return (right.createdAt ?? '').localeCompare(left.createdAt ?? '')
    })
}

export function getRecentAlerts(state, units, products, limit = 6) {
  return state.closings
    .flatMap((closing) =>
      closing.items
        .filter((item) => item.severity !== 'normal')
        .map((item) => ({
          closingId: closing.id,
          date: closing.date,
          unitId: closing.unitId,
          unitName: getUnitById(units, closing.unitId)?.name ?? closing.unitId,
          productId: item.productId,
          productName: getProductById(products, item.productId)?.name ?? item.productId,
          severity: item.severity,
          deviationRate: item.deviationRate,
          difference: item.difference,
        })),
    )
    .sort((left, right) => {
      if (left.date !== right.date) {
        return right.date.localeCompare(left.date)
      }

      if (left.severity !== right.severity) {
        return left.severity === 'observation' ? -1 : 1
      }

      return Math.abs(right.difference) - Math.abs(left.difference)
    })
    .slice(0, limit)
}

export function getMovementTimeline(state, limit = 12) {
  return [...state.movements].sort(compareMovementsDescending).slice(0, limit)
}
