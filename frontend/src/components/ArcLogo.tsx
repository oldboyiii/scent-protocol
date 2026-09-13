import React from "react";

interface ArcLogoProps {
  size?: number;
  className?: string;
}

export default function ArcLogo({ size = 16, className = "" }: ArcLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C6.48 2 2 6.48 2 12c0 1.5.33 2.92.92 4.2L12 4l9.08 12.2C21.67 14.92 22 13.5 22 12c0-5.52-4.48-10-10-10zm0 4l-6 8h3l3-4 3 4h3l-6-8z"
        fill="url(#arcGradient)"
        stroke="url(#arcGradient)"
        strokeWidth="0.5"
      />
      <path
        d="M7 14l5-8 5 8h-3l-2-3-2 3H7z"
        fill="url(#arcGradient)"
        opacity="0.9"
      />
    </svg>
  );
}
