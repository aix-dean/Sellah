"use client"

import { useState, useCallback } from "react"

interface UseAnimatedSuccessReturn {
  showSuccessAnimation: boolean
  successMessage: string
  isSuccessVisible: boolean
  showAnimatedSuccess: (message: string) => void
  clearSuccess: () => void
}

export function useAnimatedSuccess(): UseAnimatedSuccessReturn {
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [isSuccessVisible, setIsSuccessVisible] = useState(false)

  const showAnimatedSuccess = useCallback((message: string) => {
    setSuccessMessage(message)
    setShowSuccessAnimation(true)
    setIsSuccessVisible(true)

    // Start fade out after 2 seconds
    setTimeout(() => {
      setIsSuccessVisible(false)
      // Remove from DOM after fade out completes
      setTimeout(() => {
        setShowSuccessAnimation(false)
        setSuccessMessage("")
      }, 300) // Match the CSS transition duration
    }, 2000)
  }, [])

  const clearSuccess = useCallback(() => {
    setIsSuccessVisible(false)
    setTimeout(() => {
      setShowSuccessAnimation(false)
      setSuccessMessage("")
    }, 300)
  }, [])

  return {
    showSuccessAnimation,
    successMessage,
    isSuccessVisible,
    showAnimatedSuccess,
    clearSuccess,
  }
}
