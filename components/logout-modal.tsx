"use client"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2, X } from "lucide-react"
import { useLogout } from "@/hooks/use-logout"

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
}

export function LogoutModal({
  isOpen,
  onClose,
  title = "Confirm Logout",
  message = "Are you sure you want to logout? You will need to sign in again to access your account.",
}: LogoutModalProps) {
  const { logout, isLoggingOut } = useLogout()

  const handleLogout = async () => {
    try {
      await logout()
      onClose()
    } catch (error) {
      console.error("Logout failed:", error)
      // Modal will stay open to show error or retry
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoggingOut}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isLoggingOut} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
