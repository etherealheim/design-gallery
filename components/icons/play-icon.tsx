interface PlayIconProps {
  className?: string;
}

export function PlayIcon({ className = "h-4 w-4" }: PlayIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ 
        filter: 'invert(1)',
        WebkitFilter: 'invert(1)' // Safari support
      }}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
