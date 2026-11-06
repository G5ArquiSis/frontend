# EnergyShark E1 — Frontend

SPA en React + Vite para la E1 de IIC2173. Muestra el historial de ciclos (RF01), la conectividad
(RF02), la administración de negociaciones (RF04) y el registro de duplicados y NACKs (RF05).
Se despliega como build estático en S3 + CloudFront.

Repos relacionados (organización `G5ArquiSis`):

- [`backend`](https://github.com/G5ArquiSis/backend): API y nodo de ciudad.
- [`contratos`](https://github.com/G5ArquiSis/contratos): OpenAPI de la API y contexto compartido.

**Contexto compartido del proyecto:** [`contratos/AGENTS.md`](https://github.com/G5ArquiSis/contratos/blob/main/AGENTS.md).
Leerlo antes de tocar el código: resume el sistema, los repositorios y las reglas que no se rompen.

## Correr en local

Requiere Node 20 o superior.

```bash
cp .env.example .env        # completar valores
npm install
npm run dev                 # http://localhost:5173
```

## Build y lint

```bash
npm run build               # genera dist/, que es lo que se sube a S3
npm run lint
```

## Agregar una página

Cada página es un archivo propio en `src/pages/` y se registra sola: no hay que tocar
`App.jsx` ni ningún archivo compartido (ver `src/pages/registry.js`).

```jsx
import { useApi, usePolling } from '../api'

function MarketBook() {
  const api = useApi()
  // Consulta al montar y cada 5 s; se pausa mientras la pestaña está oculta.
  const { data, error, loading, refresh } = usePolling(() => api.get('/market/book'), 5000)
  // ...
}

MarketBook.meta = { id: 'market', label: 'Mercado', order: 25 }
export default MarketBook
```

- `useApi()` agrega el token de Auth0 y la URL base. Tiene `get`, `post`, `put`, `patch` y
  `delete`. Un error HTTP lanza un `ApiError` con `status` y `body`; por ejemplo, el `reason`
  de un 409 viene en `body.detail.reason`.
- `order` fija la posición en la barra: Historial 10, Conectividad 20, Negociaciones 30,
  Mensajes 40.
- Una ruta nueva del backend debe estar protegida en Nginx antes de usarla (ver
  `backend/docs/infraestructura.md` § Operación).

## Documentación

Ver [`docs/`](docs/), incluido el [runbook de deploy](docs/infraestructura.md). La documentación general del proyecto (spec, milestones, ADRs) vive en
[`backend/docs`](https://github.com/G5ArquiSis/backend/tree/main/docs).

## Reglas del repo

- Nunca subir `.env` ni `.pem` (ya están en `.gitignore`).
- Toda variable de entorno nueva se documenta en `.env.example`.
- Todo cambio entra por PR revisado por alguien de otra área.
