export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const storageKey = 'theme'
              const stored = localStorage.getItem(storageKey)
              const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
              const theme = stored === 'dark' || stored === 'light' ? stored : (systemPrefersDark ? 'dark' : 'light')
              const root = document.documentElement
              root.classList.toggle('dark', theme === 'dark')
              root.style.colorScheme = theme
              const color = theme === 'dark' ? '#0b1020' : '#f8fafc'
              const meta = document.querySelector('meta[name="theme-color"]')
              if (meta) meta.setAttribute('content', color)
              document.body.style.backgroundColor = color
            } catch (e) {}
          })();
        `,
      }}
    />
  )
}
