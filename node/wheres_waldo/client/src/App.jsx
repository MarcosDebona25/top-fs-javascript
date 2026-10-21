import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router';
import { SiteLayout } from './components/Layout.jsx';
import { prefetchGame, prefetchLogin, prefetchNotFound, prefetchRanking, prefetchRegister, prefetchResult } from './lib/prefetch.js';
import Landing from './pages/Landing.jsx';

// The landing page is the common entry point, so it stays in the initial bundle. Every other page is
// downloaded only when its route is opened; hovering a link starts the download a little earlier.
const Game = lazy(prefetchGame);
const Ranking = lazy(prefetchRanking);
const Result = lazy(prefetchResult);
const Login = lazy(prefetchLogin);
const Register = lazy(prefetchRegister);
const NotFound = lazy(prefetchNotFound);

// The calibration tool only exists in development: in a production build this branch is removed.
const Calibrate = import.meta.env.DEV ? lazy(() => import('./pages/Calibrate.jsx')) : null;

function Page({ children }) {
  return (
    <Suspense
      fallback={
        <p className="loading container" role="status">
          Loading…
        </p>
      }
    >
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Landing />} />
        <Route
          path="result/:id"
          element={
            <Page>
              <Result />
            </Page>
          }
        />
        <Route
          path="ranking/:slug?"
          element={
            <Page>
              <Ranking />
            </Page>
          }
        />
      </Route>
      <Route
        path="play/:slug"
        element={
          <Page>
            <Game />
          </Page>
        }
      />
      <Route element={<SiteLayout variant="back" />}>
        <Route
          path="login"
          element={
            <Page>
              <Login />
            </Page>
          }
        />
        <Route
          path="signup"
          element={
            <Page>
              <Register />
            </Page>
          }
        />
      </Route>
      {Calibrate && (
        <Route
          path="dev/calibrate"
          element={
            <Page>
              <Calibrate />
            </Page>
          }
        />
      )}
      <Route element={<SiteLayout variant="bare" />}>
        <Route
          path="*"
          element={
            <Page>
              <NotFound />
            </Page>
          }
        />
      </Route>
    </Routes>
  );
}
