import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Viewport } from './Viewport.jsx';

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 1000, bottom: 600, width: 1000, height: 600, x: 0, y: 0, toJSON() {} });
});

const setup = (props = {}) => {
  const onViewChange = vi.fn();
  render(<Viewport aspect={0.5} label="Scene" image={<div>picture</div>} onViewChange={onViewChange} {...props} />);
  const stage = screen.getByRole('group', { name: 'Scene' });
  const lastView = () => onViewChange.mock.calls.at(-1)[0];
  return { stage, lastView, person: userEvent.setup() };
};

describe('<Viewport>', () => {
  it('starts fit to width and centred', () => {
    const { lastView } = setup();
    // The picture is 1000 x 500 in a 1000 x 600 stage.
    expect(lastView()).toEqual({ scale: 1, tx: 0, ty: 50 });
  });

  it('zooms with + and - and resets with 0', async () => {
    const { stage, lastView, person } = setup();
    stage.focus();
    await person.keyboard('+');
    expect(lastView().scale).toBeCloseTo(1.25);
    await person.keyboard('-');
    expect(lastView().scale).toBeCloseTo(1);
    await person.keyboard('+');
    await person.keyboard('0');
    expect(lastView().scale).toBe(1);
  });

  it('zooms with the wheel and keeps the picture covering the stage', () => {
    const { stage, lastView } = setup();
    fireEvent.wheel(stage, { deltaY: -400, clientX: 500, clientY: 300 });
    const view = lastView();
    expect(view.scale).toBeGreaterThan(1);
    expect(view.tx).toBeLessThanOrEqual(0);
    expect(view.tx).toBeGreaterThanOrEqual(1000 - 1000 * view.scale);
  });

  it('pans with the arrow keys once zoomed', async () => {
    const { stage, lastView, person } = setup();
    stage.focus();
    await person.keyboard('++++');
    const before = lastView();
    await person.keyboard('{ArrowLeft}');
    expect(lastView().tx).toBeGreaterThan(before.tx); // looking left moves the picture right
  });

  it('picks the centre of the stage on Enter, as image fractions', async () => {
    const onPick = vi.fn();
    const { stage, person } = setup({ onPick });
    stage.focus();
    await person.keyboard('{Enter}');
    expect(onPick).toHaveBeenCalledTimes(1);
    const [point] = onPick.mock.calls[0];
    expect(point.x).toBeCloseTo(0.5);
    expect(point.y).toBeCloseTo(0.5);
  });

  it('draws the overlay in stage pixels', () => {
    render(<Viewport aspect={0.5} label="Scene" image={<div />} overlay={({ toStage }) => <span data-testid="dot" style={{ left: toStage(0.5, 0.5).x, top: toStage(0.5, 0.5).y }} />} />);
    expect(screen.getByTestId('dot')).toHaveStyle({ left: '500px', top: '300px' });
  });
});
