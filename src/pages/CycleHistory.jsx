import { useCallback, useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import {
  formatCredits,
  formatDate,
  formatEnergy,
  formatNumber,
  formatSigned,
  kindLabel,
  negotiationState,
  reportStatus,
  windowStatus,
} from '../format'

// RF01: para cada ciclo, su status-statement, los fondos recibidos, los demand-statements
// aplicados, las negociaciones, el negotiation-report enviado, los balances finales y cuál
// fue la última operación aplicada.

function CycleHistory() {
  const { getAccessTokenSilently } = useAuth0()

  const [cycles, setCycles] = useState([])
  const [budgetBalance, setBudgetBalance] = useState(null)
  const [selectedCycle, setSelectedCycle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchJson = useCallback(
    async (path) => {
      const token = await getAccessTokenSilently()
      const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`Error ${response.status}`)
      return response.json()
    },
    [getAccessTokenSilently],
  )

  const loadCycles = useCallback(async () => {
    try {
      setError('')
      const data = await fetchJson('/cycles')
      setCycles(data.items)
      setBudgetBalance(data.budgetBalance)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar el historial de ciclos.')
    } finally {
      setLoading(false)
    }
  }, [fetchJson])

  useEffect(() => {
    loadCycles()
  }, [loadCycles])

  async function handleSelectCycle(cycleId) {
    try {
      setDetailLoading(true)
      setError('')
      setSelectedCycle(await fetchJson(`/cycles/${cycleId}`))
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar el detalle del ciclo.')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">RF01 · Ciclos</span>
          <h2>Historial de ciclos</h2>
          <p>Lo que recibió, negoció y reportó la ciudad en cada ciclo.</p>
        </div>

        <div className="page-meta">
          <span>Presupuesto actual</span>
          <strong>{formatCredits(budgetBalance)}</strong>
          <button className="secondary-button" onClick={loadCycles}>
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card empty-state">Cargando ciclos...</div>
      ) : error && cycles.length === 0 ? (
        <div className="card error-state">
          <strong>No se pudo cargar el historial</strong>
          <span>{error}</span>
        </div>
      ) : cycles.length === 0 ? (
        <div className="card empty-state">
          <strong>No hay ciclos registrados</strong>
          <span>La central todavía no ha abierto ningún ciclo.</span>
        </div>
      ) : (
        <div className="cycle-layout">
          <div className="card cycle-list">
            <div className="card-heading">
              <h3>Ciclos</h3>
              <span className="count-badge">{cycles.length}</span>
            </div>

            {cycles.map((cycle) => {
              const report = reportStatus(cycle)
              return (
                <button
                  className={`cycle-item ${
                    selectedCycle?.cycleId === cycle.cycleId ? 'cycle-item-active' : ''
                  }`}
                  key={cycle.cycleId}
                  onClick={() => handleSelectCycle(cycle.cycleId)}
                >
                  <div>
                    <strong>{cycle.cycleId}</strong>
                    <span className={`status-badge status-${report.tone}`}>
                      Reporte: {report.label}
                    </span>
                  </div>
                  <div className="cycle-item-energy">
                    <strong>{formatEnergy(cycle.energyBalance)}</strong>
                    <span>Balance energético</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="cycle-detail">
            {error && <div className="card error-state">{error}</div>}
            {detailLoading ? (
              <div className="card empty-state">Cargando detalle...</div>
            ) : !selectedCycle ? (
              <div className="card empty-state">
                <strong>Selecciona un ciclo</strong>
                <span>Elige un ciclo de la lista para ver su historial.</span>
              </div>
            ) : (
              <CycleDetail cycle={selectedCycle} />
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function CycleDetail({ cycle }) {
  const windowInfo = windowStatus(cycle)
  const report = reportStatus(cycle)
  const lastOperation = cycle.operations.find((operation) => operation.isLast)

  return (
    <>
      <div className="card detail-header">
        <div>
          <span className="eyebrow">Detalle del ciclo</span>
          <h3>{cycle.cycleId}</h3>
          <span className="muted">Ventana hasta {formatDate(cycle.validUntil)}</span>
        </div>
        <span className={`status-badge status-${windowInfo.tone}`}>{windowInfo.label}</span>
      </div>

      <div className="detail-grid">
        <Metric label="Balance energético final" value={formatEnergy(cycle.balances.energy)} />
        <Metric label="Presupuesto al cierre" value={formatCredits(cycle.balances.budget)} />
        <Metric
          label="Última operación aplicada"
          value={lastOperation ? kindLabel(lastOperation.kind) : 'Sin operaciones'}
          detail={cycle.lastOperationIdpk}
        />
      </div>

      <StatusStatement message={cycle.statusStatement} />

      <Section title="Fondos recibidos (transfer)" empty="No llegaron transferencias.">
        {cycle.transfers.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Monto</th>
                <th>Multa</th>
                <th>Motivo</th>
                <th>Aplicado</th>
              </tr>
            </thead>
            <tbody>
              {cycle.transfers.map((transfer) => (
                <tr key={transfer.idpk} className={transfer.isLast ? 'row-last' : ''}>
                  <td>{formatSigned(transfer.budgetDelta, 'créditos')}</td>
                  <td>{formatCredits(transfer.message.data?.penalty)}</td>
                  <td>{transfer.message.data?.becauseOf ? 'Pago de una venta' : 'Presupuesto'}</td>
                  <td>{formatDate(transfer.appliedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Demand-statements aplicados" empty="No hubo demand-statements.">
        {cycle.demandStatements.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cantidad</th>
                <th>Valor por kWh</th>
                <th>Energía</th>
                <th>Presupuesto</th>
                <th>Aplicado</th>
              </tr>
            </thead>
            <tbody>
              {cycle.demandStatements.map((demand) => (
                <tr key={demand.idpk} className={demand.isLast ? 'row-last' : ''}>
                  <td>{formatEnergy(demand.message.data?.balance?.quantity)}</td>
                  <td>{formatCredits(demand.message.data?.balance?.valuePerKwh)}</td>
                  <td>{formatSigned(demand.energyDelta, 'kWh')}</td>
                  <td>{formatSigned(demand.budgetDelta, 'créditos')}</td>
                  <td>{formatDate(demand.appliedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Negociaciones voluntarias" empty="No se negoció en este ciclo.">
        {cycle.negotiations.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Dirección</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Monto</th>
                <th>Intentos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {cycle.negotiations.map((negotiation) => {
                const state = negotiationState(negotiation.state)
                return (
                  <tr key={negotiation.id}>
                    <td>{negotiation.direction === 'take' ? 'Compra' : 'Venta'}</td>
                    <td>{formatEnergy(negotiation.confirmedEnergy ?? negotiation.quantity)}</td>
                    <td>{formatCredits(negotiation.confirmedPrice ?? negotiation.pricePerEnergy)}</td>
                    <td>{formatCredits(negotiation.amount)}</td>
                    <td>{negotiation.attempts}</td>
                    <td>
                      <span className={`status-badge status-${state.tone}`}>{state.label}</span>
                      {negotiation.reason && <span className="muted"> {negotiation.reason}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Section>

      <div className="card">
        <div className="card-heading">
          <h3>Negotiation-report</h3>
          <span className={`status-badge status-${report.tone}`}>{report.label}</span>
        </div>
        {cycle.report ? (
          <dl className="facts">
            <Fact label="Budget reportado" value={formatCredits(cycle.report.data?.budgetBalance)} />
            <Fact label="Energía reportada" value={formatEnergy(cycle.report.data?.energyBalance)} />
            <Fact label="Enviado" value={formatDate(cycle.reportSentAt)} />
            <Fact label="idpk" value={cycle.report.idpk} mono />
          </dl>
        ) : (
          <p className="muted">Todavía no se envió un reporte para este ciclo.</p>
        )}
      </div>

      <Section title="Operaciones aplicadas al ledger, en orden" empty="No hay operaciones.">
        {cycle.operations.length > 0 && (
          <ol className="operation-list">
            {cycle.operations.map((operation) => (
              <li
                className={`operation-item ${operation.isLast ? 'operation-last' : ''}`}
                key={operation.idpk}
              >
                <div className="operation-top">
                  <strong>{kindLabel(operation.kind)}</strong>
                  {operation.isLast && (
                    <span className="status-badge status-success">Última operación</span>
                  )}
                </div>
                <span>
                  {formatSigned(operation.energyDelta, 'kWh')} ·{' '}
                  {formatSigned(operation.budgetDelta, 'créditos')}
                </span>
                <span className="operation-id">
                  {operation.idpk} · {formatDate(operation.appliedAt)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </>
  )
}

function StatusStatement({ message }) {
  if (!message) {
    return (
      <div className="card">
        <div className="card-heading">
          <h3>Status-statement recibido</h3>
        </div>
        <p className="muted">
          No llegó. La central habló de este ciclo sin mandar su estado, así que no se debe
          reporte.
        </p>
      </div>
    )
  }

  const energy = message.data?.energy ?? {}
  const generation = Number(energy.generationCapacity)
  const consumption = Number(energy.consumption)
  const cost = Number(energy.generationCost)
  // Mismas fórmulas que la central: el tope es round2(1.05 × generationCost).
  const cap = Math.round(1.05 * cost * 100) / 100

  return (
    <div className="card">
      <div className="card-heading">
        <h3>Status-statement recibido</h3>
      </div>
      <dl className="facts">
        <Fact label="Capacidad de generación" value={formatEnergy(generation)} />
        <Fact label="Consumo proyectado" value={formatEnergy(consumption)} />
        <Fact label="Costo de generación" value={`${formatNumber(cost)} créditos/kWh`} />
        <Fact label="Vendible como máximo" value={formatEnergy(Math.max(0, generation - consumption))} />
        <Fact label="Tope de precio" value={`${formatNumber(cap)} créditos/kWh`} />
        <Fact label="Válido hasta" value={formatDate(message.data?.validUntil)} />
      </dl>
    </div>
  )
}

function Section({ title, empty, children }) {
  return (
    <div className="card">
      <div className="card-heading">
        <h3>{title}</h3>
      </div>
      {children || <p className="muted">{empty}</p>}
    </div>
  )
}

function Metric({ label, value, detail }) {
  return (
    <div className="card metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <span className="operation-id">{detail}</span>}
    </div>
  )
}

function Fact({ label, value, mono = false }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={mono ? 'mono' : ''}>{value}</dd>
    </div>
  )
}

export default CycleHistory
