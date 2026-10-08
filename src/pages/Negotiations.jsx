// DATOS INVENTADOS (CAMBIAR)
import { useState } from 'react'

function Negotiations() {
  const [showForm, setShowForm] = useState(false)

  const negotiations = [
    {
      id: 'neg-001',
      destination: 'Ciudad Norte',
      energy: '100 kWh',
      amount: '$25.000',
      status: 'Pagado',
    },
    {
      id: 'neg-002',
      destination: 'Ciudad Sur',
      energy: '80 kWh',
      amount: '$18.000',
      status: 'Confirmado',
    },
    {
      id: 'neg-003',
      destination: 'Ciudad Este',
      energy: '120 kWh',
      amount: '$30.000',
      status: 'Expirado',
    },
    {
      id: 'neg-004',
      destination: 'Ciudad Oeste',
      energy: '60 kWh',
      amount: '$14.000',
      status: 'Pendiente',
    },
  ]

  return (
    <div className="negotiations">
      <div className="page-header">
        <div>
          <h2>Negociaciones</h2>
          <p>Gestiona y consulta las negociaciones voluntarias.</p>
        </div>

      <button
        className="primary-button"
        onClick={() => setShowForm(!showForm)}
      >
        + Nueva propuesta
      </button>
      </div>

      {showForm && (
        <div className="proposal-form">
          <h3>Nueva propuesta</h3>

          <label>
            Ciudad destino
            <input type="text" placeholder="Ej: Ciudad Norte" />
          </label>

          <label>
            Tipo de operación
            <select defaultValue="">
              <option value="" disabled>
                Seleccionar
              </option>
              <option value="give">Give</option>
              <option value="take">Take</option>
            </select>
          </label>

          <label>
            Cantidad de energía
            <input type="number" placeholder="kWh" />
          </label>

          <label>
            Precio por energía
            <input type="number" placeholder="Precio por kWh" />
          </label>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>

            <button type="button" className="primary-button">
              Crear propuesta
            </button>
          </div>
        </div>
      )}

      <div className="negotiation-list">
        {negotiations.map((negotiation) => (
          <div className="negotiation-card" key={negotiation.id}>
            <div>
              <h3>{negotiation.id}</h3>
              <p>Destino: {negotiation.destination}</p>
            </div>

            <div>
              <strong>Energía</strong>
              <span>{negotiation.energy}</span>
            </div>

            <div>
              <strong>Monto</strong>
              <span>{negotiation.amount}</span>
            </div>

            <div>
              <strong>Estado</strong>
              <span
                className={`negotiation-status negotiation-${negotiation.status.toLowerCase()}`}
              >
                {negotiation.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Negotiations