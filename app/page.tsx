import Link from 'next/link'
import {
  ArrowRight, ArrowUpRight, Bell, Scale, HeartPulse, MapPin, Stethoscope, MessageSquare, BookOpen,
  ClipboardCheck, ShieldCheck,
} from 'lucide-react'
import Navbar from '@/components/public/Navbar'
import Logo from '@/components/public/Logo'
import Landing from '@/components/landing/Landing'
import Headline from '@/components/landing/Headline'
import Portions from '@/components/landing/Portions'
import FoodCheck from '@/components/landing/FoodCheck'
import JoinCard from '@/components/landing/JoinCard'
import Photo from '@/components/landing/Photo'
import { FOOD_DB } from '@/lib/food-safety'
import { GUIDE_COUNT } from '@/lib/guides'
import { SPECIES_CFG } from '@/lib/nutrition'

/*
 * PetPal's public home page — "The Bowl".
 *
 * One idea: everything that goes into caring for a pet passes through one
 * bowl. The page is a short story told around it: what goes in (portions),
 * what must never go in (food safety), then the paper side of care (records,
 * vets, community), and a name tag at the end.
 *
 * Every figure on this page is counted from the app itself or cited. There
 * are no testimonials, user counts or ratings, because PetPal has none to
 * show honestly.
 */

const SPECIES_COUNT = Object.keys(SPECIES_CFG).length

function Eyebrow({ n, children, dark = false }: { n?: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`pp-reveal flex items-center gap-3 mb-6 pp-mono text-[11px] uppercase tracking-[0.24em] ${dark ? 'text-[#C9612F]' : 'text-[var(--pp-apricot)]'}`}>
      {n && <span className="opacity-60">{n}</span>}
      <span className="w-8 h-px bg-current opacity-60" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

/** The paper's rim-shaped top edge — it rises like the inside of the bowl. */
function Rim() {
  return (
    <svg className="pp-paper-rim" viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 64 C 320 6, 1120 6, 1440 64 Z" fill="var(--pp-paper)" />
    </svg>
  )
}

const d = (n: number) => ({ '--d': n }) as React.CSSProperties

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Landing>
        {/* ── 0 · Hero ─────────────────────────────────────────────────── */}
        <section id="top" data-t="0" className="relative min-h-[100svh] flex items-start lg:items-center">
          <div className="w-full max-w-7xl mx-auto px-6 pt-32 lg:pt-24 pb-20">
            <div className="max-w-[600px]">
              <div className="pp-hero-fade flex items-center gap-3 mb-7 pp-mono text-[11px] uppercase tracking-[0.24em] text-[var(--pp-apricot)]" style={d(0)}>
                <span className="w-8 h-px bg-current opacity-60" aria-hidden="true" />
                Free · for every kind of pet
              </div>
              <Headline as="h1" hero text="Feed them right. Keep them *safe.*"
                className="text-[3.2rem] sm:text-[4.4rem] lg:text-[5.6rem] leading-[0.94]" />
              <p className="pp-hero-fade mt-7 text-[1.05rem] lg:text-[1.15rem] text-[#F6EFE6]/75 leading-relaxed max-w-[30rem]" style={d(2)}>
                Exact portions, instant food checks, reminders and real vets nearby — for dogs, cats,
                rabbits, birds, reptiles and every small pet in between.
              </p>
              <div className="pp-hero-fade mt-9 flex flex-wrap gap-3" style={d(3)}>
                <Link href="/auth/signup" className="pp-btn pp-btn-primary">Add your pet <ArrowRight className="w-4 h-4" /></Link>
                <a href="#portions" className="pp-btn pp-btn-ghost">See a portion</a>
              </div>
              {/* Phones: room under the buttons where the bowl sits. */}
              <div className="h-[36svh] lg:hidden" aria-hidden="true" />
              <dl className="pp-hero-fade mt-4 lg:mt-14 grid grid-cols-3 gap-x-6 max-w-[32rem] border-t border-[#F6EFE6]/12 pt-5" style={d(4)}>
                {[
                  [String(FOOD_DB.length), 'foods & plants checked'],
                  [String(SPECIES_COUNT), 'species in the planner'],
                  [String(GUIDE_COUNT), 'care guides'],
                ].map(([v, l]) => (
                  <div key={l}>
                    <dt className="sr-only">{l}</dt>
                    <dd className="pp-display text-[2rem] leading-none">{v}</dd>
                    <dd aria-hidden="true" className="pp-mono text-[10px] uppercase tracking-[0.1em] leading-snug text-[#F6EFE6]/50 mt-2">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <a href="#portions" className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#F6EFE6]/55 hover:text-[#F6EFE6]">
            <span className="pp-mono text-[10px] uppercase tracking-[0.24em]">Scroll — fill the bowl</span>
            <span className="pp-cue block w-px h-8 bg-current" aria-hidden="true" />
          </a>
        </section>

        {/* ── 1 · Portions ─────────────────────────────────────────────── */}
        <section id="portions" data-t="1" className="relative min-h-[120svh] flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 py-28 pp-io">
            <Eyebrow n="01">Portions</Eyebrow>
            <Headline text="Portion size is the *quiet* problem."
              className="text-[2.6rem] sm:text-[3.6rem] lg:text-[4.2rem] leading-[0.98] max-w-[34rem]" />
            <p className="pp-reveal mt-6 text-[#F6EFE6]/70 leading-relaxed max-w-[28rem]" style={d(3)}>
              More than half of dogs in a US vet survey were overweight (APOP, 2018) — usually from a scoop nobody
              measured. Move the slider: the bowl fills with one real meal.
            </p>
            <div className="pp-reveal mt-10" style={d(5)}>
              <Portions />
            </div>
          </div>
        </section>

        {/* ── 2 · Safe or not ──────────────────────────────────────────── */}
        <section id="safe" data-t="2" className="relative min-h-[115svh] flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 py-28 flex justify-end pp-io">
            <div className="w-full max-w-[460px]">
              <Eyebrow n="02">Safe or not</Eyebrow>
              <Headline text="Not everything belongs *in the bowl.*"
                className="text-[2.6rem] sm:text-[3.4rem] lg:text-[3.9rem] leading-[0.98]" />
              <p className="pp-reveal mt-6 mb-8 text-[#F6EFE6]/70 leading-relaxed" style={d(3)}>
                {FOOD_DB.length} foods, plants and medicines, each with the clinical reason and what to do.
                Try one.
              </p>
              <div className="pp-reveal" style={d(4)}><FoodCheck /></div>
            </div>
          </div>
        </section>

        {/* ── 3 · Records (paper) ──────────────────────────────────────── */}
        <section id="records" data-t="3" data-paper className="pp-paper mt-24">
          <Rim />
          <div className="max-w-7xl mx-auto px-6 py-28 lg:py-36 grid lg:grid-cols-2 gap-16 items-center pp-io">
            <div>
              <Eyebrow n="03" dark>Records</Eyebrow>
              <Headline text="Nothing *slips.*" className="text-[3rem] sm:text-[4.2rem] lg:text-[5rem] leading-[0.95]" />
              <p className="pp-reveal mt-6 text-[#1D1621]/70 leading-relaxed max-w-[28rem]" style={d(2)}>
                Every pet gets a page: vaccinations and check-ups as reminders, a weight log that draws the trend,
                and a nutrition plan pre-filled from their latest weigh-in.
              </p>
              <ul className="mt-10 space-y-6 max-w-[30rem]">
                {([
                  [Bell, 'Reminders that turn red when overdue', 'Vaccines, deworming, medication and vet visits — on your dashboard, by date.'],
                  [Scale, 'A weight log, not a guess', 'Log weigh-ins; the profile always shows the latest, and the chart shows the direction.'],
                  [HeartPulse, 'A wellness check that knows a red flag', 'Eight questions. Not eating or lethargic means “see a vet”, whatever the score.'],
                ] as const).map(([Icon, t, desc], i) => (
                  <li key={t} className="pp-reveal flex gap-4" style={d(3 + i)}>
                    <span className="w-10 h-10 rounded-full border border-[#1D1621]/15 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-[#C9612F]" /></span>
                    <div>
                      <div className="font-semibold">{t}</div>
                      <div className="text-[14px] text-[#1D1621]/65 leading-relaxed mt-0.5">{desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="pp-reveal pp-mono text-[10.5px] uppercase tracking-[0.14em] text-[#1D1621]/45 mt-8" style={d(6)}>
                Reminders show in the app — PetPal doesn&rsquo;t send emails.
              </p>
            </div>

            {/* An example pet page — an illustration of the real screen. */}
            <div className="pp-reveal relative" style={d(2)}>
              <div className="absolute -inset-6 rounded-[40px] bg-[#EAE1D3]" aria-hidden="true" />
              <div className="relative rounded-[28px] bg-[#FBF7F0] border border-[#1D1621]/10 p-6 shadow-[0_30px_70px_-35px_rgba(29,22,33,0.45)]">
                <div className="flex items-center gap-4">
                  <Photo slug="puppy-bowl" className="w-16 h-16 rounded-2xl" sizes="64px" />
                  <div>
                    <div className="pp-mono text-[10px] uppercase tracking-[0.2em] text-[#1D1621]/45">Example profile</div>
                    <div className="pp-display text-[1.9rem] leading-none mt-1">Cocoa</div>
                    <div className="text-[13px] text-[#1D1621]/60 mt-1">Labrador · 5 months · 14.2 kg</div>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-[#1D1621]/10 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="pp-mono text-[10px] uppercase tracking-[0.18em] text-[#1D1621]/50">Weight</span>
                    <span className="text-[12px] text-[#1D1621]/55">last 6 weigh-ins</span>
                  </div>
                  <svg viewBox="0 0 300 70" className="w-full h-[70px] mt-2 overflow-visible" aria-hidden="true">
                    <path d="M4 62 L62 54 L120 44 L180 33 L240 22 L296 12" fill="none" stroke="#C9612F" strokeWidth="2.5" strokeLinecap="round" />
                    {[[4, 62], [62, 54], [120, 44], [180, 33], [240, 22], [296, 12]].map(([x, y]) => (
                      <circle key={x} cx={x} cy={y} r="3.5" fill="#FBF7F0" stroke="#C9612F" strokeWidth="2" />
                    ))}
                  </svg>
                </div>
                <ul className="mt-4 space-y-2">
                  {([
                    ['Rabies booster', 'Vaccination', 'Overdue by 2 days', true],
                    ['Deworming', 'Deworming / flea', 'In 9 days', false],
                    ['Puppy check-up', 'Vet visit', 'In 3 weeks', false],
                  ] as const).map(([t, k, when, late]) => (
                    <li key={t} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-[#F3ECE1]">
                      <span className={`w-2 h-2 rounded-full ${late ? 'bg-[#E5484D]' : 'bg-[#C9612F]'}`} />
                      <span className="flex-1 text-[14px]">{t} <span className="text-[#1D1621]/45">· {k}</span></span>
                      <span className={`pp-mono text-[11px] ${late ? 'text-[#C42F36]' : 'text-[#1D1621]/55'}`}>{when}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4 · Vets (paper) ─────────────────────────────────────────── */}
        <section id="vets" data-t="4" data-paper className="pp-paper border-t border-[#1D1621]/8">
          <div className="max-w-7xl mx-auto px-6 py-28 lg:py-36 grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center pp-io">
            <div className="order-2 lg:order-1 relative">
              <div className="pp-reveal relative rounded-[28px] overflow-hidden bg-[#EAE1D3] aspect-[5/4]">
                {/* Contour-map illustration — not a real place. */}
                <svg viewBox="0 0 500 400" className="absolute inset-0 w-full h-full" aria-hidden="true">
                  {Array.from({ length: 11 }, (_, i) => (
                    <path key={i} fill="none" stroke="#1D1621" strokeOpacity={0.09 + (i % 3) * 0.02} strokeWidth="1.2"
                      d={`M -20 ${40 + i * 34} C 120 ${10 + i * 34}, 220 ${90 + i * 30}, 330 ${50 + i * 33} S 520 ${30 + i * 36}, 540 ${60 + i * 34}`} />
                  ))}
                  <circle cx="250" cy="210" r="70" fill="none" stroke="#C9612F" strokeOpacity="0.35" strokeDasharray="3 6" />
                  <circle cx="250" cy="210" r="140" fill="none" stroke="#C9612F" strokeOpacity="0.18" strokeDasharray="3 6" />
                  <circle cx="250" cy="210" r="9" fill="#1D1621" />
                  <circle cx="250" cy="210" r="18" fill="#1D1621" fillOpacity="0.12" />
                </svg>
                {[
                  { x: '64%', y: '30%', km: '0.8 km', e: false },
                  { x: '30%', y: '64%', km: '2.3 km', e: true },
                  { x: '78%', y: '72%', km: '3.1 km', e: false },
                ].map(p => (
                  <div key={p.km} className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center" style={{ left: p.x, top: p.y }}>
                    <div className="rounded-full bg-[#FBF7F0] shadow-md px-3 py-1.5 text-[12px] font-semibold flex items-center gap-1.5 whitespace-nowrap">
                      <Stethoscope className="w-3.5 h-3.5 text-[#C9612F]" /> {p.km}
                      {p.e && <span className="pp-mono text-[9px] px-1.5 py-0.5 rounded bg-[#1D1621] text-[#F3ECE1]">24/7</span>}
                    </div>
                    <span className="w-px h-3 bg-[#1D1621]/40" />
                  </div>
                ))}
                <div className="absolute left-4 bottom-4 pp-mono text-[10px] uppercase tracking-[0.18em] text-[#1D1621]/45">Illustration</div>
              </div>
              <div className="pp-reveal hidden md:block absolute -right-6 -bottom-14 w-[38%]" style={d(2)}>
                <Photo slug="vet-exam" className="w-full aspect-[3/4] rounded-[22px] border-[6px] border-[#F3ECE1] shadow-xl" sizes="240px" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Eyebrow n="04" dark>Vets</Eyebrow>
              <Headline text="Help, *nearby.*" className="text-[3rem] sm:text-[4.2rem] lg:text-[5rem] leading-[0.95]" />
              <p className="pp-reveal mt-6 text-[#1D1621]/70 leading-relaxed max-w-[28rem]" style={d(2)}>
                Real veterinary practices from OpenStreetMap, sorted by distance from you. A phone number only
                where one is listed, 24-hour clinics flagged — and no invented ratings.
              </p>
              <div className="pp-reveal mt-8 flex flex-wrap gap-3" style={d(3)}>
                <Link href="/vet-finder" className="pp-btn pp-btn-ghost"><MapPin className="w-4 h-4" /> Find a vet</Link>
                <Link href="/ask" className="pp-btn pp-btn-ghost"><Stethoscope className="w-4 h-4" /> Ask a vet</Link>
              </div>
              <p className="pp-reveal mt-6 text-[13.5px] text-[#1D1621]/60 leading-relaxed max-w-[28rem]" style={d(4)}>
                Ask a Vet is answered only by professionals an administrator has checked against the register.
                It&rsquo;s not an emergency service — if something is wrong now, call a practice.
              </p>
            </div>
          </div>
        </section>

        {/* ── 5 · Together (paper) ─────────────────────────────────────── */}
        <section id="together" data-t="5" data-paper className="pp-paper border-t border-[#1D1621]/8">
          <div className="max-w-7xl mx-auto px-6 py-28 lg:py-36 pp-io">
            <div className="grid lg:grid-cols-2 gap-10 items-end">
              <div>
                <Eyebrow n="05" dark>Together</Eyebrow>
                <Headline text="Never parent *alone.*" className="text-[3rem] sm:text-[4.2rem] lg:text-[5rem] leading-[0.95]" />
              </div>
              <p className="pp-reveal text-[#1D1621]/70 leading-relaxed max-w-[30rem] lg:justify-self-end" style={d(2)}>
                Plain-English guides, a week-by-week plan for a new puppy or kitten, and a community wall where
                owners share wins and worries — anonymously.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 auto-rows-[170px] md:auto-rows-[220px]">
              <div className="pp-reveal col-span-2 row-span-2" style={d(0)}><Photo slug="dog-owner-floor" className="w-full h-full rounded-[26px]" sizes="(min-width: 768px) 50vw, 100vw" /></div>
              <div className="pp-reveal" style={d(1)}><Photo slug="cat-window" className="w-full h-full rounded-[26px]" sizes="25vw" /></div>
              <div className="pp-reveal" style={d(2)}><Photo slug="parrot" className="w-full h-full rounded-[26px]" sizes="25vw" /></div>
              <div className="pp-reveal" style={d(3)}><Photo slug="rabbit" className="w-full h-full rounded-[26px]" sizes="25vw" /></div>
              <div className="pp-reveal" style={d(4)}><Photo slug="kitten-hands" className="w-full h-full rounded-[26px]" sizes="25vw" /></div>
            </div>

            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { href: '/resources', icon: BookOpen, t: `${GUIDE_COUNT} care guides`, desc: 'From the first week to the last — in one honest voice.' },
                { href: '/care-plan', icon: ClipboardCheck, t: 'The first four weeks', desc: 'Separate puppy and kitten plans, week by week.' },
                { href: '/wellness', icon: HeartPulse, t: 'Wellness check', desc: 'Eight questions and what to do about the answer.' },
                { href: '/wall', icon: MessageSquare, t: 'Community', desc: 'Wins, worries and advice, with no names attached.' },
              ].map((c, i) => (
                <Link key={c.href} href={c.href} className="pp-reveal group rounded-[22px] border border-[#1D1621]/12 p-6 hover:bg-[#FBF7F0] transition-colors" style={d(i)}>
                  <div className="flex items-center justify-between">
                    <c.icon className="w-5 h-5 text-[#C9612F]" />
                    <ArrowUpRight className="w-4 h-4 text-[#1D1621]/35 group-hover:text-[#1D1621] transition-colors" />
                  </div>
                  <div className="pp-display text-[1.45rem] leading-tight mt-6">{c.t}</div>
                  <div className="text-[13.5px] text-[#1D1621]/60 leading-relaxed mt-2">{c.desc}</div>
                </Link>
              ))}
            </div>

            <div className="mt-24 grid lg:grid-cols-[1fr_2fr] gap-10">
              <h2 className="pp-display text-[2.4rem] leading-none pp-reveal">Good <em>questions.</em></h2>
              <div className="divide-y divide-[#1D1621]/10 border-y border-[#1D1621]/10">
                {[
                  ['Is PetPal free?', 'Yes. Every tool is free, and most of them work without an account.'],
                  ['How accurate is the planner?', 'It uses the standard veterinary RER and MER energy equations, adjusted for species, life stage, activity and body condition. It is guidance — medical diets are your vet’s call.'],
                  ['Where do the vets come from?', 'OpenStreetMap. We show what the directory holds, sorted by distance, and never invent ratings or phone numbers.'],
                  ['What happens to my location?', 'With your permission, PetPal’s server passes it to OpenStreetMap for one search and then discards it. It is never stored or linked to your account.'],
                  ['Who can see my pets?', 'Only you. Pet profiles, reminders and weigh-ins are restricted to their owner by the database itself, not just the app.'],
                ].map(([q, a]) => (
                  <details key={q} className="group py-5">
                    <summary className="flex items-center justify-between gap-6 cursor-pointer list-none font-semibold text-[1.02rem]">
                      {q}
                      <span aria-hidden="true" className="w-7 h-7 shrink-0 rounded-full border border-[#1D1621]/20 flex items-center justify-center text-[#1D1621]/60 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="mt-3 text-[14.5px] text-[#1D1621]/65 leading-relaxed max-w-[40rem]">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 6 · Join ─────────────────────────────────────────────────── */}
        <section id="join" data-t="6" className="relative min-h-[100svh] flex items-end lg:items-center">
          <div className="w-full max-w-7xl mx-auto px-6 pt-[46svh] pb-16 lg:py-28 flex justify-center lg:justify-end pp-io">
            <div className="pp-reveal w-full max-w-[420px]">
              <JoinCard />
            </div>
          </div>
        </section>

        <footer className="relative bg-[#0D0A14] border-t border-[#F6EFE6]/8">
          <div className="max-w-7xl mx-auto px-6 py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 w-fit">
                <Logo size={32} />
                <span className="pp-display text-[1.6rem]">Pet<em>Pal</em></span>
              </Link>
              <p className="text-[14px] text-[#F6EFE6]/55 leading-relaxed mt-4 max-w-sm">
                Feeding, safety, records and vets — for dogs, cats, rabbits, birds, reptiles and every small
                creature in between.
              </p>
            </div>
            {([
              ['Tools', [['Nutrition planner', '/nutrition'], ['Food safety', '/food-safety'], ['Find a vet', '/vet-finder'], ['Wellness check', '/wellness'], ['Care plan', '/care-plan'], ['Care guides', '/resources']]],
              ['Account', [['Sign in', '/auth/login'], ['Create account', '/auth/signup'], ['Ask a vet', '/ask'], ['Community', '/wall'], ['Setup check', '/setup']]],
            ] as const).map(([title, links]) => (
              <div key={title}>
                <h3 className="pp-mono text-[10px] uppercase tracking-[0.22em] text-[#F6EFE6]/40 mb-4">{title}</h3>
                <ul className="space-y-2.5 text-[14px] text-[#F6EFE6]/70">
                  {links.map(([l, h]) => (
                    <li key={h}><Link href={h} className="hover:text-[#F6EFE6] transition-colors">{l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="max-w-7xl mx-auto px-6 pb-10 flex flex-col sm:flex-row justify-between gap-3 text-[12px] text-[#F6EFE6]/40">
            <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Guidance only — never a substitute for your vet.</span>
            <span>PetPal</span>
          </div>
        </footer>
      </Landing>
    </>
  )
}
