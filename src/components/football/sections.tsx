import Link from "next/link";
import { LEAGUES } from "@/lib/football/leagues";
import { STAR_BOOTS, bootsLabel } from "@/lib/football/boots";

/** Links to every competition page. */
export function LeagueNav({ active }: { active?: string }) {
  return (
    <nav aria-label="Competitions" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
      {LEAGUES.map((l) => (
        <Link
          key={l.slug}
          href={`/football/${l.slug}`}
          className={
            "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition " +
            (active === l.slug ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink")
          }
        >
          {l.name}
        </Link>
      ))}
    </nav>
  );
}

/** Grid of star players linking to their boots pages. */
export function StarBootsGrid({ title = "What boots do the stars wear?" }: { title?: string }) {
  return (
    <section className="mt-20">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Boots of the stars</p>
      <h2 className="text-3xl font-black tracking-tight md:text-5xl">{title}</h2>
      <p className="mt-3 max-w-2xl text-muted">See the boots each star plays in, with today’s prices in your country, cheapest store first.</p>
      <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {STAR_BOOTS.map((p) => (
          <li key={p.slug}>
            <Link href={`/football/boots/${p.slug}`} className="group block h-full rounded-[24px] bg-white p-4 transition hover:-translate-y-1 hover:shadow-xl">
              <p className="font-black leading-tight">{p.name}</p>
              <p className="text-xs text-muted">{p.club}</p>
              <p className="mt-3 inline-block rounded-full bg-lime px-2.5 py-1 text-xs font-bold">{bootsLabel(p)}</p>
              <p className="mt-2 text-xs font-semibold text-accent opacity-0 transition group-hover:opacity-100">See prices →</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Faq({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <section className="mt-20 max-w-3xl">
      <h2 className="text-3xl font-black tracking-tight">Questions</h2>
      <dl className="mt-6 space-y-6">
        {faqs.map((f) => (
          <div key={f.q}>
            <dt className="text-lg font-bold">{f.q}</dt>
            <dd className="mt-1 text-ink-2">{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
