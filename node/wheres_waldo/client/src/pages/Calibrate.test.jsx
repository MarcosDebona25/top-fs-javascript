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

  it('starts with every rectangle pending and a JSON that still flags the placeholders', () => {
    mockApi();
    renderPage(<Calibrate />);
    expect(screen.getAllByText('Pending').length + screen.getAllByText('Selected').length).toBe(5);
    expect(screen.getByText(/15 of 15 rectangles are still placeholders/)).toBeInTheDocument();
    expect(document.querySelector('.calibrate__json').textContent).toContain('"calibrated": false');
  });

  it('selects the character to draw', async () => {
    mockApi();
    renderPage(<Calibrate />);
    const wenda = screen.getByRole('button', { name: /Wenda/ });
    expect(wenda).toHaveAttribute('aria-pressed', 'false');
    await userEvent.setup().click(wenda);
    expect(wenda).toHaveAttribute('aria-pressed', 'true');
  });
});
