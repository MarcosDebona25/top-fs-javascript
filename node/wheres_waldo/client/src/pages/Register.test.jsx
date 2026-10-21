import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router';
import { describe, expect, it } from 'vitest';
import { mockApi, reply, renderRoutes, user } from '../../test/helpers.jsx';
import Register from './Register.jsx';

const routes = (
  <>
    <Route path="/" element={<p>HOME</p>} />
    <Route path="/signup" element={<Register />} />
  </>
);

const fill = async (person, { username, password, confirm }) => {
  if (username !== undefined) await person.type(screen.getByLabelText('Username'), username);
  if (password !== undefined) await person.type(screen.getByLabelText('Password'), password);
  if (confirm !== undefined) await person.type(screen.getByLabelText('Confirm password'), confirm);
};

describe('<Register>', () => {
  it('tells the player their username is available while they type', async () => {
    mockApi({ 'GET /api/auth/username-available?username=pompom': { username: 'pompom', available: true } });
    renderRoutes(routes, { route: '/signup' });
    await fill(userEvent.setup(), { username: 'pompom' });
    expect(await screen.findByText('pompom is available')).toBeInTheDocument();
  });

  it('tells them when it is taken', async () => {
    mockApi({ 'GET /api/auth/username-available?username=stripe_seeker': { username: 'stripe_seeker', available: false } });
    renderRoutes(routes, { route: '/signup' });
    await fill(userEvent.setup(), { username: 'stripe_seeker' });
    expect(await screen.findByText('That username is already taken')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
  });

  it('checks the format without calling the server', async () => {
    const api = mockApi();
    renderRoutes(routes, { route: '/signup' });
    await fill(userEvent.setup(), { username: 'po' });
    expect(screen.getByText('Use at least 3 characters')).toBeInTheDocument();
    expect(api.called('GET', '/api/auth/username-available')).toHaveLength(0);
  });

  it("flags passwords that don't match", async () => {
    mockApi();
    renderRoutes(routes, { route: '/signup' });
    await fill(userEvent.setup(), { password: 'longenough', confirm: 'longenougX' });
    expect(screen.getByRole('alert')).toHaveTextContent("Passwords don't match");
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('aria-invalid', 'true');
  });

  it('creates the account and goes on', async () => {
    const api = mockApi({
      'GET /api/auth/username-available': { available: true },
      'POST /api/auth/register': reply(201, { user: { id: 'u1', username: 'pompom' } }),
    });
    renderRoutes(routes, { route: '/signup' });
    const person = userEvent.setup();
    await fill(person, { username: 'pompom', password: 'longenough', confirm: 'longenough' });
    await screen.findByText('pompom is available');
    await person.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('HOME')).toBeInTheDocument();
    expect(api.called('POST', '/api/auth/register')[0].body).toEqual({ username: 'pompom', password: 'longenough', confirmPassword: 'longenough' });
  });

  it('does not submit a password that is too short', async () => {
    const api = mockApi({ 'GET /api/auth/username-available': { available: true } });
    renderRoutes(routes, { route: '/signup' });
    const person = userEvent.setup();
    await fill(person, { username: 'pompom', password: 'short', confirm: 'short' });
    await screen.findByText('pompom is available');
    await person.click(screen.getByRole('button', { name: 'Create account' }));
    expect(api.called('POST', '/api/auth/register')).toHaveLength(0);
    expect(screen.getByLabelText('Password')).toHaveFocus();
  });

  it('shows the server\'s complaint when the name was taken in the meantime', async () => {
    mockApi({
      'GET /api/auth/username-available': { available: true },
      'POST /api/auth/register': reply(409, { error: 'Username already taken', code: 'USERNAME_TAKEN', errors: { username: 'That username is already taken.' } }),
    });
    renderRoutes(routes, { route: '/signup' });
    const person = userEvent.setup();
    await fill(person, { username: 'pompom', password: 'longenough', confirm: 'longenough' });
    await screen.findByText('pompom is available');
    await person.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('That username is already taken.')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveFocus();
  });

  it('redirects a logged-in player', async () => {
    mockApi({ 'GET /api/auth/me': user() });
    renderRoutes(routes, { route: '/signup' });
    await waitFor(() => expect(screen.getByText('HOME')).toBeInTheDocument());
  });
});
