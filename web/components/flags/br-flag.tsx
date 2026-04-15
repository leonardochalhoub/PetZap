export function BRFlag({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 42" className={className} aria-label="Brasil" role="img" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="60" height="42" fill="#009C3B" />
      <polygon points="30,4 56,21 30,38 4,21" fill="#FFDF00" />
      <circle cx="30" cy="21" r="8.5" fill="#002776" />
      <path d="M22 19 Q30 14 38 19" stroke="#FFFFFF" strokeWidth="0.9" fill="none" />
    </svg>
  );
}
