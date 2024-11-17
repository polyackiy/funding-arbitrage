import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/components/theme/theme-provider"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { NavigationMenu } from "@/components/navigation-menu"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Arbitrage Tools',
  description: 'Cryptocurrency funding rate arbitrage platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            <header className="border-b">
              <div className="container flex h-16 items-center justify-between px-4">
                <NavigationMenu />
                <ThemeToggle />
              </div>
            </header>
            <main className="container py-6 px-4">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
