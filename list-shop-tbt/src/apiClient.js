const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')
const TOKEN_KEY = 'tbt-stock-suite:api-token:v1'
const ADMIN_TOKEN_KEY = 'tbt-stock-suite:admin-token:v1'

function getToken(key = TOKEN_KEY) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function setToken(key, token) {
  try {
    if (token) {
      window.localStorage.setItem(key, token)
    } else {
      window.localStorage.removeItem(key)
    }
  } catch {
    return
  }
}

async function request(path, options = {}) {
  const token = options.admin ? getToken(ADMIN_TOKEN_KEY) : getToken()
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || data.error || data.detail || 'Falha ao conversar com a API.')
  }

  return data
}

export function clearSessionToken() {
  setToken(TOKEN_KEY, null)
}

export async function fetchPublicState() {
  return request('/api/public/state')
}

export async function loginWithApi(payload) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setToken(TOKEN_KEY, data.token)
  return data
}

export async function createBaseWithApi(state) {
  const data = await request('/api/auth/create-base', {
    method: 'POST',
    body: JSON.stringify({ state }),
  })
  setToken(TOKEN_KEY, data.token)
  return data
}

export async function saveStateWithApi(state) {
  return request('/api/state', {
    method: 'PUT',
    body: JSON.stringify({ state }),
  })
}

export async function saveStateAsAdminWithApi(state) {
  return request('/api/state', {
    method: 'PUT',
    admin: true,
    body: JSON.stringify({ state }),
  })
}

export async function loginAdminWithApi(payload) {
  const data = await request('/api/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setToken(ADMIN_TOKEN_KEY, data.token)
  return data
}

export async function fetchAdminReports() {
  return request('/api/admin/reports', { admin: true })
}

export async function impersonateWithApi(baseId, userId) {
  const data = await request('/api/admin/impersonate', {
    method: 'POST',
    admin: true,
    body: JSON.stringify({ baseId, userId }),
  })
  setToken(TOKEN_KEY, data.token)
  return data
}
