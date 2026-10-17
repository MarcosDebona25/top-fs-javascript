import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Markdown } from './Markdown.jsx';

describe('Markdown', () => {
  it('renders headings, lists and code', () => {
    const { container } = render(<Markdown>{'## Title\n\n- one\n- two\n\n```js\nlet a;\n```'}</Markdown>);
    expect(screen.getByRole('heading', { level: 2, name: 'Title' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(container.querySelector('pre code')).toHaveTextContent('let a;');
  });

  it('shows raw HTML as text instead of creating elements', () => {
    const { container } = render(<Markdown>{'Hi <img src=x onerror="alert(1)"> <script>alert(2)</script>'}</Markdown>);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
  });

  it('drops javascript: links', () => {
    render(<Markdown>{'[click](javascript:alert(1))'}</Markdown>);
    expect(screen.getByText('click').getAttribute('href')).toBe('');
  });
});
