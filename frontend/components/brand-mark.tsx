'use client'

import { memo } from 'react'

type BrandMarkProps = {
  size?: number
  animated?: boolean
  showWordmark?: boolean
  className?: string
}

export const BrandMark = memo(function BrandMark({ size = 36, animated = false, showWordmark = true, className = '' }: BrandMarkProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <div className={`relative shrink-0 ${animated ? 'motion-safe:animate-[pulse_2.4s_ease-in-out_infinite]' : ''}`}>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-400/20 blur-xl" />
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="relative drop-shadow-[0_8px_20px_rgba(79,70,229,0.25)]">
          <defs>
            <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#370a5a" />
              <stop offset="55%" stopColor="#54157e" />
              <stop offset="100%" stopColor="#532a82" />
            </linearGradient>
          </defs>
          <rect x="8" y="8" width="48" height="48" rx="16" fill="url(#brand-gradient)" />
          <path d="M24 20h10c6 0 10 3 10 8s-4 8-10 8H24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 36v8" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          <path d="M38 20L46 12" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
          <path d="M46 12l-4 6" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
      {showWordmark ? (
        <div className="flex flex-col leading-none">
          <span className="text-[0.8125rem] font-bold tracking-tight text-foreground">PromptSculpt <span className="gradient-text">AI</span></span>
          <span className="mt-0.5 text-[0.625rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">Prompt X-Ray</span>
        </div>
      ) : null}
    </div>
  )
})
