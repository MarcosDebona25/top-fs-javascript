import { Route, Routes } from 'react-router';
import { SiteLayout } from './components/Layout.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout variant="bare" />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
