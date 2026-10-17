// Where the login page should send someone back to once they are in.
export function returnTo(location) {
  const { pathname } = location;
  if (pathname === '/login' || pathname === '/signup') return location.state;
  return { from: pathname };
}
