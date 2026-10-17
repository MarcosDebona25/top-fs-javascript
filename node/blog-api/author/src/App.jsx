import { Route, Routes } from 'react-router';
import { NotFound } from '@blog/shared/states';
import { DeskLayout } from './components/DeskLayout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { DeskPage } from './pages/DeskPage.jsx';
import { EditorPage } from './pages/EditorPage.jsx';

export function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<DeskLayout />}>
        <Route index element={<DeskPage />} />
        <Route path="essays/new" element={<EditorPage />} />
        <Route path="essays/:essayId/edit" element={<EditorPage />} />
        <Route
          path="*"
          element={<NotFound title="This page isn’t on the desk." text="The address may be mistyped." />}
        />
      </Route>
    </Routes>
  );
}
