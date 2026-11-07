import { useState } from 'react'
import { useApi, usePolling } from '../api'

const initialStrategy = {
  priceMode: 'market_fraction',
  pricePerEnergy: null,
  priceFactor: 0.5,
  offerQuantity: null,
  bidAcceptancePolicy: 'arrival_order',
  buyWaitSpanSeconds: 60,
  offerSelectionPolicy: 'lowest_effective_price',
}

function MarketAdmin() {
  const api = useApi()
  const [notice, setNotice] = useState('')
  const [savingStrategy, setSavingStrategy] = useState(false)
  const [savingOffer, setSavingOffer] = useState(false)

  const strategy = usePolling(() => api.get('/strategy'), 10000)
  const offer = usePolling(() => api.get('/strategy/offer'), 10000)
  const swaps = usePolling(() => api.get('/strategy/swaps?limit=50'), 10000)

  const config = strategy.data?.config ?? initialStrategy
  const offerConfig = offer.data ?? {}
  const [draft, setDraft] = useState(null)
  const [offerDraft, setOfferDraft] = useState(null)

  const values = draft ?? config
  const offerValues = offerDraft ?? offerConfig

  const update = (key, value) => setDraft((current) => ({
    ...(current ?? config),
    [key]: value,
  }))

  const updateOffer = (key, value) => setOfferDraft((current) => ({
    ...(current ?? offerConfig),
    [key]: value,
  }))

  async function saveStrategy(event) {
    event.preventDefault()
    setNotice('')
    const payload = {
      ...values,
      pricePerEnergy: values.priceMode === 'fixed'
        ? Number(values.pricePerEnergy)
        : null,
      priceFactor: Number(values.priceFactor),
      offerQuantity: values.offerQuantity === '' || values.offerQuantity == null
        ? null
        : Number(values.offerQuantity),
      buyWaitSpanSeconds: Number(values.buyWaitSpanSeconds),
    }
    if (payload.priceMode === 'fixed' &&
      (payload.pricePerEnergy == null || !Number.isFinite(payload.pricePerEnergy) || payload.pricePerEnergy < 0)) {
      setNotice('Para precio fijo, ingresa un precio válido (mayor o igual a 0).')
      return
    }
    try {
      setSavingStrategy(true)
      await api.put('/strategy', payload)
      setDraft(null)
      await strategy.refresh()
      await offer.refresh()
      setNotice('Estrategia guardada correctamente.')
    } catch (error) {
      setNotice(error.message || 'No se pudo guardar la estrategia.')
    } finally {
      setSavingStrategy(false)
    }
  }

  async function saveOffer(event) {
    event.preventDefault()
    setNotice('')
    const payload = {}
    if (offerValues.priceMode !== undefined) payload.priceMode = offerValues.priceMode
    if (offerValues.priceMode === 'fixed') {
      payload.pricePerEnergy = Number(offerValues.pricePerEnergy)
    } else if (offerValues.priceMode === 'market_fraction') {
      payload.pricePerEnergy = null
    }
    if (offerValues.priceFactor !== undefined) payload.priceFactor = Number(offerValues.priceFactor)
    payload.offerQuantity = offerValues.offerQuantity === '' || offerValues.offerQuantity == null
      ? null
      : Number(offerValues.offerQuantity)
    try {
      setSavingOffer(true)
      await api.patch('/strategy/offer', payload)
      setOfferDraft(null)
      await offer.refresh()
      await strategy.refresh()
      setNotice('Configuración de oferta guardada correctamente.')
    } catch (error) {
      setNotice(error.message || 'No se pudo guardar la oferta.')
    } finally {
      setSavingOffer(false)
    }
  }

  const swapsData = Array.isArray(swaps.data) ? swaps.data : swaps.data?.items ?? []
  const fmt = (value) => value == null ? '—' : Number(value).toLocaleString('es-CL')
  const fmtDate = (value) => value ? new Date(value).toLocaleString('es-CL') : '—'

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">C6 · Administración</span>
          <h2 className="page-title">Administración del mercado</h2>
          <p className="page-description">Configura la estrategia activa, los parámetros de oferta y revisa swaps en curso.</p>
        </div>
        <div className="page-meta">
          <strong>Versión {strategy.data?.version ?? '—'}</strong>
          <span>Actualización automática cada 10 s</span>
          <button className="secondary-button" type="button" onClick={() => {
            strategy.refresh()
            offer.refresh()
            swaps.refresh()
          }}>Actualizar</button>
        </div>
      </div>

      {notice && <div className="card">{notice}</div>}
      {(strategy.error || offer.error || swaps.error) && (
        <div className="error-state card">
          {strategy.error?.message || offer.error?.message || swaps.error?.message}
        </div>
      )}

      <form className="card proposal-form" onSubmit={saveStrategy}>
        <div className="card-heading">
          <div><h3>Estrategia activa</h3><p>Estos parámetros se aplican a la estrategia completa.</p></div>
          <span className="status-badge status-info">v{strategy.data?.version ?? '—'}</span>
        </div>
        <div className="form-grid">
          <label>Modo de precio
            <select value={values.priceMode ?? 'market_fraction'} onChange={(e) => update('priceMode', e.target.value)}>
              <option value="market_fraction">Fracción del mercado</option>
              <option value="fixed">Precio fijo</option>
            </select>
          </label>
          {values.priceMode === 'fixed' ? (
            <label>Precio por energía
              <input type="number" min="0" step="any" value={values.pricePerEnergy ?? ''}
                onChange={(e) => update('pricePerEnergy', e.target.value)} required />
            </label>
          ) : (
            <label>Factor de precio (0–1)
              <input type="number" min="0" max="1" step="0.01" value={values.priceFactor ?? 0.5}
                onChange={(e) => update('priceFactor', e.target.value)} required />
            </label>
          )}
          <label>Cantidad de oferta (vacío = toda la energía disponible)
            <input type="number" min="1" step="1" value={values.offerQuantity ?? ''}
              onChange={(e) => update('offerQuantity', e.target.value)} placeholder="Toda la energía" />
          </label>
          <label>Política de aceptación de bids
            <select value={values.bidAcceptancePolicy ?? 'arrival_order'} onChange={(e) => update('bidAcceptancePolicy', e.target.value)}>
              <option value="arrival_order">Orden de llegada</option>
              <option value="largest_quantity_first">Mayor cantidad primero</option>
            </select>
          </label>
          <label>Espera de compra (segundos)
            <input type="number" min="0" step="1" value={values.buyWaitSpanSeconds ?? 60}
              onChange={(e) => update('buyWaitSpanSeconds', e.target.value)} />
          </label>
          <label>Selección de ofertas
            <select value={values.offerSelectionPolicy ?? 'lowest_effective_price'} onChange={(e) => update('offerSelectionPolicy', e.target.value)}>
              <option value="lowest_effective_price">Menor precio efectivo</option>
              <option value="lowest_nominal_price">Menor precio nominal</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={() => setDraft(null)}>Descartar</button>
          <button type="submit" className="primary-button" disabled={savingStrategy || strategy.loading}>
            {savingStrategy ? 'Guardando…' : 'Guardar estrategia'}
          </button>
        </div>
      </form>

      <form className="card proposal-form" onSubmit={saveOffer}>
        <div className="card-heading">
          <div><h3>Configuración de oferta</h3><p>Actualiza los parámetros de precio y cantidad de oferta.</p></div>
          <span className="status-badge status-info">v{offerConfig.version ?? '—'}</span>
        </div>
        <div className="form-grid">
          <label>Modo de precio
            <select value={offerValues.priceMode ?? config.priceMode ?? 'market_fraction'}
              onChange={(e) => updateOffer('priceMode', e.target.value)}>
              <option value="market_fraction">Fracción del mercado</option>
              <option value="fixed">Precio fijo</option>
            </select>
          </label>
          {offerValues.priceMode === 'fixed' ? (
            <label>Precio por energía
              <input type="number" min="0" step="any" value={offerValues.pricePerEnergy ?? ''}
                onChange={(e) => updateOffer('pricePerEnergy', e.target.value)} required />
            </label>
          ) : (
            <label>Factor de precio (0–1)
              <input type="number" min="0" max="1" step="0.01" value={offerValues.priceFactor ?? 0.5}
                onChange={(e) => updateOffer('priceFactor', e.target.value)} />
            </label>
          )}
          <label>Cantidad (vacío = toda la energía disponible)
            <input type="number" min="1" step="1" value={offerValues.offerQuantity ?? ''}
              onChange={(e) => updateOffer('offerQuantity', e.target.value)} placeholder="Toda la energía" />
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={() => setOfferDraft(null)}>Descartar</button>
          <button type="submit" className="primary-button" disabled={savingOffer || offer.loading}>
            {savingOffer ? 'Guardando…' : 'Guardar oferta'}
          </button>
        </div>
      </form>

      <section className="card">
        <div className="card-heading">
          <div><h3>Swaps en curso</h3><p>Operaciones reservadas, propuestas o con error de wallet.</p></div>
          <span className="count-badge">{swapsData.length}</span>
        </div>
        {swaps.loading && !swaps.data ? <div className="empty-state">Cargando swaps…</div> :
          swapsData.length === 0 ? <div className="empty-state">No hay swaps en curso.</div> : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>ID</th><th>Ciclo</th><th>Oferta</th><th>Comprador</th><th>Cantidad</th><th>Precio</th><th>Estado</th><th>Creado</th><th>Expira</th></tr></thead>
                <tbody>{swapsData.map((swap) => (
                  <tr key={swap.id}>
                    <td>#{swap.id}</td><td>{swap.cycleId ?? '—'}</td><td>{swap.offerId ?? '—'}</td>
                    <td>{swap.buyerCity ?? '—'}</td><td>{fmt(swap.quantity)}</td><td>{fmt(swap.pricePerEnergy)}</td>
                    <td><span className="status-badge status-warning">{swap.status ?? '—'}</span></td>
                    <td>{fmtDate(swap.createdAt)}</td><td>{fmtDate(swap.swapExpiresAt)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
      </section>
    </div>
  )
}

MarketAdmin.meta = { id: 'market-admin', label: 'Administración', order: 35 }

export default MarketAdmin
