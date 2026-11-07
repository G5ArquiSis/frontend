import { useCallback, useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useApi } from '../api'
import { formatDate } from '../format'

const CATEGORY_MAP = {
  duplicate: { label: 'Duplicado', tone: 'warning' },
  discarded: { label: 'Descartado', tone: 'danger' },
  nack: { label: 'NACK', tone: 'danger' },
}

function Badge({ tone = 'neutral', children }) {
  return <span className={`status-badge status-${tone}`}>{children}</span>
}

function CategoryBadge({ category }) {
  const conf = CATEGORY_MAP[category] ?? { label: category || '—', tone: 'neutral' }
  return <Badge tone={conf.tone}>{conf.label}</Badge>
}

function PayloadModal({ message, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!message) return null

  let formatted = message.rawContent
  try {
    const parsed = JSON.parse(message.rawContent)
    formatted = JSON.stringify(parsed, null, 2)
  } catch {
    // Si no es JSON válido, se muestra el texto crudo tal cual
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatted)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('No se pudo copiar el contenido:', err)
    }
  }

  return (
    <div className="payload-modal-backdrop" onClick={onClose}>
      <div className="payload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payload-modal-header">
          <div>
            <strong>Detalle del mensaje crudo #{message.id}</strong>
            <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
              {message.messageType || 'Tipo desconocido'} · {formatDate(message.receivedAt)}
            </div>
          </div>
          <button className="secondary-button" onClick={onClose}>
            ✕ Cerrar
          </button>
        </div>

        <div style={{ padding: '12px 18px 0', display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: '13px' }}>
          <div>
            <span className="muted">Categoría: </span>
            <CategoryBadge category={message.category} />
          </div>
          {message.senderCity && (
            <div>
              <span className="muted">Ciudad: </span>
              <strong>{message.senderCity}</strong>
            </div>
          )}
          {message.senderUserId && (
            <div>
              <span className="muted">Usuario AMQP: </span>
              <code style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>{message.senderUserId}</code>
            </div>
          )}
          {message.idpk && (
            <div>
              <span className="muted">idpk: </span>
              <code style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>{message.idpk}</code>
            </div>
          )}
          {message.reason && (
            <div style={{ width: '100%', marginTop: '4px' }}>
              <span className="muted">Motivo: </span>
              <span style={{ color: message.reason.includes('IDENTITY_MISMATCH') ? 'var(--danger-text)' : 'inherit' }}>
                {message.reason}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 18px', marginTop: '8px' }}>
          <button className="secondary-button" onClick={handleCopy} style={{ fontSize: '12px', minHeight: '28px' }}>
            {copied ? '✓ Copiado' : 'Copiar JSON'}
          </button>
        </div>

        <div className="payload-modal-body">
          <pre style={{ margin: 0 }}>{formatted}</pre>
        </div>
      </div>
    </div>
  )
}

function Messages() {
  const { isAuthenticated } = useAuth0()
  const api = useApi()

  const [messages, setMessages] = useState([])
  const [counts, setCounts] = useState({ total: 0, duplicate: 0, discarded: 0, nack: 0 })
  const [category, setCategory] = useState('')
  const [cityId, setCityId] = useState('')
  const [messageType, setMessageType] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMessage, setSelectedMessage] = useState(null)

  const loadMessages = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      })

      if (category) params.set('category', category)
      if (cityId.trim()) params.set('city_id', cityId.trim().toUpperCase())
      if (messageType.trim()) params.set('message_type', messageType.trim())

      const data = await api.get(`/message-log?${params.toString()}`)

      setMessages(data.items ?? [])
      setPages(data.pages ?? 1)
      setTotal(data.total ?? 0)
      if (data.counts) {
        setCounts(data.counts)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al cargar los mensajes')
    } finally {
      setLoading(false)
    }
  }, [api, isAuthenticated, category, cityId, messageType, page])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const handleResetFilters = () => {
    setCategory('')
    setCityId('')
    setMessageType('')
    setPage(1)
  }

  return (
    <div className="messages" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <span className="eyebrow">RF05 · Mensajería</span>
        <h2>Registro de mensajes</h2>
        <p className="muted">
          Auditoría de mensajes duplicados, descartados y rechazados con NACK (incluyendo verificación de identidad y tipos retirados).
        </p>
      </div>

      {/* Contadores por categoría (RF05) */}
      <div className="card detail-grid">
        <div className="metric-card">
          <span>Total en filtro</span>
          <strong>{total}</strong>
          <span className="muted">Registros encontrados</span>
        </div>
        <div className="metric-card">
          <span>Duplicados</span>
          <strong style={{ color: 'var(--warning-text)' }}>{counts.duplicate}</strong>
          <span className="muted">Anomalía 1: idpk ya aplicado</span>
        </div>
        <div className="metric-card">
          <span>Descartados</span>
          <strong style={{ color: 'var(--danger-text)' }}>{counts.discarded}</strong>
          <span className="muted">Envelope inválido / tipo retirado</span>
        </div>
        <div className="metric-card">
          <span>NACKs emitidos</span>
          <strong style={{ color: 'var(--danger-text)' }}>{counts.nack}</strong>
          <span className="muted">Anomalía 2: IDENTITY_MISMATCH</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card filter-row" style={{ padding: '12px 16px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--muted)' }}>
          Categoría
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Todas</option>
            <option value="duplicate">Duplicados</option>
            <option value="discarded">Descartados</option>
            <option value="nack">NACK</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--muted)' }}>
          Ciudad emisora
          <input
            type="text"
            placeholder="Ej: COR, HGW, MET"
            value={cityId}
            onChange={(e) => {
              setCityId(e.target.value)
              setPage(1)
            }}
            style={{ width: '150px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--muted)' }}>
          Tipo de mensaje
          <input
            type="text"
            placeholder="Ej: bid, offer, swap"
            value={messageType}
            onChange={(e) => {
              setMessageType(e.target.value)
              setPage(1)
            }}
            style={{ width: '160px' }}
          />
        </label>

        <button className="secondary-button" onClick={handleResetFilters} style={{ alignSelf: 'flex-end' }}>
          Limpiar filtros
        </button>

        <button className="secondary-button" onClick={loadMessages} style={{ alignSelf: 'flex-end' }}>
          ↻ Actualizar
        </button>
      </div>

      {!isAuthenticated && (
        <div className="card message-state">Debes iniciar sesión con Auth0 para consultar el registro.</div>
      )}

      {loading && <div className="card message-state">Cargando registro de mensajes...</div>}

      {!loading && error && <div className="card message-state message-error">{error}</div>}

      {!loading && !error && isAuthenticated && messages.length === 0 && (
        <div className="card empty-state">
          <strong>No hay mensajes registrados</strong>
          <span>No se encontraron eventos no aplicados para los filtros seleccionados.</span>
        </div>
      )}

      {!loading && !error && messages.length > 0 && (
        <>
          <div className="card table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Mensaje</th>
                  <th>Ciudad</th>
                  <th>Usuario AMQP</th>
                  <th>idpk</th>
                  <th>Motivo / Razón</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'center' }}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => {
                  const isIdentityMismatch = message.reason?.includes('IDENTITY_MISMATCH')
                  return (
                    <tr key={message.id}>
                      <td>
                        <CategoryBadge category={message.category} />
                      </td>
                      <td>
                        <strong>{message.messageType || '—'}</strong>
                      </td>
                      <td>
                        {message.senderCity ? (
                          <Badge tone="info">{message.senderCity}</Badge>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        {message.senderUserId ? (
                          <code style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>
                            {message.senderUserId}
                          </code>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <code style={{ fontFamily: 'var(--mono)', fontSize: '12px' }}>
                          {message.idpk ? (message.idpk.length > 18 ? `${message.idpk.slice(0, 16)}…` : message.idpk) : '—'}
                        </code>
                      </td>
                      <td>
                        {isIdentityMismatch ? (
                          <span title={message.reason}>
                            <Badge tone="danger">IDENTITY_MISMATCH</Badge>
                          </span>
                        ) : (
                          <span title={message.reason}>{message.reason || '—'}</span>
                        )}
                      </td>
                      <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {formatDate(message.receivedAt)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="secondary-button"
                          onClick={() => setSelectedMessage(message)}
                          style={{ padding: '4px 8px', minHeight: '28px', fontSize: '12px' }}
                        >
                          Ver payload
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="message-pagination">
            <button onClick={() => setPage((current) => current - 1)} disabled={page <= 1}>
              ← Anterior
            </button>

            <span>
              Página {page} de {pages} ({total} registro{total === 1 ? '' : 's'})
            </span>

            <button onClick={() => setPage((current) => current + 1)} disabled={page >= pages}>
              Siguiente →
            </button>
          </div>
        </>
      )}

      {/* Modal con JSON crudo formateado */}
      <PayloadModal message={selectedMessage} onClose={() => setSelectedMessage(null)} />
    </div>
  )
}

Messages.meta = { id: 'messages', label: 'Mensajes', order: 40 }

export default Messages
