"use client"
import type React from "react"
import { usePathname } from "next/navigation"
import ProtectedPageWrapper from "@/components/auth/protected-page-wrapper"
import DashboardLayout from "@/components/dashboard-layout"

export default function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isAccountPage = pathname === "/dashboard/account"
  const isUpgradePage = pathname === "/dashboard/account/upgrade"
  return (
    <ProtectedPageWrapper>
      {isAccountPage && isUpgradePage ? children : <DashboardLayout>{children}</DashboardLayout>}
    </ProtectedPageWrapper>
  )
}
