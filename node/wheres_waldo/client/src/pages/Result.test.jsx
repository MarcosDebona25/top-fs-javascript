import { screen, within } from '@testing-library/react';
import { Route } from 'react-router';
import { describe, expect, it } from 'vitest';
import { mockApi, reply, renderRoutes, user } from '../../test/helpers.jsx';
import Result, { Breakdown } from './Result.jsx';

const board = {
  map: { slug: 'beach', name: 'Beach' },
  page: 1,
  pageSize: 5,
  total: 3,
  totalPages: 1,
  rows: [
    { rank: 1, username: 'odlaw_fan', timeMs: 39874 },
    { rank: 2, username: 'stripe_seeker', timeMs: 41208 },
    { rank: 3, username: 'pompom', timeMs: 72348 },
  ],
};

const finished = (result, status = 'completed') => ({
  game: {
    id: 'g1',
    mapSlug: 'beach',
    status,
    ranked: result.ranked,
    startedAt: '2026-01-01T00:00:00.000Z',
    finishedAt: '2026-01-01T00:01:10.348Z',
    serverTime: '2026-01-01T00:02:00.000Z',
    characters: [],
    found: [],
    wrongCount: result.wrongCount,
    penaltyMs: result.penaltyMs,
    wrongGuessPenaltyMs: 1000,
    result,
  },
});

const routes = (
  <>
    <Route path="/result/:id" element={<Result />} />
    <Route path="/play/:slug" element={<p>PLAYING</p>} />
  </>
);

const registeredResult = {
  durationMs: 72348,
  elapsedMs: 70348,
  penaltyMs: 2000,
  wrongCount: 2,
  ranked: true,
  mapPosition: { rank: 3, total: 18 },
  globalPosition: { rank: 7, total: 48 },
  personalBest: true,
};

describe('<Result> for a registered player', () => {
  it('shows the time, how it was made, the ranks and the beach board', async () => {
    mockApi({
      'GET /api/auth/me': user('pompom'),
      'GET /api/games/g1': finished(registeredResult),
      'GET /api/leaderboards/maps/beach?page=1&pageSize=5': board,
    });
    renderRoutes(routes, { route: '/result/g1' });
    expect(await screen.findByRole('heading', { level: 1, name: /1:12.348/ })).toBeInTheDocument();
    expect(screen.getByText('1:10.348 searching + 0:02.000 for 2 wrong guesses')).toBeInTheDocument();
    expect(screen.getByText('New personal best')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('of 18 players')).toBeInTheDocument();
    expect(screen.getByText('#7')).toBeInTheDocument();
    expect(screen.getByText('of 48 players')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Next: Ski Slopes' })).toHaveAttribute('href', '/play/ski-slopes');
    expect(screen.getByRole('link', { name: 'Play Beach again' })).toHaveAttribute('href', '/play/beach');
    const row = (await screen.findByText('pompom', { selector: 'td' })).closest('tr');
    expect(within(row).getByText('You')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Full Beach ranking' })).toHaveAttribute('href', '/ranking/beach');
  });

  it('says when this run is not the one on the board', async () => {
    mockApi({
      'GET /api/auth/me': user('pompom'),
      'GET /api/games/g1': finished({ ...registeredResult, personalBest: false }),
      'GET /api/leaderboards/maps/beach?page=1&pageSize=5': board,
    });
    renderRoutes(routes, { route: '/result/g1' });
    expect(await screen.findByText(/Not your best/)).toBeInTheDocument();
  });
});

describe('<Result> for a guest', () => {
  const guestResult = { durationMs: 72348, elapsedMs: 70348, penaltyMs: 2000, wrongCount: 2, ranked: false, mapPosition: null, globalPosition: null, personalBest: false };

  it('shows their time, explains it is not saved and points at the best time', async () => {
    mockApi({ 'GET /api/games/g1': finished(guestResult), 'GET /api/leaderboards/maps/beach?page=1&pageSize=5': board });
    renderRoutes(routes, { route: '/result/g1' });
    expect(await screen.findByRole('heading', { level: 1, name: /1:12.348/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "You played as a guest, so this time isn't saved." })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute('href', '/signup');
    expect(screen.getByText('odlaw_fan')).toBeInTheDocument();
    expect(screen.getByText('0:39.874')).toBeInTheDocument();
    expect(screen.queryByText(/Beach rank/)).not.toBeInTheDocument();
  });

  it('invites the first player when the board is empty', async () => {
    mockApi({ 'GET /api/games/g1': finished(guestResult), 'GET /api/leaderboards/maps/beach?page=1&pageSize=5': { ...board, rows: [], total: 0 } });
    renderRoutes(routes, { route: '/result/g1' });
    expect(await screen.findByText(/Nobody has a time on Beach yet/)).toBeInTheDocument();
  });
});

describe('<Result> edge cases', () => {
  it('explains a run that was too fast to count', async () => {
    mockApi({
      'GET /api/games/g1': finished({ ...registeredResult, ranked: false, mapPosition: null, globalPosition: null, durationMs: 2000, elapsedMs: 2000, penaltyMs: 0, wrongCount: 0 }, 'rejected'),
      'GET /api/leaderboards/maps/beach?page=1&pageSize=5': board,
    });
    renderRoutes(routes, { route: '/result/g1' });
    expect(await screen.findByText('That run was too fast to count.')).toBeInTheDocument();
    expect(screen.getByText('Beach · not counted')).toBeInTheDocument();
  });

  it('sends the player back into a game that is still going', async () => {
    mockApi({ 'GET /api/games/g1': { game: { id: 'g1', mapSlug: 'ski-slopes', status: 'in_progress' } } });
    renderRoutes(routes, { route: '/result/g1' });
    expect(await screen.findByText('PLAYING')).toBeInTheDocument();
  });

  it('shows the 404 page for an unknown game', async () => {
    mockApi({ 'GET /api/games/nope': reply(404, { error: 'Game not found' }) });
    renderRoutes(routes, { route: '/result/nope' });
    expect(await screen.findByRole('heading', { name: /Even Waldo can't find this page/ })).toBeInTheDocument();
  });

  it('asks a logged-out player to log in to see a registered run', async () => {
    mockApi({ 'GET /api/games/g1': reply(401, { error: 'Log in to continue this game.', code: 'AUTH_REQUIRED' }) });
    renderRoutes(routes, { route: '/result/g1' });
    expect(await screen.findByRole('heading', { name: 'Log in to see this result' })).toBeInTheDocument();
  });
});

describe('<Breakdown>', () => {
  it('has no penalty text for a clean run', () => {
    const { container } = renderRoutes(<Route path="*" element={<Breakdown result={{ elapsedMs: 41208, penaltyMs: 0, wrongCount: 0 }} />} />);
    expect(container).toHaveTextContent('0:41.208 searching, no wrong guesses');
  });

  it('uses the singular for one wrong guess', () => {
    const { container } = renderRoutes(<Route path="*" element={<Breakdown result={{ elapsedMs: 41208, penaltyMs: 1000, wrongCount: 1 }} />} />);
    expect(container).toHaveTextContent('0:41.208 searching + 0:01.000 for 1 wrong guess');
  });
});
