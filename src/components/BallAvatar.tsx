/** The PIVOT handball: amber leather with a central hub and six curved panel seams.
 *  Mount <BallDefs/> once near the page root; render <BallAvatar/> anywhere via <use>. */
export function BallDefs() {
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <radialGradient id="pivot-ballgrad" cx="36%" cy="30%" r="78%">
          <stop offset="0" stopColor="#f7d28e" />
          <stop offset="0.5" stopColor="#e58a2c" />
          <stop offset="1" stopColor="#a8491a" />
        </radialGradient>
        <symbol id="pivot-ball" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="23.5" fill="url(#pivot-ballgrad)" stroke="#5e2e0e" strokeWidth="1.4" />
          <g stroke="#5e2e0e" strokeWidth="1.9" fill="none" strokeLinecap="round">
            <circle cx="25" cy="24" r="4.4" />
            <path d="M25 19.6 Q 26.6 12 25 3.6" />
            <path d="M28.7 21.6 Q 36.2 17 43.2 13.4" />
            <path d="M28.8 26.6 Q 37 30 43.6 35.6" />
            <path d="M25 28.4 Q 23.4 37 25 44.6" />
            <path d="M21.2 26.6 Q 13 30 6.4 35.6" />
            <path d="M21.3 21.6 Q 13.8 17 6.8 13.4" />
          </g>
        </symbol>
      </defs>
    </svg>
  );
}

export function BallAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} className="ball-avatar" aria-hidden="true">
      <use href="#pivot-ball" />
    </svg>
  );
}
