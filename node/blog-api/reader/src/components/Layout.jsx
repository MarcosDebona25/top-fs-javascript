import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Masthead } from './Masthead.jsx';
import { SiteFooter } from './SiteFooter.jsx';

export function Layout() {
  const { pathname } = useLocation();

  // A new page starts at the top, like a full page load would.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <Masthead />
      <main className="wrap">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
