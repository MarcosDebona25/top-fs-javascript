# Blog API — Marginalia

Proyecto de The Odin Project: una API REST para un blog y dos frontends separados que la consumen. **Marginalia** es el sitio de lectura (ensayos y "notes" de lectores); **The desk** es el sitio donde los autores escriben, publican y borran.

## Funcionalidades

**API (Express + Prisma)**

- Registro e inicio de sesión con usuario y contraseña. La sesión es un JWT de 60 minutos dentro de una cookie `HttpOnly; Secure; SameSite=Strict`; el token nunca viaja en el body.
- Roles `READER` y `AUTHOR`. El registro público sólo crea lectores; los autores salen del seed.
- Posts en Markdown con borrador/publicado (`publishedAt`). Un borrador sólo existe para su autor: para cualquier otro es un 404.
- Comentarios sólo en posts publicados. Nadie edita ni borra comentarios ajenos, ni siquiera el autor del post. Editar marca `editedAt`.
- Borrado físico (hard delete); borrar un post borra sus comentarios en cascada.
- CORS con lista de orígenes, guarda CSRF en escrituras (`Origin` permitido, `Sec-Fetch-Site`, header `X-Requested-With`), `helmet` y límite de 10 intentos de login/registro cada 15 minutos por IP.

**Lector (`reader/`, puerto 5173)**

- Índice completo de ensayos (el último destacado), página de ensayo con tiempo de lectura y Markdown renderizado sin HTML crudo.
- Notes en el margen: escribir, editar y borrar las propias; las ajenas son de sólo lectura.
- Log in y sign up con validación inline y vuelta a la página de origen.

**Autor (`author/`, puerto 5174)**

- Escritorio con filtros (todos, publicados, borradores), publicar/despublicar y borrar con confirmación.
- Editor Markdown con preview de la página final antes de publicar.
- El texto sin guardar se conserva en este dispositivo (`localStorage`) hasta que la API confirma el guardado.
- Si la sesión vence mientras se escribe, un diálogo pide la contraseña y reintenta el guardado.
- Las cuentas de lector no pueden entrar.

## Estructura

```
blog-api/
  api/       Express 5 (CommonJS), Prisma 7.10, passport-local + passport-jwt
  shared/    @blog/shared: cliente HTTP, sesión, helpers, Markdown y estilos comunes
  reader/    Vite + React 19 + react-router (sitio de lectura)
  author/    Vite + React 19 + react-router (escritorio de autores)
  e2e/       Playwright (flujos completos en navegador)
```

Es un monorepo con npm workspaces: un solo `npm install` en la raíz instala todo.

## Requisitos

- Node.js 20 o superior y npm.
- PostgreSQL 16 en ejecución local.

## Base de datos

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE blogapi WITH LOGIN PASSWORD 'blogapi' CREATEDB;
CREATE DATABASE blog_api OWNER blogapi;
SQL
```

`CREATEDB` hace falta para la base sombra de `prisma migrate dev` y para crear la base de tests (`blog_api_test`).

## Variables de entorno

Copiar `api/.env.example` a `api/.env`, `reader/.env.example` a `reader/.env` y `author/.env.example` a `author/.env`.

| Variable | Dónde | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | api | Cadena de conexión a `blog_api`. |
| `JWT_SECRET` | api | 64 bytes aleatorios en hex. La API no arranca si falta o es corto. |
| `JWT_EXPIRES_IN`, `JWT_ISSUER`, `JWT_AUDIENCE` | api | Vida y claims del token. |
| `COOKIE_SECURE` | api | `true` salvo que un cliente local rechace cookies `Secure` sobre `http://localhost`. |
| `CORS_ORIGINS` | api | Orígenes permitidos, separados por coma. |
| `AUTHOR_PASSWORD`, `READER_PASSWORD` | api | Contraseñas de las cuentas del seed. |
| `VITE_API_URL` | reader, author | URL base de la API, por ejemplo `http://localhost:3000/api`. |
| `VITE_READER_URL` | author | URL del sitio de lectura, para los links "View the site". |

Los archivos `.env` están en `.gitignore`.

## Instalación y ejecución

```bash
npm install
cd api && npx prisma migrate deploy && npx prisma generate && npm run seed && cd ..

npm run dev:api      # PostgreSQL + API en http://localhost:3000
npm run dev:reader   # http://localhost:5173
npm run dev:author   # http://localhost:5174
```

`npm run dev:api` inicia PostgreSQL con `sudo service postgresql start` y lo detiene al salir. Para producción: `npm run build:reader` y `npm run build:author` generan `dist/` con una Content Security Policy (`script-src 'self'`) inyectada en el HTML.

El seed es repetible: actualiza las cuentas y vuelve a crear los posts y comentarios. Crea `author1` a `author5` (contraseña `AUTHOR_PASSWORD`), `reader1` a `reader3` (contraseña `READER_PASSWORD`), 20 ensayos (4 borradores) y 15 notes.

## Tests

```bash
npm test             # los tres niveles, en orden
npm run test:unit    # Vitest + Testing Library: helpers, cliente HTTP, sesión, Markdown, notes, validaciones
npm run test:api     # node:test + supertest: auth, CSRF, CORS, visibilidad de borradores, permisos, rate limit
npm run test:e2e     # Playwright: flujos del lector y del autor en Chromium
```

- Los tests de la API y los e2e usan una base aparte, `blog_api_test` (o `TEST_DATABASE_URL`), que `api/scripts/test-db.js` crea, migra y siembra antes de cada corrida. La base de desarrollo no se toca.
- Playwright levanta su propia API y frontends en los puertos 3100, 5183 y 5184, así que puede correr con los servidores de desarrollo abiertos. Necesita Chromium: `npx playwright install chromium`.
- `AUTH_RATE_LIMIT` sólo se usa en la API de los e2e, que inicia sesión más de 10 veces desde la misma IP.

## Probar la API con REST Client

`api/requests/*.http` (extensión REST Client de VS Code) recorre auth, posts, comentarios y CORS con casos felices y de error. Las contraseñas se leen de `api/.env` mediante `requests/.env`, un symlink.

## Decisiones y limitaciones

- Sin refresh token: al vencer los 60 minutos hay que volver a iniciar sesión. El logout borra la cookie, pero un token copiado sigue valiendo hasta su `exp` (JWT sin estado).
- Sin paginación: el índice muestra todos los ensayos publicados.
- Los comentarios son texto plano; los ensayos, Markdown sin HTML crudo (`react-markdown` sin `rehype-raw`). La API guarda el texto tal cual y el frontend lo escapa al mostrarlo.
- Los borradores locales del editor quedan en `localStorage` del navegador hasta el siguiente guardado exitoso.
- La contraseña admite hasta 72 bytes, por el límite de bcrypt.
- Sólo modo claro.
