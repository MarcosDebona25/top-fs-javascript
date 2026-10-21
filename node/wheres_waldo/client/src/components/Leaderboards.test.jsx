import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { GlobalBoard, MapBoard, TopList } from './Leaderboards.jsx';

const globalRows = [
  { rank: 1, username: 'stripe_seeker', times: { beach: 41208, skiSlopes: 58930, moonBase: 72044 }, totalMs: 172182, mapsCompleted: 3 },
  { rank: 2, username: 'odlaw_fan', times: { beach: 39874, skiSlopes: 75002, moonBase: null }, totalMs: 114876, mapsCompleted: 2 },
];

describe('<GlobalBoard>', () => {
  it('shows each scene, a dash for the ones not finished, and the total', () => {
    render(<GlobalBoard rows={globalRows} />);
    const second = screen.getByText('odlaw_fan').closest('tr');
    const cells = within(second).getAllByRole('cell').map((cell) => cell.textContent);
    expect(cells).toEqual(['2', 'odlaw_fan', '0:39.874', '1:15.002', 'n/a', '1:54.876']);
  });

  it('labels the columns with the scene names', () => {
    render(<GlobalBoard rows={globalRows} />);
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['#', 'Player', 'Beach', 'Ski Slopes', 'Moon Base', 'Total']);
  });

  it('highlights the current player', () => {
    render(<GlobalBoard rows={globalRows} username="odlaw_fan" />);
    const row = screen.getByText('odlaw_fan').closest('tr');
    expect(row).toHaveClass('is-you');
    expect(within(row).getByText('You')).toBeInTheDocument();
    expect(screen.getByText('stripe_seeker').closest('tr')).not.toHaveClass('is-you');
  });

  it('says so when nobody has played', () => {
    render(<GlobalBoard rows={[]} />);
    expect(screen.getByText(/No times yet/)).toBeInTheDocument();
  });
});

describe('<MapBoard>', () => {
  it('lists rank, player and time', () => {
    render(<MapBoard name="Beach" rows={[{ rank: 1, username: 'odlaw_fan', timeMs: 39874 }]} />);
    const cells = within(screen.getByText('odlaw_fan').closest('tr')).getAllByRole('cell');
    expect(cells.map((cell) => cell.textContent)).toEqual(['1', 'odlaw_fan', '0:39.874']);
  });

  it('has an empty state', () => {
    render(<MapBoard name="Beach" rows={[]} />);
    expect(screen.getByText('Nobody has finished Beach yet.')).toBeInTheDocument();
  });
});

describe('<TopList>', () => {
  it('links to the full ranking of its scene', () => {
    render(
      <MemoryRouter>
        <TopList slug="ski-slopes" name="Ski Slopes" rows={[{ rank: 1, username: 'snowblind', timeMs: 49660 }]} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Ski Slopes' })).toBeInTheDocument();
    expect(screen.getByText('0:49.660')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Full Ski Slopes ranking' })).toHaveAttribute('href', '/ranking/ski-slopes');
  });
});
