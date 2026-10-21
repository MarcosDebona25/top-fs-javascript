import { Route, Routes } from 'react-router';
import { SiteLayout } from './components/Layout.jsx';
import Game from './pages/Game.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import Ranking from './pages/Ranking.jsx';
import Result from './pages/Result.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Landing />} />
        <Route path="result/:id" element={<Result />} />
        <Route path="ranking" element={<Ranking />} />
        <Route path="ranking/:slug" element={<Ranking />} />
      </Route>
      <Route path="play/:slug" element={<Game />} />
      <Route element={<SiteLayout variant="back" />}>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Register />} />
      </Route>
      <Route element={<SiteLayout variant="bare" />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
