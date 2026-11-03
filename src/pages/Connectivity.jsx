import { useCallback, useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { formatDate, formatNumber } from '../format'

// RF02: la distance-table vigente, actualizada cuando la central publique cambios. La
// central no avisa al navegador, así que la vista vuelve a consultar cada 30 segundos.
const REFRESH_MS = 30_000

function Connectivity() {
  const { getAccessTokenSilently } = useAuth0()

  const [connectivity, setConnectivity] = useState(null)
  const [checkedAt, setCheckedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadConnectivity = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently()
      const response = await fetch(`${import.meta.env.VITE_API_URL}/connectivity`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`Error ${response.status}`)

      setConnectivity(await response.json())
      setCheckedAt(new Date())
      setError('')
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar la información de conectividad.')
    } finally {
      setLoading(false)
    }
  }, [getAccessTokenSilently])

  useEffect(() => {
    loadConnectivity()
    const interval = setInterval(loadConnectivity, REFRESH_MS)
    return () => clearInterval(interval)
  }, [loadConnectivity])

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">RF02 · Red</span>
          <h2>Conectividad</h2>
          <p>
            Rutas hacia otras ciudades según la última distance-table de la central. Se
            consulta de nuevo cada 30 segundos.
          </p>
        </div>

        <div className="page-meta">
          <span>Tabla publicada</span>
          <strong>{connectivity?.updatedAt ? formatDate(connectivity.updatedAt) : 'Sin datos'}</strong>
          <span className="muted">Consultada {formatDate(checkedAt)}</span>
          <button className="secondary-button" onClick={loadConnectivity}>
            Actualizar
          </button>
        </div>
      </div>

      {error && <div className="card error-state">{error}</div>}

      {loading ? (
        <div className="card empty-state">Cargando información...</div>
      ) : !connectivity || connectivity.connections.length === 0 ? (
        <div className="card empty-state">
          <strong>No hay datos de conectividad</strong>
          <span>La ciudad todavía no ha recibido una distance-table de la central.</span>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Destino</th>
                <th className="numeric">Distancia</th>
                <th className="numeric">transportCost (créditos/(kWh·km))</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {connectivity.connections.map((connection) => (
                <tr key={connection.destination}>
                  <td>
                    <strong>{connection.destination}</strong>
                  </td>
                  {/* La central publica la distancia en metros. */}
                  <td className="numeric">
                    {connection.distance === null
                      ? '—'
                      : `${formatNumber(connection.distance / 1000, 0)} km`}
                  </td>
                  <td className="numeric">{formatNumber(connection.transportCost, 6)}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        connection.enabled ? 'status-success' : 'status-danger'
                      }`}
                    >
                      {connection.enabled ? 'Habilitada' : 'Deshabilitada'}
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
