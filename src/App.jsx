import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import './App.css'
// Las páginas se registran solas: ver src/pages/registry.js.
import { PAGES } from './pages/registry'

function App() {
  const [pageId, setPageId] = useState(PAGES[0].id)
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0()

  const page = PAGES.find((candidate) => candidate.id === pageId)

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <h1>EnergyShark</h1>
          <span>Nodo de Talca (TAL)</span>
        </div>

        {isAuthenticated && (
          <nav className="nav">
            {PAGES.map((candidate) => (
              <button
                key={candidate.id}
                className={candidate.id === pageId ? 'nav-active' : ''}
                onClick={() => setPageId(candidate.id)}
              >
                {candidate.label}
              </button>
            ))}
          </nav>
        )}

        {!isLoading && (
          <div className="session">
            {isAuthenticated ? (
              <>
                <span>{user?.name}</span>
                <button
                  className="secondary-button"
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button className="primary-button" onClick={() => loginWithRedirect()}>
                Iniciar sesión
              </button>
            )}
          </div>
        )}
      </header>

      <main className="main">
        {isLoading ? (
          <div className="card empty-state">Cargando sesión...</div>
        ) : isAuthenticated ? (
          <page.Component />
        ) : (
          <div className="card empty-state">
            <strong>Inicia sesión para ver el nodo</strong>
            <span>La API exige un token de Auth0 para cada consulta.</span>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
