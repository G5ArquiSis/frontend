import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import './App.css'
import CycleHistory from './pages/CycleHistory'
import Connectivity from './pages/Connectivity'
import Negotiations from './pages/Negotiations'
import Messages from './pages/Messages'

function App() {
  const [page, setPage] = useState('home')

  const {
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    user,
  } = useAuth0()

  if (page !== 'home') {
    const pages = {
      'cycle-history': <CycleHistory />,
      connectivity: <Connectivity />,
      negotiations: <Negotiations />,
      messages: <Messages />,
    }

    return (
      <div className="app">
        <header className="header">
          <div>
            <h1>EnergyShark</h1>
            <p>Gestión energética de la ciudad</p>
          </div>

          {!isLoading && (
            <div>
              {isAuthenticated ? (
                <>
                  <span>Hola, {user?.name}</span>
                  <button
                    onClick={() =>
                      logout({
                        logoutParams: {
                          returnTo: window.location.origin,
                        },
                      })
                    }
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
<button
  onClick={() => {
    console.log('1. Botón presionado')
    loginWithRedirect()
      .then(() => console.log('2. loginWithRedirect terminó'))
      .catch((error) => console.error('3. Error Auth0:', error))
  }}
>
  Iniciar sesión
</button>
              )}
            </div>
          )}
        </header>

        <main className="main">
          <button onClick={() => setPage('home')}>
            ← Volver
          </button>

          {pages[page]}
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>EnergyShark</h1>
          <p>Gestión energética de la ciudad</p>
        </div>

        {!isLoading && (
          <div>
            {isAuthenticated ? (
              <>
                <span>Hola, {user?.name}</span>
                <button
                  onClick={() =>
                    logout({
                      logoutParams: {
                        returnTo: window.location.origin,
                      },
                    })
                  }
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
<button
  onClick={() => {
    console.log('1. Botón presionado')
    loginWithRedirect()
      .then(() => console.log('2. loginWithRedirect terminó'))
      .catch((error) => console.error('3. Error Auth0:', error))
  }}
>
  Iniciar sesión
</button>
            )}
          </div>
        )}
      </header>

      <main className="main">
        <h2>Panel de control</h2>

        <div className="cards">
          <button onClick={() => setPage('cycle-history')}>
            Historial de ciclos
          </button>

          <button onClick={() => setPage('connectivity')}>
            Conectividad
          </button>

          <button onClick={() => setPage('negotiations')}>
            Negociaciones
          </button>

          <button onClick={() => setPage('messages')}>
            Mensajes
          </button>
        </div>
      </main>
    </div>
  )
}

export default App