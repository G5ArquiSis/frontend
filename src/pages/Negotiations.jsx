import { useCallback, useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

function Negotiations() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0()

  const [negotiations, setNegotiations] = useState([])
  const [showForm, setShowForm] = useState(false)

  const [direction, setDirection] = useState('take')
  const [quantity, setQuantity] = useState('')
  const [pricePerEnergy, setPricePerEnergy] = useState('')

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const loadNegotiations = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    try {
      setError('')

      const token = await getAccessTokenSilently()

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/negotiations`,
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
          'No se pudieron cargar las negociaciones',
        )
      }

      setNegotiations(data)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al cargar las negociaciones')
    } finally {
      setLoading(false)
    }
  }, [getAccessTokenSilently, isAuthenticated])

  useEffect(() => {
    loadNegotiations()
  }, [loadNegotiations])

  // Actualiza periódicamente las negociaciones que todavía pueden cambiar.
  useEffect(() => {
    const hasActiveNegotiations = negotiations.some(
      (negotiation) =>
        negotiation.state === 'pending' ||
        negotiation.state === 'confirmed',
    )

    if (!hasActiveNegotiations) {
      return undefined
    }

    const interval = setInterval(() => {
      loadNegotiations()
    }, 5000)

    return () => clearInterval(interval)
  }, [negotiations, loadNegotiations])

  const createNegotiation = async (event) => {
    event.preventDefault()

    setFormError('')

    if (!quantity || Number(quantity) <= 0) {
      setFormError('La cantidad debe ser mayor que 0.')
      return
    }

    if (pricePerEnergy && Number(pricePerEnergy) <= 0) {
      setFormError('El precio debe ser mayor que 0.')
      return
    }

    try {
      setCreating(true)

      const token = await getAccessTokenSilently()

      const body = {
        direction,
        quantity: Number(quantity),
      }

      if (pricePerEnergy) {
        body.pricePerEnergy = Number(pricePerEnergy)
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/negotiations`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail?.message ||
          data?.detail?.reason ||
          data?.detail ||
          'No se pudo crear la propuesta',
        )
      }

      setNegotiations((current) => [data, ...current])

      setQuantity('')
      setPricePerEnergy('')
      setDirection('take')
      setShowForm(false)
    } catch (err) {
      console.error(err)
      setFormError(err.message || 'Error al crear la propuesta')
    } finally {
      setCreating(false)
    }
  }

  const refreshNegotiation = async (id) => {
    try {
      const token = await getAccessTokenSilently()

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/negotiations/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail || 'No se pudo actualizar la negociación',
        )
      }

      setNegotiations((current) =>
        current.map((negotiation) =>
          negotiation.id === id ? data : negotiation,
        ),
      )
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al actualizar la negociación')
    }
  }

  const statusLabel = (state) => {
    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      paid: 'Pagada',
      expired: 'Expirada',
      rejected: 'Rechazada',
    }

    return labels[state] || state
  }

  const statusClass = (state) => {
    if (state === 'paid') return 'status-success'
    if (state === 'confirmed') return 'status-warning'
    if (state === 'expired' || state === 'rejected') {
      return 'status-danger'
    }

    return 'status-warning'
  }

  const formatNumber = (value) => {
    if (value === null || value === undefined) {
      return '-'
    }

    return Number(value).toLocaleString('es-CL')
  }

  const formatDate = (value) => {
    if (!value) return '-'

    return new Date(value).toLocaleString('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">RF04</span>
          <h2 className="page-title">Negociaciones</h2>
          <p className="page-description">
            Crea propuestas y sigue su confirmación y pago.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            setShowForm((current) => !current)
            setFormError('')
          }}
        >
          {showForm ? 'Cancelar' : '+ Nueva propuesta'}
        </button>
      </div>

      {showForm && (
        <form className="card proposal-form" onSubmit={createNegotiation}>
          <div className="card-heading">
            <div>
              <h3>Nueva propuesta</h3>
              <p>Ingresa los datos de la negociación voluntaria.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Dirección
              <select
                value={direction}
                onChange={(event) => setDirection(event.target.value)}
              >
                <option value="take">Take — comprar energía</option>
                <option value="give">Give — vender energía</option>
              </select>
            </label>

            <label>
              Cantidad de energía
              <input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Ej: 300"
              />
            </label>

            <label>
              Precio por energía
              <input
                type="number"
                min="0"
                step="any"
                value={pricePerEnergy}
                onChange={(event) =>
                  setPricePerEnergy(event.target.value)
                }
                placeholder="Opcional"
              />
            </label>
          </div>

          {formError && (
            <div className="error-state">
              {formError}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={creating}
            >
              {creating ? 'Creando...' : 'Crear propuesta'}
            </button>
          </div>
        </form>
      )}

      {!isAuthenticated && (
        <div className="empty-state">
          Debes iniciar sesión para consultar las negociaciones.
        </div>
      )}

      {loading && (
        <div className="empty-state">
          Cargando negociaciones...
        </div>
      )}

      {!loading && error && (
        <div className="error-state">
          {error}
        </div>
      )}

      {!loading && !error && negotiations.length === 0 && (
        <div className="empty-state">
          <strong>No hay negociaciones registradas.</strong>
          <p>
            Las propuestas creadas durante una ventana de negociación
            aparecerán aquí.
          </p>
        </div>
      )}

      {!loading && !error && negotiations.length > 0 && (
        <div className="card">
          <div className="card-heading">
            <div>
              <h3>Historial</h3>
              <p>{negotiations.length} negociación(es)</p>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Dirección</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Creada</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {negotiations.map((negotiation) => (
                  <tr key={negotiation.id}>
                    <td>#{negotiation.id}</td>

                    <td>
                      {negotiation.direction === 'take'
                        ? 'Take'
                        : 'Give'}
                    </td>

                    <td>
                      {formatNumber(negotiation.quantity)}
                    </td>

                    <td>
                      {formatNumber(
                        negotiation.pricePerEnergy,
                      )}
                    </td>

                    <td>
                      {formatNumber(negotiation.amount)}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${statusClass(
                          negotiation.state,
                        )}`}
                      >
                        {statusLabel(negotiation.state)}
                      </span>
                    </td>

                    <td>
                      {formatDate(negotiation.createdAt)}
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          refreshNegotiation(negotiation.id)
                        }
                      >
                        Actualizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="negotiation-details">
            {negotiations.map((negotiation) => (
              <div
                className="info-card"
                key={`detail-${negotiation.id}`}
              >
                <div>
                  <strong>
                    Negociación #{negotiation.id}
                  </strong>

                  <span>
                    Intentos: {negotiation.attempts ?? 0}
                  </span>
                </div>

                <div>
                  Energía confirmada:{' '}
                  {formatNumber(negotiation.confirmedEnergy)}
                </div>

                <div>
                  Precio confirmado:{' '}
                  {formatNumber(negotiation.confirmedPrice)}
                </div>

                {negotiation.reason && (
                  <div>
                    Motivo: {negotiation.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Negotiations