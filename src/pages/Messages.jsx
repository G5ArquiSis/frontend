// DATOS INVENTADOS (CAMBIAR)

function Messages() {
  
  const messages = [
    {
      id: 'msg-001',
      type: 'Duplicado',
      messageType: 'transfer',
      idpk: 'idpk-001',
      reason: 'idpk ya aplicado',
      timestamp: '2026-10-07 10:32',
    },
    {
      id: 'msg-002',
      type: 'NACK',
      messageType: 'unknown-type',
      idpk: 'idpk-002',
      reason: 'Tipo de mensaje desconocido',
      timestamp: '2026-10-07 10:28',
    },
    {
      id: 'msg-003',
      type: 'Descartado',
      messageType: 'malformed',
      idpk: 'idpk-003',
      reason: 'Mensaje no parseable',
      timestamp: '2026-10-07 10:15',
    },
  ]

  return (
    <div className="messages">
      <h2>Registro de mensajes</h2>

      <p>
        Consulta de mensajes duplicados, descartados y respondidos con NACK.
      </p>

      <div className="message-table">
        <div className="message-header">
          <span>Tipo</span>
          <span>Mensaje</span>
          <span>idpk</span>
          <span>Motivo</span>
          <span>Fecha</span>
        </div>

        {messages.map((message) => (
          <div className="message-row" key={message.id}>
            <span>{message.type}</span>
            <span>{message.messageType}</span>
            <span>{message.idpk}</span>
            <span>{message.reason}</span>
            <span>{message.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Messages