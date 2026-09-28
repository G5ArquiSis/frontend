# Infraestructura y deploy del frontend

Runbook del rol de deploy (E). El del backend, con la configuración común de la cuenta, está en
[`backend/docs/infraestructura.md`](https://github.com/G5ArquiSis/backend/blob/main/docs/infraestructura.md).

## Cómo funciona el deploy

```
push a main ─→ GitHub Actions (.github/workflows/deploy.yml)
                 1. npm ci + lint + build (las variables VITE_* se incrustan en el build)
                 2. s3 sync de dist/ al bucket privado
                 3. invalidación del caché de CloudFront
```

- El bucket es **privado**: solo la distribución de CloudFront puede leerlo (OAC + bucket policy).
- CloudFront sirve por HTTPS y redirige HTTP → HTTPS (G05, RNF03).
- Los 403/404 del bucket se responden con `index.html` y código 200, para que funcionen las rutas
  del lado del cliente de la SPA.
- `assets/` (nombres con hash) se cachea un año; el resto (`index.html`, íconos) se revalida siempre.

## Recursos

| Recurso | Valor |
|---|---|
| Bucket S3 | `energyshark-frontend-242627333688` (`us-east-2`) |
| Distribución CloudFront | `E15BV19G3L2GJX` |
| URL | https://d1fglzovmxjg55.cloudfront.net |
| Rol del CI | `energyshark-ci-frontend` |

## Configuración desde cero

Reemplazar `ACCOUNT_ID`, `BUCKET` y `DISTRIBUTION_ID` en los archivos de `deploy/iam/`.

1. **Bucket:** crearlo con *Block all public access* activado y *Object Ownership: Bucket owner enforced*.
2. **Origin Access Control:** *CloudFront → Origin access → Create control setting*, tipo S3, firmar
   siempre.
3. **Distribución:**
   - Origen: el bucket (endpoint regional `BUCKET.s3.us-east-2.amazonaws.com`) con la OAC del paso 2.
   - *Viewer protocol policy:* Redirect HTTP to HTTPS.
   - *Cache policy:* `CachingOptimized`. *Response headers policy:* `SecurityHeadersPolicy`.
   - *Default root object:* `index.html`.
   - *Error pages:* 403 y 404 → `/index.html`, código 200.
4. **Bucket policy:** [`deploy/iam/bucket-policy.json`](../deploy/iam/bucket-policy.json).
5. **Rol del CI:** trust policy [`deploy/iam/ci-frontend-trust.json`](../deploy/iam/ci-frontend-trust.json)
   y política inline [`deploy/iam/ci-frontend-policy.json`](../deploy/iam/ci-frontend-policy.json).
   El `sub` es el formato inmutable de GitHub; el prefijo exacto se obtiene con
   `gh api repos/G5ArquiSis/frontend/actions/oidc/customization/sub`.
6. **Variables del repo** (*Settings → Secrets and variables → Actions → Variables*):

| Variable | Valor |
|---|---|
| `AWS_REGION` | `us-east-2` |
| `AWS_ROLE_ARN` | `arn:aws:iam::242627333688:role/energyshark-ci-frontend` |
| `S3_BUCKET` | `energyshark-frontend-242627333688` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E15BV19G3L2GJX` |
| `VITE_API_URL` | URL de la API (subdominio de API Gateway) |
| `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE` | Los entrega el rol D |

Cambiar una variable `VITE_*` requiere un nuevo deploy (*Actions → Run workflow*), porque se
incrustan al compilar.

## Pendiente

- Dominio propio (`app.<dominio>`): certificado ACM en **us-east-1** (CloudFront lo exige ahí),
  validado por DNS en el proveedor del dominio, y agregarlo como *alternate domain name* de la
  distribución.
