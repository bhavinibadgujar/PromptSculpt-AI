export type Category = 'Marketing' | 'Coding' | 'Writing' | 'Research'

export type Dimension = {
  label: string
  score: number     // 0–20 raw scale (matches backend)
  maxScore: 20
  note: string
}

export type Analysis = {
  score: number
  grade: string
  dimensions: Dimension[]
  weaknesses: string[]
  suggestions: string[]
  issues: string[]  // combined weaknesses + suggestions for backwards compat
  improved: string
}

type ApiAnalysisResponse = {
  overall_score: number
  scores: Record<string, number>
  weaknesses: string[]
  suggestions: string[]
  improved_prompt: string
}

export type HistoryItem = {
  id: string
  prompt: string
  score: number
  improved: string
  createdAt: string
}

type ApiHistoryItem = {
  id: number
  prompt: string
  overall_score: number
  improved_prompt: string
  created_at: string
}

export const examples: Record<Category, string> = {
  Marketing: 'Write a launch email for our new project management tool for remote creative teams.',
  Coding: 'Build a React component that displays a list of tasks and lets users mark them complete.',
  Writing: 'Write an opening paragraph for a story about a city that never sleeps.',
  Research: 'Summarize the impact of remote work on team productivity.',
}

export const demoAnalysis: Analysis = {
  score: 64,
  grade: 'Developing',
  dimensions: [
    { label: 'Clarity',     score: 15, maxScore: 20, note: 'Is the request easy to interpret?' },
    { label: 'Context',     score: 16, maxScore: 20, note: 'Does the model know the situation?' },
    { label: 'Specificity', score: 16, maxScore: 20, note: 'Are the details concrete enough?' },
    { label: 'Constraints', score: 8,  maxScore: 20, note: 'Are boundaries and requirements set?' },
    { label: 'Structure',   score: 9,  maxScore: 20, note: 'Is the expected output organized?' },
  ],
  weaknesses: [
    'No explicit constraints or success criteria are given.',
    'Add tone, length, and CTA requirements.',
  ],
  suggestions: [
    'Clarify what the launch should make readers do next.',
    'Specify the audience and their level of familiarity with the product.',
  ],
  issues: [
    'No explicit constraints or success criteria are given.',
    'Add tone, length, and CTA requirements.',
    'Clarify what the launch should make readers do next.',
    'Specify the audience and their level of familiarity with the product.',
  ],
  improved: 'Act as a senior conversion copywriter. Create a launch email for our new project management tool for remote creative teams.\n\nAudience: Creative directors and producers managing distributed teams.\nGoal: Drive one clear next action: start a free trial.\nTone: Confident, concise, and human. Avoid hype.\nOutput: Provide 3 subject lines, a preview line, and a 150-word email with one CTA.',
}

const scoreLabels: Record<string, { label: string; note: string }> = {
  clarity:      { label: 'Clarity',     note: 'Is the request easy to interpret?' },
  context:      { label: 'Context',     note: 'Does the model know the situation?' },
  specificity:  { label: 'Specificity', note: 'Are the details concrete enough?' },
  constraints:  { label: 'Constraints', note: 'Are boundaries and requirements set?' },
  output_format:{ label: 'Structure',   note: 'Is the expected output organized?' },
}

function toGrade(score: number) {
  return score >= 85 ? 'Excellent' : score >= 70 ? 'Strong' : score >= 55 ? 'Developing' : 'Needs work'
}

// Use environment variable so the app works outside localhost.
// Create frontend/.env.local with: NEXT_PUBLIC_API_URL=http://localhost:8001
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8001'

export async function analyzePromptApi(prompt: string): Promise<Analysis> {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    let message = 'Analysis failed with status ' + response.status
    try {
      const errorBody = await response.json()
      if (typeof errorBody.detail === 'string') message = errorBody.detail
    } catch {}
    throw new Error(message)
  }

  const data = (await response.json()) as ApiAnalysisResponse

  // Keep raw 0–20 scores (matches backend scale); bar width computed as score/maxScore*100%
  const dimensions: Dimension[] = Object.entries(scoreLabels).map(([key, meta]) => ({
    ...meta,
    score: data.scores[key] ?? 0,
    maxScore: 20,
  }))

  return {
    score: data.overall_score,
    grade: toGrade(data.overall_score),
    dimensions,
    weaknesses: data.weaknesses,
    suggestions: data.suggestions,
    issues: [...data.weaknesses, ...data.suggestions],
    improved: data.improved_prompt,
  }
}

function formatCreatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export async function fetchHistoryApi(): Promise<HistoryItem[]> {
  const response = await fetch(`${API_BASE}/api/history`)

  if (!response.ok) {
    throw new Error('Unable to load prompt history.')
  }

  const data = (await response.json()) as ApiHistoryItem[]
  return data.map(item => ({
    id: String(item.id),
    prompt: item.prompt,
    score: item.overall_score,
    improved: item.improved_prompt,
    createdAt: formatCreatedAt(item.created_at),
  }))
}

export async function deleteHistoryApi(): Promise<void> {
  const response = await fetch(`${API_BASE}/api/history`, { method: 'DELETE' })

  if (!response.ok) {
    throw new Error('Unable to delete prompt history.')
  }
}