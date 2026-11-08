1
 "use client";
2
 
3
 // The wallet analysis screen. It shows the real readings as they arrive, so the wait feels
4
 // like a scan instead of a spinner. A reading that is still null shows a pulsing placeholder.
5
 
6
 import { useEffect, useState } from "react";
7
 
8
 export interface ScanMetrics {
9
   txCount: number | null;
10
   balanceEth: number | null;
11
   /** null while reading, -1 when the wallet age could not be found. */
12
   ageYears: number | null;
13
 }
14
 
15
 function useCountUp(target: number | null, ms = 900): number {
16
   const [value, setValue] = useState(0);
17
   useEffect(() => {
18
     if (target === null || target <= 0) {
19
       setValue(target ?? 0);
20
       return;
21
     }
22
     const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
23
     if (reduced) {
24
       setValue(target);
25
       return;
26
     }
27
     let raf = 0;
28
     const start = performance.now();
29
     const tick = (now: number) => {
30
       const k = Math.min(1, (now - start) / ms);
31
       setValue(target * (1 - Math.pow(1 - k, 3)));
32
       if (k < 1) raf = requestAnimationFrame(tick);
33
     };
34
     raf = requestAnimationFrame(tick);
35
     return () => cancelAnimationFrame(raf);
36
   }, [target, ms]);
37
   return value;
38
 }
39
 
40
 interface RowProps {
41
   label: string;
42
   caption: string;
43
   ready: boolean;
44
   text: string;
45
   color: string;
46
 }
47
 
48
 function Row({ label, caption, ready, text, color }: RowProps) {
49
   return (
50
     <div
51
       className="flex items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-500"
52
       style={{ borderColor: ready ? `${color}88` : "rgba(255,255,255,0.1)", background: ready ? `${color}14` : "rgba(255,255,255,0.03)" }}
53
     >
54
       <span
55
         className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
56
         style={{ background: ready ? color : "rgba(255,255,255,0.08)", color: ready ? "#0b0b14" : "rgba(255,255,255,0.4)" }}
57
       >
58
         {ready ? (
59
           <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden="true">
60
             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
61
           </svg>
62
         ) : (
63
           <span className="h-2 w-2 animate-pulse rounded-full bg-white/50" />
64
         )}
65
       </span>
66
       <div className="min-w-0 flex-1 text-left">
67
         <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
68
         <p className="truncate text-sm text-white/70">{ready ? text : caption}</p>
69
       </div>
70
     </div>
71
   );
72
 }
73
 
74
 export default function ScentScan({ metrics }: { metrics: ScanMetrics }) {
75
   const tx = useCountUp(metrics.txCount);
76
   const eth = useCountUp(metrics.balanceEth);
77
   const age = useCountUp(metrics.ageYears !== null && metrics.ageYears > 0 ? metrics.ageYears : null);
78
   const ageUnknown = metrics.ageYears === -1;
79
   const readyCount = [metrics.txCount, metrics.balanceEth, metrics.ageYears].filter((v) => v !== null).length;
80
 
81
   return (
82
     <div className="space-y-6 py-4 text-center" role="status" aria-live="polite">
83
       <div className="relative mx-auto h-36 w-36">
84
         <span className="ws-ring absolute inset-0 rounded-full border-2 border-purple-400/40" />
85
         <span className="ws-ring absolute inset-3 rounded-full border-2 border-pink-400/40" style={{ animationDirection: "reverse", animationDuration: "5s" }} />
86
         <span className="ws-ring absolute inset-6 rounded-full border-2 border-amber-300/40" style={{ animationDuration: "3s" }} />
87
         <span
88
           className="absolute inset-9 rounded-full"
89
           style={{
90
             background: "radial-gradient(circle, rgba(244,114,182,0.9), rgba(168,85,247,0.4) 60%, transparent 75%)",
91
             transform: `scale(${0.7 + readyCount * 0.15})`,
92
             transition: "transform 600ms ease",
93
           }}
94
         />
95
       </div>
96
 
97
       <div>
98
         <h3 className="text-2xl font-bold text-white">Reading your wallet</h3>
99
         <p className="mt-1 text-sm text-white/50">
100
           {readyCount === 0 && "Looking up your history..."}
101
           {readyCount === 1 && "First reading is in..."}
102
           {readyCount === 2 && "Almost there..."}
103
           {readyCount === 3 && "Blending your scent..."}
104
         </p>
105
       </div>
106
 
107
       <div className="mx-auto max-w-md space-y-3">
108
         <Row label="Activity" caption="Counting transactions" ready={metrics.txCount !== null} text={`${Math.round(tx).toLocaleString()} transactions`} color="#f472b6" />
109
         <Row label="Weight" caption="Weighing your balance" ready={metrics.balanceEth !== null} text={`${eth.toFixed(eth < 10 ? 2 : 0)} ETH`} color="#c084fc" />
110
         <Row
111
           label="Time"
112
           caption="Measuring your history"
113
           ready={metrics.ageYears !== null}
114
           text={ageUnknown ? "Age not found, treated as new" : `${age.toFixed(1)} years on chain`}
115
           color="#fbbf24"
116
         />
117
       </div>
118
 
119
       <style>{`
120
         @keyframes wsSpin { to { transform: rotate(360deg); } }
121
         .ws-ring { animation: wsSpin 8s linear infinite; border-top-color: transparent; }
122
         @media (prefers-reduced-motion: reduce) { .ws-ring { animation: none; } }
123
       `}</style>
124
     </div>
