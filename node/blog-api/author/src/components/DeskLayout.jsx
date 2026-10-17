import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@blog/shared/auth';
import { Loading } from '@blog/shared/states';
import { returnTo } from '@blog/shared/returnTo';
import { DeskMasthead } from './DeskMasthead.jsx';
import { DeskFooter } from './DeskFooter.jsx';
import { SessionDialog } from './SessionDialog.jsx';
import { ReadersOnly } from './ReadersOnly.jsx';

// Guards every desk page: authors only, and a session that ends mid-work asks for the password in place.
export function DeskLayout() {
  const { status, user, logOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Who was working here; set while the session lives, cleared on an explicit log out.
  const [lastUsername, setLastUsername] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') setLastUsername(user.username);
  }, [status, user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  async function handleLogOut() {
    setLastUsername(null);
    await logOut();
    navigate('/login');
  }

  const sessionLost = status === 'anonymous' && lastUsername !== null;
  if (status === 'anonymous' && !sessionLost) return <Navigate to="/login" replace state={returnTo(location)} />;

  let content = <Outlet />;
  if (status === 'loading') content = <Loading label="Opening the desk…" />;
  else if (status === 'authenticated' && user.role !== 'AUTHOR') content = <ReadersOnly user={user} onLogOut={handleLogOut} />;

  return (
    <div className="app">
      <DeskMasthead user={status === 'authenticated' ? user : null} onLogOut={handleLogOut} />
      <main className="wrap">{content}</main>
      <DeskFooter user={status === 'authenticated' ? user : null} onLogOut={handleLogOut} />
      {/* The page stays mounted underneath, so nothing typed is lost. */}
      {sessionLost && <SessionDialog username={lastUsername} onDismiss={() => setLastUsername(null)} />}
    </div>
  );
}
