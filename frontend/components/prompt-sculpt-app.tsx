'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowRight, BarChart3, Brain, Check, CheckCircle2, Clock3, Copy, FileText, History, Lightbulb, Menu, RefreshCw, Rocket, Search, Sparkles, Target, Trash2, TriangleAlert, WandSparkles, X, Zap } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { ThemeToggle } from '@/components/theme-toggle'
import { analyzePromptApi, deleteHistoryApi, demoAnalysis, examples, fetchHistoryApi, type Analysis, type Category, type HistoryItem, type XRayHighlight, type XRayIssueType } from '@/lib/prompt-analysis'

const categories = Object.keys(examples) as Category[]
const demo = demoAnalysis

const LOAD_MESSAGES = [
  'Reading prompt…',
  'Understanding intent…',
  'Analyzing structure…',
  'Evaluating clarity…',
  'Checking context…',
  'Generating recommendations…',
  'Optimizing prompt…',
  'Preparing intelligence report…',
]

function Logo() {
  return (
    <a href="#top" className="flex min-h-11 items-center" aria-label="PromptSculpt AI home">
      <BrandMark size={34} showWordmark />
    </a>
  )
}

function Score({ value, small = false }: { value: number; small?: boolean }) {
  const id = `score-grad-${small ? 's' : 'l'}`
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value <= 0) return;

    let current = display;
    const step = Math.ceil(value / 28);

    const timer = setInterval(() => {
      current += step;

      if (current >= value) {
        current = value;
        clearInterval(timer);
      }

      setDisplay(current);
    }, 20);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className={`relative grid place-items-center ${small ? 'size-16' : 'size-28'}`} style={{ '--score': display } as React.CSSProperties} aria-label={`Score ${value} out of 100`}>
      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <defs><linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#7C3AED"/><stop offset="100%" stopColor="#2563EB"/></linearGradient></defs>
        <circle cx="50" cy="50" r="43" fill="none" stroke="#EDE9FE" strokeWidth={small ? 7 : 8} />
        <circle cx="50" cy="50" r="43" fill="none" stroke={`url(#${id})`} strokeWidth={small ? 7 : 8} strokeLinecap="round" className="score-ring" />
      </svg>
      <div className="flex flex-col items-center leading-none">
        <strong className={`${small ? 'text-xl' : 'text-3xl'} font-extrabold gradient-text tabular-nums`}>{display}</strong>
        {!small && <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">/ 100</span>}
      </div>
    </div>
  )
}

function gradeColor(score: number) {
  if (score >= 85) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Excellent' }
  if (score >= 70) return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Strong' }
  if (score >= 55) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Developing' }
  return { text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', label: 'Needs Work' }
}

function aiSummary(score: number, grade: string, dims: Analysis['dimensions']): string {
  const weakDims = dims.filter(d => d.score < 70).map(d => d.label.toLowerCase())
  if (score >= 85) return 'Your prompt is well-structured and highly specific — the AI can act on it immediately.'
  if (score >= 70) return `Your prompt is solid but could improve ${weakDims.slice(0,2).join(' and ')} to produce more consistent results.`
  if (score >= 55) return `Your prompt communicates the intent but lacks ${weakDims.slice(0,2).join(' and ')}, which limits AI output quality.`
  return `Your prompt is too vague — the AI is guessing on ${weakDims.slice(0,3).join(', ')}, leading to generic responses.`
}

function AuditReport({ analysis, copyText }: { analysis: Analysis; copyText: (t: string) => void }) {
  const projected = Math.min(99, analysis.score + Math.round((100 - analysis.score) * 0.38))
  const strengths = analysis.dimensions.filter(d => d.score >= 75)
  const missing   = analysis.dimensions.filter(d => d.score < 75)
  const gc = gradeColor(analysis.score)
  const summary = aiSummary(analysis.score, analysis.grade, analysis.dimensions)
  const half = Math.ceil(analysis.issues.length / 2)
  const weaknesses   = analysis.issues.slice(0, half)
  const improvements = analysis.issues.slice(half)

  return (
    <div className="result-enter flex flex-col gap-4">

      {/* ── Hero Score ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card" style={{boxShadow:'0 4px 28px rgba(124,58,237,0.12)'}}>
        <div className="absolute inset-x-0 top-0 h-[3px]" style={{background:'linear-gradient(90deg,#7C3AED,#8B5CF6,#2563EB)'}} />
        <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full" style={{background:'radial-gradient(circle,rgba(124,58,237,0.09) 0%,transparent 65%)'}} />
        <div className="pointer-events-none absolute -left-8 bottom-0 size-40 rounded-full" style={{background:'radial-gradient(circle,rgba(37,99,235,0.06) 0%,transparent 65%)'}} />
        <div className="flex flex-col items-center gap-4 px-6 pb-6 pt-8 sm:flex-row sm:items-start sm:text-left">
          <div className="relative shrink-0">
            <div className="score-hero-glow" aria-hidden="true" />
            <Score value={analysis.score} />
          </div>
          <div className="flex-1 pt-1">
            <p className="eyebrow mb-2">Prompt Health Score</p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[1.75rem] font-extrabold tracking-tight text-foreground leading-none">{analysis.grade}</h2>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${gc.bg} ${gc.border} ${gc.text}`}>{gc.label}</span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-700">+{projected - analysis.score} pts projected</span>
            </div>
            <p className="mt-2.5 max-w-sm text-sm leading-6 text-muted-foreground">{summary}</p>
          </div>
        </div>
        <div className="border-t border-border/70 bg-surface/60 px-6 py-3.5">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Expected after optimization</span>
            <span className="gradient-text">{analysis.score} → {projected}<span className="ml-1 font-normal text-muted-foreground">(+{projected - analysis.score})</span></span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-muted">
            <div className="metric-bar absolute left-0 top-0 h-full rounded-full" style={{width:`${projected}%`,background:'rgba(124,58,237,0.18)'}} />
            <div className="metric-bar absolute left-0 top-0 h-full rounded-full" style={{width:`${analysis.score}%`,background:'linear-gradient(90deg,#7C3AED,#8B5CF6)'}} />
          </div>
        </div>
      </div>

      {/* ── Strengths ── */}
      {strengths.length > 0 && (
        <div className="report-card stagger-1 border-emerald-200/70 bg-emerald-500/10">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15"><CheckCircle2 className="size-3.5 text-emerald-600" /></span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Strengths</span>
            <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{strengths.length} passing</span>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">{strengths.map(d => (
            <div key={d.label} className="report-item border-emerald-200/70 bg-emerald-500/5">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
              <div><p className="text-xs font-semibold text-foreground">{d.label}<span className="ml-1.5 font-bold text-emerald-600">{d.score}</span></p><p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{d.note}</p></div>
            </div>
          ))}</div>
        </div>
      )}

      {/* ── Missing Elements ── */}
      {(missing.length > 0 || weaknesses.length > 0) && (
        <div className="report-card stagger-2 border-amber-200/70 bg-amber-500/10">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15"><TriangleAlert className="size-3.5 text-amber-600" /></span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Missing Elements</span>
            <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">{missing.length + weaknesses.length} issues</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {missing.map(d => (
              <div key={d.label} className="report-item border-amber-200/70 bg-amber-500/5">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                <div><p className="text-xs font-semibold text-foreground">{d.label}<span className="ml-1.5 font-bold text-amber-600">{d.score}</span></p><p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{d.note}</p></div>
              </div>
            ))}
            {weaknesses.map(issue => (
              <div key={issue} className="report-item border-amber-200/70 bg-amber-500/5">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
                <p className="text-[11px] leading-5 text-muted-foreground">{issue}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Improvements ── */}
      {improvements.length > 0 && (
        <div className="report-card stagger-3 border-violet-200/70 bg-violet-500/10">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15"><Rocket className="size-3.5 text-violet-600" /></span>
            <span className="text-sm font-bold text-violet-700 dark:text-violet-400">What the AI Added</span>
            <span className="ml-auto rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-400">{improvements.length} enhancements</span>
          </div>
          <div className="flex flex-col gap-1.5">{improvements.map(imp => (
            <div key={imp} className="report-item border-violet-100">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-violet-500" />
              <p className="text-[11px] leading-5 text-muted-foreground">{imp}</p>
            </div>
          ))}</div>
        </div>
      )}

      {/* ── Optimized Prompt ── */}
      <div className="stagger-4 overflow-hidden rounded-xl border border-primary/25" style={{boxShadow:'0 4px 24px rgba(124,58,237,0.12)'}}>
        <div className="flex items-center justify-between border-b border-primary/15 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent px-4 py-3">
          <div className="flex items-center gap-2">
            <WandSparkles className="size-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">AI Optimized Prompt</span>
          </div>
          <button onClick={() => copyText(analysis.improved)} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-card px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition-all hover:bg-primary hover:text-white">
            <Copy className="size-3.5" />Copy Prompt
          </button>
        </div>
        <div className="max-h-72 overflow-auto whitespace-pre-wrap bg-card p-5 font-mono text-[0.8125rem] leading-[1.8] text-foreground">{analysis.improved}</div>
      </div>

    </div>
  )
}

function XRayPanel({ analysis, prompt, copyText }: { analysis: Analysis; prompt: string; copyText: (text: string) => void }) {
  const [activeHighlight, setActiveHighlight] = useState<XRayHighlight | null>(analysis.xray?.highlights[0] ?? null)

  useEffect(() => {
    setActiveHighlight(analysis.xray?.highlights[0] ?? null)
  }, [analysis.xray])

  const issueStyles: Record<XRayIssueType, { badge: string; chip: string; label: string }> = {
    ambiguous: { badge: 'border-rose-200 bg-rose-50 text-rose-700', chip: 'bg-rose-500', label: 'Ambiguous wording' },
    missing_context: { badge: 'border-amber-200 bg-amber-50 text-amber-700', chip: 'bg-amber-500', label: 'Missing context' },
    weak_constraints: { badge: 'border-sky-200 bg-sky-50 text-sky-700', chip: 'bg-sky-500', label: 'Weak constraints' },
    strong_section: { badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', chip: 'bg-emerald-500', label: 'Strong section' },
  }

  const severityStyles: Record<string, string> = {
    critical: 'border-red-200 bg-red-50 text-red-700',
    high: 'border-rose-200 bg-rose-50 text-rose-700',
    medium: 'border-amber-200 bg-amber-50 text-amber-700',
    low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  if (!analysis.xray) {
    return <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">Prompt X-Ray data is not available for this analysis yet.</div>
  }

  const highlights = analysis.xray.highlights
  const summary = analysis.xray.summary
  const confidence = analysis.xray.confidence

  const renderPromptWithHighlights = () => {
    if (!highlights.length) {
      return <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{prompt}</p>
    }

    const sorted = [...highlights].sort((a, b) => a.start - b.start)
    const parts: Array<{ text: string; highlight?: XRayHighlight }> = []
    let cursor = 0

    sorted.forEach((highlight) => {
      const start = Math.max(0, Math.min(highlight.start, prompt.length))
      const end = Math.max(start, Math.min(highlight.end, prompt.length))
      if (start > cursor) parts.push({ text: prompt.slice(cursor, start) })
      if (start < end) parts.push({ text: prompt.slice(start, end), highlight })
      cursor = end
    })

    if (cursor < prompt.length) parts.push({ text: prompt.slice(cursor) })

    return <div className="whitespace-pre-wrap text-sm leading-7 text-foreground">
      {parts.map((piece, index) => piece.highlight ? (
        <button key={`${piece.highlight.start}-${piece.highlight.end}-${index}`} type="button" onClick={() => setActiveHighlight(piece.highlight!)} className={`rounded-md px-1.5 py-0.5 text-left font-medium transition-colors ${issueStyles[piece.highlight!.issueType].badge}`}>
          {piece.text}
        </button>
      ) : <span key={`plain-${index}`}>{piece.text}</span>)}
    </div>
  }

  return <div className="flex flex-col gap-5">
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-violet-500/10 to-sky-500/10 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="eyebrow">🔍 AI Prompt X-Ray</p>
          <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">A diagnostic view of your prompt's clarity, constraints, and intent.</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">This view highlights where your prompt is strong, where it is ambiguous, and exactly how to turn it into a more reliable instruction for AI.</p>
        </div>
        <div className="rounded-2xl border border-violet-200/70 bg-card/90 px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">AI Confidence</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-sky-500 text-lg font-black text-white">{confidence.score}</div>
            <div>
              <p className="text-sm font-semibold text-foreground">{confidence.score >= 85 ? 'Highly actionable' : confidence.score >= 70 ? 'Strong diagnostic signal' : 'Needs more detail'}</p>
              <p className="text-xs text-muted-foreground">{confidence.reasons[0]}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Original prompt</p>
            <p className="text-xs text-muted-foreground">Click any highlighted span to inspect the issue.</p>
          </div>
          <span className="rounded-full border border-violet-200/70 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:text-violet-400">Live inspector</span>
        </div>
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
          {renderPromptWithHighlights()}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Inspector</p>
            <p className="text-xs text-muted-foreground">Why the issue matters and how to improve it.</p>
          </div>
          {activeHighlight ? <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${issueStyles[activeHighlight.issueType].badge}`}>{issueStyles[activeHighlight.issueType].label}</span> : null}
        </div>
        {activeHighlight ? <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${severityStyles[activeHighlight.severity]}`}>{activeHighlight.severity.toUpperCase()}</span>
            <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">{activeHighlight.title ?? 'Highlighted issue'}</span>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Issue</p>
            <p className="mt-1 text-sm leading-6 text-foreground">{activeHighlight.explanation}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Impact on AI output</p>
            <p className="mt-1 text-sm leading-6 text-foreground">{activeHighlight.impact}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Better version</p>
            <p className="mt-1 text-sm leading-6 text-foreground">{activeHighlight.suggestedReplacement}</p>
          </div>
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-500/10 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Expected improvement</p>
            <p className="mt-1 text-sm leading-6 text-emerald-800">{activeHighlight.expectedImprovement}</p>
          </div>
        </div> : <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Select a highlighted section to see the reasoning and replacement guidance.</div>}
      </div>
    </div>

    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground">Executive summary</p>
        <div className="mt-4 grid gap-3">
          <div className="rounded-xl border border-border bg-muted/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Overall grade</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{summary.overallGrade}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Prompt maturity</p>
            <p className="mt-1 text-sm leading-6 text-foreground">{summary.promptMaturity}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground">Live prompt diff</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Original</p>
            <p className="mt-2 text-sm leading-6 text-foreground">{prompt.slice(0, 120)}{prompt.length > 120 ? '…' : ''}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Highlighted issues</p>
            <ul className="mt-2 space-y-2 text-sm text-foreground">
              {highlights.slice(0, 3).map((item) => <li key={`${item.issueType}-${item.start}`} className="flex items-start gap-2"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${issueStyles[item.issueType].chip}`} />{item.title ?? item.issueType}</li>)}
            </ul>
          </div>
          <div className="rounded-xl border border-emerald-200/70 bg-emerald-500/10 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Improved prompt</p>
            <p className="mt-2 text-sm leading-6 text-emerald-800">{analysis.improved.slice(0, 140)}{analysis.improved.length > 140 ? '…' : ''}</p>
          </div>
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {summary.topThreeRisks.map((risk) => <span key={risk} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{risk}</span>)}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-muted/50 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Biggest opportunity</p><p className="mt-1 text-sm leading-6 text-foreground">{summary.biggestImprovementOpportunity}</p></div>
        <div className="rounded-xl border border-border bg-muted/50 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Expected output gain</p><p className="mt-1 text-sm leading-6 text-foreground">{summary.expectedAiOutputGain}</p></div>
        <div className="rounded-xl border border-border bg-muted/50 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Quality increase</p><p className="mt-1 text-sm leading-6 text-foreground">{summary.estimatedQualityIncrease}</p></div>
        <div className="rounded-xl border border-border bg-muted/50 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Token efficiency</p><p className="mt-1 text-sm leading-6 text-foreground">{summary.estimatedTokenEfficiency}</p></div>
      </div>
    </div>
  </div>
}

function Diagnostic({ analysis, activeTab, setActiveTab, prompt, copyText }: { analysis: Analysis; activeTab: 'overview'|'xray'|'improved'|'report'; setActiveTab: (tab: 'overview'|'xray'|'improved'|'report') => void; prompt: string; copyText: (text: string) => void }) {
  const tabs = ['overview', 'xray', 'improved', 'report'] as const
  return <div className="result-enter flex flex-col gap-5">
    <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
      <div>
        <p className="eyebrow">Prompt Intelligence Report</p>
        <div className="mt-1.5 flex items-center gap-2.5">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground">{analysis.grade}</h2>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${gradeColor(analysis.score).bg} ${gradeColor(analysis.score).border} ${gradeColor(analysis.score).text}`}>{gradeColor(analysis.score).label}</span>
        </div>
      </div>
      <Score value={analysis.score} small />
    </div>
    <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Analysis views">{tabs.map(tab => <button key={tab} id={`tab-${tab}`} role="tab" aria-selected={activeTab === tab} aria-controls={`panel-${tab}`} onClick={() => setActiveTab(tab)} className={`min-h-11 border-b-2 px-4 text-sm font-medium transition-colors ${activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{tab === 'improved' ? 'AI Optimized' : tab === 'overview' ? 'Overview' : tab === 'xray' ? '🔍 X-Ray' : 'AI Report'}</button>)}</div>
    <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="tab-enter">
      {activeTab === 'overview' && <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-2">{analysis.dimensions.map(item => {
          const pct = Math.round((item.score / (item.maxScore ?? 20)) * 100)
          const good = item.score >= 15
          const weak = item.score < 10
          return <div key={item.label} className="metric-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{item.label}</span>
              <span className={`score-badge ${
                good ? '' : weak ? 'border-red-200 bg-red-50 text-red-600' : 'border-caution/30 bg-caution/10 text-caution'
              }`}>{item.score}<span className="ml-0.5 font-normal opacity-60">/20</span></span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="metric-bar h-full rounded-full" style={{ width: `${pct}%`, background:
                good ? 'linear-gradient(90deg,#7c3aed,#2563eb)' :
                weak ? 'linear-gradient(90deg,#ef4444,#f87171)' :
                       'linear-gradient(90deg,#d97706,#f59e0b)'
              }} />
            </div>
            <p className="mt-2.5 text-xs leading-5 text-muted-foreground">{item.note}</p>
          </div>
        })}</div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800"><Lightbulb className="size-4 text-amber-500" />Optimization Recommendations</div>
          <ul className="mt-3 flex flex-col gap-2">{analysis.issues.slice(0,3).map(issue => <li key={issue} className="suggestion-card"><span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100"><Sparkles className="size-3 text-amber-600" /></span><span className="text-xs leading-5 text-muted-foreground">{issue}</span></li>)}</ul>
        </div>
      </div>}
      {activeTab === 'xray' && <XRayPanel analysis={analysis} prompt={prompt} copyText={copyText} />}
      {activeTab === 'improved' && <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-primary/20" style={{boxShadow:'0 4px 20px rgba(124,58,237,0.08)'}}>
          <div className="flex items-center justify-between border-b border-primary/15 bg-gradient-to-r from-primary/6 to-secondary/4 px-4 py-2.5">
            <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary/60" /><span className="text-xs font-semibold text-primary">AI Optimized Prompt</span></div>
            <button onClick={() => copyText(analysis.improved)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-primary transition-all hover:bg-primary/10"><Copy className="size-3.5" />Copy</button>
          </div>
          <div className="max-h-80 overflow-auto whitespace-pre-wrap bg-card p-5 font-mono text-sm leading-7 text-foreground">{analysis.improved}</div>
        </div>
      </div>}
      {activeTab === 'report' && <AuditReport analysis={analysis} copyText={copyText} />}
    </div>
  </div>
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App Component
// KEY FIX: Declaration order matters for React Compiler + react-hooks/immutability.
//   notify → loadHistory → useEffect(IntersectionObserver) → runAnalysis
//   Every useCallback has its correct dependency array.
// ─────────────────────────────────────────────────────────────────────────────
export function PromptSculptApp() {
  const [prompt, setPrompt] = useState(examples.Marketing)
  const [category, setCategory] = useState<Category>('Marketing')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview'|'xray'|'improved'|'report'>('overview')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'All'|Category>('All')
  const [notice, setNotice] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const historyLoaded = useRef(false)
  const [loadStep, setLoadStep] = useState(0)

  // ── 1. Loading animation ticker ──────────────────────────────────────────
  useEffect(() => {
    if (!loading) { setLoadStep(0); return }
    const id = window.setInterval(() => setLoadStep(s => (s + 1) % LOAD_MESSAGES.length), 900)
    return () => clearInterval(id)
  }, [loading])

  // ── 2. notify — no deps, setNotice is stable ─────────────────────────────
  const notify = useCallback((message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2200)
  }, [])

  // ── 3. loadHistory — depends on notify ───────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      setHistory(await fetchHistoryApi())
    } catch (error) {
      notify(error instanceof Error && error.message ? error.message : 'Unable to load prompt history.')
    }
  }, [notify])

  // ── 4. IntersectionObserver — MUST come after loadHistory declaration ─────
  //    dep array includes loadHistory so the linter and React Compiler are happy
  useEffect(() => {
    const section = document.querySelector('#history')
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !historyLoaded.current) {
          historyLoaded.current = true
          loadHistory()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(section)

    if (window.location.hash === '#history' && !historyLoaded.current) {
      historyLoaded.current = true
      loadHistory()
    }

    return () => observer.disconnect()
  }, [loadHistory])   // ← was [] — correctly includes loadHistory now

  // ── 5. Filtered history ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const search = query.toLowerCase()
    return history.filter(item =>
      item.prompt.toLowerCase().includes(search) ||
      item.improved.toLowerCase().includes(search)
    )
  }, [history, query, filter])

  // ── 6. runAnalysis — useCallback so React Compiler can memoize cleanly ───
  const runAnalysis = useCallback(async () => {
    if (prompt.trim().length < 12) return notify('Add more detail before analyzing.')
    const promptToAnalyze = prompt
    setLoading(true)
    setAnalysis(null)
    try {
      const result = await analyzePromptApi(promptToAnalyze)
      setAnalysis(result)
      setActiveTab('xray')
      await loadHistory()
    } catch (error) {
      notify(error instanceof Error && error.message ? error.message : 'Unable to analyze prompt. Make sure the API is running.')
    } finally {
      setLoading(false)
    }
  }, [prompt, notify, loadHistory])

  // ── 7. Non-memoized helpers (don't close over changing state) ────────────
  async function deleteAllHistory() {
    if (!window.confirm('Delete all prompt history? This cannot be undone.')) return
    try {
      await deleteHistoryApi()
      setHistory([])
      historyLoaded.current = true
      notify('History cleared')
    } catch (error) {
      notify(error instanceof Error && error.message ? error.message : 'Unable to delete prompt history.')
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text)
    notify('Copied to clipboard')
  }

  function reuse(item: HistoryItem) {
    setPrompt(item.prompt)
    setAnalysis(null)
    document.querySelector('#analyzer')?.scrollIntoView({ behavior: 'smooth' })
  }

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <main id="top" className="min-h-screen overflow-x-hidden bg-background text-foreground">

      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-40 navbar-glass">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8" aria-label="Primary navigation">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            <a href="#product" className="nav-link px-3">Home</a>
            <a href="#analyzer" className="nav-link px-3">Analyze</a>
            <a href="#history" className="nav-link px-3">History</a>
            <a href="#method" className="nav-link px-3">About</a>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
              <span className="size-1.5 rounded-full bg-green-500" />AI Ready
            </span>
            <ThemeToggle />
            <a href="#analyzer" className="button-primary">Analyze Prompt <ArrowRight className="size-4" /></a>
          </div>
          <button
            className="grid size-11 place-items-center rounded-xl border border-border md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>
        {menuOpen && (
          <div className="menu-enter flex flex-col border-t border-border bg-card/95 backdrop-blur-xl p-5 text-sm">
            <a className="min-h-11 py-3 font-medium text-foreground" href="#product" onClick={() => setMenuOpen(false)}>Home</a>
            <a className="min-h-11 py-3 font-medium text-foreground" href="#analyzer" onClick={() => setMenuOpen(false)}>Analyze</a>
            <a className="min-h-11 py-3 font-medium text-foreground" href="#history" onClick={() => setMenuOpen(false)}>History</a>
            <a className="min-h-11 py-3 font-medium text-foreground" href="#method" onClick={() => setMenuOpen(false)}>About</a>
            <div className="mt-3 flex items-center justify-between gap-3">
              <ThemeToggle />
              <a href="#analyzer" className="button-primary flex-1 justify-center">Analyze Prompt <ArrowRight className="size-4" /></a>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section id="product" className="hero-bg relative px-5 pb-20 pt-32 lg:px-8 lg:pb-24 lg:pt-40">
        <div className="mx-auto max-w-7xl">
          <div className="hero-enter flex flex-col items-center text-center">
            <div className="badge-pill mb-7"><span className="status-dot" />AI Prompt Intelligence · Prompt X-Ray · Enterprise Ready</div>
            <h1 className="mx-auto max-w-4xl text-balance text-5xl font-extrabold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-[4.5rem]">
              Precision Prompting.<br />
              <span className="gradient-text">Professional AI Outcomes.</span>
            </h1>
            <p className="hero-enter-delay mx-auto mt-7 max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
              Turn vague prompts into precise instructions with live diagnostics, executive insight, and a premium AI prompt workspace.
            </p>
            <div className="hero-enter-delay2 mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <a href="#analyzer" className="button-primary px-8 py-3 text-[0.9375rem]">Analyze Prompt <ArrowRight className="size-4" /></a>
              <button
                onClick={() => { setPrompt(examples.Coding); setCategory('Coding'); document.querySelector('#analyzer')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="button-secondary px-8 py-3 text-[0.9375rem]"
              >
                <Sparkles className="size-4" />View Demo
              </button>
            </div>
            <div className="mt-16 grid grid-cols-3 gap-10 border-t border-border/50 pt-12">
              {[['5','AI Signals'],['<2s','Analysis'],['100pt','Score']].map(([v,l]) => (
                <div key={l} className="text-center">
                  <strong className="gradient-text block text-3xl font-extrabold tracking-tight">{v}</strong>
                  <span className="mt-1.5 block text-xs font-medium uppercase tracking-widest text-muted-foreground">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="eyebrow mb-3">Everything you need</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for prompt engineers</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {icon:<BarChart3 className="size-6" />,title:'AI Prompt Scoring',desc:'Get a precise 0–100 quality score across five critical dimensions instantly.'},
              {icon:<Zap className="size-6" />,title:'Prompt Optimization',desc:'Receive an AI-rewritten version of your prompt that performs significantly better.'},
              {icon:<History className="size-6" />,title:'Prompt History',desc:'Every analysis is saved so you can track improvement over time.'},
              {icon:<Sparkles className="size-6" />,title:'Real-time Suggestions',desc:'Actionable recommendations to fix weaknesses in your prompts immediately.'},
              {icon:<Brain className="size-6" />,title:'Smart AI Analysis',desc:'Deep analysis of clarity, context, specificity, constraints, and output format.'},
              {icon:<FileText className="size-6" />,title:'Detailed Reports',desc:'Full intelligence reports with before/after comparisons and dimension breakdowns.'},
            ].map(({icon,title,desc}) => (
              <div key={title} className="feature-card">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Analyzer ── */}
      <section id="analyzer" className="scroll-mt-20 px-4 pb-28 sm:px-6 lg:px-8">
        <div className="product-frame mx-auto max-w-7xl overflow-hidden rounded-2xl border border-border bg-card">
          {/* Toolbar */}
          <div className="flex min-h-[3.5rem] items-center justify-between border-b border-border bg-gradient-to-r from-primary/4 via-transparent to-transparent px-5 py-2">
            <div className="flex items-center gap-3">
              <span className="logo-gradient flex size-7 shrink-0 items-center justify-center rounded-lg shadow-sm shadow-primary/20">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 2.5C7.5 4.5 5.5 7 5.5 10c0 2 1 3.8 2.5 4.8L10 18l2-3.2C13.5 13.8 14.5 12 14.5 10c0-3-2-5.5-4.5-7.5z" fill="white" fillOpacity=".92"/>
                  <circle cx="10" cy="10" r="2" fill="white"/>
                  <circle cx="6" cy="7" r="1" fill="white" fillOpacity=".6"/>
                  <circle cx="14" cy="7" r="1" fill="white" fillOpacity=".6"/>
                </svg>
              </span>
              <div className="flex flex-col leading-none">
                <span className="text-[0.8125rem] font-bold tracking-tight text-foreground">PromptSculpt <span className="gradient-text">AI</span></span>
                <span className="mt-0.5 text-[0.625rem] font-medium tracking-wide text-muted-foreground">AI-Powered Prompt Intelligence</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:flex">
                <span className="size-1.5 rounded-full bg-green-500" />Analysis workspace
              </span>
              <span className="rounded-md border border-primary/15 bg-primary/6 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">LIVE</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[.92fr_1.08fr]">
            {/* Left pane — input */}
            <div className="flex flex-col border-b border-border p-5 lg:min-h-[580px] lg:border-b-0 lg:border-r lg:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="prompt" className="text-sm font-semibold text-foreground">Your Prompt</label>
                  <p id="prompt-help" className="mt-0.5 text-xs text-muted-foreground">Paste a request or pick an example below.</p>
                </div>
                <button onClick={() => setPrompt('')} className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Clear</button>
              </div>
              <textarea
                id="prompt"
                aria-describedby="prompt-help character-count"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runAnalysis() }}
                className="editor mt-4 min-h-52 w-full flex-1 resize-none rounded-xl border border-input bg-background p-4 text-sm leading-7 outline-none"
                placeholder="Describe what you want the AI to do…"
                maxLength={4000}
              />
              <div id="character-count" className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]" title="Keyboard shortcut: Ctrl+Enter or Cmd+Enter to analyze">⌘ Enter to analyze</span>
                <span className={prompt.length > 3600 ? 'text-caution font-medium' : ''}>{prompt.length} / 4000</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Prompt examples">
                {categories.map(item => (
                  <button key={item} onClick={() => { setPrompt(examples[item]); setCategory(item) }} className={`example-chip ${category === item ? 'example-chip-active' : ''}`}>{item}</button>
                ))}
              </div>
              <label className="mt-4 flex flex-col gap-1.5 text-xs font-semibold text-foreground">
                Use case
                <select value={category} onChange={e => setCategory(e.target.value as Category)} className="control font-normal">
                  <option>Marketing</option>
                  <option>Coding</option>
                  <option>Writing</option>
                  <option>Research</option>
                </select>
              </label>
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="button-primary mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-55"
              >
                {loading ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {loading ? 'Analyzing…' : 'Analyze Prompt'}
                <span className="ml-auto hidden font-mono text-[10px] opacity-60 sm:block">⌘ ↵</span>
              </button>
            </div>

            {/* Right pane — results */}
            <div className="min-h-[580px] bg-surface p-5 lg:p-7" aria-live="polite" aria-busy={loading}>
              {loading ? (
                <div className="flex h-full min-h-96 flex-col items-center justify-center gap-5 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full" style={{background:'radial-gradient(circle,rgba(124,58,237,.14) 0%,transparent 65%)',transform:'scale(2)'}} />
                    <div className="flex size-14 items-center justify-center rounded-2xl" style={{background:'linear-gradient(135deg,rgba(124,58,237,.12),rgba(139,92,246,.08))'}}>
                      <Sparkles className="size-6 text-primary" style={{animation:'spin-slow 2.5s linear infinite'}} />
                    </div>
                  </div>
                  <div>
                    <p className="eyebrow">Brand-powered intelligence</p>
                    <h2 className="mt-1.5 text-lg font-bold tracking-tight">Scanning your prompt with precision</h2>
                    <p className="mt-1 min-h-5 text-sm font-medium text-primary transition-all duration-500">{LOAD_MESSAGES[loadStep]}</p>
                  </div>
                  <div className="w-full max-w-[240px]">
                    <div className="mb-2 flex justify-between text-[10px] text-muted-foreground">
                      <span>Processing</span>
                      <span>{Math.round((loadStep / (LOAD_MESSAGES.length - 1)) * 100)}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                      <div className="loading-sweep h-full rounded-full" style={{background:'linear-gradient(90deg,#7C3AED,#8B5CF6)'}} />
                    </div>
                  </div>
                  <div className="grid w-full max-w-[240px] gap-1">
                    {[
                      {l:'Clarity & Intent',   done: loadStep > 1},
                      {l:'Context & Audience', done: loadStep > 3},
                      {l:'Output Format',      done: loadStep > 5},
                    ].map(({l,done}) => (
                      <div key={l} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[11px] transition-colors" style={{color: done ? '#10B981' : '#6B7280'}}>
                        {done ? <CheckCircle2 className="size-3.5 shrink-0" /> : <span className="size-1.5 rounded-full bg-primary" />}{l}
                      </div>
                    ))}
                  </div>
                </div>
              ) : analysis !== null ? (
                <Diagnostic analysis={analysis} activeTab={activeTab} setActiveTab={setActiveTab} prompt={prompt} copyText={copyText} />
              ) : (
                <div className="flex h-full min-h-96 flex-col items-center justify-center gap-4 text-center px-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl" style={{background:'linear-gradient(135deg,rgba(124,58,237,.08),rgba(139,92,246,.05))'}}>
                    <Sparkles className="size-6 text-primary/50" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-foreground">Ready for a premium prompt audit</h2>
                    <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">Enter your prompt and click <strong>Analyze Prompt</strong> to launch the Prompt X-Ray experience.</p>
                  </div>
                  <div className="grid w-full max-w-xs gap-1.5">
                    {[
                      {label: 'Clarity & Intent',     desc: 'How clear is your ask?'},
                      {label: 'Context & Audience',   desc: 'Does the AI know the situation?'},
                      {label: 'Constraints & Format', desc: 'Are success criteria defined?'},
                    ].map(({label,desc}) => (
                      <div key={label} className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left">
                        <span className="size-1.5 shrink-0 rounded-full bg-primary/40" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">{label}</p>
                          <p className="text-[11px] text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Method ── */}
      <section id="method" className="scroll-mt-20 border-y border-border bg-card/35 px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="eyebrow text-primary">The method</p>
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">Better output starts with a better brief.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">PromptSculpt scores the five ingredients that consistently shape useful AI responses.</p>
            </div>
            <div className="grid border-t border-border sm:grid-cols-2">
              {[
                ['01','Clarity','A single, unambiguous objective.'],
                ['02','Context','The situation and audience behind the task.'],
                ['03','Specificity','Concrete details that guide the response.'],
                ['04','Constraints','Boundaries, tone, and success criteria.'],
              ].map(([number,title,copy]) => (
                <article key={number} className="border-b border-border py-6 sm:px-6 sm:first:border-r sm:[&:nth-child(3)]:border-r">
                  <span className="font-mono text-xs text-primary">{number}</span>
                  <h3 className="mt-5 font-medium">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── History ── */}
      <section id="history" className="scroll-mt-20 px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10"><History className="size-5 text-primary" /></div>
                <h2 className="text-2xl font-bold tracking-tight">Prompt History</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Every analysis is saved automatically to your database.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <span className="sr-only">Search prompt history</span>
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search history…" className="control pl-9 min-w-[180px]" />
              </label>
              <select value={filter} onChange={e => setFilter(e.target.value as 'All'|Category)} aria-label="Filter by category" className="control w-auto">
                <option>All</option>
                {categories.map(item => <option key={item}>{item}</option>)}
              </select>
              <button onClick={deleteAllHistory} className="button-secondary px-3 text-xs text-destructive hover:border-destructive/40 hover:bg-destructive/5">
                <Trash2 className="size-4" />Clear All
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {filtered.map(item => (
              <article key={item.id} className="history-row sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="score-badge">{item.score} pts</span>
                    <span className="flex items-center gap-1"><Clock3 className="size-3" />{item.createdAt}</span>
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-foreground">{item.prompt}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.improved}</p>
                </div>
                <button onClick={() => reuse(item)} className="button-secondary min-h-9 px-4 text-xs">Reuse →</button>
              </article>
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted"><Search className="size-6 text-muted-foreground" /></div>
                <p className="mt-4 text-sm font-semibold">No prompts found</p>
                <p className="mt-1 text-sm text-muted-foreground">Analyze a prompt above to see it appear here.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 pb-24 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl p-px" style={{background:'linear-gradient(135deg,#7c3aed,#2563eb)'}}>
          <div className="flex flex-col items-start justify-between gap-7 rounded-3xl bg-card p-8 sm:flex-row sm:items-center sm:p-12">
            <div>
              <p className="eyebrow mb-3">Ready when you are</p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Make your next prompt count.</h2>
              <p className="mt-2 text-muted-foreground">Join developers and creators who write better AI prompts every day.</p>
            </div>
            <a href="#analyzer" className="button-primary whitespace-nowrap px-8 py-3 text-base">Analyze a Prompt <ArrowRight className="size-5" /></a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card/70 px-5 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <Logo />
            <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:text-right">
              <p className="font-medium text-foreground">Built for Hackathon 2026 · Made with AI</p>
              <p>© 2026 PromptSculpt AI · Precise inputs. Better outcomes.</p>
            </div>
            <a href="#top" className="button-secondary min-h-9 px-4 text-xs">↑ Back to top</a>
          </div>
        </div>
      </footer>

      {/* ── Toast notification ── */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="toast-enter fixed bottom-6 left-1/2 z-50 flex min-h-11 -translate-x-1/2 items-center gap-2.5 rounded-xl border border-green-200 bg-card px-5 py-3 text-sm font-semibold text-foreground"
          style={{boxShadow:'0 8px 32px rgba(0,0,0,.1),0 2px 8px rgba(0,0,0,.06)'}}
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-green-100">
            <Check className="size-3.5 text-green-600" />
          </span>
          {notice}
        </div>
      )}
    </main>
  )
}