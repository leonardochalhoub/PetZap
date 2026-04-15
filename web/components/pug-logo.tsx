export function PugLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-label="PetZap"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Floppy ears (drawn first so head overlaps them) */}
      <path d="M14 22 Q10 30 14 40 Q18 36 20 30 Z" fill="#A57858" />
      <path d="M50 22 Q54 30 50 40 Q46 36 44 30 Z" fill="#A57858" />

      {/* Head */}
      <circle cx="32" cy="34" r="20" fill="#E8B894" />

      {/* Forehead wrinkles */}
      <path d="M22 24 Q26 22 30 24" stroke="#A57858" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M34 24 Q38 22 42 24" stroke="#A57858" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M26 28 Q32 26 38 28" stroke="#A57858" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Eye whites */}
      <ellipse cx="24" cy="33" rx="4.2" ry="4.6" fill="#FFFFFF" />
      <ellipse cx="40" cy="33" rx="4.2" ry="4.6" fill="#FFFFFF" />

      {/* Pupils */}
      <circle cx="24" cy="34" r="2.4" fill="#1A1A1A" />
      <circle cx="40" cy="34" r="2.4" fill="#1A1A1A" />

      {/* Eye highlights */}
      <circle cx="25" cy="33" r="0.7" fill="#FFFFFF" />
      <circle cx="41" cy="33" r="0.7" fill="#FFFFFF" />

      {/* Snout (dark mask area) */}
      <ellipse cx="32" cy="42" rx="11" ry="8" fill="#3A2A1F" />

      {/* Nose */}
      <ellipse cx="32" cy="40" rx="3.2" ry="2.4" fill="#1A1A1A" />

      {/* Mouth */}
      <path d="M32 44 Q28 47 26 46" stroke="#1A1A1A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M32 44 Q36 47 38 46" stroke="#1A1A1A" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Tongue peek */}
      <path d="M30 47 Q32 50 34 47 Z" fill="#F4A4B5" />
    </svg>
  );
}
