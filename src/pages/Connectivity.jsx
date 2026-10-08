// DATOS INVENTADOS (CAMBIAR)
function Connectivity() {

  const connections = [
    {
      destination: 'Ciudad Norte',
      distance: '12 km',
      transportCost: '$15.000',
      enabled: true,
      updatedAt: '2026-10-07 10:30',
    },
    {
      destination: 'Ciudad Sur',
      distance: '25 km',
      transportCost: '$28.000',
      enabled: true,
      updatedAt: '2026-10-07 10:30',
    },
    {
      destination: 'Ciudad Este',
      distance: '40 km',
      transportCost: '$45.000',
      enabled: false,
      updatedAt: '2026-10-07 09:15',
    },
  ]

  return (
    <div className="connectivity">
      <h2>Conectividad</h2>
      <p>Tabla de distancias y costos de transporte.</p>

      <div className="connection-table">
        <div className="table-header">
          <span>Destino</span>
          <span>Distancia</span>
          <span>Costo de transporte</span>
          <span>Estado</span>
          <span>Actualizado</span>
        </div>

        {connections.map((connection) => (
          <div className="table-row" key={connection.destination}>
            <span>{connection.destination}</span>
            <span>{connection.distance}</span>
            <span>{connection.transportCost}</span>

            <span>
              {connection.enabled ? 'Habilitado' : 'Deshabilitado'}
            </span>

            <span>{connection.updatedAt}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Connectivity
