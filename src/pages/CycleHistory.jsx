// datos inventados para probar (CAMBIAR)
function CycleHistory() {
  // MOCK: datos inventados temporalmente para desarrollar la interfaz.
  // Serán reemplazados por datos reales provenientes del backend.
  const cycles = [
    {
      cycleId: 'cycle-001',
      status: 'Cerrado',
      statusStatement: 'Recibido',
      transferFunds: '$120.000',
      demandStatements: 12,
      negotiations: 3,
      negotiationReport: 'Enviado',
      finalEnergy: '850 kWh',
      finalBudget: '$450.000',
      lastOperation: 'Aplicación de demand-statements',
    },
    {
      cycleId: 'cycle-002',
      status: 'Cerrado',
      statusStatement: 'Recibido',
      transferFunds: '$95.000',
      demandStatements: 8,
      negotiations: 2,
      negotiationReport: 'Enviado',
      finalEnergy: '720 kWh',
      finalBudget: '$380.000',
      lastOperation: 'Envío de negotiation-report',
    },
    {
      cycleId: 'cycle-003',
      status: 'En progreso',
      statusStatement: 'Recibido',
      transferFunds: '$0',
      demandStatements: 5,
      negotiations: 1,
      negotiationReport: 'Pendiente',
      finalEnergy: '920 kWh',
      finalBudget: '$510.000',
      lastOperation: 'Negociación voluntaria',
    },
  ]

  return (
    <div className="cycle-history">
      <h2>Historial de ciclos</h2>

      <div className="cycles">
        {cycles.map((cycle) => (
          <div className="cycle-card" key={cycle.cycleId}>
            <div className="cycle-header">
              <h3>{cycle.cycleId}</h3>
              <span className="cycle-status">{cycle.status}</span>
            </div>

            <div className="cycle-details">
              <div>
                <strong>Status-statement</strong>
                <span>{cycle.statusStatement}</span>
              </div>

              <div>
                <strong>Fondos transferidos</strong>
                <span>{cycle.transferFunds}</span>
              </div>

              <div>
                <strong>Demand-statements aplicados</strong>
                <span>{cycle.demandStatements}</span>
              </div>

              <div>
                <strong>Negociaciones</strong>
                <span>{cycle.negotiations}</span>
              </div>

              <div>
                <strong>Negotiation-report</strong>
                <span>{cycle.negotiationReport}</span>
              </div>

              <div>
                <strong>Energía final</strong>
                <span>{cycle.finalEnergy}</span>
              </div>

              <div>
                <strong>Presupuesto final</strong>
                <span>{cycle.finalBudget}</span>
              </div>

              <div>
                <strong>Última operación aplicada</strong>
                <span>{cycle.lastOperation}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CycleHistory