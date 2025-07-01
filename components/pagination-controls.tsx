"use client"

import { Button } from "@/components/ui/button"
import { Loader2, ChevronDown } from "lucide-react"

interface PaginationControlsProps {
  hasMore: boolean
  loading: boolean
  totalLoaded: number
  onLoadMore: () => void
  onRefresh?: () => void
  className?: string
}

export function PaginationControls({
  hasMore,
  loading,
  totalLoaded,
  onLoadMore,
  onRefresh,
  className = "",
}: PaginationControlsProps) {
  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Load More Button */}
      {hasMore && (
        <Button
          onClick={onLoadMore}
          disabled={loading}
          variant="outline"
          className="flex items-center space-x-2 min-w-[140px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>Load More</span>
            </>
          )}
        </Button>
      )}

      {/* Status Text */}
      <div className="text-sm text-gray-500 text-center">
        {totalLoaded > 0 && (
          <p>
            Showing {totalLoaded} item{totalLoaded !== 1 ? "s" : ""}
            {!hasMore && totalLoaded > 0 && " (all loaded)"}
          </p>
        )}
      </div>

      {/* Refresh Button */}
      {onRefresh && totalLoaded > 0 && (
        <Button
          onClick={onRefresh}
          disabled={loading}
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
        >
          Refresh
        </Button>
      )}
    </div>
  )
}
