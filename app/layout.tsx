import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import BackNavigationGuard from "@/components/auth/back-navigation-guard"
import PageVisibilityDetector from "@/components/auth/page-visibility-detector"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VRC - Sellah",
  description: "Business management platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <BackNavigationGuard />
          <PageVisibilityDetector />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
