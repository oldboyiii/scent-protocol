import Link from "next/link";
import type { ReactNode } from "react";

interface Tile {
  title: string;
  text: string;
  href: string;
  hue: string; // icon tint
  icon: ReactNode;
  anchor?: boolean; // same-page link
}

const svg = (d: string) => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

const TILES: Tile[] = [
  { 
    title: "Create a scent", 
    text: "Choose the style and mint it in two quick confirmations.", 
    href: "#mint-form", 
    anchor: true, 
    hue: "#fbbf24",
    icon: svg("M12 4v16m8-8H4") 
  },
  { 
    title: "Ask the Advisor", 
    text: "Describe a mood and get a profile, plus real fragrances that fit.", 
    href: "#advisor", 
    anchor: true, 
    hue: "#c084fc",
    icon: svg("M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707M12 9a3 3 0 100 6 3 3 0 000-6z") 
  },
  { 
    title: "Your wallet's scent", 
    text: "Find your crypto archetype and mint it as a limited NFT.", 
    href: "/wallet-scent", 
    hue: "#f472b6",
    icon: svg("M3 7h18v12H3zM3 7l2-3h14l2 3M16 13h2") 
  },
  { 
    title: "Alchemy", 
    text: "Blend two fragrances into a one-of-a-kind hybrid.", 
    href: "/alchemy", 
    hue: "#22d3ee",
    icon: svg("M9 3h6M10 3v5l-5 9a2 2 0 001.7 3h10.6a2 2 0 001.7-3l-5-9V3") 
  },
  { 
    title: "Marketplace", 
    text: "Buy, sell and make offers in USDC.", 
    href: "/marketplace", 
    hue: "#34d399",
    icon: svg("M4 7h16l-1.5 11a2 2 0 01-2 1.7H7.5a2 2 0 01-2-1.7L4 7zM8 7a4 4 0 118 0") 
  },
  { 
    title: "Events", 
    text: "Genesis and Milan Fashion Week drops.", 
    href: "/events", 
    hue: "#fb7185",
    icon: svg("M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z") 
  },
];

function TileBody({ tile }: { tile: Tile }) {
  return (
    <>
      <span
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10"
        style={{ backgroundColor: `${tile.hue}1f`, color: tile.hue }}
      >
        {tile.icon}
      </span>
      <h3 className="font-display text-xl font-semibold leading-tight text-white">{tile.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-white/55">{tile.text}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/40 transition-colors group-hover:text-amber-300">
        Open
        <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </>
  );
}

const CLASS =
  "group glass-card flex flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/30 hover:bg-white/[0.07]";

export default function FeatureTiles() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {TILES.map((t) =>
        t.anchor ? (
          <a key={t.title} href={t.href} className={CLASS}>
            <TileBody tile={t} />
          </a>
        ) : (
          <Link key={t.title} href={t.href} className={CLASS}>
            <TileBody tile={t} />
          </Link>
        ),
      )}
    </div>
  );
}
