// Formato de los valores que entrega la API. Los montos llegan como texto (Decimal en el
// backend), así que todo pasa por Number antes de formatearse.

const EMPTY = '—'

export function formatNumber(value, maximumFractionDigits = 2) {
  if (value === null || value === undefined || value === '') return EMPTY
  return Number(value).toLocaleString('es-CL', { maximumFractionDigits })
}

export function formatEnergy(value) {
  return value === null || value === undefined ? EMPTY : `${formatNumber(value)} kWh`
}

export function formatCredits(value) {
  return value === null || value === undefined ? EMPTY : `${formatNumber(value)} créditos`
}

export function formatSigned(value, unit) {
  if (value === null || value === undefined) return EMPTY
  const number = Number(value)
  const sign = number > 0 ? '+' : ''
  return `${sign}${formatNumber(number)} ${unit}`
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleString('es-CL') : EMPTY
}

// Estado del negotiation-report de un ciclo, a partir de lo que guarda el backend.
// Sirve tanto para un ítem de GET /cycles como para el detalle de GET /cycles/{id}.
export function reportStatus(cycle, now = new Date()) {
  if (cycle.reportError) {
    return { label: `Rechazado: ${cycle.reportError}`, tone: 'danger' }
  }
  if (cycle.reportSentAt) {
    return { label: 'Enviado', tone: 'success' }
  }
  if (!cycle.opened) {
    // Sin status-statement la central no abrió el ciclo, y no se le debe reporte.
    return { label: 'No se debe', tone: 'neutral' }
  }
  if (cycle.validUntil && new Date(cycle.validUntil) <= now) {
    return { label: 'No enviado', tone: 'danger' }
  }
  return { label: 'Programado', tone: 'warning' }
}

export function windowStatus(cycle, now = new Date()) {
  if (!cycle.validUntil) return { label: 'Sin status-statement', tone: 'neutral' }
  return new Date(cycle.validUntil) > now
    ? { label: 'Ventana abierta', tone: 'warning' }
    : { label: 'Ventana cerrada', tone: 'neutral' }
}

const KIND_LABELS = {
  'status-statement': 'Status-statement',
  transfer: 'Transferencia',
  'demand-statement': 'Demand-statement',
  take: 'Compra (take)',
  give: 'Venta (give)',
}

export function kindLabel(kind) {
  return KIND_LABELS[kind] ?? kind
}

const NEGOTIATION_STATES = {
  pending: { label: 'Pendiente', tone: 'warning' },
  confirmed: { label: 'Confirmada', tone: 'info' },
  paid: { label: 'Pagada', tone: 'success' },
  expired: { label: 'Expirada por timeout', tone: 'danger' },
  rejected: { label: 'Rechazada', tone: 'danger' },
}

export function negotiationState(state) {
  return NEGOTIATION_STATES[state] ?? { label: state, tone: 'neutral' }
}
