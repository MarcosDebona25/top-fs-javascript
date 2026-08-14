# react-test-rtl

Ejemplo práctico de testing de componentes React con **React Testing Library**, **jest-dom** y **user-event**, corriendo sobre **Vitest** (API idéntica a Jest).

## Stack

- React 19 + Vite
- Vitest + jsdom
- @testing-library/react, @testing-library/jest-dom, @testing-library/user-event

## Scripts

```bash
npm run dev       # servidor de desarrollo
npm test          # tests en modo watch
npm test -- --run # tests una sola vez
npm run build     # build de produccion
npm run lint      # lint
```

## Guía de testing

La explicación completa de conceptos, queries, matchers, eventos, mocking y snapshots está en [TESTING.md](./TESTING.md).
