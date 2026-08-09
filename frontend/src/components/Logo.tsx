"use client";

export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="50%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <filter id="logoGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Флакон духов — стилизованный */}
      <path
        d="M35 25 L65 25 L65 30 L60 35 L60 75 C60 82 55 88 50 88 C45 88 40 82 40 75 L40 35 L35 30 Z"
        fill="none"
        stroke="url(#logoGrad)"
        strokeWidth="3"
        filter="url(#logoGlow)"
      />
      {/* Крышка */}
      <rect x="42" y="18" width="16" height="7" rx="2" fill="url(#logoGrad)" />
      {/* Распылитель */}
      <circle cx="50" cy="12" r="4" fill="url(#logoGrad)" />
      {/* Капля аромата */}
      <path
        d="M50 50 C50 50 42 62 42 68 C42 73 46 77 50 77 C54 77 58 73 58 68 C58 62 50 50 50 50Z"
        fill="url(#logoGrad)"
        opacity="0.6"
      />
      {/* Линии на флаконе */}
      <line x1="45" y1="40" x2="55" y2="40" stroke="url(#logoGrad)" strokeWidth="1.5" opacity="0.5" />
      <line x1="45" y1="48" x2="55" y2="48" stroke="url(#logoGrad)" strokeWidth="1.5" opacity="0.5" />
      <line x1="45" y1="56" x2="55" y2="56" stroke="url(#logoGrad)" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
