# Testing con React Testing Library

Guía práctica para testear componentes de React con **React Testing Library (RTL)**, **jest-dom** y **user-event**, sobre **Vitest** (test runner con la misma API que Jest).

El código de ejemplo vive en `src/components/`, con su test al lado de cada componente (archivos `.test.jsx`).

---

## Índice

1. [La filosofía de RTL](#1-la-filosofia-de-rtl)
2. [Stack del proyecto](#2-stack-del-proyecto)
3. [Configuración](#3-configuracion)
4. [`render` y `screen`](#4-render-y-screen)
5. [Queries: cómo buscar elementos](#5-queries-como-buscar-elementos)
6. [jest-dom: matchers semánticos](#6-jest-dom-matchers-semanticos)
7. [Simular eventos: user-event vs fireEvent](#7-simular-eventos-user-event-vs-fireevent)
8. [Mocking con `vi.fn()` y `vi.mock()`](#8-mocking-con-vifn-y-vimock)
9. [Snapshots: pros y contras](#9-snapshots-pros-y-contras)
10. [Comandos útiles](#10-comandos-utiles)
11. [Buenas prácticas](#11-buenas-practicas)

---

## 1. La filosofía de RTL

RTL parte de una idea simple: **testea tu componente como lo haría un usuario, no cómo está implementado por dentro**.

Esto significa:

- No testeas que un `useState` cambió de `false` a `true`.
- Testeas que, al hacer clic en un botón, aparece el texto que el usuario espera ver.
- No buscas elementos por clases CSS ni por `data-testid` salvo último recurso.
- Buscas por lo que el usuario ve y usa: el rol (`button`, `heading`, `link`), el texto visible y los labels accesibles.

Un test de RTL sigue siempre el mismo patrón de tres pasos:

1. **Arrange** (preparar): renderizar el componente.
2. **Act** (actuar): disparar una interacción con `user-event`.
3. **Assert** (verificar): comprobar el resultado con queries y matchers de `jest-dom`.

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Counter from "./Counter";

test("incrementa el contador", async () => {
  const user = userEvent.setup();      // Arrange (parte 1)

  render(<Counter initialCount={0} />); // Arrange (parte 2)

  await user.click(screen.getByRole("button", { name: "increment" })); // Act

  expect(screen.getByRole("heading")).toHaveTextContent("Count: 1");   // Assert
});
```

---

## 2. Stack del proyecto

| Pieza | Rol |
| --- | --- |
| [Vite](https://vite.dev) | Bundler y dev server |
| [Vitest](https://vitest.dev) | Test runner (API idéntica a Jest: `describe`, `it`, `expect`) |
| [jsdom](https://github.com/jsdom/jsdom) | Entorno de DOM simulado para correr los tests |
| [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro) | `render`, `screen` y las queries |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) | Matchers semánticos para `expect` |
| [@testing-library/user-event](https://testing-library.com/docs/user-event/intro) | Simulación realista de interacciones de usuario |

Las dependencias están en `package.json`; los componentes se escriben en `src/` y los tests co-localizados junto a ellos.

---

## 3. Configuración

Todo lo necesario ya está en el proyecto.

### `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "lint": "eslint ."
  }
}
```

### `vite.config.js`

```js
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,          // describe, it, expect sin importarlos
    environment: "jsdom",   // DOM simulado en lugar de Node
    setupFiles: "./tests/setup.js",
  },
});
```

### `tests/setup.js`

Se ejecuta antes de cada suite y registra los matchers de `jest-dom`:

```js
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup(); // desmonta el arbol renderizado entre tests
});
```

---

## 4. `render` y `screen`

### `render`

Monta el componente en un contenedor DOM y devuelve un objeto con utilidades (`container`, `rerender`, `unmount`, queries).

```jsx
const { container } = render(<Greeting name="Marcos" />);
```

### `screen`

Es un atajo global para buscar dentro del `document.body`. En la práctica, **siempre usas `screen`** en lugar de las queries que devuelve `render`, porque te evita mantener referencias manuales y es lo que la documentación oficial recomienda.

```jsx
render(<Greeting name="Marcos" />);

// Correcto: usar screen
screen.getByRole("heading");

// Evitar: usar la query que devuelve render
const { getByRole } = render(<Greeting />);
getByRole("heading");
```

---

## 5. Queries: cómo buscar elementos

Las queries se dividen por **prefijo** (comportamiento) y **sufijo** (criterio de búsqueda).

### Prefijos

| Prefijo | Cuántos resultados espera | Si no encuentra |
| --- | --- | --- |
| `getBy...` | exactamente uno | lanza error |
| `queryBy...` | uno o ninguno | devuelve `null` |
| `findBy...` | exactamente uno (async) | rechaza la promesa |
| `getAllBy...` | uno o más | lanza error |
| `queryAllBy...` | cero o más | devuelve `[]` |
| `findAllBy...` | uno o más (async) | rechaza la promesa |

Regla rápida:

- `getBy...` para lo que debe existir ya en el DOM.
- `queryBy...` para verificar que algo **no** existe.
- `findBy...` para esperar a que algo aparezca (renders async, fetch, timers).

### Sufijos y prioridad

Busca en este orden, de mayor a menor preferencia:

1. `ByRole` (accesible, refleja lo que el usuario percibe)
2. `ByLabelText` (para inputs con `label`)
3. `ByPlaceholderText`
4. `ByText` (texto visible)
5. `ByDisplayValue`
6. `ByAltText`
7. `ByTitle`
8. `ByTestId` (solo como último recurso)

Ejemplos:

```jsx
screen.getByRole("button", { name: /sign in/i });
screen.getByRole("heading", { level: 1 });
screen.getByLabelText(/username/i);
screen.getByText("Developer");
screen.queryByRole("alert");        // null si no hay alerta
await screen.findByRole("heading"); // espera async
```

---

## 6. jest-dom: matchers semánticos

`jest-dom` añade a `expect` matchers que describen intenciones de UI en lugar de detalles de implementación.

| Matcher | Uso típico |
| --- | --- |
| `toBeInTheDocument()` | el elemento existe en el DOM |
| `toHaveTextContent("...")` | el texto (parcial) coincide |
| `toBeVisible()` / `toBeHidden()` | visibilidad real |
| `toBeDisabled()` / `toBeEnabled()` | estado de controles de formulario |
| `toBeChecked()` | checkbox/radio marcado |
| `toHaveValue("...")` | valor de un input |
| `toHaveAttribute("href", "...")` | un atributo concreto |
| `toHaveClass("...")` | clase CSS presente |
| `toHaveFocus()` | el elemento tiene el foco |

Ejemplo real de `src/components/LoginForm.test.jsx`:

```jsx
expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();

await user.type(screen.getByLabelText(/username/i), "marcos");
await user.type(screen.getByLabelText(/password/i), "secret");

expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled();
```

---

## 7. Simular eventos: user-event vs fireEvent

Hay dos formas de disparar eventos.

### `fireEvent`

Es el despachador de bajo nivel. Dispara un solo evento DOM exactamente como se lo pidas.

```jsx
fireEvent.click(button);
fireEvent.change(input, { target: { value: "hola" } });
```

Problema: no simula la secuencia real de eventos que produce un navegador. Por ejemplo, al escribir en un input, un usuario real dispara `focus`, `keydown`, `keyup`, etc. `fireEvent.change` no hace eso, por lo que puede pasar tests que un usuario real rompería.

### `user-event`

Es la API recomendada. Simula la interacción completa y realista del usuario.

```jsx
const user = userEvent.setup();

await user.click(button);
await user.type(input, "hola");
await user.clear(input);
await user.selectOptions(select, "opcion");
await user.keyboard("{Enter}");
```

Reglas clave:

- Siempre crea el usuario con `userEvent.setup()` (no uses `userEvent.click()` directo).
- Las llamadas son async: usa `await`.
- Prefiere `user-event` a `fireEvent` salvo que necesites algo muy específico de bajo nivel.

Ejemplo real de `src/components/Counter.test.jsx`:

```jsx
const user = userEvent.setup();
render(<Counter initialCount={0} />);

await user.click(screen.getByRole("button", { name: "increment" }));

expect(screen.getByRole("heading")).toHaveTextContent("Count: 1");
```

---

## 8. Mocking con `vi.fn()` y `vi.mock()`

Cuando un componente depende de funciones o de otros componentes, los mocks te dejan aislarlo y controlar el comportamiento en cada test.

### Mock de funciones con `vi.fn()`

`vi.fn()` crea una función mock que registra cada llamada (veces, argumentos, retorno) y que puedes configurar para devolver un valor, lanzar un error o ejecutar una implementación propia.

El caso más común es mockear un callback que el componente recibe por prop:

```jsx
const onSearch = vi.fn();
render(<SearchBox onSearch={onSearch} />);

await user.click(screen.getByRole("button", { name: /search/i }));

expect(onSearch).toHaveBeenCalledTimes(1);
expect(onSearch).toHaveBeenCalledWith("react");
```

### Mock compartido con `beforeEach`

Si varios tests usan el mismo mock, lo creas en `beforeEach` para que cada test arranque con una copia limpia, sin estado arrastrado del test anterior:

```jsx
let onSearch;

beforeEach(() => {
  onSearch = vi.fn();
});
```

Ahí también puedes fijar un comportamiento por defecto que compartan todos los tests:

```jsx
beforeEach(() => {
  onSearch = vi.fn().mockResolvedValue("default result");
});
```

### Mock específico de un test

Cuando solo un test necesita un comportamiento distinto, lo sobrescribes dentro de ese test con `mockResolvedValue`, `mockRejectedValue` o `mockImplementation`:

```jsx
it("renders the returned result", async () => {
  onSearch.mockResolvedValue("42 results");
  // ...
});

it("renders an error when the search fails", async () => {
  onSearch.mockRejectedValue(new Error("network down"));
  // ...
});
```

### Limpiar mocks entre tests

| Método | Qué limpia |
| --- | --- |
| `vi.clearAllMocks()` | borra el historial de llamadas (calls, instances, results) |
| `vi.resetAllMocks()` | `clearAllMocks` + quita implementaciones y retornos configurados |
| `vi.restoreAllMocks()` | `resetAllMocks` + restaura los mocks de `vi.spyOn` a su implementación original |

Regla rápida: usa `vi.clearAllMocks()` cuando solo quieres limpiar el historial y conservar las implementaciones; usa `vi.resetAllMocks()` en `beforeEach` cuando quieres que cada test arranque desde cero.

### Mockear child components con `vi.mock()`

A veces un padre renderiza hijos "pesados" (que hacen fetch, animaciones o dependen de servicios externos). Para testear el padre de forma aislada, reemplazas el hijo por un stub con `vi.mock()`:

```jsx
vi.mock("./Avatar", () => ({
  default: vi.fn(() => <div data-testid="mock-avatar" />),
}));
```

Después verificas que el hijo se renderizó y con qué props:

```jsx
it("passes the expected props to the Avatar child", () => {
  render(<UserCard user={user} />);

  expect(screen.getByTestId("mock-avatar")).toBeInTheDocument();

  // React llama al componente con (props, segundoArgumento): inspecciona el primero.
  const [props] = Avatar.mock.calls[0];
  expect(props).toEqual({ name: "Marcos Debona" });
});
```

Importante: `vi.mock()` se eleva (hoisting) al inicio del archivo, así que su factory no puede referenciar variables definidas más abajo. Si necesitas compartir datos entre la factory y los tests, usa `vi.hoisted()`.

Ejemplos completos en `src/components/UserCard.test.jsx` y `src/components/SearchBox.test.jsx`.

---

## 9. Snapshots: pros y contras

Un **snapshot** guarda una copia del HTML renderizado en un archivo (`.snap`) la primera vez que corre el test. En las siguientes ejecuciones, Vitest compara el HTML actual con el guardado y falla si cambia.

```jsx
const { container } = render(<ProfileCard name="Marcos" role="Developer" email="m@x.com" />);
expect(container).toMatchSnapshot();
```

Al correrlo por primera vez se genera `__snapshots__/ProfileCard.test.jsx.snap`.

### Pros

- **Rápido de escribir**: una línea cubre todo el HTML del componente.
- **Detecta cambios no intencionales**: si algo cambió en la estructura, te avisa.
- **Útil como red de seguridad** en componentes muy estables o de presentación pura.

### Contras

- **Frágil**: cualquier cambio mínimo (un espacio, una clase, un texto) rompe el test, aunque el componente siga funcionando.
- **No comunica intención**: leer un snapshot gigante no te dice qué comportamiento era el importante.
- **Se actualiza a ciegas**: `vitest -u` regenera el snapshot y puede "aprobar" una regresión sin que nadie lo note.
- **Acopla el test a la implementación**: contradice la filosofía de testear comportamiento, no estructura.

### Veredicto

Usa snapshots **con moderación**, para componentes de presentación estables. Para comportamiento (estado, eventos, validaciones) prefiere aserciones explícitas con `jest-dom`, como hace `ProfileCard.test.jsx`, que combina un snapshot con un test explícito del mismo componente para mostrar la diferencia.

---

## 10. Comandos útiles

```bash
# Correr los tests en modo watch
npm test

# Correr los tests una sola vez y salir
npm test -- --run

# Filtrar por nombre de test o de archivo
npm test -- -t "Counter"

# Actualizar los snapshots
npm test -- -u

# Ejecutar un solo archivo de test
npm test -- src/components/Counter.test.jsx

# Lint del proyecto
npm run lint
```

Para cobertura, Vitest requiere un proveedor adicional (`@vitest/coverage-v8`), que no está instalado por defecto:

```bash
npm i -D @vitest/coverage-v8
npm test -- --coverage
```

---

## 11. Buenas prácticas

1. **Testea comportamiento, no implementación**: si cambias internamente el componente, el test no debería romperse.
2. **Prefiere `ByRole` y `ByLabelText`**: son las queries más accesibles y estables.
3. **Usa `userEvent.setup()` y `await`** para toda interacción.
4. **Evita `data-testid`** salvo que no exista otra forma accesible de seleccionar el elemento.
5. **Un test = un comportamiento**, con un nombre que describa el resultado esperado.
6. **No testees librerías**: solo tu código, no React ni los matchers.
7. **Mantén los snapshots pequeños** y revísalos manualmente cuando cambien.

---

## Estructura de ejemplo

```
src/
  components/
    Greeting.jsx       # render + queries + jest-dom
    Greeting.test.jsx
    Counter.jsx        # eventos de usuario (click + estado)
    Counter.test.jsx
    LoginForm.jsx      # form: type, submit, validacion
    LoginForm.test.jsx
    ProfileCard.jsx    # snapshot + asercion explicita
    ProfileCard.test.jsx
    SearchBox.jsx      # callback mockeado con vi.fn
    SearchBox.test.jsx # vi.fn en beforeEach y por test
    Avatar.jsx         # child usado para ejemplificar vi.mock
    UserCard.jsx       # padre que renderiza un child mockeado
    UserCard.test.jsx  # mock de child component
  App.jsx              # composicion
  App.test.jsx         # smoke test
  main.jsx
tests/
  setup.js             # jest-dom + cleanup
```
