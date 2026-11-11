import FaqList from "@/components/faq/FaqList";
import Reveal from "@/components/home/Reveal";

export const metadata = {
  title: "FAQ | ScentProtocol",
  description: "Frequently asked questions about ScentProtocol collections, minting, and digital perfumery",
};

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      {/* Hero Header */}
      <header className="mb-12 text-center">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/80">
          Support
        </p>
        <h1 className="font-display text-balance bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text pb-3 text-5xl font-semibold leading-[1.1] tracking-tight text-transparent sm:text-6xl">
          Frequently Asked Questions
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/55">
          Everything you need to know about ScentProtocol collections and digital perfumery
        </p>
      </header>

      {/* Interactive List (Client Component) */}
      <FaqList />

      {/* Contact Block */}
      <Reveal className="mt-14">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl"
          />
          <h2 className="relative font-display text-3xl font-semibold text-white">
            Still have questions?
          </h2>
          <p className="relative mx-auto mt-2 max-w-md text-sm text-white/55">
            Write to us and we will get back to you.
          </p>
          <a
            href="mailto:scentprotocol.support@gmail.com"
            className="relative mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-6 py-3 font-medium text-white transition hover:bg-white/15"
          >
            <svg
              aria-hidden
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Support
          </a>
        </div>
      </Reveal>
    </div>
  );
}
