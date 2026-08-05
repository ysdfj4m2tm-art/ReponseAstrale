type SunTokenIconProps = {
  className?: string;
  label?: string;
};

export function SunTokenIcon({ className = "", label }: SunTokenIconProps) {
  return (
    <svg
      className={`sun-token-icon ${className}`.trim()}
      viewBox="0 0 48 48"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.3">
        <path d="M24 3v5M24 40v5M3 24h5M40 24h5M9.2 9.2l3.6 3.6M35.2 35.2l3.6 3.6M38.8 9.2l-3.6 3.6M12.8 35.2l-3.6 3.6" />
      </g>
      <circle cx="24" cy="24" r="12.5" fill="#dc9228" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="10" fill="#f7c653" />
      <circle cx="20.2" cy="19.4" r="3.2" fill="#fff9d9" fillOpacity="0.78" />
    </svg>
  );
}
