export function Brand() {
  return (
    <span className="brand" aria-label="Sinkron Water Meters">
      <svg className="brand-symbol" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <circle cx="28" cy="28" r="25" stroke="currentColor" strokeWidth="2" />
        <circle cx="28" cy="28" r="21" stroke="currentColor" strokeWidth="1" opacity=".6" />
        <path d="M13 34a16 16 0 1 1 29-14M17 34a12 12 0 1 1 22-12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="m28 27 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="28" cy="27" r="2.5" fill="currentColor" />
      </svg>
      <span className="brand-wordmark"><strong>SINKRON</strong><span>Water Meters</span></span>
    </span>
  );
}
