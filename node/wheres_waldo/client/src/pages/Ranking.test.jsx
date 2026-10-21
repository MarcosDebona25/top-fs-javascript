import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi, renderPage } from '../../test/helpers.jsx';
import Ranking, { parsePage } from './Ranking.jsx';

const globalPage = (page, total = 48) => ({
  page,
  pageSize: 10,
  total,
  totalPages: Math.ceil(total / 10),
  rows: Array.from({ length: Math.min(10, total - (page - 1) * 10) }, (_, index) => ({
    rank: (page - 1) * 10 + index + 1,
    username: `player_${(page - 1) * 10 + index + 1}`,
    times: { beach: 40000 + index, skiSlopes: null, moonBase: null },
    totalMs: 40000 + index,
    mapsCompleted: 1,
  })),
});

describe('parsePage', () => {
  it('falls back to the first page', () => {
    expect(parsePage('3')).toBe(3);
    expect(parsePage(null)).toBe(1);
    expect(parsePage('0')).toBe(1);
    expect(parsePage('-2')).toBe(1);
    expect(parsePage('abc')).toBe(1);
  });
});

describe('<Ranking>', () => {
  it('shows the global ranking with tabs, the count and the pagination', async () => {
    mockApi({ 'GET /api/leaderboards/global?page=1&pageSize=10': globalPage(1) });
    renderPage(<Ranking />, { route: '/ranking', path: '/ranking' });
    expect(await screen.findByText('player_1', { selector: 'td' })).toBeInTheDocument();
    expect(screen.getByText('Showing 1–10 of 48 players')).toBeInTheDocument();
    const tabs = screen.getByRole('navigation', { name: 'Leaderboards' });
    expect(within(tabs).getAllByRole('link').map((link) => link.textContent)).toEqual(['Global', 'Beach', 'Ski Slopes', 'Moon Base']);
    expect(within(tabs).getByRole('link', { name: 'Global' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Page 5' })).toHaveAttribute('href', '/ranking?page=5');
  });

  it('reads the page from the address', async () => {
    mockApi({ 'GET /api/leaderboards/global?page=2&pageSize=10': globalPage(2) });
    renderPage(<Ranking />, { route: '/ranking?page=2', path: '/ranking' });
    expect(await screen.findByText('Showing 11–20 of 48 players')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute('href', '/ranking');
  });

  it('shows one scene with its own tab', async () => {
    mockApi({
      'GET /api/leaderboards/maps/ski-slopes?page=1&pageSize=10': {
        map: { slug: 'ski-slopes', name: 'Ski Slopes' },
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
        rows: [{ rank: 1, username: 'snowblind', timeMs: 49660 }],
      },
    });
    renderPage(<Ranking />, { route: '/ranking/ski-slopes', path: '/ranking/:slug' });
    expect(await screen.findByText('0:49.660')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ski Slopes' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Showing 1–1 of 1 player')).toBeInTheDocument();
  });

  it('keeps the previous board visible while another tab loads', async () => {
    let release;
    const beach = new Promise((resolve) => {
      release = () =>
        resolve({
          __reply: true,
          status: 200,
          body: {
            map: { slug: 'beach', name: 'Beach' },
            page: 1,
            pageSize: 10,
            total: 1,
            totalPages: 1,
            rows: [{ rank: 1, username: 'beach_player', timeMs: 49660 }],
          },
        });
    });
    mockApi({
      'GET /api/leaderboards/global?page=1&pageSize=10': globalPage(1),
      'GET /api/leaderboards/maps/beach?page=1&pageSize=10': () => beach,
    });
    renderPage(<Ranking />, { route: '/ranking', path: '/ranking/:slug?' });
    expect(await screen.findByText('player_1', { selector: 'td' })).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('link', { name: 'Beach' }));
    expect(screen.getByText('player_1', { selector: 'td' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading leaderboard');
    expect(screen.getByRole('navigation', { name: 'Leaderboards' })).toHaveAttribute('aria-busy', 'true');

    await act(async () => release());
    expect(await screen.findByText('beach_player', { selector: 'td' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('keeps the scene board visible while going back to Global', async () => {
    let release;
    const global = new Promise((resolve) => {
      release = () => resolve({ __reply: true, status: 200, body: globalPage(1) });
    });
    mockApi({
      'GET /api/leaderboards/global?page=1&pageSize=10': () => global,
      'GET /api/leaderboards/maps/beach?page=1&pageSize=10': {
        map: { slug: 'beach', name: 'Beach' },
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
        rows: [{ rank: 1, username: 'beach_player', timeMs: 49660 }],
      },
    });
    renderPage(<Ranking />, { route: '/ranking/beach', path: '/ranking/:slug?' });
    expect(await screen.findByText('beach_player', { selector: 'td' })).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('link', { name: 'Global' }));
    expect(screen.getByText('beach_player', { selector: 'td' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading leaderboard');

    await act(async () => release());
    expect(await screen.findByText('player_1', { selector: 'td' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('says there is nothing yet when the board is empty', async () => {
    mockApi({ 'GET /api/leaderboards/global?page=1&pageSize=10': { page: 1, pageSize: 10, total: 0, totalPages: 0, rows: [] } });
    renderPage(<Ranking />, { route: '/ranking', path: '/ranking' });
    expect(await screen.findByText('No players yet')).toBeInTheDocument();
  });

  it('shows the 404 page for a scene that does not exist', async () => {
    mockApi();
    renderPage(<Ranking />, { route: '/ranking/mars', path: '/ranking/:slug' });
    expect(await screen.findByRole('heading', { name: /Even Waldo can't find this page/ })).toBeInTheDocument();
  });
});
