'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { story, HERO_KIBBLE, type Tier } from './story'
import { KEYS, readRaw } from '@/lib/storage'
import { useClientValue } from '@/lib/use-client-value'
import SceneBoundary from './SceneBoundary'

const BowlCanvas = dynamic(() => import('./scene/BowlCanvas'), { ssr: false })

/** Chapters, in scroll order — also what the side gauge lists. */
export const CHAPTERS = [
  { id: 'top', label: 'The bowl' },
  { id: 'portions', label: 'Portions' },
  { id: 'safe', label: 'Safe or not' },
  { id: 'records', label: 'Records' },
  { id: 'vets', label: 'Vets' },
  { id: 'together', label: 'Together' },
  { id: 'join', label: 'Join' },
] as const

function detectTier(): Tier {
  // ?tier=low|medium|high forces a level — for demos on unknown machines.
  const forced = new URLSearchParams(location.search).get('tier')
  if (forced === 'low' || forced === 'medium' || forced === 'high') return forced
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return 'low'
  const cores = nav.hardwareConcurrency ?? 4
  const mem = nav.deviceMemory ?? 8
  const coarse = matchMedia('(pointer: coarse)').matches
  if (cores <= 4 || mem <= 3) return 'low'
  if (coarse || cores <= 6 || mem <= 4) return 'medium'
  return 'high'
}

function appReducedMotion(): boolean {
  try {
    const raw = readRaw(KEYS.prefs)
    return raw ? JSON.parse(raw)?.reduceMotion === true : false
  } catch { return false }
}

/**
 * Client orchestrator for the home page. The sections themselves are
 * server-rendered children; this only adds what needs a browser:
 * smooth scroll, the scroll → scene-time mapping, the 3D layer and the gauge.
 */
export default function Landing({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const [mount3d, setMount3d] = useState(false)
  const [ready, setReady] = useState(false)
  const [failedToBoot, setFailed] = useState(false)
  // Read from the browser during render — no effect, no extra render pass.
  const tier = useClientValue<Tier>(detectTier, 'high')
  const noWebGL = useClientValue(() => !window.WebGLRenderingContext, false)
  const failed = failedToBoot || noWebGL
  const [covered, setCovered] = useState(false)
  const [active, setActive] = useState(0)
  const [onPaper, setOnPaper] = useState(false)

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || appReducedMotion()
    story.reducedMotion = reduced
    story.tier = detectTier()
    // Inspectable in development, or with ?debug, for the screenshot scripts.
    if (process.env.NODE_ENV !== 'production' || location.search.includes('debug')) {
      ;(window as unknown as { __pp?: typeof story }).__pp = story
    }

    // ── Reveal-on-view ────────────────────────────────────────────────────
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('pp-in'); io.unobserve(e.target) }
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 })
    root.current?.querySelectorAll('.pp-io').forEach(el => io.observe(el))

    // ── Scroll → scene time ───────────────────────────────────────────────
    let anchors: { t: number; mid: number }[] = []
    let papers: HTMLElement[] = []
    const measure = () => {
      const els = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-t]') ?? [])
      anchors = els.map(el => {
        const r = el.getBoundingClientRect()
        return { t: Number(el.dataset.t), mid: r.top + window.scrollY + r.height / 2 }
      }).sort((a, b) => a.t - b.t)
      papers = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-paper]') ?? [])
    }
    let lastActive = -1, lastCovered: boolean | null = null, lastPaper: boolean | null = null
    const update = () => {
      const y = window.scrollY + window.innerHeight / 2
      let t = 0
      if (anchors.length) {
        if (y <= anchors[0].mid) t = anchors[0].t
        else if (y >= anchors[anchors.length - 1].mid) t = anchors[anchors.length - 1].t
        else for (let i = 1; i < anchors.length; i++) {
          const a = anchors[i - 1], b = anchors[i]
          if (y <= b.mid) { t = a.t + ((y - a.mid) / (b.mid - a.mid)) * (b.t - a.t); break }
        }
      }
      story.t = t
      // The hero bowl is a generous serving for show; from the portions
      // chapter on, it holds exactly what the planner says one meal is.
      story.kibble = t < 0.55 ? HERO_KIBBLE : story.portionKibble
      const h = window.innerHeight
      let cover = false, paperUnderGauge = false
      for (const p of papers) {
        const r = p.getBoundingClientRect()
        if (r.top <= 0 && r.bottom >= h) cover = true
        if (r.top <= h / 2 && r.bottom >= h / 2) paperUnderGauge = true
      }
      story.covered = cover
      if (cover !== lastCovered) { lastCovered = cover; setCovered(cover) }
      if (paperUnderGauge !== lastPaper) { lastPaper = paperUnderGauge; setOnPaper(paperUnderGauge) }
      const a = Math.min(CHAPTERS.length - 1, Math.round(t))
      if (a !== lastActive) { lastActive = a; setActive(a) }
    }
    measure()
    update()

    // ── Smooth scroll (Lenis), skipped for reduced motion ─────────────────
    let lenis: import('lenis').default | null = null
    let raf = 0
    let cancelled = false
    if (!reduced) {
      import('lenis').then(({ default: Lenis }) => {
        if (cancelled) return
        lenis = new Lenis({ lerp: 0.1, anchors: { offset: 0 }, wheelMultiplier: 0.9 })
        ;(window as unknown as { __lenis?: unknown }).__lenis = lenis
        lenis.on('scroll', update)
        const loop = (time: number) => { lenis?.raf(time); raf = requestAnimationFrame(loop) }
        raf = requestAnimationFrame(loop)
      })
    }
    window.addEventListener('scroll', update, { passive: true })

    let resizeTimer = 0
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { measure(); update() }, 150) }
    window.addEventListener('resize', onResize)
    // Fonts and images settling change section heights; re-measure once.
    document.fonts?.ready.then(() => { measure(); update() })
    const late = window.setTimeout(() => { measure(); update() }, 1500)

    // ── Pointer (fine pointers only) ──────────────────────────────────────
    const fine = matchMedia('(pointer: fine)').matches
    const onMove = (e: PointerEvent) => {
      story.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      story.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    if (fine && !reduced) window.addEventListener('pointermove', onMove, { passive: true })

    // ── Boot the 3D after first paint, on intent or idle ──────────────────
    let booted = false
    const boot = () => { if (!booted) { booted = true; setMount3d(true) } }
    const idle = window.setTimeout(boot, fine ? 900 : 1600)
    window.addEventListener('pointermove', boot, { once: true, passive: true })
    window.addEventListener('scroll', boot, { once: true, passive: true })
    window.addEventListener('touchstart', boot, { once: true, passive: true })

    return () => {
      cancelled = true
      io.disconnect()
      cancelAnimationFrame(raf)
      lenis?.destroy()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointermove', boot)
      window.removeEventListener('scroll', boot)
      window.removeEventListener('touchstart', boot)
      clearTimeout(idle); clearTimeout(late); clearTimeout(resizeTimer)
    }
  }, [])

  function go(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: HTMLElement, o?: object) => void } }).__lenis
    if (lenis) lenis.scrollTo(el, { duration: 1.6 })
    else el.scrollIntoView({ behavior: story.reducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <div ref={root} className="pp relative" data-ready={ready ? '' : undefined}>
      {/* Poster: what the 3D layer looks like before it boots, and the whole
          look on devices without WebGL. Pure CSS — no image to wait for. */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-0 transition-opacity duration-1000"
        style={{
          opacity: ready && !failed ? 0 : 1,
          background:
            'radial-gradient(38% 34% at 72% 58%, rgba(232,135,90,0.42) 0%, rgba(232,135,90,0.08) 55%, transparent 72%), radial-gradient(60% 50% at 70% 80%, rgba(26,20,32,1) 0%, transparent 70%), #0D0A14',
        }}
      />
      {mount3d && !failed && (
        <div className="transition-opacity duration-1000" style={{ opacity: ready ? 1 : 0 }}>
          <SceneBoundary onFail={() => setFailed(true)}>
            <BowlCanvas tier={tier} paused={covered} onReady={() => setReady(true)} onFail={() => setFailed(true)} />
          </SceneBoundary>
        </div>
      )}
      <div className="pp-grain" aria-hidden="true" />

      {/* Side gauge — where you are in the story. */}
      <nav
        aria-label="Page sections"
        className={`hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col gap-2.5 transition-colors duration-500 ${onPaper ? 'text-[#1D1621]' : 'text-[#F6EFE6]'}`}
      >
        {CHAPTERS.map((c, i) => (
          <button
            key={c.id}
            onClick={() => go(c.id)}
            aria-current={active === i ? 'step' : undefined}
            className="group flex items-center justify-end gap-3 h-5"
          >
            <span className="pp-mono text-[10px] uppercase tracking-[0.18em] transition-all duration-300 opacity-0 translate-x-1 group-hover:opacity-80 group-hover:translate-x-0 group-focus-visible:opacity-80">
              {c.label}
            </span>
            <span className={`block h-px transition-all duration-500 bg-current ${active === i ? 'w-8 opacity-100' : 'w-3.5 opacity-35 group-hover:opacity-70'}`} />
          </button>
        ))}
      </nav>

      <div className="relative z-10">{children}</div>
    </div>
  )
}
