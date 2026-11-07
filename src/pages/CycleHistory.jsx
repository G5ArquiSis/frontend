import { useCallback, useEffect, useState } from 'react'
import { useApi } from '../api'
import { CycleMarket } from './CycleMarket'
import {
  formatCredits,
  formatDate,
  formatEnergy,
  formatNumber,
  formatSigned,
  kindLabel,
  reportStatus,
  windowStatus,
} from '../format'

// RF01: para cada ciclo, su status-statement, los fondos recibidos, la oferta, los bids
// enviados y recibidos, los swaps y el transporte (CycleMarket.jsx), los demand-statements
// aplicados, las negociaciones, el negotiation-report enviado, los balances finales y cuál
// fue la última operación aplicada.

function CycleHistory() {
  const api = useApi()

  const [cycles, setCycles] = useState([])
  const [page, setPage] = useState(1)
  const [budgetBalance, setBudgetBalance] = useState(null)
  const [selectedCycle, setSelectedCycle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  const loadCycles = useCallback(async () => {
    try {
      setError('')
      const data = await api.get(`/cycles?page=${page}&limit=25`)
      setCycles(data.items)
      setBudgetBalance(data.budgetBalance)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar el historial de ciclos.')
    } finally {
      setLoading(false)
    }
  }, [api, page])

  useEffect(() => {
    loadCycles()
  }, [loadCycles])

  async function handleSelectCycle(cycleId) {
    try {
      setDetailLoading(true)
      setError('')
      setSelectedCycle(await api.get(`/cycles/${cycleId}`))
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

            <div className="page-meta">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
              <span>Página {page}</span>
              <button disabled={cycles.length < 25} onClick={() => setPage(page + 1)}>Siguiente</button>
            </div>
            {cycles.map((cycle) => {
              const report = reportStatus(cycle)
              return (
                <button
                  className={`cycle-item ${selectedCycle?.cycleId === cycle.cycleId ? 'cycle-item-active' : ''
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
        <Metric label="Balance energético registrado" value={formatEnergy(cycle.balances.energy)} />
        <Metric label="Presupuesto registrado" value={formatCredits(cycle.balances.budget)} />
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
                  <td>{formatCredits(transfer.message.data?.penalty?.amount)}</td>
                  <td>{transfer.message.data?.becauseOf ? 'Pago de una venta' : 'Presupuesto'}</td>
                  <td>{formatDate(transfer.appliedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <CycleMarket cycle={cycle} />
      <RawMessages title="Asientos oficiales de wallet" messages={cycle.walletStatement} />
      <Reconciliation value={cycle.reconciliation} />
      <RawMessages title="Tabla de distancias recibida" messages={cycle.distanceTable ? [cycle.distanceTable] : []} />

      <div className="card">
        <div className="card-heading">
          <h3>Negotiation-report</h3>
          <span className={`status-badge status-${report.tone}`}>{report.label}</span>
        </div>
        {cycle.report ? (
          <dl className="facts">
            <Fact label="Budget reportado" value={formatCredits(cycle.report.data?.budgetBalance)} />
            <Fact label="Energía reportada" value={formatEnergy(cycle.report.data?.energyBalance)} />
            <Fact label="Encolado" value={formatDate(cycle.reportQueuedAt)} />
            <Fact label="Publicación confirmada" value={formatDate(cycle.reportSentAt)} />
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

  return (
    <div className="card">
      <div className="card-heading">
        <h3>Status-statement recibido</h3>
      </div>
      <dl className="facts">
        <Fact label="Capacidad de generación" value={formatEnergy(generation)} />
        <Fact label="Consumo proyectado" value={formatEnergy(consumption)} />
        <Fact label="Costo de generación" value={`${formatNumber(cost)} créditos/kWh`} />
        <Fact label="Energía vendible" value={formatEnergy(energy.sellable)} />
        <Fact label="Recompra" value={formatCredits(message.data?.market?.buybackPrice)} />
        <Fact label="Desbalance" value={formatCredits(message.data?.market?.imbalancePrice)} />
        <Fact label="Última oferta" value={formatDate(message.data?.market?.lastOfferAt)} />
        <Fact label="Último bid" value={formatDate(message.data?.market?.lastBidAt)} />
        <Fact label="Cierre de mercado" value={formatDate(message.data?.market?.closesAt)} />
        <Fact label="Válido hasta" value={formatDate(message.data?.validUntil)} />
      </dl>
    </div>
  )
}

function Reconciliation({ value }) {
  return <Section title="Reconciliación con wallet" empty="Todavía no se ha conciliado este ciclo.">
    {value && <>
      <p>Consultada: {formatDate(value.checkedAt)} · Asientos nuevos: {value.entriesImported}</p>
      <p>El delta registrado es wallet menos saldo local antes de corregir. Los saldos son los de esa consulta.</p>
      <table className="data-table"><thead><tr><th>Activo</th><th>Local disponible / retenido</th><th>Wallet disponible / retenido</th><th>Delta disponible / retenido</th></tr></thead>
        <tbody>{Object.keys(value.wallet ?? {}).map(asset => <tr key={asset}>
          <td>{asset}</td>
          <td>{value.localBefore?.[asset]?.available} / {value.localBefore?.[asset]?.held}</td>
          <td>{value.wallet[asset].available} / {value.wallet[asset].held}</td>
          <td>{value.delta?.[asset]?.available} / {value.delta?.[asset]?.held}</td>
        </tr>)}</tbody>
      </table>
    </>}
  </Section>
}

function RawMessages({ title, messages = [] }) {
  return <Section title={title} empty="Sin registros para este ciclo.">
    {messages.length > 0 && messages.map((message, index) => (
      <details key={message.idpk ?? message.swapId ?? message.entryId ?? index}>
        <summary>{message.type ?? message.status ?? message.kind ?? 'Detalle'} · {message.swapId ?? message.entryId ?? message.idpk ?? ''}
          {message.cityId && ` · ${message.cityId}`}
          {message.data?.quantity != null && ` · ${message.data.quantity} kWh`}
          {message.data?.transportTotal != null && ` · transporte ${formatCredits(message.data.transportTotal)}`}
          {message.data?.total != null && ` · ${formatCredits(message.data.total)}`}
        </summary>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(message, null, 2)}</pre>
      </details>
    ))}
  </Section>
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

CycleHistory.meta = { id: 'cycle-history', label: 'Historial de ciclos', order: 10 }

export default CycleHistory
