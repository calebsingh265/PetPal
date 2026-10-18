'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { computePlan, SPECIES_CFG, type LifeStage } from '@/lib/nutrition'
import { story, GRAMS_PER_PIECE, MAX_KIBBLE } from './story'

const SPECIES = ['dog', 'cat', 'rabbit'] as const
type S = (typeof SPECIES)[number]

/**
 * The live planner, styled as the nutrition-facts panel on a bag of food.
 * It runs the SAME engine as /nutrition, and the bowl behind it fills with
 * one meal of what it calculates — one visible piece ≈ 1.5 g.
 */
export default function Portions() {
  const [species, setSpecies] = useState<S>('dog')
  const [weight, setWeight] = useState<number>(SPECIES_CFG.dog.defaultKg)
  const [stage, setStage] = useState<LifeStage>('adult')
  const plan = computePlan({ species, weightKg: weight, activity: 1.6, lifeStage: stage })
  const cfg = SPECIES_CFG[species]
  const max = species === 'dog' ? 60 : cfg.maxKg

  const pieces = Math.round(plan.gramsPerMeal / GRAMS_PER_PIECE)
  const cap = MAX_KIBBLE[story.tier]
  const overflow = pieces > cap

  useEffect(() => {
    story.portionKibble = Math.min(pieces, MAX_KIBBLE[story.tier])
    if (story.t >= 0.55) story.kibble = story.portionKibble
  }, [pieces])

  const pill = (on: boolean) =>
    `px-3 h-8 rounded-full text-[13px] font-semibold border-2 border-[#120D10] transition-colors ${on ? 'bg-[#120D10] text-[#FBF7F0]' : 'bg-transparent text-[#120D10] hover:bg-[#120D10]/8'}`

  return (
    <div className="pp-facts w-full max-w-[400px] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
      <div className="pp-label text-[2.1rem] leading-none">Portion Facts</div>
      <div className="text-[13px] mt-1">Calculated live — the same maths as the planner</div>
      <div className="rule-xl" />

      <div className="flex flex-wrap gap-1.5 mb-3" role="radiogroup" aria-label="Species">
        {SPECIES.map(s => (
          <button key={s} role="radio" aria-checked={species === s} className={pill(species === s)}
            onClick={() => { setSpecies(s); setWeight(SPECIES_CFG[s].defaultKg) }}>
            {SPECIES_CFG[s].label}
          </button>
        ))}
      </div>

      <div className="flex items-baseline justify-between">
        <label htmlFor="pp-weight" className="font-bold text-[14px]">Body weight</label>
        <span className="pp-label text-[1.4rem] tabular-nums">{weight.toFixed(1)} kg</span>
      </div>
      <input id="pp-weight" type="range" className="pp-range" min={species === 'dog' ? 2 : 0.5} max={max}
        step={max > 15 ? 0.5 : 0.1} value={weight} onChange={e => setWeight(Math.round(+e.target.value * 10) / 10)} />

      <div className="flex gap-1.5 mt-2" role="radiogroup" aria-label="Life stage">
        {(['young', 'adult', 'senior'] as const).map(s => (
          <button key={s} role="radio" aria-checked={stage === s} className={pill(stage === s)} onClick={() => setStage(s)}>
            {s === 'young' ? cfg.youngLabel : s === 'adult' ? 'Adult' : 'Senior'}
          </button>
        ))}
      </div>

      <div className="rule-md mt-3" />
      <div className="flex items-end justify-between">
        <div className="font-bold text-[14px] leading-tight">Energy per day</div>
        <div className="pp-label text-[2.6rem] leading-none tabular-nums">{plan.mer}<span className="text-[1rem] ml-1">kcal</span></div>
      </div>
      <div className="rule" />
      <Row k={`${cfg.foodLabel} per day`} v={`${plan.dryGrams} g`} />
      <div className="rule" />
      <Row k="Meals" v={`${plan.meals} × ${plan.gramsPerMeal} g`} />
      <div className="rule" />
      <Row k="Water (typical)" v={`${plan.waterMl} ml`} />
      <div className="rule-md" />
      <p className="text-[11.5px] leading-snug">
        <b>In the bowl: one meal, {plan.gramsPerMeal} g.</b>{' '}
        {overflow
          ? 'That is more than this bowl can show — it is drawn full.'
          : `Each piece you see stands for about ${GRAMS_PER_PIECE} g.`}{' '}
        Moderate activity. A planning guide, not a prescription.
      </p>
      <Link href={`/nutrition?species=${species}&weight=${weight}`}
        className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold underline underline-offset-4 decoration-2">
        Open the full planner <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between text-[14px]">
      <span>{k}</span>
      <span className="font-bold tabular-nums">{v}</span>
    </div>
  )
}
