'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowUpRight, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from '@/components/public/Logo'

const NAV = [
  { label: 'Nutrition', href: '/nutrition' },
  { label: 'Food safety', href: '/food-safety' },
  { label: 'Vets', href: '/vet-finder' },
  { label: 'Wellness', href: '/wellness' },
  { label: 'Ask a vet', href: '/ask' },
  { label: 'Community', href: '/wall' },
  { label: 'Guides', href: '/resources' },
]

const remember = () => { try { localStorage.setItem('pp_chrome', 'site') } catch {} }

/**
 * The public navigation bar. Clear over the home page's opening scene, firms
 * up once you scroll, and on the home page steps out of the way while you
 * scroll down — it comes back the moment you scroll up.
 */
export default function Navbar() {
  const pathname = usePathname()
  const home = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 16)
      if (home) setHidden(y > 240 && y > last + 2 ? true : y < last - 2 ? false : hidden => hidden)
      last = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [home])

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(.16,1,.3,1)] border-b',
          hidden && !open ? '-translate-y-full' : 'translate-y-0',
          // No backdrop blur over the home page's 3D scene: re-blurring a live
          // WebGL canvas every frame costs more than the effect is worth.
          !scrolled && home ? 'bg-transparent border-transparent'
            : home ? 'bg-[#0D0A14]/92 border-[#F6EFE6]/[0.07]'
            : 'bg-[#0D0A14]/80 backdrop-blur-xl border-[#F6EFE6]/[0.07]'
        )}
      >
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="PetPal home">
            <Logo size={30} className="group-hover:rotate-[-6deg] transition-transform duration-500" />
            <span className="text-[1.4rem] leading-none text-[#F6EFE6]" style={{ fontFamily: 'var(--font-pp-display)', fontWeight: 440 }}>
              Pet<em className="italic text-[var(--apricot)]" style={{ fontWeight: 380 }}>Pal</em>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {NAV.map(item => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={remember}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative px-3 py-2 text-[13px] transition-colors duration-200 group',
                    active ? 'text-[#F6EFE6]' : 'text-[#F6EFE6]/60 hover:text-[#F6EFE6]'
                  )}
                >
                  {item.label}
                  <span className={cn(
                    'absolute left-3 right-3 bottom-1 h-px bg-[var(--apricot)] origin-left transition-transform duration-300',
                    active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  )} />
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="hidden sm:inline-flex h-9 px-3 items-center text-[13px] text-[#F6EFE6]/70 hover:text-[#F6EFE6]">
              Sign in
            </Link>
            <Link href="/auth/signup"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[var(--apricot)] text-[#24140A] text-[13px] font-semibold hover:bg-[#FFBE86] transition-colors">
              Add your pet <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden w-9 h-9 rounded-full border border-[#F6EFE6]/15 flex items-center justify-center text-[#F6EFE6]"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Rendered outside the nav: a fixed element inside a transformed parent
          would be trapped by it. */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-[60] w-[19rem] bg-[#141019] border-l border-[#F6EFE6]/8 lg:hidden p-6 flex flex-col"
              role="dialog"
              aria-label="Menu"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-[1.4rem] text-[#F6EFE6]" style={{ fontFamily: 'var(--font-pp-display)' }}>
                  Pet<em className="italic text-[var(--apricot)]">Pal</em>
                </span>
                <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-full border border-[#F6EFE6]/15 flex items-center justify-center" aria-label="Close menu">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col">
                {NAV.map(item => (
                  <Link key={item.href} href={item.href} onClick={() => { remember(); setOpen(false) }}
                    className="flex items-center justify-between py-3.5 border-b border-[#F6EFE6]/[0.06] text-[1.15rem] text-[#F6EFE6]/85"
                    style={{ fontFamily: 'var(--font-pp-display)' }}>
                    {item.label}
                    <ArrowUpRight className="w-4 h-4 opacity-40" />
                  </Link>
                ))}
              </div>
              <div className="mt-auto pt-8 flex flex-col gap-2">
                <Link href="/auth/signup" onClick={() => setOpen(false)} className="h-12 rounded-full bg-[var(--apricot)] text-[#24140A] font-semibold flex items-center justify-center gap-2">
                  Add your pet <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/auth/login" onClick={() => setOpen(false)} className="h-12 rounded-full border border-[#F6EFE6]/15 flex items-center justify-center text-[#F6EFE6]/85">
                  Sign in
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
