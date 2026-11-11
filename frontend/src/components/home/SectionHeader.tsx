/** One heading style for every home section: small label, serif title, short line. */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  const center = align === "center";
  return (
    <div className={`mb-8 ${center ? "text-center" : "text-left"}`}>
      {eyebrow && (
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/80">{eyebrow}</p>
      )}
      <h2 className="font-display text-balance pb-1 text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 max-w-xl text-pretty text-sm leading-relaxed text-white/55 sm:text-base ${center ? "mx-auto" : ""}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
