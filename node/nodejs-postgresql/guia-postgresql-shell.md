# Guía rápida: PostgreSQL por shell (psql)

Referencia rápida de los comandos más usados de `psql` para administrar bases de datos, usuarios, roles, tablas y esquemas desde la terminal.

## Índice

1. [Arrancar PostgreSQL](#1-arrancar-postgresql)
2. [Conectarse a psql](#2-conectarse-a-psql)
3. [Meta-comandos de psql](#3-meta-comandos-de-psql)
4. [Bases de datos](#4-bases-de-datos)
5. [Usuarios y roles](#5-usuarios-y-roles)
6. [Tablas](#6-tablas)
7. [Esquemas](#7-esquemas)
8. [Consultas básicas (CRUD)](#8-consultas-básicas-crud)
9. [Salir y tips finales](#9-salir-y-tips-finales)

---

## 1. Arrancar PostgreSQL

```bash
# 1) Verificar el estado del servicio
sudo service postgresql status

# 2) Si dice "inactive", arrancarlo
sudo service postgresql start

# 3) Entrar al shell de PostgreSQL
psql
```

> **Nota:** si `psql` te da el error `role "tu_usuario" does not exist`, es porque tu usuario de Linux aún no tiene un rol en PostgreSQL. Entra como el usuario por defecto:
>
> ```bash
> sudo -u postgres psql
> ```

Otros comandos útiles del servicio:

```bash
sudo service postgresql stop      # detener el servicio
sudo service postgresql restart   # reiniciar el servicio
```

## 2. Conectarse a psql

```bash
# Como usuario por defecto (postgres)
sudo -u postgres psql

# Con un usuario y base de datos específicos
psql -U mi_usuario -d mi_bd

# Con host y puerto (útil para servidores remotos)
psql -h localhost -p 5432 -U mi_usuario -d mi_bd
```

## 3. Meta-comandos de psql

Los comandos que empiezan con `\` solo funcionan dentro de `psql`. No llevan punto y coma.

| Comando | Qué hace |
|---------|----------|
| `\l` | Ver todas las bases de datos |
| `\c mi_bd` | Conectarse a la base `mi_bd` |
| `\dt` | Ver las tablas del esquema actual |
| `\dt *.*` | Ver las tablas de todos los esquemas |
| `\d usuarios` | Describir la tabla `usuarios` (columnas, tipos, claves) |
| `\dn` | Ver los esquemas |
| `\du` | Ver usuarios y roles |
| `\x` | Activar/desactivar la vista vertical de resultados |
| `\timing` | Mostrar el tiempo de cada consulta |
| `\i script.sql` | Ejecutar un archivo `.sql` |
| `\?` | Ayuda de meta-comandos |
| `\h` | Ayuda de comandos SQL |
| `\q` | Salir de psql |

## 4. Bases de datos

```sql
-- Ver bases de datos (equivale a \l)
\l

-- Crear una base de datos
CREATE DATABASE mi_bd;

-- Conectarse a ella (equivale a \c)
\c mi_bd

-- Eliminar una base de datos
DROP DATABASE mi_bd;

-- Renombrar una base de datos
ALTER DATABASE mi_bd RENAME TO nueva_bd;
```

> **Ojo:** para eliminar una base de datos no puedes estar conectado a ella. Conéctate primero a otra (`\c postgres`).

## 5. Usuarios y roles

En PostgreSQL, `USER` y `ROLE` son prácticamente lo mismo (un usuario es un rol que puede iniciar sesión).

```sql
-- Ver usuarios y roles
\du

-- Crear un usuario con contraseña
CREATE USER mi_usuario WITH PASSWORD 'mi_contraseña';

-- Crear un rol
CREATE ROLE mi_rol;

-- Crear un usuario con permisos de administrador
CREATE USER admin_user WITH SUPERUSER PASSWORD 'contraseña';

-- Modificar un usuario
ALTER USER mi_usuario WITH CREATEDB;          -- puede crear bases de datos
ALTER USER mi_usuario WITH PASSWORD 'nueva';  -- cambiar contraseña

-- Dar permisos sobre una base de datos
GRANT ALL PRIVILEGES ON DATABASE mi_bd TO mi_usuario;

-- Dar permisos sobre todas las tablas de un esquema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mi_usuario;

-- Quitar permisos
REVOKE ALL PRIVILEGES ON DATABASE mi_bd FROM mi_usuario;

-- Eliminar un usuario
DROP USER mi_usuario;
```

## 6. Tablas

```sql
-- Ver las tablas
\dt

-- Crear una tabla
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    edad INT,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Describir una tabla
\d usuarios

-- Agregar una columna
ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(20);

-- Renombrar una columna
ALTER TABLE usuarios RENAME COLUMN edad TO años;

-- Cambiar el tipo de una columna
ALTER TABLE usuarios ALTER COLUMN nombre TYPE VARCHAR(150);

-- Eliminar una columna
ALTER TABLE usuarios DROP COLUMN telefono;

-- Vaciar una tabla (borra datos, mantiene estructura)
TRUNCATE TABLE usuarios;

-- Eliminar una tabla (borra datos y estructura)
DROP TABLE usuarios;
```

## 7. Esquemas

Un esquema es una "carpeta" de tablas dentro de una base de datos. Por defecto todo vive en el esquema `public`.

```sql
-- Ver esquemas
\dn

-- Crear un esquema
CREATE SCHEMA ventas;

-- Crear una tabla dentro de un esquema
CREATE TABLE ventas.clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100)
);

-- Ver las tablas de todos los esquemas
\dt *.*

-- Cambiar el esquema por defecto de la sesión
SET search_path TO ventas;
```

## 8. Consultas básicas (CRUD)

```sql
-- INSERTAR
INSERT INTO usuarios (nombre, email, edad)
VALUES ('Marcos', 'marcos@mail.com', 30);

-- LEER
SELECT * FROM usuarios;
SELECT nombre, email FROM usuarios WHERE activo = true;

-- ACTUALIZAR
UPDATE usuarios SET edad = 31 WHERE email = 'marcos@mail.com';

-- BORRAR
DELETE FROM usuarios WHERE id = 1;
```

## 9. Salir y tips finales

```sql
-- Salir de psql
\q
```

- Todo comando **SQL** termina en `;` — si parece que "se colgó", probablemente te falta cerrarlo con `;`.
- Todo **meta-comando** (`\l`, `\dt`, `\du`...) NO lleva `;`.
- Usa `\?` cuando no recuerdes un meta-comando y `\h CREATE TABLE` para ver la sintaxis SQL de algo puntual.
- Antes de un `DROP`, verifica con `\l` o `\dt` que estás borrando lo correcto: no pide confirmación.
