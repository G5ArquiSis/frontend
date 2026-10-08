import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

function CycleHistory() {
  const { getAccessTokenSilently } = useAuth0()

  const [cycles, setCycles] = useState([])
  const [selectedCycle, setSelectedCycle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCycles() {
      try {
        setLoading(true)
        setError('')

        const token = await getAccessTokenSilently()

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/cycles`,
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
        setCycles(data.items)
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar el historial de ciclos.')
      } finally {
        setLoading(false)
      }
    }

    loadCycles()
  }, [getAccessTokenSilently])

  async function handleSelectCycle(cycleId) {
    try {
      setDetailLoading(true)
      setError('')

      const token = await getAccessTokenSilently()

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/cycles/${cycleId}`,
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
      setSelectedCycle(data)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar el detalle del ciclo.')
    } finally {
      setDetailLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div className="page-title">
          <div>
            <span className="eyebrow">RF01 · CICLOS</span>
            <h2>Historial de ciclos</h2>
            <p>Consultando el historial energético de la ciudad.</p>
          </div>
        </div>

        <div className="card empty-state">
          Cargando ciclos...
        </div>
      </section>
    )
  }

  if (error && cycles.length === 0) {
    return (
      <section className="page">
        <div className="page-title">
          <div>
            <span className="eyebrow">RF01 · CICLOS</span>
            <h2>Historial de ciclos</h2>
          </div>
        </div>

        <div className="card error-state">
          <strong>No se pudo cargar el historial</strong>
          <span>{error}</span>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">RF01 · CICLOS</span>
          <h2>Historial de ciclos</h2>
          <p>
            Consulta el estado y los resultados de los ciclos de negociación.
          </p>
        </div>
      </div>

      {cycles.length === 0 ? (
        <div className="card empty-state">
          <strong>No hay ciclos registrados</strong>
          <span>Aún no existen ciclos disponibles para consultar.</span>
        </div>
      ) : (
        <div className="cycle-layout">
          <div className="card cycle-list">
            <div className="card-heading">
              <div>
                <span className="eyebrow">HISTORIAL</span>
                <h3>Ciclos disponibles</h3>
              </div>
              <span className="count-badge">{cycles.length}</span>
            </div>

            {cycles.map((cycle) => (
              <button
                className={`cycle-item ${
                  selectedCycle?.cycleId === cycle.cycleId
                    ? 'cycle-item-active'
                    : ''
                }`}
                key={cycle.cycleId}
                onClick={() => handleSelectCycle(cycle.cycleId)}
              >
                <div>
                  <strong>{cycle.cycleId}</strong>
                  <span>
                    {cycle.opened ? 'Ciclo abierto' : 'Ciclo cerrado'}
                  </span>
                </div>

                <div className="cycle-item-energy">
                  <strong>{cycle.energyBalance} kWh</strong>
                  <span>Balance energético</span>
                </div>
              </button>
            ))}
          </div>

          <div className="cycle-detail">
            {!selectedCycle ? (
              <div className="card empty-state">
                <strong>Selecciona un ciclo</strong>
                <span>
                  Elige un ciclo de la lista para consultar su historial.
                </span>
              </div>
            ) : detailLoading ? (
              <div className="card empty-state">
                Cargando detalle...
              </div>
            ) : (
              <>
                <div className="card detail-header">
                  <div>
                    <span className="eyebrow">DETALLE DEL CICLO</span>
                    <h3>{selectedCycle.cycleId}</h3>
                  </div>

                  <span
                    className={`status-badge ${
                      selectedCycle.opened
                        ? 'status-warning'
                        : 'status-success'
                    }`}
                  >
                    {selectedCycle.opened ? 'Abierto' : 'Cerrado'}
                  </span>
                </div>

                <div className="detail-grid">
                  <div className="card metric-card">
                    <span>Balance energético</span>
                    <strong>{selectedCycle.balances.energy} kWh</strong>
                  </div>

                  <div className="card metric-card">
                    <span>Presupuesto</span>
                    <strong>
                      ${Number(selectedCycle.balances.budget).toLocaleString(
                        'es-CL',
                      )}
                    </strong>
                  </div>

                  <div className="card metric-card">
                    <span>Transferencias</span>
                    <strong>{selectedCycle.transfers.length}</strong>
                  </div>

                  <div className="card metric-card">
                    <span>Demand-statements</span>
                    <strong>{selectedCycle.demandStatements.length}</strong>
                  </div>

                  <div className="card metric-card">
                    <span>Negociaciones</span>
                    <strong>{selectedCycle.negotiations.length}</strong>
                  </div>

                  <div className="card metric-card">
                    <span>Operaciones</span>
                    <strong>{selectedCycle.operations.length}</strong>
                  </div>
                </div>

                <div className="card operations-card">
                  <div className="card-heading">
                    <div>
                      <span className="eyebrow">LEDGER</span>
                      <h3>Operaciones aplicadas</h3>
                    </div>
                  </div>

                  {selectedCycle.operations.length === 0 ? (
                    <div className="empty-state compact">
                      No hay operaciones registradas.
                    </div>
                  ) : (
                    <div className="operation-list">
                      {selectedCycle.operations.map((operation) => (
                        <div
                          className={`operation-item ${
                            operation.isLast ? 'operation-last' : ''
                          }`}
                          key={operation.idpk}
                        >
                          <div className="operation-marker" />

                          <div className="operation-content">
                            <div className="operation-top">
                              <strong>{operation.kind}</strong>

                              {operation.isLast && (
                                <span className="status-badge status-success">
                                  Última operación
                                </span>
                              )}
                            </div>

                            <span className="operation-id">
                              {operation.idpk}
                            </span>

                            <span className="operation-date">
                              {new Date(
                                operation.appliedAt,
                              ).toLocaleString('es-CL')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="detail-grid detail-grid-bottom">
                  <div className="card info-card">
                    <span>Última operación aplicada</span>
                    <strong>
                      {selectedCycle.lastOperationIdpk || 'Sin operaciones'}
                    </strong>
                  </div>

                  <div className="card info-card">
                    <span>Negotiation report</span>
                    <strong>
                      {selectedCycle.report
                        ? 'Enviado'
                        : selectedCycle.reportError
                          ? 'Error'
                          : 'Pendiente'}
                    </strong>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default CycleHistory