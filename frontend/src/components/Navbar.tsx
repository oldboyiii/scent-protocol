// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-white/5 ${
        isScrolled ? "bg-slate-950/80 backdrop-blur-md py-3" : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">
          
          {/* LEFT: Logo with Perfume Bottle Icon */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
            {/* Original perfume bottle icon */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform relative overflow-hidden">
              {/* Perfume bottle SVG icon */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-900" fill="currentColor">
                <path d="M12 2C11.45 2 11 2.45 11 3V5H9C8.45 5 8 5.45 8 6V7H7C6.45 7 6 7.45 6 8V18C6 19.66 7.34 21 9 21H15C16.66 21 18 19.66 18 18V8C18 7.45 17.55 7 17 7H16V6C16 5.45 15.55 5 15 5H13V3C13 2.45 12.55 2 12 2ZM10 9H14V11H10V9ZM10 13H14V15H10V13Z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent leading-tight">
                ScentProtocol
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider leading-tight">
                AI Perfume House
              </span>
            </div>
          </Link>

          {/* CENTER: Navigation Links */}
          <div className="hidden md:flex flex-1 justify-center items-center gap-8">
            {[
              { name: "Home", href: "/" },
              { name: "Collection", href: "/collection" },
              { name: "Marketplace", href: "/marketplace" },
              { name: "Gallery", href: "/gallery" },
              { name: "About", href: "/about" },
              { name: "FAQ", href: "/faq" }
            ].map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className="text-sm font-medium text-slate-300 hover:text-amber-400 transition-colors relative group py-1"
              >
                {item.name}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {/* RIGHT: Wallet Connection */}
          <div className="flex-shrink-0">
             <button className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-all flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                0x5Fed...20DA
             </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
