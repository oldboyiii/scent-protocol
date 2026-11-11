const STEPS = [
  {
    n: "01",
    title: "Describe it",
    text: "Pick a style, or tell the Advisor a mood, a place or an occasion.",
  },
  {
    n: "02",
    title: "Seal and reveal",
    text: "Confirm once to seal your scent on Arc, then once more to reveal the formula. Gas is paid in USDC.",
  },
  {
    n: "03",
    title: "Own it",
    text: "Your NFT holds the formula. Listen to it, trade it, or blend it with another.",
  },
];

export default function HowItWorks() {
  return (
    <ol className="grid gap-3 md:grid-cols-3">
      {STEPS.map((s, i) => (
        <li key={s.n} className="relative glass-card p-6">
          <span className="font-display text-5xl font-semibold leading-none text-white/10">{s.n}</span>
          <h3 className="mt-3 font-display text-xl font-semibold text-white">{s.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/55">{s.text}</p>
          {i < STEPS.length - 1 && (
            <span aria-hidden className="absolute -right-2.5 top-1/2 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#120a24] text-white/40 md:flex">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
