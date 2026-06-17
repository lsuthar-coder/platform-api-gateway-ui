import axios from 'axios'
import { store } from '../store'
import { authActions } from '../store'

const BASE = import.meta.env.VITE_API_URL || 'https://api.lsuthar.in'

const api = axios.create({ baseURL: BASE, withCredentials: true })

// ── Request interceptor — attach token ─────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gw_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor — auto refresh on 401 ────────────────────────────
let refreshing = null // singleton promise — prevents multiple refresh calls

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    // Only handle 401, only once per request, skip the refresh endpoint itself
    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true

      // If another request already triggered a refresh, wait for it
      if (!refreshing) {
        refreshing = axios
          .post(`${BASE}/auth/refresh`, {}, { withCredentials: true })
          .then(({ data }) => {
            localStorage.setItem('gw_token', data.accessToken)
            // Update user in store without re-fetching (token only)
            return data.accessToken
          })
          .catch(() => {
            // Refresh failed — force logout
            store.dispatch(authActions.logout())
            window.location.href = '/login'
            return null
          })
          .finally(() => { refreshing = null })
      }

      const newToken = await refreshing
      if (!newToken) return Promise.reject(err)

      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    }

    return Promise.reject(err)
  }
)

// ── Auth ───────────────────────────────────────────────────────────────────
export const login  = (email, password) => api.post('/auth/login', { email, password })
export const getMe  = () => api.get('/auth/me')
export const logout = () => api.post('/auth/logout')

// ── Gateway Health ─────────────────────────────────────────────────────────
export const getHealth         = () => api.get('/health')
export const getPlatformHealth = () => api.get('/admin/platform-health')

// ── Admin — User Management ────────────────────────────────────────────────
export const getUsers       = ()             => api.get('/auth/admin/users')
export const updateRole     = (userId, role) => api.put(`/auth/admin/users/${userId}/role`, { role })
export const revokeSessions = (userId)       => api.post(`/auth/admin/users/${userId}/revoke`)

// ── Admin — Routes Management ──────────────────────────────────────────────
export const getRoutes   = ()         => api.get('/admin/routes')
export const createRoute = (data)     => api.post('/admin/routes', data)
export const updateRoute = (id, data) => api.put(`/admin/routes/${id}`, data)
export const deleteRoute = (id)       => api.delete(`/admin/routes/${id}`)

// ── Admin — Circuit Breaker ────────────────────────────────────────────────
// GET  /admin/circuit               all circuit states
// POST /admin/circuit/:route/reset  reset to CLOSED (strip leading slash from route)
export const getCircuit      = ()      => api.get('/admin/circuit')
export const resetCircuit    = (route) => api.post(`/admin/circuit/${encodeURIComponent(route.replace(/^\//, ''))}/reset`)

// ── Admin — Metrics ────────────────────────────────────────────────────────
export const getMetrics = () => api.get('/admin/metrics')

// ── Admin — Workers ────────────────────────────────────────────────────────
export const getWorkers = () => api.get('/admin/workers')

// ── Admin — Public Routes ──────────────────────────────────────────────────
export const getPublicRoutes   = ()     => api.get('/admin/public-routes')
export const createPublicRoute = (data) => api.post('/admin/public-routes', data)
export const updatePublicRoute = (id, data) => api.put(`/admin/public-routes/${id}`, data)
export const deletePublicRoute = (id)   => api.delete(`/admin/public-routes/${id}`)

export default api
