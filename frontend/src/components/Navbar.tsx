// src/components/Navbar.tsx (или где у тебя находится хедер)
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
// Импортируй свои иконки или компоненты кошелька здесь, если нужно
// import { ConnectButton } from "@rainbow-me/rainbowkit"; 

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
        isScrolled ? "bg-slate-950/80 backdrop-blur-md py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">
          
          {/* LEFT: Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-slate-900 font-bold text-lg shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent hidden sm:block">
              ScentProtocol
            </span>
          </div>

          {/* CENTER: Navigation Links */}
          {/* Используем absolute positioning + transform для идеального центра, 
              или просто flex-1 с justify-center, если лого и кошелек имеют примерно одинаковую ширину.
              Здесь используем flex-grow и justify-center для простоты. */}
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
                className="text-sm font-medium text-slate-300 hover:text-amber-400 transition-colors relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {/* RIGHT: Wallet Connection */}
          <div className="flex-shrink-0">
             {/* Здесь должен быть твой компонент подключения кошелька */}
             {/* Пример заглушки, замени на реальный компонент */}
             <button className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-all flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                0x5Fed...20DA
             </button>
          </div>

        </div>
      </div>
      
      {/* Mobile Menu Button (Hamburger) - Optional */}
      <div className="md:hidden absolute right-4 top-4">
         <button className="text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
         </button>
      </div>
    </nav>
  );
}
