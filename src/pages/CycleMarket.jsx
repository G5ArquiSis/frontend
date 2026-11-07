import { formatCredits, formatDate, formatEnergy, formatNumber } from '../format'

// RF01, la parte del mercado de un ciclo: la oferta de TAL y sus actualizaciones, los bids
// enviados y recibidos con su resultado, los swaps con su estado final y el transporte
// cobrado, y el imbalance-settlement. Todo sale de GET /cycles/{id} (marketMessages, swaps y
// walletEvents); acá solo se cruza.

// Código de nuestra ciudad: separa nuestra oferta y nuestros bids de los de otras ciudades.
const OWN_CITY = import.meta.env.VITE_CITY_CODE || 'TAL'

const OFFER_TYPES = new Set(['offer', 'offer-updated', 'offer-withdrawn'])
const OFFER_LABEL = {
  offer: 'Publicada',
  'offer-updated': 'Actualizada',
  'offer-withdrawn': 'Retirada',
}
const SWAP_STATUS = {
  proposed: { label: 'Propuesto', tone: 'info' },
  settled: { label: 'Liquidado', tone: 'success' },
  expired: { label: 'Vencido', tone: 'warning' },
  cancelled: { label: 'Cancelado', tone: 'warning' },
  rejected: { label: 'Rechazado', tone: 'danger' },
  unknown: { label: 'Sin estado final', tone: 'neutral' },
}

export function CycleMarket({ cycle }) {
  const messages = cycle.marketMessages ?? []
  const walletEvents = cycle.walletEvents ?? []
  const bids = groupBids(messages)

  return (
    <>
      <OwnOffer messages={messages} />
      <Bids title="Bids enviados por TAL" bids={bids.filter((bid) => bid.cityId === OWN_CITY)} sent />
      <Bids title="Bids recibidos por TAL" bids={bids.filter((bid) => bid.cityId !== OWN_CITY)} />
      <Swaps swaps={cycle.swaps ?? []} trades={walletEvents.filter((e) => e.type === 'trade-recorded')} />
      <ImbalanceSettlement events={walletEvents.filter((e) => e.type === 'imbalance-settlement')} />
    </>
  )
}

function OwnOffer({ messages }) {
  const offers = messages
    .filter((m) => OFFER_TYPES.has(m.type) && m.cityId === OWN_CITY)
    .sort(byTimestamp)
  return (
    <Card title={`Oferta de ${OWN_CITY} y sus actualizaciones`} empty="TAL no ofreció en este ciclo.">
      {offers.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Oferta</th>
              <th>Cantidad</th>
              <th>Restante</th>
              <th>Precio</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((m) => (
              <tr key={m.idpk}>
                <td>{OFFER_LABEL[m.type]}</td>
                <td className="mono">{m.data?.offerId ?? '—'}</td>
                <td>{formatEnergy(m.data?.quantity)}</td>
                <td>{formatEnergy(m.data?.remaining ?? m.data?.quantity)}</td>
                <td>{formatCredits(m.data?.pricePerEnergy)}</td>
                <td>{formatDate(m.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function Bids({ title, bids, sent = false }) {
  return (
    <Card title={title} empty="Sin bids en este ciclo." count={bids.length}>
      {bids.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>{sent ? 'Vendedor' : 'Comprador'}</th>
              <th>Oferta</th>
              <th>Cantidad</th>
              <th>Envíos</th>
              <th>Resultado</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid) => {
              const result = bidResult(bid.response)
              return (
                <tr key={bid.idpk}>
                  <td>{sent ? bid.seller ?? '—' : bid.cityId}</td>
                  <td className="mono">{bid.offerId ?? '—'}</td>
                  <td>{formatEnergy(bid.quantity)}</td>
                  <td>{bid.attempts}</td>
                  <td>
                    <span className={`status-badge status-${result.tone}`}>{result.label}</span>
                    {result.detail && <span className="operation-id">{result.detail}</span>}
                  </td>
                  <td>{formatDate(bid.timestamp)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function Swaps({ swaps, trades }) {
  const tradeBySwap = new Map(trades.map((t) => [t.data?.swapId, t.data ?? {}]))
  const transport = trades.reduce((sum, t) => sum + Number(t.data?.transportTotal ?? 0), 0)
  return (
    <Card
      title="Swaps y transporte cobrado"
      empty="No hubo swaps en este ciclo."
      count={swaps.length}
      extra={trades.length > 0 ? `Transporte total: ${formatCredits(transport)}` : null}
    >
      {swaps.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Swap</th>
              <th>Estado final</th>
              <th>Vendedor → comprador</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Transporte</th>
            </tr>
          </thead>
          <tbody>
            {swaps.map((swap) => {
              const trade = tradeBySwap.get(swap.swapId)
              const status = SWAP_STATUS[swap.status] ?? SWAP_STATUS.unknown
              const reason = swap.lastEvent?.data?.reason ?? swap.lastEvent?.reason
              return (
                <tr key={swap.swapId}>
                  <td className="mono">{swap.swapId}</td>
                  <td>
                    <span className={`status-badge status-${status.tone}`}>{status.label}</span>
                    {reason && <span className="operation-id">{reason}</span>}
                  </td>
                  <td>{trade ? `${trade.seller} → ${trade.buyer}` : '—'}</td>
                  <td>{formatEnergy(trade?.quantity)}</td>
                  <td>{formatCredits(trade?.pricePerEnergy)}</td>
                  <td>
                    {trade ? formatCredits(trade.transportTotal) : '—'}
                    {trade && trade.routeEnabled === false && (
                      <span className="operation-id">ruta deshabilitada</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function ImbalanceSettlement({ events }) {
  return (
    <Card title="Liquidación de desbalance (imbalance-settlement)" empty="Todavía no llega la liquidación de este ciclo.">
      {events.map((event) => (
        <dl className="facts" key={event.idpk}>
          <Fact label="kWh retenidos" value={formatEnergy(event.data?.kwhHeld)} />
          <Fact label="Déficit" value={formatEnergy(event.data?.deficit)} />
          <Fact label="Cobertura" value={formatEnergy(event.data?.coverage)} />
          <Fact label="Precio" value={formatCredits(event.data?.pricePerEnergy)} />
          <Fact label="Total" value={formatCredits(event.data?.total)} />
          <Fact label="Saldo después" value={formatCredits(event.data?.balanceAfter)} />
        </dl>
      ))}
    </Card>
  )
}

// Un bid y sus reenvíos comparten idpk y cambian de msgId; la respuesta cita uno de esos
// msgId en data.target. Se agrupan por idpk y se busca la respuesta de cualquiera.
function groupBids(messages) {
  const offersCity = new Map(
    messages.filter((m) => OFFER_TYPES.has(m.type)).map((m) => [m.data?.offerId, m.cityId]),
  )
  const responses = new Map()
  for (const m of messages) {
    if ((m.type === 'bid-accepted' || m.type === 'bid-rejected') && m.data?.target) {
      responses.set(m.data.target, m)
    }
  }
  const groups = new Map()
  for (const m of [...messages].sort(byTimestamp)) {
    if (m.type !== 'bid') continue
    const group = groups.get(m.idpk) ?? {
      idpk: m.idpk,
      cityId: m.cityId,
      offerId: m.data?.offerId,
      seller: offersCity.get(m.data?.offerId),
      quantity: m.data?.quantity,
      timestamp: m.timestamp,
      attempts: 0,
      response: null,
    }
    group.attempts += 1
    group.response = group.response ?? responses.get(m.msgId) ?? null
    groups.set(m.idpk, group)
  }
  return [...groups.values()]
}

function bidResult(response) {
  if (!response) return { label: 'Sin respuesta', tone: 'neutral' }
  if (response.type === 'bid-accepted') {
    const amount = response.data?.amount
    return {
      label: 'Aceptado',
      tone: 'success',
      detail: [response.data?.swapId, amount != null ? formatCredits(amount) : null]
        .filter(Boolean)
        .join(' · '),
    }
  }
  const reason = response.reason ?? response.data?.reason
  const available = response.data?.available
  return {
    label: 'Rechazado',
    tone: 'danger',
    detail: available != null ? `${reason} (disponible ${formatNumber(available)})` : reason,
  }
}

function byTimestamp(a, b) {
  return new Date(a.timestamp) - new Date(b.timestamp)
}

function Card({ title, empty, count, extra, children }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return (
    <div className="card">
      <div className="card-heading">
        <h3>{title}</h3>
        {extra && <span className="muted">{extra}</span>}
        {count != null && <span className="count-badge">{count}</span>}
      </div>
      {hasContent ? children : <p className="muted">{empty}</p>}
    </div>
  )
}

function Fact({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
