"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";

const getNetworkName = (chainId: number, networkName: string): string => {
  if (networkName.toLowerCase().includes("arc")) return "Arc Network";

  switch (chainId) {
    case 1: return "Ethereum Mainnet";
    case 11155111: return "Sepolia Testnet";
    case 5042: return "Arc Network";
    case 5043: return "Arc Testnet";
    default: return `Chain ${chainId}`;
  }
};

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/collection", label: "Collection" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/gallery", label: "Gallery" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const { address, isConnected, chain } = useAccount();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  // Close the menu when the page changes, on Escape, and when the window grows to desktop width.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth >= 768 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* LEFT: Logo */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* CENTER: Navigation Links (desktop) */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-8" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`text-sm font-medium transition-colors hover:text-amber-400 ${isActive(l.href) ? "text-amber-300" : "text-white/70"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* RIGHT: Wallet + Network + mobile menu button */}
        <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3">
          {isConnected && address && chain && (
            <span className="hidden sm:block text-[10px] text-emerald-400 font-semibold tracking-wide uppercase">
              {getNetworkName(chain.id, chain.name || "")}
            </span>
          )}

          <ConnectKitButton.Custom>
            {({ show, isConnected, ensName, truncatedAddress }) => (
              <button
                onClick={show}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white hover:bg-white/10 transition-all"
              >
                {isConnected ? (ensName || truncatedAddress) : "Connect Wallet"}
              </button>
            )}
          </ConnectKitButton.Custom>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="md:hidden flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav id="mobile-menu" aria-label="Main" className="md:hidden border-t border-white/10 bg-[#0a0a1a]/95 backdrop-blur-xl">
          <ul className="mx-auto max-w-7xl px-4 py-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`flex min-h-[48px] items-center justify-between rounded-xl px-3 text-base font-medium transition-colors hover:bg-white/5 ${
                    isActive(l.href) ? "text-amber-300" : "text-white/80"
                  }`}
                >
                  {l.label}
                  {isActive(l.href) && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
