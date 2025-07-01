"use client"

import { useState, useCallback } from "react"
import {
  type Query,
  type QueryDocumentSnapshot,
  type DocumentData,
  limit,
  startAfter,
  getDocs,
  query,
} from "firebase/firestore"

export interface PaginationConfig {
  pageSize: number
  initialLoad?: boolean
}

export interface PaginationState<T> {
  data: T[]
  loading: boolean
  error: string | null
  hasMore: boolean
  currentPage: number
  totalLoaded: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  reset: () => void
}

export function useFirestorePagination<T>(
  baseQuery: Query<DocumentData>,
  transform: (doc: QueryDocumentSnapshot<DocumentData>) => T,
  config: PaginationConfig,
): PaginationState<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)

  const loadPage = useCallback(
    async (isRefresh = false) => {
      if (loading) return

      setLoading(true)
      setError(null)

      try {
        let paginatedQuery = baseQuery

        // Apply pagination constraints
        if (!isRefresh && lastDoc) {
          paginatedQuery = query(baseQuery, startAfter(lastDoc), limit(config.pageSize))
        } else {
          paginatedQuery = query(baseQuery, limit(config.pageSize))
        }

        const snapshot = await getDocs(paginatedQuery)
        const newItems = snapshot.docs.map(transform)

        if (isRefresh) {
          setData(newItems)
          setCurrentPage(1)
        } else {
          setData((prev) => [...prev, ...newItems])
          setCurrentPage((prev) => prev + 1)
        }

        // Update pagination state
        const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null
        setLastDoc(newLastDoc)
        setHasMore(snapshot.docs.length === config.pageSize)
      } catch (err) {
        console.error("Error loading paginated data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    },
    [baseQuery, transform, config.pageSize, lastDoc, loading],
  )

  const loadMore = useCallback(() => loadPage(false), [loadPage])

  const refresh = useCallback(async () => {
    setLastDoc(null)
    setHasMore(true)
    await loadPage(true)
  }, [loadPage])

  const reset = useCallback(() => {
    setData([])
    setLastDoc(null)
    setHasMore(true)
    setCurrentPage(0)
    setError(null)
  }, [])

  return {
    data,
    loading,
    error,
    hasMore,
    currentPage,
    totalLoaded: data.length,
    loadMore,
    refresh,
    reset,
  }
}
