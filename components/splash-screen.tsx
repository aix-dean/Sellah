import React from "react"

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-gray-900 transition-opacity duration-500">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500 mx-auto mb-4"></div>
        <p className="text-xl text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  )
}