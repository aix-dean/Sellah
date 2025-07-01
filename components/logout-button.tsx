"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"
import { useLogout } from "@/hooks/use-logout"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
  onLogoutStart?: () => void
  onLogoutComplete?: () => void
  onLogoutError?: (error: string) => void
}

export function LogoutButton({
  variant = "destructive",
  size = "default",
  className = "",
  showIcon = true,
  children,
  onLogoutStart,
  onLogoutComplete,
  onLogoutError,
}: LogoutButtonProps) {
  const { logout, isLoggingOut, logoutError } = useLogout()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleLogout = async () => {
    try {
      onLogoutStart?.()
      await logout()
      onLogoutComplete?.()
    } catch (error: any) {
      onLogoutError?.(error.message || "Failed to logout")
    }
  }

  const handleConfirmLogout = () => {
    setShowConfirm(false)
    handleLogout()
  }

  if (showConfirm) {
    return (
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)} disabled={isLoggingOut}>
          Cancel
        </Button>
        <Button variant="destructive" size="sm" onClick={handleConfirmLogout} disabled={isLoggingOut}>
          {isLoggingOut ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging out...
            </>
          ) : (
            "Confirm Logout"
          )}
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => setShowConfirm(true)}
      disabled={isLoggingOut}
    >
      {showIcon && <LogOut className="w-4 h-4 mr-2" />}
      {children || "Logout"}
    </Button>
  )
}
