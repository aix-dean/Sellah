import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { BackNavigationGuard } from "@/components/auth/back-navigation-guard"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sellah",
  description: "Secure login with Firebase Authentication",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  other: {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <BackNavigationGuard />
      </body>
    </html>
  )
}
