// Small inline icons: stroke follows the text colour.
const base = { 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 2, focusable: 'false' };

export const CheckIcon = ({ size = 18 }) => (
  <svg {...base} width={size} height={size} viewBox="0 0 18 18" style={{ flex: 'none' }}>
    <path d="M3.5 9.5l3.5 3.5 7.5-8" />
  </svg>
);

export const AlertIcon = ({ size = 18 }) => (
  <svg {...base} width={size} height={size} viewBox="0 0 18 18" style={{ flex: 'none' }}>
    <circle cx="9" cy="9" r="7.5" />
    <path d="M9 5v5M9 12.5v.5" />
  </svg>
);

export const SpinnerIcon = ({ size = 18 }) => (
  <svg {...base} className="spin" width={size} height={size} viewBox="0 0 18 18" style={{ flex: 'none' }}>
    <path d="M9 2.5a6.5 6.5 0 1 0 6.5 6.5" strokeLinecap="round" />
  </svg>
);

export const ClockIcon = () => (
  <svg {...base} width="20" height="20" viewBox="0 0 20 20" style={{ flex: 'none', marginTop: 2 }}>
    <circle cx="10" cy="10" r="8" />
    <path d="M10 5v5l3 2" />
  </svg>
);

export const PlusIcon = ({ size = 20 }) => (
  <svg {...base} width={size} height={size} viewBox="0 0 20 20">
    <path d="M4 10h12M10 4v12" />
  </svg>
);

export const MinusIcon = ({ size = 20 }) => (
  <svg {...base} width={size} height={size} viewBox="0 0 20 20">
    <path d="M4 10h12" />
  </svg>
);

export const BackIcon = ({ size = 18 }) => (
  <svg {...base} width={size} height={size} viewBox="0 0 18 18">
    <path d="M11 3L5 9l6 6" />
  </svg>
);

export const CrossIcon = ({ size = 18 }) => (
  <svg {...base} width={size} height={size} viewBox="0 0 18 18">
    <path d="M4 4l10 10M14 4L4 14" />
  </svg>
);

export const PersonIcon = () => (
  <svg {...base} width="20" height="20" viewBox="0 0 20 20" style={{ flex: 'none', marginTop: 2 }}>
    <circle cx="10" cy="7" r="3.5" />
    <path d="M3.5 17c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5" />
  </svg>
);

export const PointerIcon = () => (
  <svg {...base} width="20" height="20" viewBox="0 0 20 20" style={{ flex: 'none', marginTop: 2 }}>
    <path d="M4 10h12M10 4v12" />
  </svg>
);

export const BigCheckIcon = ({ size = 20 }) => (
  <svg {...base} width={size} height={size} viewBox="0 0 20 20" style={{ flex: 'none', marginTop: 2 }}>
    <path d="M4 10.5l4 4 8-9" />
  </svg>
);

export const GitHubIcon = ({ size = 18 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="currentColor" focusable="false" style={{ flex: 'none' }}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>
);

// The green badge on a character that was found.
export const FoundBadge = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" className="found-badge">
    <circle cx="9" cy="9" r="9" fill="#1A7A43" />
    <path d="M5 9.5l2.8 2.8L13 6.5" fill="none" stroke="#FFFFFF" strokeWidth="2" />
  </svg>
);
