import { Route, Routes } from 'react-router';
import { SiteLayout } from './components/Layout.jsx';
import Landing from './pages/Landing.jsx';
import NotFound from './pages/NotFound.jsx';
import Ranking from './pages/Ranking.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Landing />} />
        <Route path="ranking" element={<Ranking />} />
        <Route path="ranking/:slug" element={<Ranking />} />
      </Route>
      <Route element={<SiteLayout variant="bare" />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
