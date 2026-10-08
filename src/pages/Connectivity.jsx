import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

function Connectivity() {
  const { getAccessTokenSilently } = useAuth0()

  const [connectivity, setConnectivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadConnectivity() {
      try {
        setLoading(true)
        setError('')

        const token = await getAccessTokenSilently()

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/connectivity`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        if (!response.ok) {
          throw new Error(`Error ${response.status}`)
        }

        const data = await response.json()
        setConnectivity(data)
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar la información de conectividad.')
      } finally {
        setLoading(false)
      }
    }

    loadConnectivity()
  }, [getAccessTokenSilently])

  if (loading) {
    return (
      <section className="page">
        <div className="page-title">
          <div>
            <span className="eyebrow">RF02 · RED</span>
            <h2>Conectividad</h2>
            <p>Cargando conexiones...</p>
          </div>
        </div>

        <div className="card empty-state">
          Cargando información...
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <div className="page-title">
          <div>
            <span className="eyebrow">RF02 · RED</span>
            <h2>Conectividad</h2>
            <p>Estado actual de las conexiones y costos de transporte publicados.</p>
          </div>
        </div>

        <div className="card error-state">
          <strong>No se pudo cargar la conectividad</strong>
          <span>{error}</span>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">RF02 · RED</span>
          <h2>Conectividad</h2>
          <p>
            Estado actual de las conexiones y costos de transporte publicados.
          </p>
        </div>

        <div className="page-meta">
          <span>Última actualización</span>
          <strong>
            {connectivity.updatedAt
              ? new Date(connectivity.updatedAt).toLocaleString('es-CL')
              : 'Sin datos'}
          </strong>
        </div>
      </div>

      {connectivity.connections.length === 0 ? (
        <div className="card empty-state">
          <strong>No hay datos de conectividad</strong>
          <span>
            La ciudad todavía no ha recibido una distance-table de la central.
          </span>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Destino</th>
                <th>Distancia</th>
                <th>Costo transporte</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {connectivity.connections.map((connection) => (
                <tr key={connection.destination}>
                  <td>
                    <strong>{connection.destination}</strong>
                  </td>

                  <td>
                    {connection.distance !== null
                      ? `${connection.distance} km`
                      : '—'}
                  </td>

                  <td>
                    {connection.transportCost !== null
                      ? `$${connection.transportCost.toLocaleString('es-CL')}`
                      : '—'}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        connection.enabled
                          ? 'status-success'
                          : 'status-danger'
                      }`}
                    >
                      {connection.enabled ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default Connectivity