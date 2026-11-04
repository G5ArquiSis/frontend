# AI log — Melchort

- **Integrante:** Melchor Guerrero
- **Autocompletado:** no

Todas las entradas usan Claude Code (modelo Claude Opus 5.5) en modo agéntico: la IA escribió los
archivos, ejecutó los comandos de AWS y GitHub y abrió los PRs. Los commits correspondientes llevan
`Co-Authored-By: Claude`.

## 2026-09-27 — Esqueleto del repo

- **Herramienta y modo:** Claude Code, Claude Opus 5.5, agéntico.
- **Tarea:** dejar un repo de frontend listo para que el grupo empiece a trabajar.
- **Prompts relevantes:**
  > "Ayudame a construir la infraestructura para comenzar a trabajar. Necesito hacer nuevos repos?"
- **Qué produjo la IA:** el scaffold de Vite + React, `.env.example`, el README y `docs/README.md`.
- **Verificación:** `npm run lint` y `npm run build` pasan en el workflow.
- **Correcciones del integrante:** elegí React + Vite como stack.
- **Referencia:** commit `c37c00f`.

## 2026-09-28 — Deploy a S3 + CloudFront

- **Herramienta y modo:** Claude Code, Claude Opus 5.5, agéntico.
- **Tarea:** desplegar el build estático en S3 detrás de CloudFront (RNF03), de forma automática.
- **Prompts relevantes:**
  > "Sigue con el frontend"
- **Qué produjo la IA:** `.github/workflows/deploy.yml` (lint, build, `s3 sync` e invalidación de
  CloudFront), las políticas de `deploy/iam/` y `docs/infraestructura.md`. En AWS: el bucket
  privado, la distribución de CloudFront con OAC y el rol de IAM con OIDC para el CI.
- **Verificación:** el workflow corrió completo y el sitio responde por HTTPS en la URL de CloudFront.
- **Correcciones del integrante:** ninguna.
- **Referencia:** commit `4819e70`.

## 2026-09-28 — Enlace al contexto compartido

- **Herramienta y modo:** Claude Code, Claude Opus 5.5, agéntico.
- **Tarea:** cumplir RDOC04 enlazando `contratos/AGENTS.md` desde el README.
- **Prompts relevantes:**
  > "Haz los enlaces de los readme"
- **Qué produjo la IA:** el párrafo del README con el enlace.
- **Verificación:** la URL enlazada responde 200.
- **Correcciones del integrante:** ninguna.
- **Referencia:** PR #1, commit `5fef8af`.

## 2026-10-06 — Dominio propio para el frontend

- **Herramienta y modo:** Claude Code, Claude Opus 5.5, agéntico.
- **Tarea:** servir el frontend en `https://app.melchort.me`, para que la URL no dependa de la
  distribución de CloudFront.
- **Prompts relevantes:**
  > "no deberia usar un subdominio para la api y otro para el frontend"

  > "Pide los dos certificados y pásame los registros"

  > "Prepara la documentacion sin hacer commit"
- **Qué produjo la IA:** en AWS, el certificado de ACM en `us-east-1` y el cambio de la
  distribución (dominio alternativo, certificado, TLS 1.2 como mínimo). En el repo, la
  actualización de `docs/infraestructura.md` y de `.env.example`.
- **Verificación:** `https://app.melchort.me` responde 200 con el certificado correcto, HTTP
  redirige a HTTPS y una ruta interna de la SPA responde 200.
- **Correcciones del integrante:** propuse el subdominio, que la IA había dejado como opcional, y
  agregué a mano los registros DNS en Namecheap.
- **Referencia:** rama `docs/api-gateway-dominios`.

## 2026-11-03 — Detalle de ciclo completo (RF01) y conectividad (RF02)

- **Herramienta y modo:** Claude Code, Claude Opus 5.5, agéntico.
- **Tarea:** que la vista de ciclos muestre todo lo que pide RF01 y que la de conectividad se
  mantenga al día (RF02), con estilos que se habían perdido en un merge anterior.
- **Prompts relevantes:**
  > "Quiero que hagas una revision punto por punto viendo que se cumple y que falta."

  > "primero corrijamos todo lo necesario para que la entrega 1 este completa"
- **Qué produjo la IA:** `src/format.js` (formatos y estados de reporte, ventana y
  negociación); la reescritura de `CycleHistory.jsx`, que agrega el status-statement con el tope
  de precio, los transfers, demand-statements, negociaciones, el negotiation-report enviado y la
  línea de operaciones con la última destacada; `Connectivity.jsx`, que vuelve a consultar cada
  30 s, muestra la distancia en km y el costo de transporte con 6 decimales; la navegación de
  `App.jsx` sin `console.log`; y los estilos de `index.css` y `App.css` en modo claro y oscuro.
- **Verificación:** `npm run lint` sin errores (solo avisos `set-state-in-effect` por el fetch
  inicial) y `npm run build` correcto. Prueba manual en `localhost:5173` contra la API de
  producción con sesión de Auth0, revisando el ciclo `cycle-249797` y las cuatro vistas.
- **Correcciones del integrante:** ninguna hasta ahora (pendiente de revisión en el PR).
- **Referencia:** rama `feat/rf01-rf02-detalle-y-conectividad`.
