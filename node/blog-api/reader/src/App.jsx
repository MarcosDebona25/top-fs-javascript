import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { PostPage } from './pages/PostPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { SignupPage } from './pages/SignupPage.jsx';
import { NotFound } from '@blog/shared/states';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="posts/:postId" element={<PostPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route
          path="*"
          element={<NotFound title="This page isn’t here." text="The address may be mistyped, or the page moved." />}
        />
      </Route>
    </Routes>
  );
}
