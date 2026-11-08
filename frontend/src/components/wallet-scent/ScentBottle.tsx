1
 "use client";
2
 
3
 // The archetype reveal: a bottle fills with the wallet's colours, then the notes appear
4
 // tier by tier (top, heart, base), the way a real fragrance unfolds.
5
 
6
 interface ScentBottleProps {
7
   name: string;
8
   description: string;
9
   /** Five hex colours, top of the bottle first. */
10
   colors: string[];
11
   topNotes: string[];
12
   heartNotes: string[];
13
   baseNotes: string[];
14
 }
15
 
16
 const BODY = "M52 70 Q52 60 62 58 L62 40 L98 40 L98 58 Q108 60 108 70 L112 190 Q112 208 94 208 L66 208 Q48 208 48 190 Z";
17
 
18
 export default function ScentBottle({ name, description, colors, topNotes, heartNotes, baseNotes }: ScentBottleProps) {
19
   const c = (i: number) => colors[i % colors.length] ?? "#a855f7";
20
   const tiers: Array<[string, string[], string]> = [
21
     ["Top", topNotes, c(0)],
22
     ["Heart", heartNotes, c(2)],
23
     ["Base", baseNotes, c(4)],
24
   ];
25
 
26
   return (
27
     <div className="space-y-6 text-center">
28
       <div className="relative mx-auto h-60 w-44">
29
         <svg viewBox="0 0 160 220" className="h-full w-full overflow-visible" aria-hidden="true">
30
           <defs>
31
             <clipPath id="wsBottleClip">
32
               <path d={BODY} />
33
             </clipPath>
34
             <linearGradient id="wsLiquid" x1="0" y1="0" x2="0" y2="1">
35
               <stop offset="0%" stopColor={c(0)} />
36
               <stop offset="35%" stopColor={c(1)} />
37
               <stop offset="60%" stopColor={c(2)} />
38
               <stop offset="100%" stopColor={c(4)} />
39
             </linearGradient>
40
           </defs>
41
 
42
           <g clipPath="url(#wsBottleClip)">
43
             <rect x="40" y="60" width="80" height="160" fill="rgba(255,255,255,0.05)" />
44
             <g className="ws-fill">
45
               <rect x="40" y="100" width="80" height="120" fill="url(#wsLiquid)" />
46
               <path className="ws-wave" d="M20 100 Q40 92 60 100 T100 100 T140 100 T180 100 V112 H20 Z" fill="url(#wsLiquid)" opacity="0.9" />
47
             </g>
48
             <path d="M60 80 Q56 130 62 190" stroke="rgba(255,255,255,0.35)" strokeWidth="3" fill="none" strokeLinecap="round" />
49
           </g>
50
 
51
           <path d={BODY} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
52
           <rect x="64" y="20" width="32" height="22" rx="4" fill="#fbbf24" />
53
           <rect x="64" y="20" width="32" height="6" rx="3" fill="rgba(255,255,255,0.4)" />
54
 
55
           {[[28, 90], [132, 70], [30, 160], [136, 150], [80, 8]].map(([x, y], i) => (
56
             <circle key={i} className="ws-twinkle" cx={x} cy={y} r="2.2" fill={c(i)} style={{ animationDelay: `${1.2 + i * 0.35}s` }} />
57
           ))}
58
         </svg>
59
       </div>
60
 
61
       <div className="ws-rise" style={{ animationDelay: "1.4s" }}>
62
         <p className="text-xs font-medium uppercase tracking-widest text-purple-300">Your wallet smells like</p>
63
         <h3 className="mt-1 bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-4xl font-bold text-transparent">{name}</h3>
64
       </div>
65
 
66
       <div className="ws-rise" style={{ animationDelay: "1.7s" }}>
67
         <div className="flex h-3 overflow-hidden rounded-full">
68
           {colors.map((color, i) => (
69
             <span key={i} className="h-full flex-1" style={{ background: color }} />
70
           ))}
71
         </div>
72
       </div>
73
 
74
       <p className="ws-rise mx-auto max-w-lg italic text-white/70" style={{ animationDelay: "2s" }}>
75
         &ldquo;{description}&rdquo;
76
       </p>
77
 
78
       <div className="mx-auto max-w-lg space-y-3 text-left">
79
         {tiers.map(([label, notes, color], i) => (
80
           <div key={label} className="ws-rise flex items-start gap-3" style={{ animationDelay: `${2.4 + i * 0.5}s` }}>
81
             <span className="w-12 flex-shrink-0 pt-1 text-xs font-semibold uppercase" style={{ color }}>{label}</span>
82
             <div className="flex flex-wrap gap-1.5">
83
               {notes.map((n) => (
84
                 <span key={n} className="rounded-full border px-2.5 py-0.5 text-xs text-white/85" style={{ borderColor: `${color}77`, background: `${color}1f` }}>
85
                   {n}
86
                 </span>
87
               ))}
88
             </div>
89
           </div>
90
         ))}
91
       </div>
92
 
93
       <style>{`
94
         @keyframes wsFill { from { transform: translateY(110px); } to { transform: translateY(0); } }
95
         @keyframes wsWave { from { transform: translateX(0); } to { transform: translateX(-40px); } }
96
         @keyframes wsRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
97
         @keyframes wsTwinkle { 0%, 100% { opacity: 0; transform: scale(0.4); } 50% { opacity: 1; transform: scale(1.4); } }
98
         .ws-fill { animation: wsFill 2.2s cubic-bezier(0.3, 0.7, 0.2, 1) both; }
99
         .ws-wave { animation: wsWave 2.4s linear infinite; }
100
         .ws-rise { opacity: 0; animation: wsRise 0.7s ease-out forwards; }
101
         .ws-twinkle { opacity: 0; transform-box: fill-box; transform-origin: center; animation: wsTwinkle 2.4s ease-in-out infinite; }
102
         @media (prefers-reduced-motion: reduce) {
103
           .ws-fill, .ws-wave, .ws-twinkle { animation: none; }
104
           .ws-rise { animation: none; opacity: 1; }
105
         }
106
       `}</style>
107
     </div>
