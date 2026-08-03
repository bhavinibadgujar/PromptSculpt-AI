'use client'

import { MoonStar, SunMedium } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!mounted) {
    return <div className="size-11" aria-hidden="true" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="group inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 bg-card/90 text-foreground shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-muted hover:shadow-[0_10px_28px_rgba(124,58,237,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      <span className="relative block h-5 w-5 transition-transform duration-300 group-hover:scale-110">
        {isDark ? (
          <SunMedium className="h-5 w-5 text-amber-500" />
        ) : (
          <MoonStar className="h-5 w-5 text-violet-600" />
        )}
      </span>
    </button>
  )
}