import ReactMarkdown from 'react-markdown';

// No rehype-raw: HTML inside the Markdown is shown as text, never turned into elements.
export function Markdown({ children }) {
  return (
    <div className="prose">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
