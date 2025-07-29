"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Paperclip, Send, Info, FileIcon, ImageIcon, FileAudio, FileVideo } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { ChatMessage, ChatThread } from "@/types/chat"
import { format } from "date-fns"

interface ChatWindowProps {
  messages: ChatMessage[]
  activeThread: ChatThread | null
  loadingMessages: boolean
  sendingMessage: boolean
  currentUserId: string
  onSendMessage: (content: string, file?: File | null) => void
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  imagePreviewUrl: string | null
  uploadError: string | null
}

export function ChatWindow({
  messages,
  activeThread,
  loadingMessages,
  sendingMessage,
  currentUserId,
  onSendMessage,
  onFileSelect,
  selectedFile,
  imagePreviewUrl,
  uploadError,
}: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    onSendMessage(messageInput, selectedFile)
    setMessageInput("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files?.[0] || null)
  }

  // Get file icon based on file type
  const getFileIcon = (fileType: string | undefined) => {
    if (!fileType) return <FileIcon className="h-4 w-4" />

    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType.startsWith("audio/")) return <FileAudio className="h-4 w-4" />
    if (fileType.startsWith("video/")) return <FileVideo className="h-4 w-4" />

    return <FileIcon className="h-4 w-4" />
  }

  // Helper function to format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return ""

    const units = ["B", "KB", "MB", "GB"]
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  // Helper function to convert URLs in text to clickable links
  const linkifyText = (text: string): React.ReactNode => {
    const urlRegex = /(https?:\/\/[^\s]+)/g

    if (!text.match(urlRegex)) {
      return text
    }

    const parts = text.split(urlRegex)
    const elements = []

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Text part
        if (parts[i]) {
          elements.push(parts[i])
        }
      }
    }

    return elements
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
        <div className="flex items-center">
          <Avatar className="h-12 w-12 mr-3">
            <AvatarImage src={activeThread?.seller_photo || "/placeholder.svg?height=48&width=48&query=user"} />
            <AvatarFallback>{(activeThread?.receiver_name || "User").substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium text-lg">{activeThread?.receiver_name || "Select a conversation"}</h2>
            <p className="text-sm text-gray-500">Offline</p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <Info className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-grow p-4">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">No messages yet. Start a conversation!</div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isCurrentUser = msg.senderId === currentUserId
              const timestamp = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp)
              return (
                <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`px-4 py-2 rounded-lg max-w-xs md:max-w-md ${
                      isCurrentUser
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-200 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    {/* Show image directly if it's an image file */}
                    {msg.fileUrl && msg.fileType?.startsWith("image/") && (
                      <div className="mb-2">
                        <div className="relative rounded-md overflow-hidden" style={{ maxWidth: "250px" }}>
                          <img
                            src={msg.fileUrl || "/placeholder.svg"}
                            alt={msg.fileName || "Attached image"}
                            className="max-w-full object-cover rounded-md"
                            style={{ maxHeight: "250px" }}
                            onError={(e) => {
                              console.error("Image failed to load:", msg.fileUrl)
                              e.currentTarget.src = "/placeholder.svg?height=250&width=250"
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Show other file types as before */}
                    {msg.fileUrl && !msg.fileType?.startsWith("image/") && (
                      <div className="mb-2">
                        {msg.fileType?.startsWith("video/") ? (
                          <div className="rounded-lg overflow-hidden mb-1 bg-blue-500 p-1">
                            <div className="relative rounded-md overflow-hidden">
                              <video
                                src={msg.fileUrl}
                                className="max-w-full w-full rounded-t-md"
                                style={{ maxHeight: "250px" }}
                                controls
                                preload="metadata"
                                playsInline
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  console.error("Video failed to load:", msg.fileUrl)
                                  e.currentTarget.poster = "/placeholder.svg?height=250&width=250"
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                            <div className="px-2 py-1 text-xs text-white">{msg.fileName || "video.mp4"}</div>
                          </div>
                        ) : msg.fileType?.startsWith("audio/") ? (
                          <div className="rounded-md overflow-hidden mb-1 bg-black bg-opacity-5 p-2">
                            <audio controls className="w-full">
                              <source src={msg.fileUrl} type={msg.fileType} />
                              Your browser does not support the audio element.
                            </audio>
                            <div className="text-xs mt-1 truncate">{msg.fileName || "Audio file"}</div>
                          </div>
                        ) : msg.fileType?.includes("pdf") ? (
                          <div className="flex flex-col p-2 bg-black bg-opacity-10 rounded-md mb-1">
                            <div className="flex items-center mb-1">
                              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 18h12V6h-4V2H4v16zm8-13v3h3l-3-3zM3 0h10l5 5v14a1 1 0 01-1 1H3a1 1 0 01-1-1V1a1 1 0 011-1z" />
                              </svg>
                              <span className="text-sm font-medium truncate">{msg.fileName || "PDF Document"}</span>
                            </div>
                            <div className="flex space-x-2">
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                              >
                                Download
                              </a>
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                              >
                                View
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col p-2 bg-black bg-opacity-10 rounded-md mb-1">
                            <div className="flex items-center mb-1">
                              {getFileIcon(msg.fileType)}
                              <span className="text-sm font-medium truncate ml-2">{msg.fileName || "Attachment"}</span>
                            </div>
                            <div className="text-xs text-gray-500 mb-1">
                              {formatFileSize(msg.fileSize) || "Unknown size"}
                            </div>
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 self-start"
                            >
                              Download
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show text content */}
                    {msg.content && (
                      <p className="break-words whitespace-pre-wrap overflow-wrap-anywhere">
                        {linkifyText(msg.content)}
                      </p>
                    )}

                    <div className={`text-xs mt-1 ${isCurrentUser ? "text-blue-200" : "text-gray-500"}`}>
                      {format(timestamp, "p")}
                      {isCurrentUser && <span className="ml-2">{msg.read ? "✓✓" : "✓"}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message input */}
      <div
        className="border-t p-3 flex-shrink-0 bg-white"
        style={{ height: selectedFile ? (imagePreviewUrl ? "150px" : "90px") : "70px" }}
      >
        {uploadError && (
          <div className="mb-2 px-3 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-md">{uploadError}</div>
        )}
        <form onSubmit={handleSend} className="flex flex-col h-full">
          {/* Selected file preview */}
          {selectedFile && (
            <div className="flex items-center mb-2 bg-gray-50 rounded px-2 py-1">
              <div className="flex-1 flex items-center">
                {imagePreviewUrl ? (
                  <div className="mr-2 h-10 w-10 rounded overflow-hidden">
                    <img
                      src={imagePreviewUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mr-2 h-6 w-6 flex items-center justify-center">{getFileIcon(selectedFile.type)}</div>
                )}
                <div className="text-sm truncate">{selectedFile.name}</div>
              </div>
              <button
                type="button"
                className="ml-2 text-gray-500 hover:text-red-500"
                onClick={() => onFileSelect(null)}
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf,video/*,audio/*"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-gray-700 mr-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={selectedFile ? "Add a caption (optional)" : "Write your message..."}
              className="flex-1 py-2 px-3 bg-gray-100 rounded-full focus:outline-none"
            />
            <Button
              type="submit"
              disabled={(!messageInput.trim() && !selectedFile) || sendingMessage}
              className={`ml-2 p-2 rounded-full ${
                (messageInput.trim() || selectedFile) && !sendingMessage
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {sendingMessage ? (
                <div className="h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
