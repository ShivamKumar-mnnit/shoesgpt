"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { STORES } from "@/lib/stores";
import type { Region, StoreId } from "@/lib/types";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Fades + slides children in when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  y = 40,
  className,
  ...rest
}: { children: ReactNode; delay?: number; y?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Text that rises out of a mask, word by word. */
export function MaskText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    // The visibility check sits on the outer box. The words start below their clipped boxes,
    // so watching the words themselves would never fire and the text would stay hidden.
    <motion.span
      className={clsx("inline-flex flex-wrap gap-x-[0.25em]", className)}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.2 }}
    >
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block"
            variants={{ hidden: { y: "110%" }, shown: { y: 0 } }}
            transition={{ duration: 0.9, delay: delay + i * 0.06, ease: EASE }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

export function SectionHeading({
  kicker,
  title,
  sub,
  right,
}: {
  kicker: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <Reveal y={16} className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          <Sparkle className="size-3.5" /> {kicker}
        </Reveal>
        <h2 className="text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
          <MaskText text={title} />
        </h2>
        {sub && (
          <Reveal delay={0.15} y={16} className="mt-4 text-base text-muted md:text-lg">
            {sub}
          </Reveal>
        )}
      </div>
      {right && <Reveal delay={0.2} y={16}>{right}</Reveal>}
    </div>
  );
}

/** Four-point star used as decoration across the site. */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 0c.6 6.3 5.7 11.4 12 12-6.3.6-11.4 5.7-12 12-.6-6.3-5.7-11.4-12-12C6.3 11.4 11.4 6.3 12 0Z" />
    </svg>
  );
}

export function StoreBadge({ store, className }: { store: StoreId; className?: string }) {
  const s = STORES[store];
  return (
    <span
      className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white", className)}
      style={{ background: s.color }}
    >
      <span className="grid size-3.5 place-items-center rounded-full bg-white/25 text-[8px]">{s.name[0]}</span>
      {s.name}
    </span>
  );
}

/** Product image loaded from the store's CDN, with a shimmer while loading and a fallback if it fails. */
export function ShoeImg({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">(src ? "loading" : "error");
  const [prev, setPrev] = useState(src);
  if (prev !== src) {
    setPrev(src);
    setState(src ? "loading" : "error");
  }
  return (
    <div className={clsx("relative overflow-hidden", className)}>
      {state === "loading" && <div className="skeleton absolute inset-0" />}
      {state === "error" ? (
        <div className="absolute inset-0 grid place-items-center bg-paper-2 text-muted">
          <ShoeGlyph className="w-1/2 opacity-40" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setState("ok")}
          onError={() => setState("error")}
          className={clsx(
            "h-full w-full object-cover transition-opacity duration-500",
            state === "ok" ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}

export function ShoeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 32" className={className} fill="currentColor" aria-hidden>
      <path d="M2 22c0-3 1-9 3-12 1-2 4-2 5 0 2 3 6 5 10 5 3 0 5-2 7-4 1-1 3-1 4 0l6 6c3 3 9 4 15 5 6 1 10 3 10 6v2H4c-1 0-2-1-2-2v-6Z" />
    </svg>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={clsx("relative inline-block text-[13px] leading-none tracking-[2px]", className)} aria-label={`${value} out of 5`}>
      <span className="text-ink/15">★★★★★</span>
      <span className="absolute inset-0 overflow-hidden text-accent" style={{ width: `${(value / 5) * 100}%` }}>
        ★★★★★
      </span>
    </span>
  );
}

/** Simple stripes: [colors] stacked horizontally (h) or vertically (v). */
const stripes = (dir: "h" | "v", colors: string[], w = 30, h = 20) =>
  colors.map((c, i) =>
    dir === "h" ? (
      <rect key={i} y={(i * h) / colors.length} width={w} height={h / colors.length} fill={c} />
    ) : (
      <rect key={i} x={(i * w) / colors.length} width={w / colors.length} height={h} fill={c} />
    ),
  );

/** Simplified Union Jack, used for the UK and inside the Australian flag. */
const unionJack = (w: number, h: number) => (
  <g>
    <rect width={w} height={h} fill="#012169" />
    <path d={`M0 0L${w} ${h}M${w} 0L0 ${h}`} stroke="#fff" strokeWidth={h / 5} />
    <path d={`M0 0L${w} ${h}M${w} 0L0 ${h}`} stroke="#c8102e" strokeWidth={h / 15} />
    <path d={`M${w / 2} 0V${h}M0 ${h / 2}H${w}`} stroke="#fff" strokeWidth={h / 3} />
    <path d={`M${w / 2} 0V${h}M0 ${h / 2}H${w}`} stroke="#c8102e" strokeWidth={h / 5} />
  </g>
);

const FLAGS: Record<Region, ReactNode> = {
  in: (
    <>
      {stripes("h", ["#ff9933", "#ffffff", "#138808"])}
      <circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" strokeWidth="0.7" />
    </>
  ),
  us: (
    <>
      <rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#b22234" />
      ))}
      <rect width="12" height={(7 * 20) / 13} fill="#3c3b6e" />
    </>
  ),
  uk: unionJack(30, 20),
  de: stripes("h", ["#000000", "#dd0000", "#ffce00"]),
  fr: stripes("v", ["#002395", "#ffffff", "#ed2939"]),
  it: stripes("v", ["#009246", "#ffffff", "#ce2b37"]),
  es: (
    <>
      <rect width="30" height="20" fill="#aa151b" />
      <rect y="5" width="30" height="10" fill="#f1bf00" />
    </>
  ),
  nl: stripes("h", ["#ae1c28", "#ffffff", "#21468b"]),
  ca: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="7.5" height="20" fill="#d52b1e" />
      <rect x="22.5" width="7.5" height="20" fill="#d52b1e" />
      <path d="M15 4l1.2 2.6 2-.8-.6 3.6 2-1.6.4 1.4 1.8-.2-1 2 .8.6L18 12.8l.4 1.6-2.8-.4V17h-1.2v-3l-2.8.4.4-1.6-3.6-1.4.8-.6-1-2 1.8.2.4-1.4 2 1.6-.6-3.6 2 .8z" fill="#d52b1e" />
    </>
  ),
  au: (
    <>
      <rect width="30" height="20" fill="#012169" />
      <svg width="15" height="10" viewBox="0 0 30 20">{unionJack(30, 20)}</svg>
      <circle cx="7.5" cy="15" r="1.8" fill="#fff" />
      <circle cx="22" cy="5" r="1" fill="#fff" />
      <circle cx="25" cy="10" r="1" fill="#fff" />
      <circle cx="22" cy="16" r="1" fill="#fff" />
      <circle cx="19" cy="9" r="1" fill="#fff" />
    </>
  ),
  jp: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="6" fill="#bc002d" />
    </>
  ),
  ae: (
    <>
      {stripes("h", ["#00732f", "#ffffff", "#000000"])}
      <rect width="8" height="20" fill="#ff0000" />
    </>
  ),
  sg: (
    <>
      {stripes("h", ["#ef3340", "#ffffff"])}
      <circle cx="6.5" cy="5" r="3.2" fill="#fff" />
      <circle cx="7.8" cy="5" r="3.2" fill="#ef3340" />
    </>
  ),
  mx: (
    <>
      {stripes("v", ["#006847", "#ffffff", "#ce1126"])}
      <circle cx="15" cy="10" r="2.4" fill="#8c5a2b" />
    </>
  ),
};

/** Small flag icons (Windows doesn't draw flag emoji). */
export function Flag({ region, className }: { region: Region; className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={clsx("inline-block h-[0.8em] w-[1.2em] shrink-0 overflow-hidden rounded-[2px] align-[-0.05em] ring-1 ring-black/10", className)}
      aria-label={region.toUpperCase()}
    >
      {FLAGS[region]}
    </svg>
  );
}
