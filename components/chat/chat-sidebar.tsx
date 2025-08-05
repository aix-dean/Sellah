"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import type { ChatThread } from "@/types/chat"

interface ChatSidebarProps {
  threads: ChatThread[]
  loading: boolean
  selectedThreadId?: string
  onSelectThread: (thread: ChatThread) => void
  currentUserId: string
}

export function ChatSidebar({ threads, loading, selectedThreadId, onSelectThread, currentUserId }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Helper function to safely extract text from different message formats
  const getLastMessageText = (lastMessage: any): string => {
    if (typeof lastMessage === "string") {
      return lastMessage
    }
    if (lastMessage && typeof lastMessage === "object") {
      if (typeof lastMessage.text === "string") return lastMessage.text
      if (typeof lastMessage.content === "string") return lastMessage.content
      if (lastMessage.type === "IMAGE") return "Sent an image"
      if (lastMessage.type === "FILE") return "Sent a file"
      if (lastMessage.type === "VIDEO") return "Sent a video"
      if (lastMessage.type === "AUDIO") return "Sent an audio"
    }
    return "No messages yet"
  }

  // Format timestamp
  const formatThreadTime = (timestamp: any) => {
    if (!timestamp) return ""

    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)

    // If today, show time only
    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    // If this year, show month and day
    if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }

    // Otherwise show full date
    return date.toLocaleDateString()
  }

  // Filter threads based on search query
  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    const threadName = thread.name?.toLowerCase() || ""
    const receiverName = thread.receiver_name?.toLowerCase() || ""
    const lastMessageText = getLastMessageText(thread.lastMessage).toLowerCase()

    return threadName.includes(query) || receiverName.includes(query) || lastMessageText.includes(query)
  })

  return (
    <div className="w-80 border-r flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-4">Messages</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1">
        {loading ? (
          // Loading skeletons
          Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border-b">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))
        ) : filteredThreads.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? "No conversations match your search" : "No conversations yet"}
          </div>
        ) : (
          filteredThreads.map((thread) => {
            // Get the other participant's ID for fallback if receiver_name is not set
            const otherParticipantId = thread.participants.find((id) => id !== currentUserId) || "Unknown"
            const lastMessageText = getLastMessageText(thread.lastMessage)

            return (
              <button
                key={thread.id}
                className={`flex items-center gap-3 p-3 w-full text-left hover:bg-gray-100 border-b ${
                  thread.id === selectedThreadId ? "bg-gray-100" : ""
                }`}
                onClick={() => onSelectThread(thread)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={thread.seller_photo || `/placeholder.svg?text=${otherParticipantId.substring(0, 2)}`}
                  />
                  <AvatarFallback>
                    {(thread.receiver_name || otherParticipantId).substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{thread.receiver_name || otherParticipantId}</h3>
                    {thread.lastMessageTimestamp && (
                      <span className="text-xs text-gray-500">{formatThreadTime(thread.lastMessageTimestamp)}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{lastMessageText}</p>
                </div>
              </button>
            )
          })
        )}
      </ScrollArea>

      <div className="p-4 border-t">
        <Button className="w-full">New Conversation</Button>
      </div>
    </div>
  )
}
