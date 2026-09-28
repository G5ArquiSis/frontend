# EnergyShark E1 — Frontend

SPA en React + Vite para la E1 de IIC2173. Muestra el historial de ciclos (RF01), la conectividad
(RF02), la administración de negociaciones (RF04) y el registro de duplicados y NACKs (RF05).
Se despliega como build estático en S3 + CloudFront.

Repos relacionados (organización `G5ArquiSis`):

- [`backend`](https://github.com/G5ArquiSis/backend): API y nodo de ciudad.
- [`contratos`](https://github.com/G5ArquiSis/contratos): OpenAPI de la API y contexto compartido.

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

## Documentación

Ver [`docs/`](docs/), incluido el [runbook de deploy](docs/infraestructura.md). La documentación general del proyecto (spec, milestones, ADRs) vive en
[`backend/docs`](https://github.com/G5ArquiSis/backend/tree/main/docs).

## Reglas del repo

- Nunca subir `.env` ni `.pem` (ya están en `.gitignore`).
- Toda variable de entorno nueva se documenta en `.env.example`.
- Todo cambio entra por PR revisado por alguien de otra área.
