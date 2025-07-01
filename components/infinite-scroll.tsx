"use client"

import type React from "react"

import { useEffect, useRef, useCallback } from "react"

interface InfiniteScrollProps {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
  threshold?: number
  children: React.ReactNode
}

export function InfiniteScroll({ hasMore, loading, onLoadMore, threshold = 200, children }: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !loading) {
        onLoadMore()
      }
    },
    [hasMore, loading, onLoadMore],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    })

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [handleIntersection, threshold])

  return (
    <>
      {children}
      {hasMore && (
        <div ref={sentinelRef} className="h-4 flex items-center justify-center">
          {loading && <div className="text-sm text-gray-500">Loading more...</div>}
        </div>
      )}
    </>
  )
}
