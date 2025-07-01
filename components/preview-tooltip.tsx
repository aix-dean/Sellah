"use client"

import React from "react"
import { Info } from "lucide-react"

interface PreviewTooltipProps {
  children: React.ReactNode
}

export function PreviewTooltip({ children }: PreviewTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)} className="cursor-help">
        {children}
      </div>

      {isVisible && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-10">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">Live Preview</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Updates automatically as you fill out the form</li>
                <li>• Shows exactly how customers will see your product</li>
                <li>• Includes images, pricing, and all product details</li>
                <li>• Navigate through uploaded images using the dots</li>
                <li>• Preview updates across all form steps</li>
              </ul>
            </div>
          </div>

          {/* Arrow pointing down */}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-200"></div>
        </div>
      )}
    </div>
  )
}
