import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

function Messages() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()

  const [messages, setMessages] = useState([])
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadMessages = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const token = await getAccessTokenSilently()

        const params = new URLSearchParams({
          page: String(page),
          limit: '25',
        })

        if (category) {
          params.set('category', category)
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/message-log?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data?.detail?.message ||
            data?.detail ||
            'No se pudo cargar el registro de mensajes',
          )
        }

        setMessages(data.items ?? [])
        setPages(data.pages ?? 1)
        setTotal(data.total ?? 0)
      } catch (err) {
        console.error(err)
        setError(err.message || 'Error al cargar los mensajes')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [getAccessTokenSilently, isAuthenticated, category, page])

  const handleCategoryChange = (event) => {
    setCategory(event.target.value)
    setPage(1)
  }

  const getCategoryLabel = (value) => {
    const labels = {
      duplicate: 'Duplicado',
      discarded: 'Descartado',
      nack: 'NACK',
    }

    return labels[value] || value
  }

  const formatDate = (value) => {
    if (!value) return '-'

    return new Date(value).toLocaleString('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  return (
    <div className="messages">
      <h2>Registro de mensajes</h2>

      <p>
        Consulta de mensajes duplicados, descartados y respondidos con NACK.
      </p>

      <div className="message-filters">
        <label>
          Tipo de mensaje
          <select value={category} onChange={handleCategoryChange}>
            <option value="">Todos</option>
            <option value="duplicate">Duplicados</option>
            <option value="discarded">Descartados</option>
            <option value="nack">NACK</option>
          </select>
        </label>

        <span>
          {total} registro{total === 1 ? '' : 's'}
        </span>
      </div>

      {!isAuthenticated && (
        <div className="message-state">
          Debes iniciar sesión para consultar el registro.
        </div>
      )}

      {loading && (
        <div className="message-state">
          Cargando mensajes...
        </div>
      )}

      {!loading && error && (
        <div className="message-state message-error">
          {error}
        </div>
      )}

      {!loading && !error && isAuthenticated && messages.length === 0 && (
        <div className="message-state">
          No hay mensajes registrados.
        </div>
      )}

      {!loading && !error && messages.length > 0 && (
        <>
          <div className="message-table">
            <div className="message-header">
              <span>Tipo</span>
              <span>Mensaje</span>
              <span>idpk</span>
              <span>Motivo</span>
              <span>Fecha</span>
            </div>

            {messages.map((message) => (
              <div className="message-row" key={message.id}>
                <span>{getCategoryLabel(message.category)}</span>
                <span>{message.messageType || '-'}</span>
                <span>{message.idpk || '-'}</span>
                <span>{message.reason || '-'}</span>
                <span>{formatDate(message.receivedAt)}</span>
              </div>
            ))}
          </div>

          <div className="message-pagination">
            <button
              onClick={() => setPage((current) => current - 1)}
              disabled={page <= 1}
            >
              ← Anterior
            </button>

            <span>
              Página {page} de {pages}
            </span>

            <button
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= pages}
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Messages