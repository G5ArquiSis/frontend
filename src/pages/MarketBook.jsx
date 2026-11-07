import { useApi, usePolling } from '../api'
import { formatCredits, formatDate, formatEnergy, formatNumber } from '../format'

// RF02: libro de ofertas en vivo según market.TAL, con transporte hasta cada vendedor y
// precio efectivo. Abajo, los bids de TAL y el estado de su swap. El feed cambia cada pocos
// segundos mientras el mercado está abierto, así que se consulta cada 5 s.
const REFRESH_MS = 5_000

const BID_STATES = {
  sent: { label: 'Enviado', tone: 'warning' },
  proposed: { label: 'Swap propuesto', tone: 'info' },
  accepted: { label: 'Aceptado', tone: 'info' },
  settled: { label: 'Liquidado', tone: 'success' },
  rejected: { label: 'Rechazado', tone: 'danger' },
  token_invalid: { label: 'Token inválido', tone: 'danger' },
  failed: { label: 'Falló', tone: 'danger' },
  expired: { label: 'Vencido', tone: 'neutral' },
}

function bidState(state) {
  return BID_STATES[state] ?? { label: state, tone: 'neutral' }
}

function Badge({ tone, children }) {
  return <span className={`status-badge status-${tone}`}>{children}</span>
}

function MarketWindow({ market }) {
  if (!market) return null
  return (
    <div className="detail-grid">
      <div className="metric-card">
        <span>Mercado</span>
        <strong>{market.isOpen ? 'Abierto' : 'Cerrado'}</strong>
        <span className="muted">
          Último bid {formatDate(market.lastBidAt)} · cierra {formatDate(market.closesAt)}
        </span>
      </div>
      <div className="metric-card">
        <span>Déficit de TAL</span>
        <strong>{formatEnergy(market.deficit)}</strong>
        <span className="muted">Bid mínimo {formatEnergy(market.minBid)}</span>
      </div>
      <div className="metric-card">
        <span>Precio de desbalance</span>
        <strong>{formatNumber(market.imbalancePrice)}</strong>
        <span className="muted">Solo conviene comprar por debajo de este precio efectivo</span>
      </div>
      <div className="metric-card">
        <span>Precio de recompra</span>
        <strong>{formatNumber(market.buybackPrice)}</strong>
        <span className="muted">Lo que paga la central por el excedente</span>
      </div>
    </div>
  )
}

function OfferTable({ offers }) {
  if (offers.length === 0) {
    return (
      <div className="card empty-state">
        <strong>No hay ofertas abiertas</strong>
        <span>Ninguna otra ciudad tiene una oferta vigente en este ciclo.</span>
      </div>
    )
  }
  return (
    <div className="card table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Oferta</th>
            <th>Vendedor</th>
            <th className="numeric">Disponible</th>
            <th className="numeric">Precio</th>
            <th className="numeric">Transporte</th>
            <th className="numeric">Precio efectivo</th>
            <th>Ruta</th>
            <th>¿Conviene?</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.offerId}>
              <td className="mono">{offer.offerId}</td>
              <td>
                <strong>{offer.cityId}</strong>
              </td>
              <td className="numeric">
                {formatEnergy(offer.remaining)}
                {offer.quantity !== null && (
                  <span className="muted"> de {formatNumber(offer.quantity)}</span>
                )}
              </td>
              <td className="numeric">{formatNumber(offer.pricePerEnergy)}</td>
              <td className="numeric">
                {formatNumber(offer.transportPerEnergy)}
                {offer.distanceKm !== null && (
                  <span className="muted"> ({formatNumber(offer.distanceKm, 0)} km)</span>
                )}
              </td>
              <td className="numeric">
                <strong>{formatNumber(offer.effectivePrice)}</strong>
              </td>
              <td>
                {offer.routeEnabled === null ? (
                  <Badge tone="neutral">Sin ruta</Badge>
                ) : offer.routeEnabled ? (
                  <Badge tone="success">Habilitada</Badge>
                ) : (
                  <Badge tone="danger">Deshabilitada</Badge>
                )}
              </td>
              <td>
                {offer.worthBuying === null ? (
                  '—'
                ) : offer.worthBuying ? (
                  <Badge tone="success">Sí</Badge>
                ) : (
                  <Badge tone="neutral">No</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BidTable({ bids }) {
  if (bids.length === 0) {
    return <div className="card empty-state">TAL no ha pujado en este ciclo.</div>
  }
  return (
    <div className="card table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Oferta</th>
            <th>Vendedor</th>
            <th className="numeric">Cantidad</th>
            <th className="numeric">Costo (con transporte)</th>
            <th className="numeric">Envíos</th>
            <th>Estado</th>
            <th>Swap</th>
          </tr>
        </thead>
        <tbody>
          {bids.map((bid) => {
            const state = bidState(bid.state)
            const unit = Number(bid.pricePerEnergy) + Number(bid.transportPerEnergy)
            return (
              <tr key={bid.id}>
                <td className="mono">{bid.offerId}</td>
                <td>{bid.seller}</td>
                <td className="numeric">{formatEnergy(bid.quantity)}</td>
                <td className="numeric">{formatCredits(Number(bid.quantity) * unit)}</td>
                <td className="numeric">{bid.attempts}</td>
                <td>
                  <Badge tone={state.tone}>{state.label}</Badge>
                  {bid.reason && <span className="muted"> {bid.reason}</span>}
                </td>
                <td className="mono">{bid.swapId ?? '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MarketBook() {
  const api = useApi()
  const { data, error, loading, updatedAt, refresh } = usePolling(async () => {
    const book = await api.get('/market/book')
    const query = book.cycleId ? `?cycleId=${encodeURIComponent(book.cycleId)}` : ''
    const bids = await api.get(`/market/bids${query}`)
    return { book, bids: bids.items }
  }, REFRESH_MS)

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">RF02 · Mercado</span>
          <h2>Libro de ofertas</h2>
          <p>
            Ofertas de otras ciudades, de la más barata a la más cara contando el transporte
            hasta TAL. Las rutas deshabilitadas pagan la tarifa punitiva de la central.
          </p>
        </div>

        <div className="page-meta">
          <span>Ciclo</span>
          <strong className="mono">{data?.book.cycleId ?? 'Sin mercado'}</strong>
          <span className="muted">Consultado {formatDate(updatedAt)}</span>
          <button className="secondary-button" onClick={refresh}>
            Actualizar
          </button>
        </div>
      </div>

      {error && <div className="card error-state">No se pudo cargar el libro de ofertas.</div>}

      {loading ? (
        <div className="card empty-state">Cargando el mercado...</div>
      ) : data ? (
        <>
          <MarketWindow market={data.book.market} />
          <OfferTable offers={data.book.offers} />
          <div className="card-heading">
            <h3>Bids de TAL</h3>
            <p>Lo que el comprador pidió en este ciclo y en qué quedó cada swap.</p>
          </div>
          <BidTable bids={data.bids} />
        </>
      ) : null}
    </section>
  )
}

MarketBook.meta = { id: 'market', label: 'Mercado', order: 25 }

export default MarketBook
