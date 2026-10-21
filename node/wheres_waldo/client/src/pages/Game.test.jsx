import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockApi, reply, renderRoutes, user } from '../../test/helpers.jsx';
import Game, { describeGameError } from './Game.jsx';

const characters = [
  { slug: 'waldo', name: 'Waldo' },
  { slug: 'woof', name: 'Woof' },
  { slug: 'wenda', name: 'Wenda' },
  { slug: 'wizard', name: 'Wizard Whitebeard' },
  { slug: 'odlaw', name: 'Odlaw' },
];
const map = { map: { slug: 'beach', name: 'Beach', imageWidth: 2560, imageHeight: 1644, calibrated: true, characters, bestTimeMs: null } };
const game = (overrides = {}) => ({
  id: 'g1',
  mapSlug: 'beach',
  status: 'in_progress',
  ranked: false,
  startedAt: new Date(Date.now() - 4000).toISOString(),
  finishedAt: null,
  serverTime: new Date().toISOString(),
  characters,
  found: [],
  wrongCount: 0,
  penaltyMs: 0,
  wrongGuessPenaltyMs: 1000,
  ...overrides,
});

const routes = (
  <>
    <Route path="/" element={<p>HOME</p>} />
    <Route path="/play/:slug" element={<Game />} />
    <Route path="/result/:id" element={<p>RESULT PAGE</p>} />
  </>
);

// jsdom has no layout: give the stage a size. The picture is fit to the width, so with a 1000 x 700 stage it is
// 1000 x 642 and sits centred, which puts the centre of the stage at (0.5, 0.5) of the image.
beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 1000, bottom: 700, width: 1000, height: 700, x: 0, y: 0, toJSON() {} });
});

async function startGame(handlers = {}, { login } = {}) {
  const api = mockApi({
    'GET /api/maps/beach': map,
    'POST /api/maps/beach/games': reply(201, { game: game() }),
    ...(login ? { 'GET /api/auth/me': user('pompom') } : {}),
    ...handlers,
  });
  renderRoutes(routes, { route: '/play/beach' });
  const person = userEvent.setup();
  const start = await screen.findByRole('button', { name: /Start/ });
  await waitFor(() => expect(start).toBeEnabled());
  await person.click(start);
  const stage = await screen.findByRole('group', { name: /Beach scene to search/ });
  return { api, person, stage };
}

async function pickCenter(person, stage) {
  stage.focus();
  await person.keyboard('{Enter}');
  return screen.findByRole('menu', { name: 'Who is here?' });
}

describe('<Game> before the start', () => {
  it('announces the rule, the five characters and that a guest\'s time is not saved', async () => {
    mockApi({ 'GET /api/maps/beach': map });
    renderRoutes(routes, { route: '/play/beach' });
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Find all five characters' })).toBeInTheDocument();
    expect(within(dialog).getByText('Scene 1 · Beach')).toBeInTheDocument();
    expect(within(dialog).getByText(/Every wrong guess adds \+1 second/)).toBeInTheDocument();
    expect(within(dialog).getAllByRole('img').map((img) => img.getAttribute('alt'))).toEqual(characters.map((character) => character.name));
    expect(await within(dialog).findByText(/Playing as a guest/)).toBeInTheDocument();
  });

  it('tells a registered player their time counts', async () => {
    mockApi({ 'GET /api/maps/beach': map, 'GET /api/auth/me': user('pompom') });
    renderRoutes(routes, { route: '/play/beach' });
    expect(await screen.findByText(/Your best time goes on the leaderboard/)).toBeInTheDocument();
    expect(screen.getByText('pompom')).toBeInTheDocument();
  });

  it('does not start the game, or the clock, until the player says so', async () => {
    const api = mockApi({ 'GET /api/maps/beach': map });
    renderRoutes(routes, { route: '/play/beach' });
    await screen.findByRole('dialog');
    expect(api.called('POST', '/api/maps/beach/games')).toHaveLength(0);
    expect(screen.getByRole('timer')).toHaveTextContent('0:00.000');
  });

  it('shows the 404 page for a scene that does not exist', async () => {
    mockApi({ 'GET /api/maps/beach': map });
    renderRoutes(<Route path="/play/:slug" element={<Game />} />, { route: '/play/mars' });
    expect(await screen.findByRole('heading', { name: /Even Waldo can't find this page/ })).toBeInTheDocument();
  });

  it('says so when the game cannot be started', async () => {
    mockApi({ 'GET /api/maps/beach': map, 'POST /api/maps/beach/games': reply(429, { error: 'Too many requests', code: 'RATE_LIMITED' }) });
    renderRoutes(routes, { route: '/play/beach' });
    const person = userEvent.setup();
    const start = await screen.findByRole('button', { name: /Start/ });
    await waitFor(() => expect(start).toBeEnabled());
    await person.click(start);
    expect(await screen.findByRole('alert')).toHaveTextContent('Slow down a little');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('<Game> playing', () => {
  it('starts the game on the server and hides the modal', async () => {
    const { api } = await startGame();
    expect(api.called('POST', '/api/maps/beach/games')).toHaveLength(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('No misses yet')).toBeInTheDocument();
  });

  it('abandons the game before going back to the scenes', async () => {
    const { api, person } = await startGame({ 'POST /api/games/g1/quit': reply(200, { game: { id: 'g1', status: 'abandoned' } }) });
    await person.click(screen.getByRole('button', { name: 'Quit' }));
    expect(await screen.findByText('HOME')).toBeInTheDocument();
    expect(api.called('POST', '/api/games/g1/quit')).toHaveLength(1);
  });

  it('opens the picker where the player clicked and lists only who is still hidden', async () => {
    const { person, stage } = await startGame({}, { login: true });
    const menu = await pickCenter(person, stage);
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual(characters.map((character) => character.name));
  });

  it('sends the guess in image fractions and shows the penalty on a miss', async () => {
    const { api, person, stage } = await startGame({
      'POST /api/games/g1/guesses': reply(200, { correct: false, completed: false, character: 'waldo', found: [], wrongCount: 1, penaltyMs: 1000 }),
    });
    const menu = await pickCenter(person, stage);
    await person.click(within(menu).getByRole('menuitem', { name: 'Waldo' }));
    const [call] = api.called('POST', '/api/games/g1/guesses');
    expect(call.body.character).toBe('waldo');
    expect(call.body.x).toBeCloseTo(0.5);
    expect(call.body.y).toBeCloseTo(0.5);
    expect(await screen.findByText('Not here: +1.0 s')).toBeInTheDocument();
    expect(screen.getByText(/\+1\.000/)).toHaveTextContent('+1.000 penalty · 1 miss');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('marks a character as found and removes them from the picker', async () => {
    const { person, stage } = await startGame({
      'POST /api/games/g1/guesses': reply(200, { correct: true, completed: false, character: 'waldo', found: ['waldo'], wrongCount: 0, penaltyMs: 0 }),
    });
    await person.click(within(await pickCenter(person, stage)).getByRole('menuitem', { name: 'Waldo' }));
    expect(await screen.findByText('Found Waldo!')).toBeInTheDocument();
    expect(screen.getByText('Waldo found')).toBeInTheDocument();
    const next = await pickCenter(person, stage);
    expect(within(next).queryByRole('menuitem', { name: 'Waldo' })).not.toBeInTheDocument();
    expect(within(next).getAllByRole('menuitem')).toHaveLength(4);
  });

  it('goes to the result when the last character is found', async () => {
    const { person, stage } = await startGame({
      'POST /api/games/g1/guesses': reply(200, { correct: true, completed: true, character: 'odlaw', found: characters.map((c) => c.slug), wrongCount: 0, penaltyMs: 0, result: { durationMs: 41208 } }),
    });
    await person.click(within(await pickCenter(person, stage)).getByRole('menuitem', { name: 'Odlaw' }));
    expect(await screen.findByText('RESULT PAGE')).toBeInTheDocument();
  });

  it('goes to the result when the server says the run was too fast to rank', async () => {
    const { person, stage } = await startGame({
      'POST /api/games/g1/guesses': reply(422, { error: 'That was too fast to be ranked.', code: 'GAME_TOO_FAST' }),
    });
    await person.click(within(await pickCenter(person, stage)).getByRole('menuitem', { name: 'Odlaw' }));
    expect(await screen.findByText('RESULT PAGE')).toBeInTheDocument();
  });

  it('cancels the picker with Escape without sending anything', async () => {
    const { api, person, stage } = await startGame();
    await pickCenter(person, stage);
    await person.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(api.called('POST', '/api/games/g1/guesses')).toHaveLength(0);
  });

  it('zooms with the buttons', async () => {
    const { person } = await startGame();
    const hudZoom = screen.getAllByRole('group', { name: 'Zoom' })[0];
    expect(within(hudZoom).getByText('100%')).toBeInTheDocument();
    await person.click(within(hudZoom).getByRole('button', { name: 'Zoom in' }));
    expect(await within(hudZoom).findByText('125%')).toBeInTheDocument();
    await person.click(within(hudZoom).getByRole('button', { name: 'Zoom out' }));
    expect(await within(hudZoom).findByText('100%')).toBeInTheDocument();
  });

  it('reports a server error without losing the game', async () => {
    const { person, stage } = await startGame({ 'POST /api/games/g1/guesses': reply(500, { error: 'Internal server error' }) });
    await person.click(within(await pickCenter(person, stage)).getByRole('menuitem', { name: 'Waldo' }));
    expect(await screen.findByText('Internal server error')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });
});

describe('describeGameError', () => {
  it('speaks plainly', () => {
    expect(describeGameError({ status: 429 })).toMatch(/Slow down/);
    expect(describeGameError({ status: 401 })).toMatch(/Log in again/);
    expect(describeGameError({ status: 500, message: 'Boom' })).toBe('Boom');
  });
});
