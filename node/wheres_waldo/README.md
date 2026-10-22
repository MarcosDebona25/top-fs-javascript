# Where's Waldo?

Proyecto de The Odin Project: un juego de fotos para encontrar personajes. El jugador elige una de tres escenas (**Beach**, **Ski Slopes** y **Moon Base**), pulsa Start y tiene que encontrar a Waldo, Woof, Wenda, Wizard Whitebeard y Odlaw. El tiempo lo mide y lo calcula el servidor.

> Estado: sin deploy todavía. Los hitboxes del repositorio son **provisorios** hasta que se calibren (ver más abajo).

## Funcionalidades

**Juego**

- Modal previo al inicio que anuncia la regla: **+1 s por cada selección equivocada**. El reloj arranca al pulsar Start.
- La imagen se ajusta al ancho y admite zoom y desplazamiento (rueda, botones, teclado y pellizco en móvil). Se sirve en AVIF/WebP con `srcset`.
- Un click abre un círculo (anillo rojo y blanco) con el menú de personajes; en móvil el menú es una hoja inferior. Los personajes encontrados quedan marcados.
- Al encontrar los cinco, la pantalla de resultado muestra el tiempo (`m:ss.mmm`), las penalizaciones y la posición en la escena y en el ranking global.
- Salir con **Quit** o **Scenes** abandona la partida en el servidor: no se guarda ningún tiempo y esa partida no puede completarse después.

**Cuentas (opcionales)**

- Usuario de 3 a 20 caracteres `[A-Za-z0-9_-]`, único sin distinguir mayúsculas, con chequeo de disponibilidad mientras se escribe. Contraseña de 8 caracteres o más, con confirmación. Sin email. La sesión dura 7 días.
- Un invitado juega y ve su tiempo, pero no queda registrado. Un usuario registrado guarda todas sus partidas y los rankings usan su mejor tiempo por escena.

**Rankings**

- La portada muestra la tabla global (`Player | Beach | Ski Slopes | Moon Base | Total`; los jugadores con escenas sin completar van al final con "n/a") y el top 10 de cada escena. Se actualizan en vivo por Server-Sent Events.
- Rankings completos y paginados, global y por escena.

**Anti-trampa**

- Los rectángulos de los personajes nunca viajan al cliente: cada click se valida en el servidor.
- Una partida más rápida que `MIN_GAME_MS` de tiempo real se rechaza y no entra al ranking.
- Límites de intentos para registro/login, inicio de partidas y selecciones.

## Estructura

```
wheres_waldo/
  api/        Express 5, express-validator, Prisma 7.10 + PostgreSQL, passport-local, express-session
  client/     Vite + React 19 + react-router, Vitest + Testing Library, Playwright (client/e2e)
  assets/     Originales: mapas (assets/maps) y recortes de personajes (assets/characters)
  scripts/    build-images.mjs: genera las variantes AVIF/WebP con sharp
  reference/  Material de referencia (imágenes originales y enunciado). Ignorado por git
```

Es un monorepo con npm workspaces: un solo `npm install` en esta carpeta instala todo. La documentación de la API (reglas, endpoints y formas de respuesta) está en [`api/README.md`](api/README.md).

## Requisitos

- Node.js 20 o superior y npm.
- PostgreSQL 16 en ejecución local.

## Base de datos

```bash
sudo -u postgres psql -c "CREATE ROLE wheres_waldo LOGIN PASSWORD 'wheres_waldo' CREATEDB"
sudo -u postgres psql -c "CREATE DATABASE wheres_waldo OWNER wheres_waldo"
```

`CREATEDB` hace falta para la base de tests (`wheres_waldo_test`) y la de los e2e (`..._e2e`).

El seed crea las escenas, los personajes y también 12 jugadores ficticios con partidas completas, para que los rankings tengan datos creíbles desde el primer arranque.

## Variables de entorno

Copiar `api/.env.example` a `api/.env` y generar el secreto como explica el archivo. Las más importantes:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Conexión a `wheres_waldo`. |
| `SESSION_SECRET` | 64 bytes aleatorios en hex (mínimo 64 caracteres). |
| `CORS_ORIGINS` | Orígenes permitidos, separados por coma (`http://localhost:5173` por defecto). |
| `COOKIE_SECURE` | `true` salvo en `http://localhost`, donde el navegador no guarda cookies `Secure`: usar `false` en desarrollo. |
| `MIN_GAME_MS` | Tiempo real mínimo para que una partida cuente (5000). |
| `WRONG_GUESS_PENALTY_MS` | Penalización por selección errónea (1000). |
| `HIT_MARGIN` | Margen extra alrededor de cada rectángulo, como fracción de la imagen (0.005). |
| `TRUST_PROXY` | Cantidad de proxies delante de la API, para el deploy. |

El resto (límites de intentos, latido del SSE, puerto) está comentado en `.env.example`. Los `.env` están en `.gitignore`.

## Instalación y ejecución

```bash
npm install
cd api && npx prisma migrate deploy && npm run seed && cd ..

npm run dev:api      # inicia PostgreSQL y la API en http://localhost:3000
npm run dev:client   # inicia PostgreSQL si hace falta y el cliente en http://localhost:5173 (proxy de /api hacia la API; API_URL lo cambia)
```

Ambos comandos arrancan PostgreSQL cuando no está en marcha (`scripts/start-db.sh`); `dev:api` además lo detiene al salir. `npm run build:client` genera `client/dist/`.

## Calibrar los hitboxes

`api/prisma/data/hitboxes.json` trae un rectángulo por personaje y escena, pero **los valores del repositorio son provisorios** (`"calibrated": false`): están apilados en la esquina superior izquierda de cada imagen y no son las posiciones reales. Mientras tanto, `GET /api/maps` informa `calibrated: false` y el modal de inicio lo avisa en desarrollo.

1. Con la API y el cliente corriendo, abrir `http://localhost:5173/dev/calibrate` (la ruta sólo existe en desarrollo).
2. Elegir la escena y el personaje. La vista arranca en **Move**: arrastrar desplaza y la rueda hace zoom. Pasar a **Draw box** y arrastrar un rectángulo alrededor del personaje. También se puede mantener Espacio para desplazar mientras se dibuja.
3. Pulsar **Download file** (o **Copy JSON**) y reemplazar `api/prisma/data/hitboxes.json` con el resultado.
4. Volver a sembrar: `npm run seed -w api`.

Los rectángulos son fracciones de la imagen (0 a 1), así que valen a cualquier tamaño de pantalla.

## Imágenes

Los originales están en `assets/`. Para regenerar las variantes web (AVIF/WebP a 640/1024/1600/2560 px, más un placeholder diminuto, y los personajes) tras editar un original:

```bash
npm run build:images
```

El resultado queda en `client/public/img/` y se versiona.

## Tests

```bash
npm test             # cliente y API, en orden
npm run test:client  # Vitest + Testing Library: utilidades, componentes y páginas con fetch simulado
npm run test:api     # Jest + Supertest: auth, juego, rankings, SSE, que ninguna respuesta filtre coordenadas
npm run test:e2e     # Playwright: invitado, registro, login, ranking en vivo, móvil y calibración
```

- Los tests de la API usan una base aparte (`DATABASE_URL` con `_test`, o `TEST_DATABASE_URL`) que `api/scripts/test-db.js` crea, migra y siembra. Los e2e crean y siembran otra (`E2E_DATABASE_URL`, o `..._e2e`) con rectángulos conocidos, nunca los provisorios.
- Playwright necesita Chromium: `npx playwright install chromium`, y una PostgreSQL accesible.
- `client/playwright.config.js` reintenta hasta 2 veces: en WSL el reloj de pared puede retroceder más de un segundo en plena partida y el servidor la tomaría por instantánea.

## Decisiones y limitaciones

- Los tiempos son del servidor, con reloj de pared. Un salto del reloj del sistema durante una partida puede falsear su duración.
- Sin CSRF explícito: la cookie es `HttpOnly` y `SameSite=Lax`, y CORS está limitado a la lista de orígenes.
- La contraseña admite hasta 72 bytes, por el límite de bcrypt.
- En móvil la escena empieza ajustada al ancho, así que el jugador hace zoom por su cuenta.
- `npm audit` marca dos hallazgos altos dentro de las herramientas de `prisma@7.10.0` (la misma versión que usa Blog API).
- Sólo modo claro. Interfaz en inglés.

---

Hecho por [MarcosDebona25](https://github.com/MarcosDebona25).
