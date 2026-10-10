# Revisión final

## Auditoría de consultas por ownerId

Toda consulta sobre datos privados filtra por `ownerId` en la misma sentencia. Un recurso ajeno responde 404.

| Ubicación | Consulta | Filtro |
| --- | --- | --- |
| `controllers/folders.js` | `findOwnedFolder`, listados de subcarpetas y archivos, `count` | `{ id, ownerId }`, `{ parentId, ownerId }`, `{ folderId, ownerId }` |
| `controllers/folders.js` | rename (`updateMany`), delete (`deleteMany`) | `{ id, ownerId }` |
| `controllers/files.js` | `findFirst`, `updateMany`, `deleteMany` | `{ id, ownerId }` |
| `controllers/shares.js` | carpeta, listado, `findFirst`, `deleteMany` | `ownerId: req.user.id` |
| `services/folder-tree.js` | CTE recursivas | el ancla filtra `"ownerId"` |
| `middlewares/locals.js`, `app.js` | carpeta raíz | `{ ownerId, parentId: null }` |
| `controllers/public-share.js` | vistas públicas | `ownerId` del link, y pertenencia al subárbol compartido |

Excepciones por diseño: `passport` (búsqueda por email y por id para autenticar), `shareLink.findUnique({ token })` (sólo distingue 404 de 410 y selecciona `id`), `AssetDeletionFailure` (no pertenece a un usuario) y `Session` (la gestiona el session store).

Resultado: sin hallazgos.

## Matriz de validaciones

| Campo | Regla | Cliente | Servidor |
| --- | --- | --- | --- |
| username | 3 a 20, `[a-z0-9_]`, se guarda en minúsculas, único | `pattern`, `minlength`, `maxlength` | `matches`, P2002 sobre `User_username_key` |
| email | requerido, válido, hasta 254, trim y minúsculas, único | `type=email`, requerido | `isEmail`, `isLength`, P2002 sobre `User_email_key` |
| password (alta) | 8 caracteres mínimo, 72 bytes máximo, nunca se trunca | `minlength`, `maxlength=72`, conteo de bytes, pegado bloqueado | `custom` por caracteres y `Buffer.byteLength` |
| passwordConfirmation | igual a password | `data-match` | `custom` |
| password (login) | requerido, hasta 72 bytes | requerido, bytes | `notEmpty`, `custom` bytes |
| nombre de carpeta | 1 a 100 tras trim, sin `/` ni `\`, único por padre (sensible a mayúsculas) | `maxlength`, `data-no-slashes` | `trim`, `isLength`, `custom`, P2002 sobre `Folder_parentId_name_key` |
| archivo (subida) | uno, hasta 10485760 bytes, extensión y MIME permitidos | `data-max-size`, `data-allowed-ext` | multer `limits` y `fileFilter`, `req.uploadError` |
| nombre base al subir | no vacío, hasta 200 | no | controlador |
| nuevo nombre de archivo | 1 a 200, sin `/` ni `\`, no parece extensión; la extensión guardada se agrega en el servidor | `maxlength`, `data-no-slashes`, `data-no-extension` | `fileRenameRules` |
| durationDays | uno de 1, 7, 15, 30 | `select` con esas opciones | `isIn` |
| ids de ruta y token | entero positivo, token existente y vigente | no aplica | `parseId`, 404 o 410 |

## Checklist de pruebas manuales ejecutado

Se ejecutó con curl contra la app levantada (puerto 3111), con los datos del seed y Cloudinary real. Todos los resultados coincidieron con lo esperado.

| Prueba | Esperado | Resultado |
| --- | --- | --- |
| Login válido | 302 | OK |
| Contraseña incorrecta | 422 | OK |
| Ruta privada sin sesión | 302 a /log-in | OK |
| `GET /log-out` | 404 | OK |
| Subcarpeta con nombre repetido | 422 | OK |
| Mismo nombre con otra capitalización | 302 | OK |
| Nombre con `/`, nombre de 101 caracteres | 422 | OK |
| Renombrar o borrar la raíz | 403 | OK |
| Otro usuario: carpeta, creación, links, archivo, descarga, borrado | 404 | OK |
| Subir txt | 302 | OK |
| Subir zip, subir sin archivo | 422 | OK |
| Renombrar a `Plan.pdf` | 422 | OK |
| Renombrar a `Plan final` | 302 | OK |
| Descarga y URL de Cloudinary | 302 y 200 | OK |
| Link con 5 días | 422 | OK |
| Link con 7 días | 302 | OK |
| Link público anónimo | 200 | OK |
| Token inexistente | 404 | OK |
| Link vencido | 410 | OK |
| Carpeta fuera del subárbol compartido, raíz del dueño | 404 | OK |
| Archivo dentro del subárbol y su descarga | 200 y 302 | OK |
| Borrar archivo | 302 | OK |
| Cerrar sesión (POST) y reintentar ruta privada | 302 y 302 | OK |

Verificado en fases anteriores: límite de 10 MB + 1 byte, MIME que no coincide, compensación ante falla de base, borrado de carpeta con assets, registro y reintento de `AssetDeletionFailure`, descarga de los 9 tipos con nombre renombrado.

## Pruebas tras aplicar la identidad visual

Se resembró la base (los assets de Cloudinary se habían borrado a mano) y se repitió el checklist anterior con curl, más comprobaciones del marcado nuevo: 68 de 69 correctas. La restante pide la URL de Cloudinary de un archivo recién borrado y recibe 200 desde la caché del CDN; la API de administración confirma que el asset ya no existe (limitación documentada en el README).

Pruebas en Chromium sin interfaz (Playwright, fuera de las dependencias del proyecto), a 1280 px y 390 px:

| Prueba | Resultado |
| --- | --- |
| Tipografías locales cargadas, colores y medidas de los botones | OK |
| Nombres sin subrayado, carpetas en negrita, un icono por fila | OK |
| `validate.js`: alta con 4 errores, `/` en nombre de carpeta, subida sin archivo, extensión al renombrar | OK |
| El error ocupa el lugar de la ayuda y la ayuda vuelve al corregir | OK |
| Modal de borrado: abre sin navegar, cierra con Cancel, Escape y clic fuera; el clic dentro no lo cierra | OK |
| Sin JavaScript, "Delete folder" lleva a la página de confirmación | OK |
| `copy.js`: el link llega al portapapeles y el botón muestra "Copied" | OK |
| Detalle de archivo: "Rename" alineado al borde derecho con "Delete file" | OK |
| Botones de fila en Share links: 28 px de alto, texto de 13 px | OK |
| 390 px: sin desplazamiento horizontal de página en carpeta, archivo, links y vista pública | OK |

No verificado: `password-limit.js` (pegado y límite de 72 bytes), la accesibilidad con lector de pantalla y otros navegadores además de Chromium.

## Pruebas tras pasar los formularios a modales y separar secciones en paneles

"New folder", "Upload file" y "Rename" abren un `<dialog>` modal; cada sección va en un panel blanco con título. Checklist con curl: 90 de 91 correctas (la restante es la misma de la caché del CDN de Cloudinary). Pruebas en Chromium sin interfaz: 44 de 46; las dos restantes son del script (un conteo esperado desactualizado y las respuestas 404, 410 y 422 intencionales que la consola registra como error).

| Prueba | Resultado |
| --- | --- |
| Los tres modales abren sin navegar, con foco en el campo; "Rename" trae el nombre actual | OK |
| Cierre con Cancel, Escape y clic fuera; arrastrar una selección desde el campo hacia fuera no lo cierra | OK |
| Validación en cliente dentro del modal: `/` y `\` en nombres, subida sin archivo | OK |
| Error del servidor (422): la página vuelve con el modal abierto, el error y el valor enviado | OK |
| Crear carpeta, subir archivo, renombrar y borrar carpeta desde los modales | OK |
| Sin JavaScript, cada botón lleva a su página (`/folders/:id/new`, `/upload`, `/rename`) | OK |
| Sin JavaScript, un envío fallido muestra el diálogo abierto con el error y "Cancel" vuelve a la carpeta | OK |
| Páginas de respaldo: 403 para renombrar la raíz, 404 para carpetas de otro usuario | OK |
| 390 px: sin desplazamiento horizontal de página | OK |

Durante estas pruebas apareció un defecto previo: tras subir un archivo desde el navegador, el aviso de éxito no se mostraba porque el navegador seguía la redirección antes de que la sesión terminara de guardarse. Ahora la sesión se guarda antes de redirigir cuando hay un aviso pendiente.
