1
 "use client";
2
 
3
 // The three stages of a commit-reveal mint, driven by real transactions and real block numbers.
4
 //   1. Seal    : the commit transaction
5
 //   2. Mature  : wait a few blocks so the result cannot be gamed
6
 //   3. Open    : the reveal transaction
7
 // `stage` is the stage currently running (1 to 3). 4 means everything is done.
8
 
9
 interface MintProgressProps {
10
   stage: 1 | 2 | 3 | 4;
11
   blocksDone: number;
12
   blocksTotal: number;
13
   accent?: string;
14
 }
15
 
16
 const STEPS = [
17
   { title: "Seal", hint: "Confirm in your wallet" },
18
   { title: "Mature", hint: "Letting the scent settle" },
19
   { title: "Open", hint: "Confirm in your wallet" },
20
 ];
21
 
22
 export default function MintProgress({ stage, blocksDone, blocksTotal, accent = "#c084fc" }: MintProgressProps) {
23
   const pct = blocksTotal > 0 ? Math.min(100, Math.round((blocksDone / blocksTotal) * 100)) : 0;
24
 
25
   return (
26
     <div className="space-y-6" role="status" aria-live="polite">
27
       <ol className="flex items-start justify-between gap-2">
28
         {STEPS.map((step, i) => {
29
           const n = i + 1;
30
           const done = stage > n;
31
           const active = stage === n;
32
           return (
33
             <li key={step.title} className="flex flex-1 flex-col items-center text-center">
34
               <span
35
                 className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-500 ${active ? "ws-step-active" : ""}`}
36
                 style={{
37
                   borderColor: done || active ? accent : "rgba(255,255,255,0.15)",
38
                   background: done ? accent : active ? `${accent}26` : "transparent",
39
                   color: done ? "#0b0b14" : "#fff",
40
                   boxShadow: active ? `0 0 22px ${accent}88` : "none",
41
                 }}
42
               >
43
                 {done ? (
44
                   <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden="true">
45
                     <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
46
                   </svg>
47
                 ) : (
48
                   n
49
                 )}
50
               </span>
51
               <span className={`mt-2 text-sm font-semibold ${done || active ? "text-white" : "text-white/40"}`}>{step.title}</span>
52
               <span className="text-[11px] text-white/40">{active ? step.hint : done ? "Done" : ""}</span>
53
             </li>
54
           );
55
         })}
56
       </ol>
57
 
58
       <div>
59
         <div className="h-2 overflow-hidden rounded-full bg-white/10">
60
           <div
61
             className="h-full rounded-full transition-all duration-500"
62
             style={{ width: stage === 2 ? `${pct}%` : stage > 2 ? "100%" : "0%", background: `linear-gradient(90deg, ${accent}, #f472b6)` }}
63
           />
64
         </div>
65
         <p className="mt-2 text-center text-xs text-white/50">
66
           {stage === 1 && "Sealing your scent onchain..."}
67
           {stage === 2 && `Maturing: block ${Math.min(blocksDone, blocksTotal)} of ${blocksTotal}`}
68
           {stage === 3 && "Ready. Opening the bottle..."}
69
           {stage === 4 && "Done"}
70
         </p>
71
       </div>
72
 
73
       <style>{`
74
         @keyframes wsPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
75
         .ws-step-active { animation: wsPulse 1.6s ease-in-out infinite; }
76
         @media (prefers-reduced-motion: reduce) { .ws-step-active { animation: none; } }
77
       `}</style>
78
     </div>
79
   );
