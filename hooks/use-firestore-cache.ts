"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface CacheEntry<T> {
  data: T
  timestamp: number
  loading: boolean
  error: string | null
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  staleWhileRevalidate?: boolean
  forceRefresh?: boolean
}

class FirestoreCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      loading: false,
      error: null,
    })
  }

  get<T>(key: string, ttl?: number): CacheEntry<T> | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const age = Date.now() - entry.timestamp
    const maxAge = ttl || this.defaultTTL

    if (age > maxAge) {
      this.cache.delete(key)
      return null
    }

    return entry as CacheEntry<T>
  }

  setLoading(key: string, loading: boolean): void {
    const entry = this.cache.get(key)
    if (entry) {
      entry.loading = loading
    } else {
      this.cache.set(key, {
        data: null,
        timestamp: Date.now(),
        loading,
        error: null,
      })
    }
  }

  setError(key: string, error: string): void {
    const entry = this.cache.get(key)
    if (entry) {
      entry.error = error
      entry.loading = false
    } else {
      this.cache.set(key, {
        data: null,
        timestamp: Date.now(),
        loading: false,
        error,
      })
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }
}

export const firestoreCache = new FirestoreCache()

export function useFirestoreQuery<T>(key: string, queryFn: () => Promise<T>, options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true, forceRefresh = false } = options
  const [state, setState] = useState<CacheEntry<T>>(() => {
    const cached = firestoreCache.get<T>(key, ttl)
    return (
      cached || {
        data: null,
        timestamp: 0,
        loading: true,
        error: null,
      }
    )
  })

  const queryFnRef = useRef(queryFn)
  queryFnRef.current = queryFn

  const executeQuery = useCallback(
    async (bypassCache = false) => {
      const cached = firestoreCache.get<T>(key, ttl)

      if (cached && !bypassCache && !forceRefresh) {
        setState(cached)
        if (!staleWhileRevalidate) return cached.data
      }

      try {
        firestoreCache.setLoading(key, true)
        setState((prev) => ({ ...prev, loading: true, error: null }))

        const data = await queryFnRef.current()

        firestoreCache.set(key, data, ttl)
        const newState = {
          data,
          timestamp: Date.now(),
          loading: false,
          error: null,
        }
        setState(newState)

        return data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        firestoreCache.setError(key, errorMessage)
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }))
        throw error
      }
    },
    [key, ttl, staleWhileRevalidate, forceRefresh],
  )

  useEffect(() => {
    executeQuery(forceRefresh)
  }, [executeQuery, forceRefresh])

  const refetch = useCallback(() => executeQuery(true), [executeQuery])
  const invalidate = useCallback(() => firestoreCache.invalidate(key), [key])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
    invalidate,
  }
}
