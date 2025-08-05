"use client"

import { useState, useEffect } from "react"
import { ChatService } from "../lib/chat-service"
import type { ChatThread, ChatMessage } from "../types/chat"

// Renamed from useChat to useThreads but keeping the old name for backward compatibility
export function useChat(userId: string) {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    console.log("Setting up threads subscription for user:", userId)

    const unsubscribe = ChatService.subscribeToThreads(userId, (newThreads) => {
      console.log(`Received ${newThreads.length} threads for user ${userId}`)
      setThreads(newThreads)
      setLoading(false)
    })

    return () => {
      console.log("Cleaning up threads subscription")
      unsubscribe()
    }
  }, [userId])

  return { threads, loading, error }
}

// Also provide the new name for better semantics
export function useThreads(userId: string) {
  return useChat(userId)
}

// Renamed from useChatMessages to useMessages but keeping the old name for backward compatibility
export function useChatMessages(threadId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!threadId) {
      setMessages([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Normalize the thread ID (remove /threads/ prefix if present)
    const normalizedThreadId = threadId.includes("/threads/") ? threadId.split("/threads/")[1] : threadId

    console.log(`Subscribing to messages for thread: ${normalizedThreadId}`)

    const unsubscribe = ChatService.subscribeToMessages(normalizedThreadId, (newMessages) => {
      console.log(`Received ${newMessages.length} messages for thread ${normalizedThreadId}`)
      setMessages(newMessages)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [threadId])

  const sendMessage = async ({
    threadId,
    content,
    senderId,
  }: {
    threadId: string
    content: string
    senderId: string
  }) => {
    if (!threadId) {
      throw new Error("Thread ID is required")
    }

    try {
      // Normalize the thread ID
      const normalizedThreadId = threadId.includes("/threads/") ? threadId.split("/threads/")[1] : threadId

      await ChatService.sendMessage(normalizedThreadId, senderId, content)
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  return { messages, loading, error, sendMessage }
}

// Also provide the new name for better semantics
export function useMessages(threadId: string | null) {
  return useChatMessages(threadId)
}

export function useThread(threadId: string | null) {
  const [thread, setThread] = useState<ChatThread | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!threadId) {
      setThread(null)
      setLoading(false)
      return
    }

    setLoading(true)

    ChatService.getThread(threadId).then((threadData) => {
      setThread(threadData)
      setLoading(false)
    })
  }, [threadId])

  return { thread, loading }
}
