# Prisma ORM — Crash Course

> **Stack:** Prisma 6.19.3 + @prisma/client 6.19.3 + SQLite + TypeScript 5.9.3 + ts-node

---

## Tabla de Contenidos

1. [Setup e Inicialización](#1-setup-e-inicialización)
2. [Schema y Modelos](#2-schema-y-modelos)
3. [Migraciones](#3-migraciones)
4. [CRUD Básico](#4-crud-básico)
5. [Queries Avanzadas](#5-queries-avanzadas)
6. [Relaciones (Nested Reads/Writes)](#6-relaciones)
7. [Transacciones](#7-transacciones)
8. [Comandos CLI](#8-comandos-cli)
9. [Errores Comunes](#9-errores-comunes)

---

## 1. Setup e Inicialización

### Instalar dependencias

```bash
# CLI (dev) — genera, migra, inspecciona
npm install -D prisma@6.19.3

# Cliente (runtime) — lo importás en tu código
npm install @prisma/client@6.19.3
```

### Inicializar Prisma

```bash
npx prisma init --datasource-provider sqlite
```

Esto crea:
- `prisma/schema.prisma` — tu modelo de datos
- `.env` — variables de entorno (DATABASE_URL)
- `.gitignore` — ignora node_modules, .env, etc.

### Estructura del proyecto

```
.
├── .env                     # DATABASE_URL="file:./dev.db"
├── prisma/
│   ├── schema.prisma        # modelos + datasource + generator
│   ├── seed.ts              # datos de ejemplo
│   ├── migrations/          # historial de migraciones
│   └── dev.db               # base SQLite (ignorada por git)
├── index.ts                 # tu código
├── tsconfig.json
└── package.json
```

---

## 2. Schema y Modelos

### Schema básico

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id       Int       @id @default(autoincrement())
  email    String    @unique
  name     String?
  articles Article[]
}

model Article {
  id       Int     @id @default(autoincrement())
  title    String
  body     String?
  author   User    @relation(fields: [authorId], references: [id])
  authorId Int
}
```

### Tipos de datos

| Prisma | SQLite | PostgreSQL | MySQL |
|--------|--------|------------|-------|
| `String` | TEXT | VARCHAR/TEXT | VARCHAR/TEXT |
| `Int` | INTEGER | INTEGER | INT |
| `BigInt` | INTEGER | BIGINT | BIGINT |
| `Float` | REAL | DOUBLE PRECISION | DOUBLE |
| `Decimal` | REAL | DECIMAL | DECIMAL |
| `Boolean` | INTEGER | BOOLEAN | TINYINT |
| `DateTime` | TEXT | TIMESTAMP | DATETIME |
| `Json` | TEXT | JSON | JSON |
| `Bytes` | BLOB | BYTEA | BLOB |

### Atributos de campo

```prisma
model User {
  id        Int      @id @default(autoincrement())  // Primary key autoincremental
  email     String   @unique                        // Campo único
  name      String?                                 // Nullable (?)
  age       Int      @default(18)                   // Valor por defecto
  createdAt DateTime @default(now())                // Timestamp actual
  updatedAt DateTime @updatedAt                     // Se actualiza automáticamente
  role      Role     @default(USER)                 // Enum con default
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### Atributos de modelo

```prisma
model User {
  firstName String
  lastName  String
  email     String
  
  @@id([firstName, lastName])      // Primary key compuesta
  @@unique([firstName, lastName])  // Unique constraint compuesto
  @@index([email])                 // Índice para queries rápidas
  @@map("users")                   // Mapear a nombre de tabla diferente
}
```

### Relaciones

#### One-to-One (1:1)

```prisma
model User {
  id      Int      @id @default(autoincrement())
  profile Profile?
}

model Profile {
  id     Int  @id @default(autoincrement())
  bio    String
  user   User @relation(fields: [userId], references: [id])
  userId Int  @unique
}
```

#### One-to-Many (1:n)

```prisma
model User {
  id       Int       @id @default(autoincrement())
  articles Article[]
}

model Article {
  id       Int  @id @default(autoincrement())
  author   User @relation(fields: [authorId], references: [id])
  authorId Int
}
```

#### Many-to-Many (n:m)

```prisma
model Post {
  id         Int        @id @default(autoincrement())
  title      String
  categories Category[]
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String
  posts Post[]
}
// Prisma crea la tabla intermedia automáticamente (implicit)
```

Many-to-Many explícito (cuando necesitás campos extra):

```prisma
model Post {
  id         Int            @id @default(autoincrement())
  title      String
  categories PostCategory[]
}

model Category {
  id    Int            @id @default(autoincrement())
  name  String
  posts PostCategory[]
}

model PostCategory {
  post       Post     @relation(fields: [postId], references: [id])
  postId     Int
  category   Category @relation(fields: [categoryId], references: [id])
  categoryId Int
  assignedAt DateTime @default(now())
  
  @@id([postId, categoryId])
}
```

---

## 3. Migraciones

### Crear y aplicar migración

```bash
npx prisma migrate dev --name init
```

Esto:
1. Crea el archivo SQL de migración en `prisma/migrations/`
2. Aplica la migración a la base de datos
3. Regenera el cliente Prisma

### Aplicar migraciones pendientes (producción/CI)

```bash
npx prisma migrate deploy
```

### Resetear la base de datos

```bash
npx prisma migrate reset
```

**⚠️ DESTRUCTIVO:** Borra todos los datos y re-aplica todas las migraciones.

### Sincronizar schema sin migración (prototipado)

```bash
npx prisma db push
```

Útil para desarrollo rápido, pero **no crea historial de migraciones**.

### Formato y validación

```bash
npx prisma format    # Formatea el schema
npx prisma validate  # Valida que el schema sea correcto
```

---

## 4. CRUD Básico

### Instanciar el cliente

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Tu código aquí
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### CREATE — Crear registros

```typescript
// Crear un user
const user = await prisma.user.create({
  data: { email: "ada@prisma.io", name: "Ada" },
});

// Crear con relación (nested write)
const userWithArticle = await prisma.user.create({
  data: {
    email: "alice@prisma.io",
    name: "Alice",
    articles: {
      create: { title: "First article", body: "Content..." },
    },
  },
  include: { articles: true },
});

// Crear article y conectar a user existente
const article = await prisma.article.create({
  data: {
    title: "New article",
    body: "Content...",
    author: { connect: { id: 1 } },
  },
});

// Crear muchos de una vez
const users = await prisma.user.createMany({
  data: [
    { email: "user1@test.io", name: "User 1" },
    { email: "user2@test.io", name: "User 2" },
  ],
});
```

### READ — Leer registros

```typescript
// Traer todos
const users = await prisma.user.findMany();

// Traer uno por campo único
const user = await prisma.user.findUnique({
  where: { email: "ada@prisma.io" },
});

// Traer el primero que matchee
const user = await prisma.user.findFirst({
  where: { name: { contains: "Ada" } },
});

// Con relaciones incluidas
const users = await prisma.user.findMany({
  include: { articles: true },
});

// Seleccionar campos específicos
const users = await prisma.user.findMany({
  select: { id: true, email: true },
});
```

### UPDATE — Actualizar registros

```typescript
// Actualizar uno
const updated = await prisma.user.update({
  where: { email: "ada@prisma.io" },
  data: { name: "Ada Lovelace" },
});

// Actualizar con relación
const updated = await prisma.user.update({
  where: { email: "ada@prisma.io" },
  data: {
    articles: {
      create: { title: "New article" },
    },
  },
});

// Actualizar muchos
const result = await prisma.article.updateMany({
  where: { authorId: 1 },
  data: { body: "Updated content" },
});
// result.count = cantidad actualizados

// Upsert: crear si no existe, actualizar si existe
const user = await prisma.user.upsert({
  where: { email: "ada@prisma.io" },
  update: { name: "Ada Lovelace" },
  create: { email: "ada@prisma.io", name: "Ada" },
});
```

### DELETE — Borrar registros

```typescript
// Borrar uno
const deleted = await prisma.article.delete({
  where: { id: 1 },
});

// Borrar muchos
const result = await prisma.article.deleteMany({
  where: { authorId: 1 },
});
// result.count = cantidad borrados
```

---

## 5. Queries Avanzadas

### Filtros (where)

```typescript
// Igualdad
await prisma.user.findMany({ where: { email: "ada@prisma.io" } });

// Comparación
await prisma.user.findMany({ where: { id: { gt: 5 } } });
await prisma.user.findMany({ where: { id: { gte: 5 } } });
await prisma.user.findMany({ where: { id: { lt: 10 } } });
await prisma.user.findMany({ where: { id: { lte: 10 } } });

// Strings
await prisma.user.findMany({ where: { name: { contains: "Ada" } } });
await prisma.user.findMany({ where: { name: { startsWith: "A" } } });
await prisma.user.findMany({ where: { name: { endsWith: "son" } } });

// IN / NOT IN
await prisma.user.findMany({
  where: { id: { in: [1, 2, 3] } },
});

// NOT
await prisma.user.findMany({
  where: { NOT: { email: "ada@prisma.io" } },
});

// AND / OR
await prisma.user.findMany({
  where: {
    AND: [
      { name: { contains: "a" } },
      { id: { gt: 5 } },
    ],
  },
});

await prisma.user.findMany({
  where: {
    OR: [
      { email: "ada@prisma.io" },
      { email: "alice@prisma.io" },
    ],
  },
});

// Filtros en relaciones
await prisma.article.findMany({
  where: {
    author: { email: "ada@prisma.io" },
  },
});

await prisma.user.findMany({
  where: {
    articles: { some: { title: { contains: "Prisma" } } },
  },
});
```

### Ordenamiento

```typescript
// Ascendente
await prisma.user.findMany({ orderBy: { name: "asc" } });

// Descendente
await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

// Múltiples campos
await prisma.user.findMany({
  orderBy: [
    { name: "asc" },
    { createdAt: "desc" },
  ],
});
```

### Paginación

```typescript
// Limitar resultados
await prisma.user.findMany({ take: 10 });

// Saltar resultados
await prisma.user.findMany({ skip: 20 });

// Paginación con cursor (más eficiente para datasets grandes)
await prisma.user.findMany({
  take: 10,
  cursor: { id: 100 },
});

// Paginación offset-based
const PAGE_SIZE = 10;
const page = 2;
await prisma.user.findMany({
  skip: (page - 1) * PAGE_SIZE,
  take: PAGE_SIZE,
});
```

### Select y Include

```typescript
// select: solo campos específicos
await prisma.user.findMany({
  select: { id: true, email: true },
});

// include: traer relaciones
await prisma.user.findMany({
  include: { articles: true },
});

// include con filtros en la relación
await prisma.user.findMany({
  include: {
    articles: {
      where: { title: { contains: "Prisma" } },
      orderBy: { createdAt: "desc" },
      take: 5,
    },
  },
});

// include anidado
await prisma.user.findMany({
  include: {
    articles: {
      include: { author: true },
    },
  },
});
```

### Aggregate y GroupBy

```typescript
// Aggregate: contar, min, max, avg, sum
const stats = await prisma.article.aggregate({
  _count: true,
  _min: { id: true },
  _max: { id: true },
  _avg: { authorId: true },
});

// GroupBy: agrupar por campo
const byAuthor = await prisma.article.groupBy({
  by: ["authorId"],
  _count: { id: true },
  orderBy: { _count: { id: "desc" } },
});

// GroupBy con filtro
const byAuthor = await prisma.article.groupBy({
  by: ["authorId"],
  where: { title: { contains: "Prisma" } },
  _count: { id: true },
  having: { id: { _count: { gt: 5 } } },
});
```

### Contar registros

```typescript
const count = await prisma.user.count();
const count = await prisma.user.count({ where: { name: { contains: "a" } } });
```

---

## 6. Relaciones

### Nested Reads (include)

```typescript
// User con sus articles
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { articles: true },
});

// User con articles filtrados
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    articles: {
      where: { title: { contains: "Prisma" } },
      orderBy: { createdAt: "desc" },
    },
  },
});
```

### Nested Writes (create/update dentro de create/update)

```typescript
// Crear user + article en una sola operación
const user = await prisma.user.create({
  data: {
    email: "new@prisma.io",
    name: "New User",
    articles: {
      create: [
        { title: "Article 1", body: "Content 1" },
        { title: "Article 2", body: "Content 2" },
      ],
    },
  },
  include: { articles: true },
});

// Actualizar user y crear article
const user = await prisma.user.update({
  where: { email: "ada@prisma.io" },
  data: {
    articles: {
      create: { title: "New article" },
    },
  },
});
```

### Connect (relacionar con registros existentes)

```typescript
// Crear article y conectar a user existente
const article = await prisma.article.create({
  data: {
    title: "New article",
    author: { connect: { id: 1 } },
  },
});

// Actualizar article y cambiar de author
const article = await prisma.article.update({
  where: { id: 1 },
  data: {
    author: { connect: { id: 2 } },
  },
});

// Disconnect (solo en relaciones opcionales)
const article = await prisma.article.update({
  where: { id: 1 },
  data: {
    author: { disconnect: true },
  },
});
```

### Operaciones en relaciones

```typescript
// create: crear registros relacionados
// connect: conectar a registros existentes
// disconnect: desconectar (solo opcionales)
// set: reemplazar todas las conexiones
// update: actualizar registros relacionados
// upsert: crear si no existe, actualizar si existe
// connectOrCreate: conectar o crear si no existe
// delete: borrar registros relacionados
// deleteMany: borrar múltiples relacionados

// Ejemplo: update + nested operations
await prisma.user.update({
  where: { id: 1 },
  data: {
    articles: {
      create: { title: "New article" },
      connect: { id: 5 },
      delete: { id: 3 },
    },
  },
});
```

---

## 7. Transacciones

### Transaction con array de operaciones

```typescript
// Todas las operaciones se ejecutan o ninguna
const [user, article] = await prisma.$transaction([
  prisma.user.create({
    data: { email: "test@prisma.io", name: "Test" },
  }),
  prisma.article.create({
    data: { title: "Transaction article", authorId: 1 },
  }),
]);
```

### Transaction con callback (interactive)

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: "test@prisma.io", name: "Test" },
  });
  
  const article = await tx.article.create({
    data: { title: "Transaction article", authorId: user.id },
  });
  
  // Si algo falla, todo se revierte
  if (someCondition) {
    throw new Error("Rollback!");
  }
});
```

### Opciones de transacción

```typescript
await prisma.$transaction(
  async (tx) => {
    // operaciones
  },
  {
    maxWait: 5000,    // ms a esperar para obtener la transacción
    timeout: 10000,   // ms antes de hacer rollback
    isolationLevel: "Serializable", // solo PostgreSQL/MySQL
  }
);
```

---

## 8. Comandos CLI

### Comandos principales

| Comando | Descripción |
|---------|-------------|
| `npx prisma init` | Inicializa Prisma en el proyecto |
| `npx prisma generate` | Regenera el cliente a partir del schema |
| `npx prisma migrate dev` | Crea y aplica migración en desarrollo |
| `npx prisma migrate deploy` | Aplica migraciones pendientes (prod/CI) |
| `npx prisma migrate reset` | Borra la BD y re-aplica migraciones |
| `npx prisma db push` | Sincroniza schema sin migración |
| `npx prisma db seed` | Ejecuta el seed |
| `npx prisma db pull` | Introspección: trae schema de BD existente |
| `npx prisma studio` | Abre UI web para explorar datos |
| `npx prisma format` | Formatea el schema |
| `npx prisma validate` | Valida el schema |
| `npx prisma -v` | Muestra versiones |

### Scripts de package.json

```json
{
  "scripts": {
    "dev": "ts-node index.ts",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "db:seed": "prisma db seed",
    "db:format": "prisma format",
    "db:validate": "prisma validate"
  }
}
```

### Seed

Configurar en `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Ejecutar:

```bash
npx prisma db seed
# o
npm run db:seed
```

---

## 9. Errores Comunes

### `Cannot find module '@prisma/client'`

**Causa:** Falta el paquete o no corriste `generate`.

**Solución:**
```bash
npm install @prisma/client
npx prisma generate
```

### `Environment variable not found: DATABASE_URL`

**Causa:** Falta el archivo `.env` o la variable.

**Solución:** Crear `.env` con:
```
DATABASE_URL="file:./dev.db"
```

### `Unique constraint failed`

**Causa:** Intentás crear un registro con un valor único que ya existe.

**Solución:** Usar `upsert` en vez de `create`:
```typescript
await prisma.user.upsert({
  where: { email: "existing@email.com" },
  update: {},
  create: { email: "existing@email.com", name: "Name" },
});
```

### Cambiaste el schema y no ves los tipos nuevos

**Causa:** No regeneraste el cliente.

**Solución:**
```bash
npx prisma generate
# o
npx prisma migrate dev  # ya lo hace automáticamente
```

### `Foreign key constraint failed`

**Causa:** Intentás borrar un registro que tiene relaciones.

**Solución:**
1. Borrar primero los registros relacionados
2. O configurar `onDelete: Cascade` en el schema:
```prisma
model Article {
  author User @relation(onDelete: Cascade, fields: [authorId], references: [id])
}
```

### `prisma db execute` pide `--url` o `--schema`

**Solución:**
```bash
npx prisma db execute --schema prisma/schema.prisma --stdin < script.sql
```

---

## Cheat Sheet Rápido

```typescript
// CREATE
await prisma.model.create({ data: { ... } })
await prisma.model.createMany({ data: [{ ... }, { ... }] })

// READ
await prisma.model.findMany()
await prisma.model.findUnique({ where: { ... } })
await prisma.model.findFirst({ where: { ... } })
await prisma.model.count()

// UPDATE
await prisma.model.update({ where: { ... }, data: { ... } })
await prisma.model.updateMany({ where: { ... }, data: { ... } })
await prisma.model.upsert({ where: { ... }, update: { ... }, create: { ... } })

// DELETE
await prisma.model.delete({ where: { ... } })
await prisma.model.deleteMany({ where: { ... } })

// RELATIONS
include: { relation: true }
{ connect: { id: 1 } }
{ create: { ... } }

// TRANSACTIONS
await prisma.$transaction([op1, op2])
await prisma.$transaction(async (tx) => { ... })
```

---

## Recursos

- [Documentación oficial](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Schema](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
