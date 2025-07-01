"use client"

import { Button } from "@/components/ui/button"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { forceLogout } from "@/lib/auth"

interface SessionTimeoutHandlerProps {
  timeoutMinutes?: number
  warningMinutes?: number
}

export function SessionTimeoutHandler({ timeoutMinutes = 60, warningMinutes = 5 }: SessionTimeoutHandlerProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let warningTimeoutId: NodeJS.Timeout
    let countdownInterval: NodeJS.Timeout

    const resetTimers = () => {
      clearTimeout(timeoutId)
      clearTimeout(warningTimeoutId)
      clearInterval(countdownInterval)
      setShowWarning(false)

      // Set warning timer
      warningTimeoutId = setTimeout(
        () => {
          setShowWarning(true)
          setTimeLeft(warningMinutes * 60)

          // Start countdown
          countdownInterval = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                forceLogout()
                return 0
              }
              return prev - 1
            })
          }, 1000)
        },
        (timeoutMinutes - warningMinutes) * 60 * 1000,
      )

      // Set logout timer
      timeoutId = setTimeout(
        () => {
          forceLogout()
        },
        timeoutMinutes * 60 * 1000,
      )
    }

    const handleUserActivity = () => {
      if (auth.currentUser) {
        resetTimers()
      }
    }

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        resetTimers()
      } else {
        clearTimeout(timeoutId)
        clearTimeout(warningTimeoutId)
        clearInterval(countdownInterval)
        setShowWarning(false)
      }
    })

    // Add event listeners for user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, true)
    })

    return () => {
      unsubscribe()
      clearTimeout(timeoutId)
      clearTimeout(warningTimeoutId)
      clearInterval(countdownInterval)
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity, true)
      })
    }
  }, [timeoutMinutes, warningMinutes])

  const extendSession = () => {
    setShowWarning(false)
    // This will trigger the activity handler and reset timers
    document.dispatchEvent(new Event("mousedown"))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Timeout Warning</h3>
          <p className="text-gray-600 mb-4">
            Your session will expire in <strong>{formatTime(timeLeft)}</strong>. Would you like to extend your session?
          </p>
          <div className="flex space-x-3 justify-end">
            <Button onClick={() => forceLogout()} variant="outline" className="w-full sm:w-auto">
              Logout Now
            </Button>
            <Button onClick={extendSession} className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto">
              Extend Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
