'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

/**
 * The shared header for every tool page, in the same language as the home
 * page: an editorial serif headline with one italic accent word, a mono
 * eyebrow, and the measuring-scale ruler that runs through the site.
 *
 * It used to carry a WebGL "aura" of particles on the right. That cost a
 * second 3D context on every tool page and said nothing about the tool, so it
 * is gone; the ruler does the decorative job for free.
 */

const EASE = [0.16, 1, 0.3, 1] as const

/** Gram-scale ticks — every 5th long, every 10th labelled. Pure SVG. */
function ScaleRuler() {
  const ticks = Array.from({ length: 61 }, (_, i) => i)
  return (
    <svg viewBox="0 0 600 44" className="w-full h-11" aria-hidden="true">
      {ticks.map(i => {
        const x = 6 + i * 9.8
        const long = i % 5 === 0
        return <line key={i} x1={x} x2={x} y1={0} y2={long ? 16 : 8} stroke="currentColor" strokeWidth={long ? 1.2 : 0.8} opacity={long ? 0.55 : 0.3} />
      })}
      {ticks.filter(i => i % 10 === 0).map(i => (
        <text key={i} x={6 + i * 9.8} y={32} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.45"
          style={{ fontFamily: 'var(--font-pp-mono)' }}>{i * 10}</text>
      ))}
    </svg>
  )
}

export default function PageHeader({
  eyebrow,
  icon: Icon,
  title,
  accent,
  sub,
  action,
}: {
  eyebrow: string
  icon?: LucideIcon
  /** Leading part of the heading. */
  title: string
  /** Trailing part, set in italic and tinted — the editorial accent. */
  accent?: string
  sub?: string
  /** Accepted for compatibility with older call sites; no longer drawn. */
  species?: string
  /** Optional right-hand control, e.g. an "Add" button. */
  action?: React.ReactNode
}) {
  return (
    <header className="relative overflow-hidden border-b border-white/[0.07]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 140% at 8% -10%, rgba(255,174,109,0.12) 0%, transparent 60%), radial-gradient(40% 90% at 100% 0%, rgba(142,139,245,0.08) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative px-6 lg:px-8 pt-12 pb-9 lg:pt-16 lg:pb-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="flex items-end justify-between gap-8"
        >
          <div className="min-w-0 max-w-2xl">
            <div className="inline-flex items-center gap-2.5 mb-5 text-[var(--apricot)]">
              {Icon ? <Icon className="w-3.5 h-3.5" aria-hidden="true" /> : <span className="w-6 h-px bg-current" aria-hidden="true" />}
              <span className="text-[11px] uppercase tracking-[0.24em]" style={{ fontFamily: 'var(--font-pp-mono)' }}>
                {eyebrow}
              </span>
            </div>

            <h1
              className="text-[2.6rem] md:text-[3.3rem] lg:text-[4rem] leading-[0.98] tracking-[-0.02em] mb-4 text-[#F6EFE6]"
              style={{ fontFamily: 'var(--font-pp-display)', fontWeight: 420 }}
            >
              {title}
              {accent && (
                <>
                  {' '}
                  <em className="italic text-[var(--apricot)]" style={{ fontWeight: 380 }}>{accent}</em>
                </>
              )}
            </h1>

            {sub && <p className="text-zinc-400 text-[15px] md:text-base leading-relaxed max-w-xl">{sub}</p>}
          </div>

          {action && <div className="shrink-0 hidden sm:block">{action}</div>}
        </motion.div>

        {action && <div className="sm:hidden mt-6">{action}</div>}

        <div className="hidden lg:block absolute right-8 top-10 w-[300px] text-[#F6EFE6]">
          <ScaleRuler />
        </div>
      </div>
    </header>
  )
}
