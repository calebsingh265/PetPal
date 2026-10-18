'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { setTagName } from './story'

/**
 * The closing card. Typing a name engraves it on the ID tag beside it — a
 * small promise of what the account is for. Nothing typed here is stored or
 * sent anywhere; creating the account happens on the sign-up page.
 */
export default function JoinCard() {
  const [name, setName] = useState('')

  return (
    <div className="w-full max-w-[420px] rounded-[28px] bg-[#F3ECE1] text-[#1D1621] p-7 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)]">
      <div className="pp-mono text-[10.5px] uppercase tracking-[0.22em] text-[#1D1621]/55">New profile · free</div>
      <label htmlFor="pp-petname" className="pp-display block text-[2rem] leading-[1.05] mt-3">
        What&rsquo;s your pet <em>called?</em>
      </label>
      <input
        id="pp-petname"
        value={name}
        maxLength={14}
        autoComplete="off"
        onChange={e => { setName(e.target.value); setTagName(e.target.value) }}
        placeholder="e.g. Biscuit"
        className="mt-5 w-full h-14 px-5 rounded-2xl bg-white/70 border-2 border-[#1D1621]/12 focus:border-[#C9612F] outline-none text-[1.15rem]"
      />
      <p className="text-[12px] text-[#1D1621]/55 mt-2">Watch the tag. Nothing you type here is saved.</p>

      <Link href="/auth/signup" className="pp-btn pp-btn-primary w-full justify-center mt-6">
        {name.trim() ? `Make ${name.trim()}’s profile` : 'Create a free account'} <ArrowRight className="w-4 h-4" />
      </Link>
      <p className="text-center text-[13px] text-[#1D1621]/60 mt-4">
        Already have one? <Link href="/auth/login" className="underline underline-offset-4 text-[#1D1621]">Sign in</Link>
      </p>
      <p className="text-[11.5px] text-[#1D1621]/50 leading-relaxed mt-5 border-t border-[#1D1621]/10 pt-4">
        Most tools — the planner, the food check, the wellness check, the vet finder and the guides — work without an account.
      </p>
    </div>
  )
}
