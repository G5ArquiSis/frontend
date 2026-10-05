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
