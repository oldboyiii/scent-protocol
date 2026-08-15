"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 40 }: LogoProps) {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <Image
        src="/scentprotocol-logo.jpg"
        alt="ScentProtocol"
        width={size}
        height={size}
        className="rounded-lg group-hover:scale-105 transition-transform duration-300"
        priority
      />
      <div className="hidden sm:flex flex-col leading-tight">
        <span className="text-xl font-bold tracking-tight text-amber-400">
          ScentProtocol
        </span>
        <span className="text-[10px] text-gray-400 uppercase tracking-widest">
          AI Perfume House
        </span>
      </div>
    </Link>
  );
}
