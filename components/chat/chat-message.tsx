"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ChatMessage as Message } from "@/types/chat"

interface ChatMessageProps {
  message: Message
  isCurrentUser: boolean
}

export function ChatMessage({ message, isCurrentUser }: ChatMessageProps) {
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const messageContent = message.content || ""
  const messageTimestamp = formatMessageTime(message.timestamp)

  return (
    <div className={`flex items-end gap-2 mb-4 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
      {!isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={`/placeholder.svg?text=${message.senderId.substring(0, 2)}`} />
          <AvatarFallback>{message.senderId.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`flex flex-col max-w-[70%] p-3 rounded-lg ${
          isCurrentUser ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-100 text-gray-800 rounded-bl-none"
        }`}
      >
        {message.type === "IMAGE" && message.imageUrl ? (
          <img src={message.imageUrl || "/placeholder.svg"} alt="Sent image" className="max-w-full h-auto rounded-md" />
        ) : (
          <p className="text-sm break-words">{messageContent}</p>
        )}
        <span className={`text-xs mt-1 ${isCurrentUser ? "text-blue-200" : "text-gray-500"} self-end`}>
          {messageTimestamp}
        </span>
      </div>
      {isCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={`/placeholder.svg?text=${message.senderId.substring(0, 2)}`} />
          <AvatarFallback>{message.senderId.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
