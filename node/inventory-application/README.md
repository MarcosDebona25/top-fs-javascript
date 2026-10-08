# Axle Supply — Parts inventory

Aplicación local de inventario de repuestos para una tienda ficticia, construida como proyecto de **The Odin Project** (fase de Node.js). Marca: **Axle Supply**, subtítulo *Parts inventory*. Interfaz en inglés, precios en USD.

---

## 1. Alcance

### Incluido en esta iteración

- **Categorías:** CRUD completo con borrado definitivo (solo cuando están vacías).
- **Repuestos:** creación, consulta, edición y **borrado lógico por archivado**; los archivados pueden restaurarse y conservan datos e historial.
- **Movimientos de stock:** entradas (*receipt*), salidas (*dispatch*) y ajustes por **cantidad contada** (*adjustment*).
- **Catálogo:** búsqueda por nombre, SKU y marca (sin distinguir mayúsculas); filtros por categoría, disponibilidad y estado (`status=active|archived`); paginación de 20 piezas.
- **Acceso público:** consultar el catálogo y crear categorías o repuestos.
- **Acceso con contraseña administrativa:** editar y eliminar categorías, archivar y restaurar repuestos, y registrar movimientos.
- Aplicación reproducible en local, con pruebas automatizadas sobre PostgreSQL real.

### Fuera de esta iteración

Compras, ventas, facturación, cuentas de usuario y compatibilidad con vehículos. El despliegue queda para una fase posterior.

### ¿Por qué sin ORM?

Esta fase de The Odin Project pide trabajar los fundamentos: se usan **consultas SQL directas** con el driver `pg` y se administra la base con `psql`. No hay ORM, migraciones automáticas ni generación de esquemas: el esquema vive en `db/schema.sql` y cada consulta es explícita y parametrizada. Esto hace visible el modelo relacional, el bloqueo de filas y las transacciones que exige la lógica de inventario.

---

## 2. Stack

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 24 (vía `nvm`, fijado en `.nvmrc`) |
| Lenguaje | JavaScript, CommonJS |
| Servidor | Express 5 |
| Vistas | EJS (renderizado desde el servidor) |
| Validación | `express-validator` |
| Base de datos | PostgreSQL 16 (cluster local en `127.0.0.1:5433`) |
| Driver | `pg` (pool + clientes por transacción) |
| Sesión/CSRF | `cookie-session` + `csrf-sync` (estado anónimo firmado, sin tabla de sesiones) |
| Seguridad | `helmet`, `crypto.timingSafeEqual`, límite de intentos de contraseña |
| Pruebas | `node:test` + `supertest` contra `axle_supply_test` |
| Estilos | CSS propio, fuentes alojadas localmente |

Sin dependencias de CDN, sin fotos, sin JavaScript obligatorio en el navegador: todos los formularios funcionan con JS deshabilitado.

---

## 3. Cuentas de prueba y credenciales

| Uso | Usuario / valor | Contraseña |
|---|---|---|
| Contraseña administrativa (POST protegidos) | — | `axle-admin` |
| Base de datos (app y tests) | `inventory_app` | `inventory_app` |
| Superusuario del cluster (solo administración) | `postgres` | `postgres` |

- La contraseña administrativa se configura con `ADMIN_PASSWORD` en `.env`. Se verifica **en cada POST protegido** (editar/eliminar categorías, archivar/restaurar repuestos, registrar movimientos) mediante digests de longitud fija y `crypto.timingSafeEqual`. No se guarda en cookies, no se devuelve en HTML ni se registra en logs; no existe estado de "administrador autenticado" entre acciones.
- Acceso público (sin contraseña): navegar, crear categorías y crear repuestos.
- Conexión: `postgresql://inventory_app:inventory_app@127.0.0.1:5433/axle_supply` (desarrollo) y `.../axle_supply_test` (pruebas).

---

## 4. Preparación del entorno

### 4.1 Node 24

```bash
nvm use 24        # el proyecto incluye .nvmrc con la versión 24
```

### 4.2 Cluster PostgreSQL 16 dedicado

Se inicializa dentro de `.local/postgres` (excluido de Git), escuchando en `127.0.0.1:5433` con autenticación por contraseña para TCP:

```bash
export PGBIN=/usr/lib/postgresql/16/bin
cd <raíz-del-proyecto>

# Inicializar el cluster (una sola vez)
mkdir -p .local/postgres
$PGBIN/initdb -D .local/postgres -U postgres --encoding=UTF8 --locale=C.UTF-8

# Configurar: port = 5433, listen_addresses = '127.0.0.1',
# unix_socket_directories = '<raíz-del-proyecto>/.local' en postgresql.conf,
# y en pg_hba.conf: local = trust, host 127.0.0.1/32 = scram-sha-256

# Iniciar / detener
$PGBIN/pg_ctl -D .local/postgres -l .local/postgres/server.log start
$PGBIN/pg_ctl -D .local/postgres stop

# Crear rol y bases (por el socket local, antes de exigir contraseña en TCP)
$PGBIN/psql -h .local -p 5433 -U postgres \
  -c "ALTER USER postgres PASSWORD 'postgres';"
$PGBIN/psql -h .local -p 5433 -U postgres \
  -c "CREATE ROLE inventory_app LOGIN PASSWORD 'inventory_app';"
$PGBIN/psql -h .local -p 5433 -U postgres \
  -c "CREATE DATABASE axle_supply OWNER inventory_app;"
$PGBIN/psql -h .local -p 5433 -U postgres \
  -c "CREATE DATABASE axle_supply_test OWNER inventory_app;"
```

### 4.3 Configuración de la aplicación

```bash
npm install
cp .env.example .env     # ajustar valores si es necesario
```

Variables: `DATABASE_URL`, `TEST_DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `PORT`, `NODE_ENV`.

### 4.4 Esquema y datos iniciales

```bash
# Aplicar el esquema (una sola transacción; se revierte si falla)
$PGBIN/psql "$DATABASE_URL" --single-transaction --set ON_ERROR_STOP=1 -f db/schema.sql

# Cargar el seed determinista (categorías, 24 piezas, movimientos)
npm run db:seed
```

---

## 5. Comandos del proyecto

| Comando | Función |
|---|---|
| `npm run dev` | Servidor en modo desarrollo con recarga (`--watch`) |
| `npm start` | Servidor en producción |
| `npm test` | Suite de pruebas sobre `axle_supply_test` |
| `npm run db:seed` | Seed determinista (idempotente) |

El servidor escucha en `http://127.0.0.1:3000` por defecto. Si el puerto está ocupado, cambia la variable `PORT` (p. ej. `PORT=3100 npm start`); el proceso avisa y termina con un mensaje claro si el puerto ya está en uso.

La suite **rechaza** configuraciones que apunten a la base de desarrollo: exige `TEST_DATABASE_URL` con la base `axle_supply_test` y aísla sus fixtures antes de cada prueba.

---

## 6. Modelo de datos

Cada repuesto pertenece a **una** categoría; cada categoría contiene **cero o muchos** repuestos; cada repuesto tiene **cero o muchos** movimientos.

```mermaid
erDiagram
    CATEGORIES ||--o{ ITEMS : "contiene (1:N, ON DELETE RESTRICT)"
    ITEMS ||--o{ STOCK_MOVEMENTS : "registra (1:N, ON DELETE RESTRICT)"

    CATEGORIES {
        int id PK
        string name UK "VARCHAR(80); único sin distinguir mayúsculas (índice sobre lower(name)); 2–80 caracteres"
        text description "TEXT; máximo 1000 caracteres; vacío por defecto"
        timestamptz created_at "obligatorio"
        timestamptz updated_at "último cambio"
    }

    ITEMS {
        int id PK
        int category_id FK "obligatoria"
        string sku UK "VARCHAR(40); único incluso entre archivados; 3–40 caracteres; empieza con letra o dígito; normalizado a MAYÚSCULAS"
        string name "VARCHAR(120); 2–120 caracteres"
        string brand "VARCHAR(80); obligatorio"
        string part_number "VARCHAR(60); opcional"
        text description "TEXT; máximo 1000 caracteres"
        decimal unit_price "NUMERIC(10,2); >= 0; se envía como cadena decimal validada"
        int stock_quantity "INTEGER; 0 por defecto; nunca negativo"
        timestamptz archived_at "nulo mientras está activo; archivado implica stock 0"
        timestamptz created_at "obligatorio"
        timestamptz updated_at "se actualiza explícitamente en cada cambio"
    }

    STOCK_MOVEMENTS {
        int id PK
        int item_id FK "obligatoria"
        string type "VARCHAR(20); receipt | dispatch | adjustment"
        int delta "INTEGER; distinto de cero; receipt > 0, dispatch < 0, adjustment en cualquier dirección"
        int stock_before "INTEGER; nunca negativo"
        int stock_after "INTEGER; nunca negativo; siempre = stock_before + delta"
        string reason "VARCHAR(250); obligatorio y no vacío"
        uuid request_id UK "UUID único; evita aplicar dos veces un mismo envío"
        timestamptz created_at "obligatorio"
    }
```

**Índices adicionales:** `items(category_id)` para listar piezas por categoría y `stock_movements(item_id, created_at DESC)` para el historial por pieza y fecha.

### Secuencia de procesamiento de un movimiento

```mermaid
flowchart TD
    A[Validar campos, contraseña y token CSRF] --> B[Abrir transacción y bloquear la fila<br/>SELECT … FOR UPDATE]
    B --> C{¿El repuesto existe<br/>y está activo?}
    C -- No existe --> Z1[404]
    C -- Archivado --> Z2[409: restaurar primero]
    C -- Sí --> D{¿request_id ya<br/>procesado?}
    D -- Sí --> E[Confirmar sin cambios:<br/>idempotencia]
    D -- No --> F[Calcular delta con el stock vigente]
    F --> G{¿Cantidad válida y<br/>stock suficiente?}
    G -- No --> Z3[409: explicar cómo resolverlo]
    G -- Sí --> H[Insertar movimiento y<br/>actualizar stock_quantity]
    H --> I[Confirmar ambos cambios juntos]
    I --> J[Redirección 303 + aviso]
    G -- Fallo inesperado --> K[Revertir todo<br/>ROLLBACK]
    H -- Fallo inesperado --> K
```

Cada movimiento usa **un mismo cliente de `pg`** para todas las consultas de la transacción, y el bloqueo de fila serializa los cambios simultáneos sobre una pieza. En un ajuste, el administrador ingresa la cantidad contada: pasar de 12 registradas a 9 contadas genera un movimiento de −3; si ambas cantidades coinciden, se informa que el stock ya coincide sin crear movimiento.

### Reglas de inventario

- Un repuesto creado desde la web comienza con **stock cero**; los formularios de creación y edición **no** permiten modificar el stock directamente.
- **Entrada:** delta positivo. **Salida:** delta negativo (se rechaza si supera el stock). **Ajuste:** el administrador ingresa la *cantidad contada*; pasar de 12 registradas a 9 contadas genera un movimiento de −3. Si coincide con el stock actual, se informa sin crear movimiento.
- **Secuencia transaccional** de cada movimiento: validar campos, contraseña y token CSRF → abrir transacción y bloquear la fila (`SELECT … FOR UPDATE`) → verificar que está activo y reconocer `request_id` ya procesados → calcular con el stock vigente → rechazar cantidades inválidas o stock insuficiente → insertar movimiento y actualizar `stock_quantity` → confirmar ambos cambios juntos (o revertirlos).
- **Archivo:** solo con stock cero; los archivados no admiten movimientos hasta restaurarse; su metadata y categoría siguen editables con contraseña; el SKU y todo el historial se conservan.
- **Categorías:** una categoría con repuestos activos o archivados no puede eliminarse; la confirmación muestra las piezas que la bloquean.
- `updated_at` se actualiza explícitamente en cada cambio.

---

## 7. Rutas

Todas las vistas se renderizan desde el servidor; los formularios usan GET y POST. Las rutas `/new` se registran antes de las rutas con `:id`.

| Método | Ruta | Función |
|---|---|---|
| GET | `/` | Portada con categorías y cantidad de piezas activas |
| GET | `/categories/new` | Formulario de categoría |
| POST | `/categories` | Crear categoría (público) |
| GET | `/categories/:id` | Categoría y sus piezas activas |
| GET / POST | `/categories/:id/edit` | Formulario / guardar cambios (POST protegido) |
| GET / POST | `/categories/:id/delete` | Confirmar / eliminar categoría vacía (POST protegido) |
| GET | `/items` | Catálogo con búsqueda, filtros y paginación |
| GET | `/items/new` | Formulario de repuesto |
| POST | `/items` | Crear repuesto con stock cero (público) |
| GET | `/items/:id` | Ficha: placa de identificación, disponibilidad e historial |
| GET / POST | `/items/:id/edit` | Formulario / guardar cambios (POST protegido) |
| GET / POST | `/items/:id/archive` | Confirmar / archivar (POST protegido) |
| GET / POST | `/items/:id/restore` | Confirmar / restaurar (POST protegido) |
| GET | `/items/:id/movements/new?type=…` | Formulario del movimiento elegido |
| POST | `/items/:id/movements` | Registrar movimiento (protegido) |

### Respuestas y errores

| Situación | Código |
|---|---|
| Operación exitosa | **303** + aviso de texto predefinido |
| Datos inválidos o duplicados | **422** con errores por campo y valores conservados |
| Contraseña ausente/incorrecta o CSRF inválido | **403** |
| Recurso inexistente | **404** |
| Stock insuficiente, archivo bloqueado, categoría ocupada | **409** con explicación de cómo resolverlo |
| Fallo inesperado | **500** con mensaje general y registro técnico en el servidor |

La contraseña queda vacía tras cualquier error; ninguna solicitud GET modifica datos.

---

## 8. Seguridad

- **CSRF** en todos los POST mediante `cookie-session` + `csrf-sync`; la cookie contiene únicamente estado anónimo para CSRF, firmada, `HttpOnly` y `SameSite=Lax` (`Secure` con HTTPS). El token viaja en un campo oculto del formulario.
- **Contraseña administrativa** verificada por digest con `crypto.timingSafeEqual`; límite de **10 intentos fallidos por IP cada 15 minutos**.
- `helmet`, límite de tamaño de cuerpo (100 KB), escape de contenido vía EJS y consultas 100 % parametrizadas.

---

## 9. Recorrido de demostración

1. Abrir `http://127.0.0.1:3000/` → portada con las 7 categorías y sus cantidades.
2. Entrar en **Braking** → 4 piezas activas. Abrir una pieza → placa de identificación, panel de stock e historial.
3. En una pieza, registrar una **entrada de 10**, una **salida de 3** y un **ajuste a 5** → stock final 5 e historial `+10, −3, −2`.
4. Intentar una salida mayor al stock → **409** con la explicación.
5. Intentar archivar una pieza con stock positivo → **409**; ajustar el conteo a 0, archivar → los movimientos quedan bloqueados hasta **restaurar**.
6. Intentar eliminar una categoría con piezas → **409** mostrando las piezas que la bloquean; crear una categoría vacía y eliminarla → éxito.
7. Enviar un POST protegido con contraseña incorrecta → **403**; tras 10 fallos, el límite de tasa bloquea la IP por 15 minutos.

---

## 10. Pruebas

`npm test` ejecuta `node:test` + `supertest` contra `axle_supply_test` (PostgreSQL real). Cubre: CRUD y duplicados (categorías sin distinción de mayúsculas, SKUs), validaciones, movimientos con su secuencia `+10 −3 −2`, rechazo de salidas inválidas, reversión conjunta stock+movimiento, concurrencia (una unidad y dos salidas simultáneas: solo una se acepta), idempotencia por `request_id`, coherencia entre stock almacenado y la suma de movimientos, archivo/restauración, protección por contraseña y CSRF, filtros, paginación, estados vacíos y persistencia. El seed es idempotente: repetirlo no duplica movimientos ni altera piezas existentes.

---

## 11. Estructura del proyecto

```
inventory-application/
├── app.js               # aplicación Express (middleware, rutas, errores)
├── server.js            # inicia el servidor (separado para Supertest)
├── db/
│   ├── pool.js          # pool de conexiones
│   ├── categories.js    # consultas parametrizadas de categorías
│   ├── items.js         # catálogo, búsqueda y paginación en SQL
│   ├── movements.js     # historial de movimientos
│   ├── schema.sql       # tablas, restricciones e índices
│   └── seed.js          # seed determinista (npm run db:seed)
├── routes/              # declaración de URLs y middleware por ruta
├── controllers/         # solicitudes, renderizados y redirecciones
├── validators/          # validación con express-validator
├── services/            # transacciones de movimientos, archivo y restauración
├── lib/                 # errores HTTP, contraseña+rate limit, CSRF, flash, paginación
├── views/               # plantillas EJS y parciales compartidos
├── public/              # estilos, fuentes e iconos
└── test/                # node:test + supertest sobre axle_supply_test
```
