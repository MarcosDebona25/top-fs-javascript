import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockApi, renderPage } from '../../test/helpers.jsx';
import Calibrate from './Calibrate.jsx';

beforeEach(() => window.localStorage.clear());

describe('<Calibrate>', () => {
  it('is marked as a dev tool and lists the scenes and the five characters', async () => {
    mockApi({ 'GET /img/maps/manifest.json': { beach: { width: 2560, height: 1644 } } });
    renderPage(<Calibrate />);
    expect(screen.getByText('DEV ONLY')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^(Beach|Ski Slopes|Moon Base)$/ })).toHaveLength(3);
    const characters = ['Waldo', 'Woof', 'Wenda', 'Wizard Whitebeard', 'Odlaw'];
    for (const name of characters) expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument();
  });

  it('starts from the calibrated rectangles in the file and a JSON that is ready to save', () => {
    mockApi();
    renderPage(<Calibrate />);
    expect(screen.getAllByText('Saved')).toHaveLength(5);
    expect(screen.getByText(/Every rectangle is calibrated/)).toBeInTheDocument();
    expect(document.querySelector('.calibrate__json').textContent).not.toContain('"calibrated": false');
  });

  it('marks a cleared rectangle as a placeholder again', async () => {
    mockApi();
    renderPage(<Calibrate />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Clear selected' }));
    expect(screen.getByRole('button', { name: /Waldo/ })).toHaveTextContent('not drawn');
    expect(screen.getByText(/1 of 15 rectangles are still placeholders/)).toBeInTheDocument();
  });

  it('selects the character to draw', async () => {
    mockApi();
    renderPage(<Calibrate />);
    const wenda = screen.getByRole('button', { name: /Wenda/ });
    expect(wenda).toHaveAttribute('aria-pressed', 'false');
    await userEvent.setup().click(wenda);
    expect(wenda).toHaveAttribute('aria-pressed', 'true');
  });

  it('starts in Move mode and switches to Draw box mode', async () => {
    mockApi();
    renderPage(<Calibrate />);
    const move = screen.getByRole('button', { name: 'Move' });
    const draw = screen.getByRole('button', { name: 'Draw box' });
    expect(move).toHaveAttribute('aria-pressed', 'true');
    expect(draw).toHaveAttribute('aria-pressed', 'false');
    await userEvent.setup().click(draw);
    expect(move).toHaveAttribute('aria-pressed', 'false');
    expect(draw).toHaveAttribute('aria-pressed', 'true');
  });
});
