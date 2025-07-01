import type React from "react"
import { ProtectedPageWrapper } from "@/components/auth/protected-page-wrapper"

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedPageWrapper>{children}</ProtectedPageWrapper>
}
