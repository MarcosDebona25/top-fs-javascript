import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi, renderPage, user } from '../../test/helpers.jsx';
import Landing from './Landing.jsx';

const summary = {
  mapCount: 3,
  global: {
    rows: [
      { rank: 1, username: 'stripe_seeker', times: { beach: 41208, skiSlopes: 58930, moonBase: 72044 }, totalMs: 172182, mapsCompleted: 3 },
      { rank: 2, username: 'odlaw_fan', times: { beach: 39874, skiSlopes: null, moonBase: null }, totalMs: 39874, mapsCompleted: 1 },
    ],
    total: 2,
  },
  maps: [
    { slug: 'beach', name: 'Beach', total: 2, bestTimeMs: 39874, rows: [{ rank: 1, username: 'odlaw_fan', timeMs: 39874 }, { rank: 2, username: 'stripe_seeker', timeMs: 41208 }] },
    { slug: 'ski-slopes', name: 'Ski Slopes', total: 0, bestTimeMs: null, rows: [] },
    { slug: 'moon-base', name: 'Moon Base', total: 1, bestTimeMs: 65902, rows: [{ rank: 1, username: 'stripe_seeker', timeMs: 72044 }] },
  ],
};

describe('<Landing>', () => {
  it('offers the scenes with their best times and links to play them', async () => {
    mockApi({ 'GET /api/leaderboards/summary': summary });
    renderPage(<Landing />);
    const picker = screen.getByRole('region', { name: 'Pick a scene' });
    expect(await within(picker).findByText('Best 0:39.874')).toBeInTheDocument();
    expect(within(picker).getByText('Best n/a')).toBeInTheDocument();
    expect(within(picker).getByRole('link', { name: /Beach/ })).toHaveAttribute('href', '/play/beach');
    expect(within(picker).getByRole('link', { name: /Moon Base/ })).toHaveAttribute('href', '/play/moon-base');
  });

  it('shows the global leaderboard with dashes for unfinished scenes', async () => {
    mockApi({ 'GET /api/leaderboards/summary': summary });
    renderPage(<Landing />);
    const row = (await screen.findByText('odlaw_fan', { selector: 'td' })).closest('tr');
    expect(within(row).getAllByText('n/a')).toHaveLength(2);
    expect(within(row).getAllByText('0:39.874')).toHaveLength(2); // Beach and Total
  });

  it('lists the top of each scene under it, with a link to the full ranking', async () => {
    mockApi({ 'GET /api/leaderboards/summary': summary });
    renderPage(<Landing />);
    const skiList = (await screen.findByRole('heading', { name: 'Ski Slopes' })).closest('section');
    expect(within(skiList).getByText('Nobody has finished this scene yet.')).toBeInTheDocument();
    expect(within(skiList).getByRole('link', { name: 'Full Ski Slopes ranking' })).toHaveAttribute('href', '/ranking/ski-slopes');
  });

  it('invites a guest to create an account', async () => {
    mockApi({ 'GET /api/leaderboards/summary': summary });
    renderPage(<Landing />);
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute('href', '/signup');
    expect(screen.getByRole('link', { name: 'Play as guest' })).toHaveAttribute('href', '#maps');
    await screen.findByText('stripe_seeker', { selector: 'td' });
  });

  it('greets a registered player and marks their row', async () => {
    mockApi({ 'GET /api/auth/me': user('odlaw_fan'), 'GET /api/leaderboards/summary': summary });
    renderPage(<Landing />);
    expect(await screen.findByText(/Welcome back, odlaw_fan/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Create account' })).not.toBeInTheDocument();
    expect((await screen.findAllByText('You'))[0]).toBeInTheDocument();
  });

  it('offers a retry when the leaderboard cannot be loaded', async () => {
    mockApi({});
    renderPage(<Landing />);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
