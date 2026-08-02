import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'
import { ThemeScript } from '@/components/theme-script'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'PromptSculpt AI | Prompt X-Ray',
  description: 'Analyze, score, and optimize AI prompts with premium prompt intelligence, live diagnostics, and actionable Prompt X-Ray insights.',
  generator: 'PromptSculpt AI',
  keywords: ['prompt engineering', 'AI prompt analyzer', 'prompt optimization', 'LLM', 'ChatGPT prompts', 'prompt x-ray'],
  metadataBase: new URL('https://promptsculpt.ai'),
  openGraph: {
    title: 'PromptSculpt AI | Prompt X-Ray',
    description: 'A premium AI prompt intelligence workspace for analyzing and improving prompts.',
    url: 'https://promptsculpt.ai',
    siteName: 'PromptSculpt AI',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'PromptSculpt AI Prompt X-Ray' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PromptSculpt AI | Prompt X-Ray',
    description: 'Premium AI prompt intelligence for professional prompt engineering.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-svg', media: '(prefers-color-scheme: light)' },
      { url: '/icon.svg', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/icon.svg',
  },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#0b1020',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-background">
      <head>
        <ThemeScript />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            {children}
          </div>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
