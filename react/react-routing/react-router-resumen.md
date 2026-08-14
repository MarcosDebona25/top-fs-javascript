# React Router — Resumen conceptual

> Nota: este proyecto usa `react-router` v8. Antes de la v7 el paquete se llamaba
> `react-router-dom`; desde la v7 todo vive en `react-router` (las importaciones de
> este resumen usan `react-router`).
>
> Todos los ejemplos coinciden con el proyecto que vive en `src/`. Para verlos en
> acción: `npm run dev`.

---

## 1. Client-side routing (por qué no se recarga la página)

### Cómo funciona la navegación clásica (MPA)

En una web tradicional, al hacer clic en un enlace el navegador:

1. Hace una petición HTTP `GET` al servidor.
2. El servidor responde con un HTML completo.
3. El navegador **recarga toda la página** (destruye y reconstruye el DOM).

### Cómo funciona en una SPA con React Router

En una Single Page Application la página se carga **una sola vez**. A partir de ahí,
React Router intercepta la navegación y usa la **History API** del navegador
(`history.pushState`) para:

1. Cambiar la URL de la barra de direcciones.
2. **Sin** hacer ninguna petición al servidor.
3. Renderizar el componente que corresponde a esa ruta.

Como el DOM no se destruye, solo cambia el árbol de componentes de React: la página
no "recarga", solo se actualiza la vista.

### Pros

- **Navegación instantánea**: no hay parpadeo ni pantalla en blanco entre páginas.
- **Layout compartido persistente**: la barra de navegación se monta una vez y no se
  vuelve a renderizar ni a recargar.
- **Menos tráfico tras la carga inicial**: solo se piden datos (JSON), no HTML completo.
- **Mejor UX** para interfaces tipo "app".

### Contras

- **Carga inicial más pesada**: hay que descargar y ejecutar el bundle de JS antes de
  ver contenido.
- **SEO**: los crawlers no siempre ejecutan JS, así que el contenido puede no indexarse
  (se mitiga con SSR o prerendering).
- **Configuración extra en el servidor**: si el usuario recarga en `/profile/popeye`,
  el servidor debe responder con `index.html` (fallback), o devuelve 404.
- **Sin JS no hay contenido**: la página está vacía si JavaScript está deshabilitado.

---

## 2. Instalación

```bash
npm install react-router
```

> Histórico: en v6 y anteriores se instalaba `react-router-dom`. Desde v7 se usa
> directamente `react-router`.

---

## 3. Creación del router

El router se crea con `createBrowserRouter` (recibe un array de rutas) y se monta con
`RouterProvider`, en el punto de entrada de la app.

```jsx
// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import routes from "./routes";

const router = createBrowserRouter(routes);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

---

## 4. Estructura de carpetas (estándar de la industria)

Separar por **responsabilidad** mantiene el proyecto escalable:

```
src/
├── main.jsx               # entry point: crea el router + RouterProvider
├── routes.jsx             # definición centralizada de rutas
├── layouts/
│   └── RootLayout.jsx     # layout raíz (nav + Outlet + contexto compartido)
├── pages/
│   ├── Home.jsx           # ruta index ("/")
│   ├── About.jsx          # "/about"
│   ├── Profile.jsx        # "/profile/:name" (useParams)
│   ├── Profile.test.jsx   # test co-localizado con su página
│   └── ErrorPage.jsx      # errorElement
└── components/
    ├── Popeye.jsx         # componentes reutilizables (no son rutas)
    ├── Spinach.jsx
    └── DefaultProfile.jsx
```

- **`layouts/`**: componentes que envuelven a otros (nav + `Outlet`). No son páginas.
- **`pages/`**: un componente por ruta. Lo que se asigna al `element`.
- **`components/`**: piezas reutilizables que una página usa, pero que no son rutas en
  sí (aquí `Profile` compone a `Popeye`, `Spinach` y `DefaultProfile`).
- Los tests se **co-localizan** junto al archivo que prueban (`Profile.test.jsx`).

---

## 5. Componente `Link`

`Link` es el reemplazo de la etiqueta `<a>` en React Router. Renderiza un `<a>` real,
pero al hacer clic **intercepta la navegación** y evita la recarga completa.

```jsx
// src/layouts/RootLayout.jsx (extracto)
import { Link } from "react-router";

<nav>
  <Link to="/">Home</Link>
  <Link to="/about">About</Link>
  <Link to="/profile/popeye">Popeye</Link>
  <Link to="/profile/spinach">Spinach</Link>
</nav>
```

Diferencias clave:

| `<a href="/about">`          | `<Link to="/about">`          |
| ---------------------------- | ----------------------------- |
| Recarga completa la página   | Solo actualiza la vista (SPA) |
| Petición HTTP al servidor    | Sin petición (History API)    |
| Pierde el estado de la app   | Conserva el estado en memoria  |

> Regla práctica: usa `Link` para navegación interna de la app; usa `<a>` solo para
> enlaces externos o descargas.

---

## 6. Rutas: `path`, `element` y `children`

Cada ruta es un objeto con una URL (`path`) y el componente que renderiza (`element`).
`children` define **rutas anidadas**.

```jsx
const routes = [
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },        // se renderiza en "/" exacto
      { path: "about", element: <About /> },     // "/about"
      { path: "profile/:name", element: <Profile /> }, // ruta dinámica
    ],
  },
];
```

- `path` puede ser relativo (`"about"`) cuando la ruta tiene un padre.
- `element` es el JSX que se renderiza cuando la URL coincide.
- `children` permite anidar rutas que comparten un layout (ver `Outlet`).
- `index: true` marca la ruta que se muestra en la URL exacta del padre.

---

## 7. Componente `Outlet` (rutas anidadas)

`Outlet` es un "hueco" que indica **dónde** se renderiza la ruta hija dentro del layout
del padre. Sin él, las rutas hijas no se muestran.

```jsx
// src/layouts/RootLayout.jsx
import { Link, Outlet } from "react-router";

const RootLayout = () => (
  <div>
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
    </nav>
    <main>
      {/* Aquí se renderiza Home, About o Profile según la URL */}
      <Outlet />
    </main>
  </div>
);
```

Con el router del punto 6, al visitar `/about` el resultado es:

```
RootLayout (nav) ──┐
                   └── <Outlet /> = <About />
```

---

## 8. `useParams` (rutas dinámicas)

Sirve para leer los parámetros dinámicos de la URL (los que empiezan con `:`).

```jsx
// src/pages/Profile.jsx
import { useParams } from "react-router";
import DefaultProfile from "../components/DefaultProfile";
import Spinach from "../components/Spinach";
import Popeye from "../components/Popeye";

const Profile = () => {
  const { name } = useParams(); // "/profile/popeye" -> name === "popeye"

  return (
    <div>
      <h1>Hello from profile page!</h1>
      {name === "popeye" ? (
        <Popeye />
      ) : name === "spinach" ? (
        <Spinach />
      ) : (
        <DefaultProfile />
      )}
    </div>
  );
};
```

---

## 9. `errorElement`

Es un "error boundary" por ruta: si algo falla al renderizar (o la ruta no existe),
se muestra el componente indicado en lugar de romper toda la app.

```jsx
// src/pages/ErrorPage.jsx
import { Link } from "react-router";

const ErrorPage = () => (
  <div>
    <h1>Oh no, this route doesn't exist!</h1>
    <Link to="/">You can go back to the home page by clicking here, though!</Link>
  </div>
);
```

```jsx
// routes.jsx
{
  path: "/",
  element: <RootLayout />,
  errorElement: <ErrorPage />, // se muestra ante cualquier error/404
}
```

> En una ruta con `children`, el `errorElement` del padre captura también los errores
> de las hijas.

---

## 10. Archivo `routes.jsx`

En vez de escribir las rutas dentro de `main.jsx`, se mueven a un archivo propio que
exporta el array. Mantiene el router limpio y centralizado (y usa la estructura de
carpetas del punto 4).

```jsx
// src/routes.jsx
import RootLayout from "./layouts/RootLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Profile from "./pages/Profile";
import ErrorPage from "./pages/ErrorPage";

const routes = [
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "profile/:name", element: <Profile /> },
    ],
  },
];

export default routes;
```

```jsx
// src/main.jsx
import { createBrowserRouter, RouterProvider } from "react-router";
import routes from "./routes";

const router = createBrowserRouter(routes);

// ...
```

---

## 11. `useOutletContext`

Permite pasar datos **del padre a sus rutas hijas** a través del `Outlet`. Es útil cuando
el layout tiene estado o datos que el hijo necesita.

```jsx
// src/layouts/RootLayout.jsx
import { Link, Outlet } from "react-router";

const RootLayout = () => {
  const user = { name: "Marcos", role: "admin" };

  return (
    <div>
      <nav>...</nav>
      {/* El contexto se pasa como prop del Outlet */}
      <Outlet context={user} />
    </div>
  );
};
```

```jsx
// src/pages/About.jsx
import { useOutletContext } from "react-router";

const About = () => {
  const user = useOutletContext(); // { name: "Marcos", role: "admin" }

  return <p>Data shared by the layout: {user.name} ({user.role})</p>;
};
```

---

## 12. `useNavigate`

Permite navegar **programáticamente** (sin un clic en `Link`), por ejemplo tras un
submit, un login exitoso o un temporizador.

```jsx
// src/pages/Home.jsx
import { Link, useNavigate } from "react-router";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Hello from the main page of the app!</h1>

      <Link to="/profile/popeye">Go to Popeye (Link)</Link>

      <button type="button" onClick={() => navigate("/profile/spinach")}>
        Go to Spinach (useNavigate)
      </button>
    </div>
  );
};
```

Otros usos útiles:

```jsx
navigate("/profile/popeye");              // ir a una ruta
navigate(-1);                             // ir atrás (historial)
navigate("/login", { replace: true });    // reemplaza la entrada actual
```

---

## 13. `MemoryRouter` para testing

En tests no hay un navegador real (ni History API). `MemoryRouter` mantiene el historial
**en memoria**, así que puedes simular una URL inicial y verificar qué se renderiza sin
recargar nada.

> Importante: `MemoryRouter` usa el modo **declarativo** (`<Routes>` / `<Route>`), no el
> array de objetos de `createBrowserRouter`.

```jsx
// src/pages/Profile.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import Profile from "./Profile";

describe("Profile", () => {
  it("renders the Popeye profile for /profile/popeye", () => {
    render(
      <MemoryRouter initialEntries={["/profile/popeye"]}>
        <Routes>
          <Route path="/profile/:name" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/popeye/i)).toBeInTheDocument();
  });

  it("renders the default profile for an unknown name", () => {
    render(
      <MemoryRouter initialEntries={["/profile/unknown"]}>
        <Routes>
          <Route path="/profile/:name" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/nothing to see here/i)).toBeInTheDocument();
  });
});
```

Para que funcione, el proyecto configura Vitest en `vite.config.js` (`environment:
'jsdom'`) y un `tests/setup.js` que registra los matchers de
`@testing-library/jest-dom`.

```bash
npm test
```

- `initialEntries` simula la URL inicial (equivale a estar en esa ruta).
- Cada test define su propia URL sin depender de un servidor.
- Alternativa: `createMemoryRouter(routes, { initialEntries })` + `RouterProvider` si
  quieres reutilizar el mismo array de objetos de `routes.jsx`.
