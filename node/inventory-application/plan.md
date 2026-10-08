# Axle Supply: plan de la aplicación de inventario

## 1\. Objetivo y decisiones generales

Construir una aplicación local de inventario para una tienda ficticia de repuestos, como proyecto de The Odin Project. Permitirá explorar categorías y piezas, gestionar sus datos y registrar entradas, salidas y ajustes de stock.

Decisiones acordadas:

- **Marca:** Axle Supply. Subtítulo: “Parts inventory”.
- **Interfaz:** inglés; precios en USD.
- **Categorías:** CRUD completo con borrado definitivo.
- **Repuestos:** creación, consulta, edición y borrado lógico mediante archivado; podrán restaurarse.
- **Movimientos:** entradas, salidas y ajustes mediante cantidad contada.
- **Acceso público:** consultar y crear categorías o repuestos.
- **Contraseña administrativa:** editar, eliminar categorías, archivar, restaurar y registrar movimientos.
- **Entrega actual:** aplicación local reproducible. El despliegue queda para una fase posterior.

La versión inicial manejará cantidades actuales e historial manual. Compras, ventas, facturación, cuentas de usuario y compatibilidad con vehículos quedan fuera de esta iteración.

**Stack:** Node.js 24 mediante `nvm`, JavaScript CommonJS, Express 5, EJS, `express-validator`, PostgreSQL 16 y `pg`. Consultas SQL directas y administración mediante `psql`. CSS propio y JavaScript del navegador como mejora opcional.

## 2\. Modelo de datos y reglas de inventario

Cada repuesto pertenece a **una categoría**. Cada categoría contiene **cero o muchos repuestos**. Cada repuesto tiene **cero o muchos movimientos**.

### Tabla `categories`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | Integer identity | Clave primaria |
| `name` | Varchar(80) | Obligatorio; entre 2 y 80 caracteres |
| `description` | Text | Máximo 1000 caracteres; vacío por defecto |
| `created_at` | Timestamptz | Fecha de creación obligatoria |
| `updated_at` | Timestamptz | Fecha del último cambio obligatoria |

El nombre será único sin distinguir mayúsculas y minúsculas, mediante un índice sobre su versión en minúsculas. Se eliminarán espacios exteriores antes de guardar.

### Tabla `items`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | Integer identity | Clave primaria |
| `category_id` | Integer | FK obligatoria a `categories`; borrado restringido |
| `sku` | Varchar(40) | Obligatorio y único, incluso entre archivados |
| `name` | Varchar(120) | Obligatorio; entre 2 y 120 caracteres |
| `brand` | Varchar(80) | Obligatorio |
| `part_number` | Varchar(60) | Código del fabricante opcional |
| `description` | Text | Máximo 1000 caracteres; vacío por defecto |
| `unit_price` | Numeric(10,2) | Obligatorio; mayor o igual a cero |
| `stock_quantity` | Integer | Obligatorio; cero por defecto; nunca negativo |
| `archived_at` | Timestamptz | Nulo mientras esté activo |
| `created_at` | Timestamptz | Fecha de creación obligatoria |
| `updated_at` | Timestamptz | Fecha del último cambio obligatoria |

El SKU tendrá entre 3 y 40 caracteres, comenzará con una letra o número y admitirá letras, números y guiones. Se normalizará a mayúsculas.

Los importes se enviarán a PostgreSQL como cadenas decimales validadas, conservando la precisión de `numeric`.

### Tabla `stock_movements`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | Integer identity | Clave primaria |
| `item_id` | Integer | FK obligatoria a `items`; borrado restringido |
| `type` | Varchar(20) | `receipt`, `dispatch` o `adjustment` |
| `delta` | Integer | Cambio de unidades; distinto de cero |
| `stock_before` | Integer | Cantidad anterior; nunca negativa |
| `stock_after` | Integer | Cantidad resultante; nunca negativa |
| `reason` | Varchar(250) | Motivo obligatorio y no vacío |
| `request_id` | UUID | Único; evita aplicar dos veces un envío |
| `created_at` | Timestamptz | Fecha obligatoria |

Restricciones adicionales:

- Una entrada tiene `delta` positivo; una salida, negativo.
- Un ajuste puede sumar o restar.
- Cada registro cumple `stock_after = stock_before + delta`.
- Un repuesto archivado debe tener stock cero.
- Índices para piezas por categoría y movimientos por pieza y fecha.
- `updated_at` se actualizará explícitamente en cada cambio de la entidad.

**Procesamiento del stock**

Un repuesto creado desde la web comienza con cero unidades. Los formularios de creación y edición no tendrán un campo para modificar stock directamente.

Cada movimiento seguirá esta secuencia:

1. Validar campos, contraseña y token CSRF.
2. Abrir una transacción y bloquear la fila del repuesto.
3. Comprobar que está activo y reconocer envíos ya procesados mediante `request_id`.
4. Calcular el resultado usando el stock vigente.
5. Rechazar cantidades inválidas, stock insuficiente o resultados fuera del rango permitido.
6. Insertar el movimiento y actualizar `stock_quantity`.
7. Confirmar ambos cambios juntos; ante un error, revertirlos.

Todas las consultas de esa transacción utilizarán el mismo cliente de `pg`, como requiere su [documentación](<https://node-postgres.com/features/transactions>). El bloqueo de fila serializará los cambios simultáneos sobre una pieza. [PostgreSQL](<https://www.postgresql.org/docs/16/explicit-locking.html>).

En un ajuste, el administrador ingresará la **cantidad contada**. Por ejemplo, pasar de 12 unidades registradas a 9 contadas genera un movimiento de −3. Si ambas cantidades coinciden, se informará que el stock ya coincide, sin crear un movimiento.

**Archivo y eliminación**

- Todos los repuestos se retirarán mediante archivado, conservando datos e historial.
- Solo podrán archivarse con stock cero.
- Los archivados no admitirán movimientos hasta restaurarse.
- Su metadata y categoría podrán editarse con la contraseña.
- Una categoría con repuestos activos o archivados no podrá eliminarse.
- La confirmación de eliminación mostrará las piezas que la bloquean.
- Los movimientos se conservarán como registros; las correcciones generarán eventos nuevos.

## 3\. Rutas, arquitectura y protección

La aplicación renderizará HTML desde el servidor. Los formularios usarán GET y POST.

| Método | Ruta | Función |
|---|---|---|
| GET | `/` | Portada con categorías |
| GET | `/categories/new` | Formulario de categoría |
| POST | `/categories` | Crear categoría |
| GET | `/categories/:id` | Categoría y sus piezas activas |
| GET / POST | `/categories/:id/edit` | Mostrar formulario / guardar cambios |
| GET / POST | `/categories/:id/delete` | Confirmar / eliminar categoría vacía |
| GET | `/items` | Catálogo y archivados mediante filtros |
| GET | `/items/new` | Formulario de repuesto |
| POST | `/items` | Crear repuesto con stock cero |
| GET | `/items/:id` | Ficha, disponibilidad e historial |
| GET / POST | `/items/:id/edit` | Mostrar formulario / guardar cambios |
| GET / POST | `/items/:id/archive` | Confirmar / archivar |
| GET / POST | `/items/:id/restore` | Confirmar / restaurar |
| GET | `/items/:id/movements/new?type=…` | Formulario del movimiento elegido |
| POST | `/items/:id/movements` | Registrar movimiento |

Registrar las rutas `/new` antes de las rutas con `:id`.

**Búsqueda y filtros**

- Buscar por nombre, SKU y marca sin distinguir mayúsculas.
- Filtrar por categoría y disponibilidad.
- Separar piezas activas y archivadas mediante `status=active|archived`.
- Mostrar 20 piezas por página, ordenadas por nombre y luego por ID.
- Mantener los filtros al navegar entre páginas.
- Paginar el historial en grupos de 20, del más reciente al más antiguo.
- Preseleccionar la categoría al crear una pieza desde su página.

**Responsabilidades**

- `routes`: declarar URLs y aplicar middleware.
- `controllers`: gestionar solicitudes, renderizados y redirecciones.
- `validators`: validar entradas y extraer únicamente campos permitidos.
- `db`: pool, consultas parametrizadas, esquema y seed.
- `services`: transacciones de movimientos, archivo y restauración.
- `views`: plantillas EJS y parciales compartidos.
- `public`: estilos, fuentes y mejoras progresivas.

Separar la aplicación Express del archivo que inicia el servidor para poder probarla con Supertest.

**Protección administrativa**

La contraseña se configurará mediante `ADMIN_PASSWORD` y se verificará en cada POST protegido. La comparación se hará en el servidor utilizando digests de longitud fija y `crypto.timingSafeEqual`. [Node.js](<https://nodejs.org/docs/latest-v24.x/api/crypto.html#cryptotimingsafeequala-b>).

La clave no se guardará en cookies, se devolverá en HTML ni se registrará en logs. Tampoco se conservará un estado de administrador autenticado entre acciones.

Agregar:

- Protección CSRF en todos los POST mediante `cookie-session` y `csrf-sync`; la cookie contendrá únicamente estado anónimo para CSRF.
- Cookies firmadas, `HttpOnly` y `SameSite=Lax`; `Secure` al usar HTTPS.
- Token del formulario en un campo oculto.
- Helmet y límite de tamaño del cuerpo de las solicitudes.
- Límite de 10 intentos fallidos de contraseña por IP cada 15 minutos.
- Escape de contenido mediante EJS y consultas parametrizadas.

`cookie-session` firma el contenido de la cookie y permite mantener este estado sin agregar una tabla de sesiones. [Documentación](<https://expressjs.com/en/resources/middleware/cookie-session/>).

**Respuestas y errores**

- Operación exitosa: redirección **303** y aviso con texto predefinido.
- Datos inválidos o duplicados: **422**, errores por campo y conservación de los valores ingresados.
- Contraseña ausente o incorrecta, o CSRF inválido: **403**.
- Recurso inexistente: **404**.
- Stock insuficiente, archivo bloqueado o categoría ocupada: **409**, explicando cómo resolverlo.
- Fallo inesperado: página **500** con mensaje general y registro técnico en el servidor.

La contraseña quedará vacía después de cualquier error. Ninguna solicitud GET modificará datos.

## 4\. Design Brief completo

**Objetivo.** Facilitar la exploración del catálogo y la gestión de stock, demostrando el funcionamiento del CRUD y las relaciones SQL.

**Público.** Visitantes de la demo, evaluadores de The Odin Project y quien gestione el inventario mediante la contraseña compartida. Uso principal en escritorio, con soporte móvil.

**Estilo visual.** Concepto “Ficha de fábrica”: proveedor OEM sobrio, preciso, ordenado y técnico. La placa con SKU, marca y categoría será el elemento distintivo.

**Paleta.**

| Uso | Color |
|---|---|
| Fondo general | Gris frío `#F3F6F7` |
| Superficies | Blanco `#FFFFFF` |
| Texto principal | Grafito `#25313B` |
| Texto secundario | Acero `#52616B` |
| Acciones principales | Petróleo `#365D6A` |
| Errores y acciones destructivas | Rojo contenido `#9A3E42` |

Evitar colores fluorescentes y grandes superficies saturadas. Los estados siempre tendrán texto, además del color.

**Tipografía.** Barlow Condensed para títulos, Source Sans 3 para lectura y controles, IBM Plex Mono para SKU y cantidades. Títulos principales de aproximadamente 40 px en escritorio y 32 px en móvil; cuerpo de 16 px y datos de 14 px. Fuentes alojadas localmente con sus licencias.

**Componentes principales.** Cabecera, navegación, breadcrumbs, tarjetas de categorías, tabla de piezas, listado móvil, placa de identificación, panel de stock, historial, formularios, confirmaciones, avisos y paginación.

**Layout.** Contenedor de hasta 1200 px. Portada con tres columnas de categorías. Categorías y catálogo con tablas compactas. Ficha de pieza con datos a la izquierda y disponibilidad a la derecha; historial debajo. Formularios de una columna y hasta 640 px de ancho.

**Responsive.** Una columna por debajo de 768 px, dos columnas de categorías en tablet y tres desde 1024 px. En móvil, piezas e historial se mostrarán en filas apiladas. La navegación podrá envolver líneas y la ficha priorizará identificación, stock y acciones.

**Animaciones.** Microinteracciones de aproximadamente 140 ms para feedback de pulsación con puntero, con escalado sutil y curva de salida rápida. Navegación, tablas y acciones de teclado inmediatas. Respetar `prefers-reduced-motion` y limitar las propiedades animadas a transformación y opacidad.

**Accesibilidad.** HTML semántico, labels explícitos, foco visible, navegación completa por teclado, controles táctiles de al menos 44 px y errores vinculados a sus campos. Conservar la semántica de tablas y listas según la presentación.

**Restricciones.** Stack educativo acordado, SQL directo, sin ORM. Formularios funcionales sin JavaScript del navegador. Sin fotografías, dependencias de CDN ni presupuesto de hosting para esta versión. No se acordó una fecha límite.

**Requisitos funcionales.** CRUD, búsqueda, filtros, paginación, movimientos, ajustes por conteo, archivo y restauración. Si no existen categorías, el formulario de repuesto indicará que primero debe crearse una. Los estados vacíos ofrecerán la acción correspondiente.

**Requisitos no funcionales.** Renderizado desde servidor, consultas agrupadas para evitar N+1, páginas acotadas, pool de conexiones y estructura mantenible. Compatibilidad con navegadores modernos. Títulos de página descriptivos y contenido semántico.

**Referencias.** Catálogo de `design-discovery`: claridad minimalista, organización utilitaria y superficies discretas. No se aportaron sitios externos.

**Decisiones tomadas durante la entrevista.** Axle Supply; inglés y USD; concepto A; colores contenidos; datos sin fotos; tablas; animación discreta; movimientos protegidos; ajustes por cantidad contada; archivo universal con stock cero; búsqueda y filtros; entrega local.

## 5\. Construcción paso a paso

1. **Preparar el entorno.** Cargar `nvm` y fijar Node 24 en `.nvmrc`. Inicializar un clúster PostgreSQL 16 dedicado dentro de `.local/postgres`, escuchando en `127.0.0.1:5433`, con autenticación por contraseña para TCP.
2. **Crear rol y bases mediante `psql`.** Usar un rol `inventory_app` sin superusuario y bases separadas `axle_supply` y `axle_supply_test`. Excluir `.local`, `.env` y dependencias de Git.
3. **Documentar configuración.** Preparar `.env.example` con `DATABASE_URL`, `TEST_DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `PORT` y `NODE_ENV`, usando placeholders.
4. **Escribir primero el esquema SQL.** Crear tablas, relaciones, restricciones e índices en `db/schema.sql`. Aplicarlo con `psql`, deteniendo y revirtiendo la ejecución si falla.
5. **Crear la base Express.** Configurar EJS, archivos estáticos, parser de formularios, pool de PostgreSQL y manejo central de errores.
6. **Implementar consultas READ.** Categorías con cantidad de piezas activas; catálogo filtrado; ficha de pieza e historial. Resolver búsqueda y paginación en SQL.
7. **Construir las vistas de lectura.** Portada, categoría, catálogo, archivados y ficha de repuesto, incluyendo estados vacíos.
8. **Agregar creación.** Formularios, validadores e inserciones de categorías y repuestos. Resolver duplicados y categorías inexistentes. Mantener el stock inicial en cero.
9. **Agregar protección administrativa y CSRF.** Aplicarla antes de habilitar operaciones protegidas. Probar solicitudes directas a los POST.
10. **Implementar edición.** Reutilizar formularios de creación con valores existentes y contraseña. Actualizar únicamente los campos permitidos.
11. **Implementar movimientos.** Formularios separados por tipo, servicio transaccional, cálculo de ajustes e idempotencia mediante UUID.
12. **Implementar archivo y restauración.** Confirmaciones, comprobación de stock bajo bloqueo y listado de archivados. Agregar eliminación de categorías vacías y explicación de bloqueos.
13. **Crear el seed determinista.** Siete categorías: Braking, Engine, Suspension, Electrical, Filtration, Cooling y Accessories. Cargar 24 piezas en las primeras seis; dejar Accessories vacía. Incluir entradas, salidas, ajustes, una pieza agotada y una archivada.
14. **Pulir la interfaz.** Aplicar el Design Brief a componentes compartidos, formularios, mensajes, responsive e interacciones.
15. **Verificar y documentar la entrega.** Ejecutar pruebas, revisar la aplicación en navegador y completar el README con preparación, SQL, comandos y recorridos de demostración.

El seed utilizará las mismas reglas transaccionales del inventario. Su repetición agregará únicamente datos faltantes y conservará cambios existentes. Se ejecutará manualmente, sin reinicializar datos al arrancar la aplicación.

Comandos del proyecto: `npm run dev`, `npm start`, `npm test` y `npm run db:seed`. El README incluirá los comandos `psql`, `initdb` y `pg_ctl` necesarios para preparar, iniciar y detener la base local.

## 6\. Pruebas y criterios de aceptación

Usar `node:test` y Supertest, con PostgreSQL real en `axle_supply_test`. La suite rechazará configuraciones que apunten a la base de desarrollo y aislará sus fixtures.

**Base de datos y CRUD**

- Rechazar categorías duplicadas por diferencia de mayúsculas, SKU duplicados y referencias inválidas.
- Validar precio, longitudes y cantidades.
- Crear y editar ambas entidades; eliminar una categoría vacía.
- Bloquear categorías con piezas activas o archivadas.
- Mantener el stock de una pieza recién creada en cero.

**Movimientos**

- Entrada de 10, salida de 3 y ajuste a 5: stock final 5 e historial `+10, −3, −2`.
- Rechazar salidas superiores al stock y cantidades inválidas.
- Revertir conjuntamente stock y movimiento ante un fallo.
- Con una unidad disponible y dos salidas simultáneas, aceptar solamente una.
- Procesar una misma solicitud UUID una sola vez, incluso con envíos simultáneos.
- Comprobar que el stock almacenado coincide con la suma de sus movimientos.

**Archivo y protección**

- Bloquear archivo con stock positivo.
- Archivar con stock cero, impedir movimientos y permitir restauración.
- Conservar el SKU y todo el historial después de archivar.
- Impedir operaciones protegidas con contraseña incorrecta o CSRF inválido.
- Escapar contenido ingresado y tratar búsquedas como parámetros SQL.

**Experiencia y persistencia**

- Verificar filtros, paginación, estados vacíos y conservación de datos tras errores.
- Revisar vistas a 320, 768 y 1280 px, navegación por teclado y movimiento reducido.
- Completar todos los formularios con JavaScript deshabilitado.
- Confirmar persistencia tras reiniciar aplicación y PostgreSQL.
- Repetir el seed sin duplicar movimientos ni alterar piezas existentes.

La entrega estará completa cuando una instalación siguiendo el README permita recorrer categorías, gestionar piezas, registrar movimientos y comprobar archivo y restauración, con las pruebas anteriores aprobadas.

El proceso de descubrimiento ha finalizado. El Design Brief está listo. Usá una skill de implementación frontend para construir la interfaz respetando estas decisiones. Para validar calidad de animaciones e interacciones consultá las guías de Emil Kowalski. Para controles de robustness usá las Vercel Web Design Guidelines.

La confirmación “el diseño está definido” fue recibida. Ese cierre explícito está requerido por design-discovery (/home/marcosdebona/skills-md25/frontend/skills/design-discovery/SKILL.md): “Iterate until the user explicitly confirms: ‘el diseño está definido.’”
