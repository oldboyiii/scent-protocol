1
 "use client";
2
 
3
 // Falling confetti for the celebration screen. Pure CSS, no packages.
4
 // The pieces are generated from a fixed seed, so a re-render never reshuffles them.
5
 // Skipped completely when the visitor prefers reduced motion.
6
 
7
 import { useEffect, useMemo, useState } from "react";
8
 import type { CSSProperties } from "react";
9
 
10
 interface ConfettiProps {
11
   /** How many pieces. Scale it with rarity. */
12
   count?: number;
13
   colors?: string[];
14
   /** Milliseconds before the pieces are removed from the page. */
15
   lifetime?: number;
16
 }
17
 
18
 function rng(seed: number): () => number {
19
   let a = seed >>> 0;
20
   return () => {
21
     a = (a + 0x6d2b79f5) >>> 0;
22
     let t = a;
23
     t = Math.imul(t ^ (t >>> 15), t | 1);
24
     t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
25
     return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
26
   };
27
 }
28
 
29
 const DEFAULT_COLORS = ["#f472b6", "#c084fc", "#fbbf24", "#60a5fa", "#34d399"];
30
 
31
 export default function Confetti({ count = 70, colors = DEFAULT_COLORS, lifetime = 7000 }: ConfettiProps) {
32
   const [visible, setVisible] = useState(true);
33
   const [reduced, setReduced] = useState(false);
34
 
35
   useEffect(() => {
36
     setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
37
     const t = setTimeout(() => setVisible(false), lifetime);
38
     return () => clearTimeout(t);
39
   }, [lifetime]);
40
 
41
   const pieces = useMemo(() => {
42
     const r = rng(count * 7919 + colors.length);
43
     return Array.from({ length: count }, (_, i) => ({
44
       left: r() * 100,
45
       delay: r() * 1.6,
46
       duration: 3.2 + r() * 2.6,
47
       size: 6 + r() * 7,
48
       color: colors[i % colors.length],
49
       drift: (r() - 0.5) * 160,
50
       round: r() > 0.6,
51
     }));
52
   }, [count, colors]);
53
 
54
   if (!visible || reduced) return null;
55
 
56
   return (
57
     <div className="pointer-events-none fixed inset-0 z-[150] overflow-hidden" aria-hidden="true">
58
       {pieces.map((p, i) => (
59
         <span
60
           key={i}
61
           className="ws-confetti absolute top-0 block"
62
           style={
63
             {
64
               left: `${p.left}%`,
65
               width: p.size,
66
               height: p.round ? p.size : p.size * 0.5,
67
               background: p.color,
68
               borderRadius: p.round ? "50%" : "2px",
69
               animationDelay: `${p.delay}s`,
70
               animationDuration: `${p.duration}s`,
71
               "--drift": `${p.drift}px`,
72
             } as CSSProperties
73
           }
74
         />
75
       ))}
76
       <style>{`
77
         @keyframes ws-fall {
78
           0% { transform: translate3d(0, -8vh, 0) rotate(0deg); opacity: 1; }
79
           100% { transform: translate3d(var(--drift), 108vh, 0) rotate(720deg); opacity: 0.85; }
80
         }
81
         .ws-confetti { animation-name: ws-fall; animation-timing-function: cubic-bezier(0.25, 0.6, 0.4, 1); animation-fill-mode: both; }
82
       `}</style>
83
     </div>
