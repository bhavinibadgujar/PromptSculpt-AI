import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

import "./globals.css";
import { ThemeScript } from "@/components/theme-script";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "PromptSculpt AI | Prompt X-Ray",
  description:
    "Analyze, score, and optimize AI prompts with premium prompt intelligence, live diagnostics, and actionable Prompt X-Ray insights.",

  applicationName: "PromptSculpt AI",
  generator: "PromptSculpt AI",

  keywords: [
    "PromptSculpt AI",
    "Prompt X-Ray",
    "AI Prompt Analyzer",
    "Prompt Engineering",
    "Prompt Optimization",
    "ChatGPT",
    "Gemini",
    "Claude",
    "LLM",
  ],

  openGraph: {
    title: "PromptSculpt AI | Prompt X-Ray",
    description:
      "Analyze, score, and optimize AI prompts with premium prompt intelligence.",
    type: "website",
    siteName: "PromptSculpt AI",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "PromptSculpt AI",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "PromptSculpt AI | Prompt X-Ray",
    description:
      "Analyze, score, and optimize AI prompts with PromptSculpt AI.",
    images: ["/og-image.svg"],
  },

  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
    shortcut: "/icon.svg",
  },

  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: "#0b1020",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="bg-background"
    >
      <head>
        <ThemeScript />
      </head>

      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            {children}
          </div>
        </ThemeProvider>

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}