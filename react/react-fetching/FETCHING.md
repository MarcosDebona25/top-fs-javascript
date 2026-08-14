# Fetching en React - Resumen teorico

Este documento explica los conceptos de fetching de datos en React. El codigo de este proyecto (`react-fetching`) implementa cada concepto de forma practica; cada seccion indica el archivo del proyecto que lo ejemplifica.

## Referencias para consultar mientras lees

Tene estas dos lecturas a mano mientras revisas el resumen:

- LogRocket - Modern API data fetching methods in React: https://blog.logrocket.com/modern-api-data-fetching-methods-react/
- Developerway - How to fetch data in React: https://www.developerway.com/posts/how-to-fetch-data-in-react

---

## 1. Por que fetch va dentro de useEffect

Una peticion HTTP es un **efecto secundario** (side effect): toca algo que esta fuera de React (la red). React renderiza componentes de forma pura: dado el mismo estado y props, produce el mismo JSX. Hacer un `fetch` directamente en el cuerpo del componente romperia esa pureza y, ademas, se ejecutaria en **cada render**, no solo cuando hace falta.

`useEffect` es la API de React para ejecutar efectos secundarios **despues** de que el componente se renderiza. El primer argumento es una funcion (el efecto); el segundo es el arreglo de dependencias, que controla cuando se vuelve a ejecutar.

Codigo de referencia: `src/components/UserList.jsx`.

## 2. Peticion al montar: arreglo de dependencias vacio

```jsx
useEffect(() => {
  fetchUsers()
    .then(setUsers)
    .catch(...)
}, []) // <-- arreglo VACIO
```

- `[]` significa: ejecutar el efecto **una sola vez, al montar** el componente, y no volver a ejecutarlo.
- Si se omite el arreglo, el efecto corre despues de **cada render** (loop infinito de peticiones si ademas haces setState).
- Si el arreglo contiene valores (`[userId]`), el efecto se re-ejecuta cada vez que esos valores cambian (util para peticiones dependientes de props o estado).

Regla de oro: la peticion se dispara por el **ciclo de vida** (montaje o cambio de dependencias), nunca por un render arbitrario.

Nota: en desarrollo con `<StrictMode>`, React monta, desmonta y vuelve a montar los componentes una vez para detectar efectos con limpieza incorrecta. Es normal ver **dos peticiones** en la pestana Network durante el desarrollo. No es un bug: es el comportamiento esperado de StrictMode, y no ocurre en el build de produccion.

## 3. Los tres estados de una peticion: data, loading, error

Toda peticion necesita, como minimo, tres estados para una experiencia de usuario optima:

| Estado | Valor tipico | Que muestra la UI |
| --- | --- | --- |
| `data` | los datos o `null` | el contenido real |
| `loading` | `true`/`false` | un indicador de carga |
| `error` | mensaje o `null` | un aviso con la falla |

```jsx
const [users, setUsers] = useState([])     // data
const [loading, setLoading] = useState(true) // loading: arranca en true
const [error, setError] = useState(null)   // error: arranca en null
```

El flujo es siempre el mismo:

1. Al montar: `loading = true`, aun no hay datos ni error. La UI muestra el estado de carga.
2. La peticion termina bien: `setData(resultado)` y `loading = false`. La UI muestra los datos.
3. La peticion falla: `setError(mensaje)` y `loading = false`. La UI muestra el error.

Sin el estado de loading, el usuario ve una pantalla vacia durante la espera. Sin el estado de error, el usuario ve una pantalla vacia para siempre cuando algo falla. Los tres estados juntos garantizan que la UI siempre tenga algo significativo que mostrar.

Codigo de referencia: `src/components/UserList.jsx` (estados) y `src/components/UserListWithHook.jsx` (los mismos estados via hook).

## 4. Manejo de errores: ¿es correcto comprobar `response.status >= 400`?

**Punto clave que casi nadie sabe:** `fetch` solo rechaza la promesa ante **errores de red** (sin conexion, DNS fallido, CORS, timeout). Un status HTTP de error como 404 o 500 **resuelve la promesa normalmente**: `fetch` te devuelve el `response` y la responsabilidad de revisarlo es tuya.

```jsx
const response = await fetch(url)

if (response.status >= 400) {
  throw new Error('Algo salio mal')
}
```

¿Es correcto? **Si, funciona en la practica.** Como `fetch` sigue las redirecciones automaticamente por defecto, un 3xx nunca llega como respuesta final, asi que en la mayoria de los casos reales `status >= 400` y `!response.ok` son equivalentes.

Pero **la forma mas idiomatica y robusta es `!response.ok`**:

```jsx
const response = await fetch(url)

if (!response.ok) {
  throw new Error(`Request failed with status ${response.status}`)
}
```

Por que es mejor:

- `response.ok` es una propiedad booleana de React a tu favor: es `true` cuando el status esta entre 200 y 299. La intencion se lee directo: "si la respuesta no fue OK, falla".
- Si alguna vez configuras `redirect: 'manual'` y un 3xx aparece como respuesta final, `status >= 400` lo trataria como exito y `!response.ok` lo detectaria. Es la diferencia entre cubrir un rango especifico y cubrir "todo lo que no es exito".
- No hay ningun caso real en el que `status >= 400` sea necesario sobre `!response.ok`.

Resumen: tu verificacion no esta mal, pero `!response.ok` es la convencion estandar de la industria.

Ambos errores (red y HTTP) terminan en el mismo lugar: el `catch` del `try/catch` alrededor del `await`, que es donde haces `setError(...)`.

Codigo de referencia: `src/api/users.js` (la comprobacion `!response.ok`) y `src/components/UserList.jsx` (el `try/catch` + `setError`).

## 5. Custom hooks para evitar llamar useEffect dentro de una funcion

Las **Rules of Hooks** dicen: los hooks (`useState`, `useEffect`, etc.) solo pueden llamarse en el **nivel superior** de un componente o de otro hook. Nunca dentro de:

- funciones de eventos (`onClick`, handlers),
- funciones auxiliares,
- loops o condiciones.

Esto no es una sugerencia: es como React sabe que hooks pertenecen a que componente. Si llamas `useEffect` dentro de una funcion normal, React pierde el rastro del estado del componente y la app falla o se comporta de forma impredecible.

La solucion es el **custom hook**: una funcion cuyo nombre empieza con `use` y que internamente llama a otros hooks. Es el unico lugar, aparte de un componente, donde los hooks estan permitidos.

```jsx
// src/hooks/useFetch.js
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { /* ... la logica completa ... */ }, deps)

  return { data, loading, error }
}
```

Beneficios:

- El componente queda limpio: una linea pide los tres estados, en vez de duplicar `useState` + `useEffect` + `try/catch` en cada lugar.
- La logica (carga, limpieza, errores) se escribe **una sola vez** y se reutiliza en cualquier componente.
- Se cumple la regla de los hooks: `useEffect` vive dentro del hook, no dentro de una funcion arbitraria.

Codigo de referencia: `src/hooks/useFetch.js` y `src/components/UserListWithHook.jsx`. Compara `UserList.jsx` (todo inline) con `UserListWithHook.jsx` (todo en el hook): misma peticion, misma logica, mucho menos codigo en el componente.

## 6. Renderizado condicional: las ramas falsas nunca se renderizan

En React, **un componente no se renderiza hasta que es llamado**. El JSX es JavaScript: `condicion && <Componente />` es una expresion booleana que evalúa:

- si `condicion` es falsa, el resultado es `false`, y React no renderiza nada;
- si `condicion` es verdadera, React llama a `<Componente />` y recien ahi se renderiza.

Consecuencia directa: **si el JSX tiene logica condicional, las ramas falsas nunca se renderizan hasta que se vuelven verdaderas**. No estan "ocultas con CSS": no existen en el DOM.

```jsx
if (loading) return <p>Loading...</p>   // solo se renderiza si loading es true
if (error) return <p>{error}</p>        // solo se renderiza si hay error
return <ul>{users.map(...)}</ul>        // solo se renderiza si no hay loading ni error
```

Este comportamiento es exactamente lo que hace funcionar el patron de los tres estados: en cada momento existe **una sola** de las ramas en el DOM. Cuando `loading` pasa de `true` a `false` despues de la respuesta, React re-ejecuta el componente, la rama de loading deja de llamarse y la rama de datos se llama por primera vez.

Los dos patrones de la vida real:

- Con `return` temprano (util para estados simples): `if (loading) return <Spinner />`.
- Con `&&` (util para fragmentos dentro de un JSX mayor): `{error && <ErrorBanner />}` o `{users.length > 0 && <UserList />}`.

Codigo de referencia: `src/components/UserList.jsx` (los tres `return` condicionales) y `src/components/ConditionalRenderDemo.jsx` (el ejemplo interactivo con `showSecret && <SecretMessage />`).

## 7. Checklist de repaso

1. ¿La peticion vive en `useEffect` con arreglo de dependencias vacio para correr al montar? No en el cuerpo del componente.
2. ¿Existen los tres estados (`data`, `loading`, `error`)? Toda peticion los necesita.
3. ¿`loading` arranca en `true` y se apaga en el `finally` (o al terminar) de la peticion?
4. ¿Se comprueba `response.ok` (o al menos `status >= 400`) despues del `fetch`, porque `fetch` solo rechaza en errores de red?
5. ¿El error se asigna con `setError` en el `catch` y se renderiza condicionalmente?
6. ¿La logica de fetching esta en un custom hook si se va a reutilizar, y los hooks solo se llaman en el nivel superior?
7. ¿Las ramas condicionales renderizan solo cuando su condicion es verdadera, sin asumir que existen antes?
