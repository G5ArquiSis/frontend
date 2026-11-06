// Cliente de la API para las páginas. Toda llamada pasa por acá: el token de Auth0, la
// URL base y el manejo de errores viven en un solo lugar, y cada página solo dice qué
// ruta quiere.
//
//   const api = useApi()
//   const ciclo = await api.get(`/cycles/${id}`)
//   await api.post('/strategy', { span: 30 })
//
//   const { data, error, loading, refresh } = usePolling(() => api.get('/market/book'), 5000)

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

const BASE_URL = import.meta.env.VITE_API_URL

// Error HTTP con el cuerpo de la respuesta. Por ejemplo, un 409 de /negotiations trae
// `body.detail.reason`.
export class ApiError extends Error {
  constructor(status, body) {
    const detail = body?.detail
    const message =
      typeof detail === 'string' ? detail : detail?.message ?? `Error ${status}`
    super(message)
    this.status = status
    this.body = body
  }
}

export function useApi() {
  const { getAccessTokenSilently } = useAuth0()

  return useMemo(() => {
    async function request(method, path, body) {
      const token = await getAccessTokenSilently()
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : null
      if (!response.ok) throw new ApiError(response.status, data)
      return data
    }

    return {
      get: (path) => request('GET', path),
      post: (path, body) => request('POST', path, body),
      put: (path, body) => request('PUT', path, body),
      patch: (path, body) => request('PATCH', path, body),
      delete: (path) => request('DELETE', path),
    }
  }, [getAccessTokenSilently])
}

// Ejecuta `load` al montar y cada `intervalMs` (sin intervalo, solo una vez). Mientras la
// pestaña está oculta no consulta, para no gastar llamadas ni cupo del API Gateway.
//
// `load` puede cambiar en cada render: se usa siempre la última versión, así que no hace
// falta envolverla en useCallback.
export function usePolling(load, intervalMs) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)

  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  const refresh = useCallback(async () => {
    try {
      setData(await loadRef.current())
      setError(null)
      setUpdatedAt(new Date())
    } catch (err) {
      console.error(err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    if (!intervalMs) return undefined

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, intervalMs)
    return () => clearInterval(interval)
  }, [refresh, intervalMs])

  return { data, error, loading, updatedAt, refresh }
}
