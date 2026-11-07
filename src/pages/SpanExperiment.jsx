import { useApi, usePolling } from '../api'
import { formatCredits, formatEnergy, formatNumber } from '../format'

// RF06: experimento de span. El span es cuánto espera el comprador la respuesta de un
// vendedor antes de reenviar el bid; se cambia en la estrategia (rol C) y rige por ciclo.
// Cada ciclo dura 20 minutos, así que basta consultar cada minuto.
const REFRESH_MS = 60_000

function percent(value) {
  return value === null || value === undefined ? '—' : `${formatNumber(Number(value) * 100, 1)} %`
}

function spanLabel(span) {
  return span === null || span === undefined ? 'Sin dato' : `${span} s`
}

// Barras horizontales: costo efectivo como fracción del baseline (100 % = no comprar nada).
function CostChart({ bySpan }) {
  const rows = bySpan.filter((row) => row.costVsBaseline !== null)
  if (rows.length === 0) return null
  const max = Math.max(1, ...rows.map((row) => Number(row.costVsBaseline)))
  return (
    <div className="card span-chart">
      <div className="card-heading">
        <h3>Costo efectivo frente al baseline</h3>
        <p>Bajo 100 % el mercado salió más barato que pagar el desbalance.</p>
      </div>
      {rows.map((row) => {
        const ratio = Number(row.costVsBaseline)
        return (
          <div className="span-bar" key={String(row.spanSeconds)}>
            <span>{spanLabel(row.spanSeconds)}</span>
            <div className="span-bar-track">
              <div
                className={`span-bar-fill ${ratio < 1 ? 'span-bar-good' : 'span-bar-bad'}`}
                style={{ width: `${(ratio / max) * 100}%` }}
              />
              <div className="span-bar-baseline" style={{ left: `${(1 / max) * 100}%` }} />
            </div>
            <strong>{percent(ratio)}</strong>
          </div>
        )
      })}
    </div>
  )
}

function SpanExperiment() {
  const api = useApi()
  const { data, error, loading, refresh } = usePolling(
    () => api.get('/experiments/span'),
    REFRESH_MS,
  )

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">RF06 · Experimento</span>
          <h2>Experimento de span</h2>
          <p>
            Por ciclo: el span usado, cuánto del déficit se cubrió en el mercado, el costo
            efectivo frente al baseline (déficit × precio de desbalance) y los bids rechazados.
          </p>
        </div>
        <div className="page-meta">
          <button className="secondary-button" onClick={refresh}>
            Actualizar
          </button>
        </div>
      </div>

      {error && <div className="card error-state">No se pudo cargar el experimento.</div>}

      {loading ? (
        <div className="card empty-state">Cargando el experimento...</div>
      ) : !data || data.cycles.length === 0 ? (
        <div className="card empty-state">
          <strong>Todavía no hay ciclos con compras</strong>
          <span>Aparecen aquí los ciclos en que TAL tuvo déficit y pujó en el mercado.</span>
        </div>
      ) : (
        <>
          <CostChart bySpan={data.bySpan} />

          <div className="card-heading">
            <h3>Agregado por valor de span</h3>
          </div>
          <div className="card table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Span</th>
                  <th className="numeric">Ciclos</th>
                  <th className="numeric">Déficit cubierto</th>
                  <th className="numeric">Costo efectivo</th>
                  <th className="numeric">Baseline</th>
                  <th className="numeric">Costo / baseline</th>
                  <th className="numeric">Bids rechazados</th>
                </tr>
              </thead>
              <tbody>
                {data.bySpan.map((row) => (
                  <tr key={String(row.spanSeconds)}>
                    <td>
                      <strong>{spanLabel(row.spanSeconds)}</strong>
                    </td>
                    <td className="numeric">{row.cycles}</td>
                    <td className="numeric">
                      {formatEnergy(row.covered)}{' '}
                      <span className="muted">({percent(row.coverage)})</span>
                    </td>
                    <td className="numeric">{formatCredits(row.effectiveCost)}</td>
                    <td className="numeric">{formatCredits(row.baselineCost)}</td>
                    <td className="numeric">{percent(row.costVsBaseline)}</td>
                    <td className="numeric">
                      {row.bidsRejected} de {row.bidsSent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card-heading">
            <h3>Por ciclo</h3>
          </div>
          <div className="card table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ciclo</th>
                  <th>Span</th>
                  <th className="numeric">Déficit</th>
                  <th className="numeric">Cubierto en el mercado</th>
                  <th className="numeric">Costo efectivo</th>
                  <th className="numeric">Baseline</th>
                  <th className="numeric">Ahorro</th>
                  <th className="numeric">Bids rechazados</th>
                </tr>
              </thead>
              <tbody>
                {data.cycles.map((cycle) => (
                  <tr key={cycle.cycleId}>
                    <td className="mono">{cycle.cycleId}</td>
                    <td>{spanLabel(cycle.spanSeconds)}</td>
                    <td className="numeric">{formatEnergy(cycle.deficit)}</td>
                    <td className="numeric">
                      {formatEnergy(cycle.covered)}{' '}
                      <span className="muted">({percent(cycle.coverage)})</span>
                    </td>
                    <td className="numeric">{formatCredits(cycle.effectiveCost)}</td>
                    <td className="numeric">{formatCredits(cycle.baselineCost)}</td>
                    <td className="numeric">{formatCredits(cycle.savings)}</td>
                    <td className="numeric">
                      {cycle.bidsRejected} de {cycle.bidsSent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

SpanExperiment.meta = { id: 'span-experiment', label: 'Experimento de span', order: 50 }

export default SpanExperiment
