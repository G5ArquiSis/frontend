import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useApi } from '../api'

// RF05: duplicados, descartados y NACK, incluidos los de otras ciudades. Cada registro
// muestra la ciudad que el mensaje dice ser (cityId) y el user_id AMQP con que llegó: si no
// coinciden, es un IDENTITY_MISMATCH. Esta pantalla es la evidencia de las anomalías 1 y 2.

const CATEGORIES = [
  { value: 'duplicate', label: 'Duplicados' },
  { value: 'discarded', label: 'Descartados' },
  { value: 'nack', label: 'NACK' },
]

const CATEGORY_LABEL = { duplicate: 'Duplicado', discarded: 'Descartado', nack: 'NACK' }

const EMPTY_FILTERS = { category: '', cityId: '', since: '', until: '' }

function Messages() {
  const { isAuthenticated } = useAuth0()
  const api = useApi()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [reloads, setReloads] = useState(0)
  // Última respuesta y para qué consulta fue: mientras no coincide con la actual, está cargando.
  const [result, setResult] = useState({ key: null, data: null, error: '' })

  const query = buildQuery(filters, page)
  const requestKey = `${query}#${reloads}`

  useEffect(() => {
    if (!isAuthenticated) return undefined
    let cancelled = false
    api
      .get(`/message-log?${query}`)
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, data, error: '' })
      })
      .catch((err) => {
        if (!cancelled) {
          setResult((current) => ({
            key: requestKey,
            data: current.data,
            error: err.message || 'No se pudo cargar el registro de mensajes',
          }))
        }
      })
    return () => {
      cancelled = true
    }
  }, [api, isAuthenticated, query, requestKey])

  const loading = isAuthenticated && result.key !== requestKey
  const { data, error } = result

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const messages = data?.items ?? []
  const counts = data?.counts ?? {}
  const pages = Math.max(data?.pages ?? 1, 1)
  const total = data?.total ?? 0

  return (
    <div className="messages">
      <div className="page-header">
        <div>
          <span className="eyebrow">RF05 · Mensajes</span>
          <h2 className="page-title">Registro de mensajes</h2>
          <p className="page-description">
            Duplicados, descartados y respondidos con NACK, también los de otras ciudades. Si la
            ciudad del mensaje no corresponde a su user_id, es un IDENTITY_MISMATCH.
          </p>
        </div>
        <div className="page-meta">
          <button className="secondary-button" type="button" onClick={() => setReloads((n) => n + 1)}>
            Actualizar
          </button>
        </div>
      </div>

      <div className="message-counters">
        <button
          type="button"
          className={`message-counter${filters.category === '' ? ' active' : ''}`}
          onClick={() => updateFilter('category', '')}
        >
          <span>Todos</span>
          <strong>{CATEGORIES.reduce((sum, { value }) => sum + (counts[value] ?? 0), 0)}</strong>
        </button>
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`message-counter${filters.category === value ? ' active' : ''}`}
            onClick={() => updateFilter('category', value)}
          >
            <span>{label}</span>
            <strong>{counts[value] ?? 0}</strong>
          </button>
        ))}
      </div>

      <div className="message-filters">
        <label>
          Ciudad emisora
          <input
            type="text"
            value={filters.cityId}
            placeholder="HGW, MET o central"
            maxLength={16}
            onChange={(event) => updateFilter('cityId', normalizeCity(event.target.value))}
          />
        </label>
        <label>
          Desde
          <input
            type="datetime-local"
            value={filters.since}
            onChange={(event) => updateFilter('since', event.target.value)}
          />
        </label>
        <label>
          Hasta
          <input
            type="datetime-local"
            value={filters.until}
            onChange={(event) => updateFilter('until', event.target.value)}
          />
        </label>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setFilters(EMPTY_FILTERS)
            setPage(1)
          }}
        >
          Limpiar filtros
        </button>
        <span>
          {total} registro{total === 1 ? '' : 's'}
        </span>
      </div>

      {!isAuthenticated && (
        <div className="message-state">Debes iniciar sesión para consultar el registro.</div>
      )}

      {loading && <div className="message-state">Cargando mensajes...</div>}

      {!loading && error && <div className="message-state message-error">{error}</div>}

      {!loading && !error && isAuthenticated && messages.length === 0 && (
        <div className="message-state">No hay mensajes registrados con estos filtros.</div>
      )}

      {!loading && !error && messages.length > 0 && (
        <>
          <div className="message-table">
            <div className="message-header">
              <span>Tipo</span>
              <span>Mensaje</span>
              <span>Emisor</span>
              <span>Motivo</span>
              <span>Fecha</span>
            </div>

            {messages.map((message) => (
              <MessageRow key={message.id} message={message} />
            ))}
          </div>

          <div className="message-pagination">
            <button onClick={() => setPage((current) => current - 1)} disabled={page <= 1}>
              ← Anterior
            </button>
            <span>
              Página {page} de {pages}
            </span>
            <button onClick={() => setPage((current) => current + 1)} disabled={page >= pages}>
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function MessageRow({ message }) {
  const mismatch = identityMismatch(message)
  return (
    <details className="message-row-details">
      <summary className="message-row">
        <span>{CATEGORY_LABEL[message.category] || message.category}</span>
        <span>
          <strong>{message.messageType || '—'}</strong>
          {message.cycleId && <small className="mono">{message.cycleId}</small>}
        </span>
        <span>
          {message.cityId || '—'}
          {message.userId && (
            <small className={mismatch ? 'message-mismatch mono' : 'mono'}>
              user_id {message.userId}
              {mismatch && ' · no corresponde'}
            </small>
          )}
        </span>
        <span>{message.reason || '—'}</span>
        <span>{formatDate(message.receivedAt)}</span>
      </summary>
      <div className="message-raw">
        <div className="message-raw-ids mono">
          <span>idpk: {message.idpk || '—'}</span>
          <span>msgId: {message.msgId || '—'}</span>
        </div>
        <pre>{prettyRaw(message.rawContent)}</pre>
      </div>
    </details>
  )
}

function buildQuery(filters, page) {
  const params = new URLSearchParams({ page: String(page), limit: '25' })
  if (filters.category) params.set('category', filters.category)
  if (filters.cityId.trim()) params.set('cityId', filters.cityId.trim())
  // datetime-local no trae zona: se interpreta como hora local y se manda en ISO (UTC).
  if (filters.since) params.set('since', new Date(filters.since).toISOString())
  if (filters.until) params.set('until', new Date(filters.until).toISOString())
  return params.toString()
}

// Los códigos de ciudad van en mayúsculas; la central se registra como "central".
function normalizeCity(value) {
  const upper = value.toUpperCase()
  return upper === 'CENTRAL' ? 'central' : upper
}

// Una ciudad publica con user_id `city.{cityId}` y la central con `central`.
function identityMismatch({ cityId, userId }) {
  if (!cityId || !userId) return false
  return cityId === 'central' ? userId !== 'central' : userId !== `city.${cityId}`
}

function prettyRaw(raw) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium' })
}

Messages.meta = { id: 'messages', label: 'Mensajes', order: 40 }

export default Messages
