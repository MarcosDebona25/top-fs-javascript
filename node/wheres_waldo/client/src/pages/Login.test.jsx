import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router';
import { describe, expect, it } from 'vitest';
import { mockApi, reply, renderRoutes, user } from '../../test/helpers.jsx';
import Login from './Login.jsx';

const routes = (
  <>
    <Route path="/" element={<p>HOME</p>} />
    <Route path="/login" element={<Login />} />
  </>
);

describe('<Login>', () => {
  it('logs in and goes back to the page the player came from', async () => {
    const api = mockApi({ 'POST /api/auth/login': user('pompom') });
    renderRoutes(routes, { route: '/login' });
    const person = userEvent.setup();
    await person.type(screen.getByLabelText('Username'), ' pompom ');
    await person.type(screen.getByLabelText('Password'), 'secret-pass');
    await person.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('HOME')).toBeInTheDocument();
    expect(api.called('POST', '/api/auth/login')[0].body).toEqual({ username: 'pompom', password: 'secret-pass' });
  });

  it('shows the same message for a wrong username or password', async () => {
    mockApi({ 'POST /api/auth/login': reply(401, { error: 'Invalid username or password' }) });
    renderRoutes(routes, { route: '/login' });
    const person = userEvent.setup();
    await person.type(screen.getByLabelText('Username'), 'pompom');
    await person.type(screen.getByLabelText('Password'), 'nope-nope');
    await person.click(screen.getByRole('button', { name: 'Log in' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Wrong username or password.');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Wrong username or password.');
  });

  it('asks for both fields before calling the server', async () => {
    const api = mockApi();
    renderRoutes(routes, { route: '/login' });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter your username and password.');
    expect(api.called('POST', '/api/auth/login')).toHaveLength(0);
  });

  it('explains rate limiting', async () => {
    mockApi({ 'POST /api/auth/login': reply(429, { error: 'Too many requests', code: 'RATE_LIMITED' }) });
    renderRoutes(routes, { route: '/login' });
    const person = userEvent.setup();
    await person.type(screen.getByLabelText('Username'), 'pompom');
    await person.type(screen.getByLabelText('Password'), 'whatever1');
    await person.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts');
  });

  it('sends a player who is already logged in away from the form', async () => {
    mockApi({ 'GET /api/auth/me': user('pompom') });
    renderRoutes(routes, { route: '/login' });
    await waitFor(() => expect(screen.getByText('HOME')).toBeInTheDocument());
  });
});
