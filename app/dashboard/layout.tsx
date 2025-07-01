import type React from "react"
import { ProtectedPageWrapper } from "@/components/auth/protected-page-wrapper"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPageWrapper>{children}</ProtectedPageWrapper>
}
