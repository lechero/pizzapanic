import Link from "next/link"
import { Pizza } from "lucide-react"
import { Geist_Mono, Montserrat } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        montserrat.variable
      )}
    >
      <body>
        <ThemeProvider>
          <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <nav
              aria-label="Main"
              className="mx-auto flex h-14 w-full max-w-[96rem] items-center px-4 sm:px-6 lg:px-8"
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-semibold tracking-normal"
              >
                <span className="grid size-8 place-items-center border border-border bg-muted">
                  <Pizza className="size-4" aria-hidden="true" />
                </span>
                <span>Pizza Panic</span>
              </Link>
            </nav>
          </header>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
