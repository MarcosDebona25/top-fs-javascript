# File Uploader

Proyecto de The Odin Project: una aplicación web donde cada usuario administra su propio árbol de carpetas y archivos, y puede compartir carpetas mediante links públicos con vencimiento.

## Funcionalidades

- Registro, inicio y cierre de sesión (sesiones persistidas en PostgreSQL).
- Carpeta raíz "My Drive" por usuario, subcarpetas anidadas, breadcrumbs.
- Crear, renombrar y borrar carpetas (el borrado es en cascada y pide confirmación).
- Subir archivos (hasta 10 MB), ver su detalle, renombrarlos, descargarlos y borrarlos.
- Links compartidos de carpeta con duración de 1, 7, 15 o 30 días, vistas públicas de solo lectura y página 410 para links vencidos.
- Validaciones inline en cliente y servidor.

## Stack y versiones fijadas

- Node.js con CommonJS, Express 5, EJS.
- PostgreSQL 16, Prisma 7.10.0 con `prisma-client-js` y `@prisma/adapter-pg` (PrismaPg).
- passport, passport-local, express-session, `@quixo3/prisma-session-store`, bcryptjs.
- multer (memoryStorage), cloudinary v2, express-validator, dotenv.

Las versiones de `prisma`, `@prisma/client` y `@prisma/adapter-pg` están fijadas en `7.10.0` sin `^`. No usar `prisma@latest`: una versión mayor puede cambiar el formato de configuración y el comportamiento del cliente.

## Requisitos

- Node.js 20 o superior y npm.
- PostgreSQL 16 en ejecución local.
- Una cuenta gratuita de Cloudinary.

## Base de datos

Crear el usuario y la base con psql:

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE fileuploader WITH LOGIN PASSWORD 'fileuploader' CREATEDB;
CREATE DATABASE file_uploader OWNER fileuploader;
SQL
```

`CREATEDB` es necesario para que `prisma migrate dev` pueda crear su base sombra.

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión, por ejemplo `postgresql://fileuploader:fileuploader@localhost:5432/file_uploader`. |
| `SESSION_SECRET` | Cadena larga y aleatoria. La app no arranca sin ella. |
| `CLOUDINARY_CLOUD_NAME` | Nombre de la nube. |
| `CLOUDINARY_API_KEY` | API key. |
| `CLOUDINARY_API_SECRET` | API secret. |

`PORT` es opcional (por defecto 3000). El archivo `.env` está en `.gitignore`.

## Instalación, migraciones, seed y ejecución

```bash
npm install
npx prisma migrate deploy   # aplica las migraciones existentes
npx prisma generate         # genera el cliente
npx prisma db seed          # opcional, requiere credenciales de Cloudinary
npm run dev                 # PostgreSQL + node --watch
```

Scripts:

- `npm run dev`: inicia PostgreSQL (con `sudo service postgresql start`), ejecuta la app con `node --watch` y detiene PostgreSQL al salir. Pide la contraseña de sudo.
- `npm start`: ejecuta la app sin watch (PostgreSQL ya debe estar activo).
- `npm run seed`: equivale a `npx prisma db seed`.
- `npm run assets:retry`: reintenta el borrado en Cloudinary de los assets registrados en `AssetDeletionFailure` y elimina las filas resueltas. Termina con código 1 si queda alguno pendiente.

Para desarrollar el schema usar `npx prisma migrate dev`.

## Credenciales del seed

El seed es repetible: borra los usuarios del seed, todas las sesiones y los registros de `AssetDeletionFailure`, y vuelve a crear los datos. Los archivos se suben a Cloudinary bajo `file-uploader/seed/`.

| Usuario | Email | Contraseña |
| --- | --- | --- |
| alice | alice@example.com | Seed-Pass-2026 |
| bob | bob@example.com | Seed-Pass-2026 |
| carol | carol@example.com | Seed-Pass-2026 |

Links compartidos del seed (carpetas de alice):

- Vigente: `/share/5f0c6a3e-7d1b-4b52-9c3a-2f6a0e1d8a01`
- Vencido (responde 410): `/share/8b2e41c7-3a9d-4f6e-b1c5-9d7e5a2c4b02`

## Decisiones y limitaciones

- No se pueden mover carpetas ni archivos.
- No se puede cambiar la extensión de un archivo al renombrarlo. Un nombre base que termina en un punto y 1 a 5 caracteres alfanuméricos con al menos una letra (por ejemplo `informe.pdf`) se rechaza.
- Las URLs de Cloudinary son públicas y difíciles de adivinar; las URLs privadas (autenticadas) no están implementadas.
- El vencimiento de un link no revoca el acceso a las URLs de Cloudinary ya copiadas. Tampoco el borrado inmediato de la caché del CDN.
- Límite de 10 MB por archivo. Tipos permitidos: PNG, JPG, JPEG, WEBP, GIF, PDF, TXT, DOCX y XLSX. Los archivos comprimidos no están permitidos.
- La contraseña admite hasta 72 bytes, por el límite de bcrypt. Nunca se trunca; el campo bloquea el pegado para evitar entradas más largas.
- No se valida el contenido real de los archivos (magic bytes), sólo extensión y MIME.
- Sin protección CSRF por tokens (se usa `sameSite=lax` en la cookie de sesión).
- Si el borrado de un asset en Cloudinary falla, la fila se elimina igual y el fallo queda registrado para `npm run assets:retry`.
- Los archivos `.jpeg` se descargan con la extensión `.jpg` porque Cloudinary normaliza el formato.

## Abrir Prisma Studio desde el navegador de Windows

Prisma Studio corre dentro de WSL:

```bash
npx prisma studio --port 5555 --browser none
```

Abrir `http://localhost:5555` en el navegador de Windows (WSL2 reenvía `localhost`). Si no carga, obtener la IP de WSL con `hostname -I` y abrir `http://<ip>:5555`.
