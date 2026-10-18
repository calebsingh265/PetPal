'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Search } from 'lucide-react'
import { lookupFood, LEVEL_META, type FoodEntry } from '@/lib/food-safety'
import { releaseDrop, type Drop } from './story'

const CHIPS = ['Chocolate', 'Grapes', 'Carrot', 'Onion', 'Blueberries', 'Apple', 'Peanut butter', 'Lily']

/** Which 3D model to drop for an entry; anything else drops a coloured token. */
function modelFor(entry: FoodEntry): Drop['model'] {
  const n = entry.names.join(' ')
  if (/chocolate|cocoa/.test(n)) return 'chocolate'
  if (/grape|raisin/.test(n)) return 'grape'
  if (/onion|garlic|leek/.test(n)) return 'onion'
  if (/carrot/.test(n)) return 'carrot'
  if (/blueberr/.test(n)) return 'blueberry'
  if (/\bapple/.test(n)) return 'apple'
  return 'token'
}

/**
 * The food check, in miniature. Uses the real lookup from lib/food-safety, so
 * the verdict here is exactly what the full checker would say — and it never
 * guesses: an unknown item says so instead of dropping anything.
 */
export default function FoodCheck() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<ReturnType<typeof lookupFood>>({ status: 'empty' })

  function check(q: string) {
    setQuery(q)
    const r = lookupFood(q)
    setResult(r)
    if (r.status === 'found') releaseDrop(modelFor(r.entry), r.entry.level)
  }

  const meta = result.status === 'found' ? LEVEL_META[result.entry.level] : null

  return (
    <div className="w-full max-w-[440px]">
      <form onSubmit={e => { e.preventDefault(); check(query) }} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F6EFE6]/50 pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type a food, plant or medicine…"
          aria-label="Food to check"
          enterKeyHint="search"
          className="w-full h-14 pl-11 pr-28 rounded-full bg-[#1a1520] border border-[#F6EFE6]/15 text-[15px] text-[#F6EFE6] placeholder:text-[#F6EFE6]/40 outline-none focus:border-[var(--pp-apricot)]/60"
        />
        <button type="submit" className="absolute right-1.5 top-1.5 h-11 px-5 rounded-full bg-[var(--pp-apricot)] text-[#24140A] text-sm font-semibold">
          Drop it
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {CHIPS.map(c => (
          <button key={c} onClick={() => check(c)}
            className="pp-mono text-[11px] uppercase tracking-[0.12em] px-3 h-8 rounded-full border border-[#F6EFE6]/15 text-[#F6EFE6]/70 hover:text-[#F6EFE6] hover:border-[#F6EFE6]/35 transition-colors">
            {c}
          </button>
        ))}
      </div>

      <div className="mt-5 min-h-[190px]" aria-live="polite">
        {result.status === 'found' && meta && (
          <div key={result.entry.names[0] + query} className="pp-reveal pp-in rounded-2xl border p-5 bg-[#0D0A14]/85"
            style={{ borderColor: `${meta.color}55` }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="pp-label text-[13px] px-2.5 py-1 rounded-md" style={{ background: meta.color, color: '#120D10' }}>
                {meta.label}
              </span>
              <span className="pp-display text-[1.6rem] capitalize leading-none">{result.entry.names[0]}</span>
            </div>
            <p className="text-[14px] text-[#F6EFE6]/80 leading-relaxed">{result.entry.note}</p>
            {result.entry.action && (
              <p className="text-[13px] text-[#F6EFE6]/95 mt-2"><span className="pp-mono text-[10px] uppercase tracking-[0.16em] opacity-60 mr-2">What to do</span>{result.entry.action}</p>
            )}
          </div>
        )}
        {result.status === 'unknown' && (
          <div className="rounded-2xl border border-[#F6EFE6]/12 p-5 bg-[#0D0A14]/85">
            <p className="text-[14px] text-[#F6EFE6]/85">
              &ldquo;{result.query}&rdquo; isn&rsquo;t one we&rsquo;ve checked, so nothing gets dropped.
              A wrong &ldquo;safe&rdquo; is worse than no answer — when in doubt, don&rsquo;t feed it.
            </p>
            {result.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {result.suggestions.map(s => (
                  <button key={s} onClick={() => check(s)} className="text-xs px-2.5 h-7 rounded-full border border-[#F6EFE6]/15 capitalize hover:border-[#F6EFE6]/35">{s}</button>
                ))}
              </div>
            )}
          </div>
        )}
        {result.status === 'empty' && (
          <p className="text-[13px] text-[#F6EFE6]/55 leading-relaxed max-w-sm">
            Safe food lands in the bowl. &ldquo;Only a little&rdquo; shrinks to a taste. Toxic food gets knocked out.
          </p>
        )}
      </div>

      <Link href="/food-safety" className="inline-flex items-center gap-1 text-[13px] text-[#F6EFE6]/75 hover:text-[#F6EFE6] underline underline-offset-4 decoration-[#F6EFE6]/30">
        Open the full checker <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
