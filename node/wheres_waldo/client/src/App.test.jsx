import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { mockApi, user } from '../test/helpers.jsx';
import { AuthProvider } from './auth.jsx';
import App from './App.jsx';

const renderApp = (route) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );

const leaderboards = {
  'GET /api/maps': { maps: [] },
  'GET /api/leaderboards/summary': { mapCount: 3, global: { rows: [], total: 0 }, maps: [] },
};

describe('<App>', () => {
  it('shows the 404 page on an unknown address', async () => {
    mockApi();
    renderApp('/nowhere');
    expect(await screen.findByRole('heading', { name: /Even Waldo can't find this page/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the scenes' })).toHaveAttribute('href', '/#maps');
  });

  it('has a footer link to the author on every page', async () => {
    mockApi(leaderboards);
    renderApp('/');
    expect(await screen.findByRole('link', { name: 'MarcosDebona25' })).toHaveAttribute('href', 'https://github.com/MarcosDebona25');
  });

  it('shows Log in and Sign up to a guest', async () => {
    mockApi(leaderboards);
    renderApp('/');
    expect(await screen.findByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/signup');
  });

  it('shows the player and a Log out button once logged in, and logs out', async () => {
    const api = mockApi({ ...leaderboards, 'GET /api/auth/me': user('pompom'), 'POST /api/auth/logout': null });
    renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    expect(await screen.findByText('pompom', { selector: '.nav__user' })).toHaveClass('btn', 'btn--primary', 'btn--small');
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Log out' }));
    expect(api.called('POST', '/api/auth/logout')).toHaveLength(1);
    expect(await screen.findByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(nav).toBeInTheDocument();
  });

  it('has no calibration tool in the way of the game routes', async () => {
    mockApi(leaderboards);
    renderApp('/');
    expect(screen.queryByText('DEV ONLY')).not.toBeInTheDocument();
    await screen.findByRole('link', { name: 'MarcosDebona25' });
  });
});
