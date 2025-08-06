"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { ChatSidebar } from "@/components/chat/chat-sidebar"
import { ChatWindow } from "@/components/chat/chat-window"
import type { ChatThread, ChatMessage } from "@/types/chat"
import { ChatService } from "@/lib/chat-service"
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Define UploadProgress type
interface UploadProgress {
  progress: number
  error?: string
  downloadUrl?: string
}

// Ensure page starts at the top when first loaded
const useScrollToTop = (params?: { id?: string }) => {
  useEffect(() => {
    // Scroll to top when component first mounts or thread changes
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" })

      // Also scroll the messages container to top if it exists
      setTimeout(() => {
        const messagesContainer = document.querySelector('[style*="maxHeight"]')
        if (messagesContainer) {
          messagesContainer.scrollTop = 0
        }
      }, 100)
    }
  }, [params?.id])
}

export default function ChatPage({ params }: { params?: { id?: string } }) {
  useScrollToTop(params)

  const threadId = params?.id

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null)
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [threadNotFound, setThreadNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { currentUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Analytics tracking refs
  const analyticsTracked = useRef(false)
  const pageStartTime = useRef(Date.now())
  const exitAnalyticsSent = useRef(false)
  const isNavigatingInternally = useRef(false)

  // Fetch threads from Firestore
  useEffect(() => {
    if (!currentUser) {
      setLoadingThreads(false)
      return
    }

    setLoadingThreads(true)

    const unsubscribe = ChatService.subscribeToThreads(currentUser.uid, async (fetchedThreads) => {
      try {
        const threadsWithReceiverInfo: ChatThread[] = []
        for (const thread of fetchedThreads) {
          const receiverId = thread.participants?.find((id) => id !== currentUser.uid) || ""
          thread.receiverId = receiverId

          if (receiverId) {
            try {
              const iboardUserDocRef = doc(db, "iboard_users", receiverId)
              const iboardUserSnap = await getDoc(iboardUserDocRef)

              if (iboardUserSnap.exists()) {
                const userData = iboardUserSnap.data()
                thread.receiver_name = `${userData.first_name || ""} ${userData.last_name || ""}`.trim()
                thread.seller_photo = userData.photo_url || null
              }
            } catch (err) {
              console.error("Error fetching iboard_user data for thread:", err)
            }
          }
          threadsWithReceiverInfo.push(thread)
        }
        setThreads(threadsWithReceiverInfo)
        setLoadingThreads(false)
      } catch (err) {
        console.error("Error processing threads:", err)
        setError("Failed to load conversations")
        setLoadingThreads(false)
      }
    })

    return () => unsubscribe()
  }, [currentUser])

  // Set active thread and fetch messages when threadId changes
  useEffect(() => {
    if (!threadId || !currentUser) {
      setActiveThread(null)
      setMessages([])
      setLoadingMessages(false)
      return
    }

    setThreadNotFound(false)
    setError(null)
    setLoadingMessages(true)

    const fetchAndSubscribeToThread = async () => {
      let currentThread: ChatThread | null = null

      // Try to find in already loaded threads first
      const existingThread = threads.find((t) => t.id === threadId)
      if (existingThread) {
        currentThread = existingThread
      } else {
        // If not found, fetch directly from Firestore
        try {
          currentThread = await ChatService.getThread(threadId)
          if (currentThread) {
            // Populate receiver info if not already present
            const receiverId = currentThread.participants?.find((id) => id !== currentUser.uid) || ""
            currentThread.receiverId = receiverId
            if (receiverId) {
              const iboardUserDocRef = doc(db, "iboard_users", receiverId)
              const iboardUserSnap = await getDoc(iboardUserDocRef)
              if (iboardUserSnap.exists()) {
                const userData = iboardUserSnap.data()
                currentThread.receiver_name = `${userData.first_name || ""} ${userData.last_name || ""}`.trim()
                currentThread.seller_photo = userData.photo_url || null
              }
            }
          }
        } catch (err) {
          console.error("Error fetching thread directly:", err)
          setError("Failed to load conversation details.")
          setLoadingMessages(false)
          return
        }
      }

      if (currentThread && currentThread.participants.includes(currentUser.uid)) {
        setActiveThread(currentThread)
        // Subscribe to messages for the active thread
        const unsubscribeMessages = ChatService.subscribeToMessages(threadId, (fetchedMessages) => {
          setMessages(fetchedMessages)
          setLoadingMessages(false)
        })
        return () => unsubscribeMessages()
      } else {
        // Thread not found or user not a participant
        setThreadNotFound(true)
        setLoadingMessages(false)
        // Attempt to create a new thread if the ID looks like a user ID
        try {
          const userDocRef = doc(db, "iboard_users", threadId)
          const userSnap = await getDoc(userDocRef)
          if (userSnap.exists()) {
            // This means the ID is a valid user ID, so we can create a new thread
            const newThreadId = await ChatService.createThread([currentUser.uid, threadId])
            router.replace(`/dashboard/chat/${newThreadId}`)
          }
        } catch (createError) {
          console.error("Error attempting to create new thread:", createError)
        }
      }
    }

    fetchAndSubscribeToThread()
  }, [threadId, currentUser, threads, router])

  // Redirect to first thread if current thread not found and we have threads
  useEffect(() => {
    if (!threadNotFound || loadingThreads || !currentUser) return

    console.log("Thread not found, checking for available threads...")

    const redirectTimer = setTimeout(() => {
      isNavigatingInternally.current = true
      if (threads.length > 0) {
        console.log("Redirecting to first available thread:", threads[0].id)
        router.replace(`/dashboard/chat/${threads[0].id}`)
      } else {
        console.log("No threads available, redirecting to messages page")
        router.replace("/dashboard/chat")
      }
    }, 2000)

    return () => clearTimeout(redirectTimer)
  }, [threadNotFound, threads, loadingThreads, currentUser, router])

  // Handle sending a message
  const handleSendMessage = async (content: string, file?: File | null) => {
    if (!activeThread || !currentUser || sendingMessage) return

    setSendingMessage(true)
    setUploadError(null)

    try {
      let fileData = undefined
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          setUploadError("File is too large (max 5MB). Message sent without attachment.")
        } else {
          try {
            const storage = getStorage()
            const timestamp = Date.now()
            const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_")
            const filePath = `chat_files/${timestamp}_${safeFileName}`
            const storageRef = ref(storage, filePath)
            const uploadTask = uploadBytesResumable(storageRef, file)

            const downloadURL = await new Promise<string>((resolve, reject) => {
              uploadTask.on(
                "state_changed",
                (snapshot) => {
                  const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
                  setUploadProgress({ progress })
                },
                (error) => {
                  setUploadProgress({ progress: 0, error: error.message })
                  reject(error)
                },
                async () => {
                  const url = await getDownloadURL(uploadTask.snapshot.ref)
                  setUploadProgress({ progress: 100, downloadUrl: url })
                  resolve(url)
                },
              )
            })
            fileData = {
              fileUrl: downloadURL,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            }
          } catch (uploadErr) {
            console.error("Error uploading file:", uploadErr)
            setUploadError("Failed to upload file. Message sent without attachment.")
          }
        }
      }

      await ChatService.sendMessage(activeThread.id, currentUser.uid, content, fileData)

      setSelectedFile(null)
      setImagePreviewUrl(null)
      setUploadProgress(null)
    } catch (err) {
      console.error("Error sending message:", err)
      alert("Failed to send message. Please try again.")
    } finally {
      setSendingMessage(false)
    }
  }

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    setUploadError(null)
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreviewUrl(null)
    }
  }

  // If no threads are available, show a message
  if (!loadingThreads && threads.length === 0 && !threadId) {
    return (
      <div style={{ height: "95vh" }} className="flex flex-col items-center justify-center bg-white">
        <div className="text-center p-8 max-w-md">
          <div className="mb-4 flex justify-center">
            <AlertCircle className="h-12 w-12 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No conversations yet</h2>
          <p className="text-gray-600 mb-6">
            You don't have any messages yet. Start a conversation with someone to see it here.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={() => {
              isNavigatingInternally.current = true
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: "95vh" }} className="flex flex-col overflow-hidden bg-white">
      <div className="flex flex-1 overflow-hidden">
        <div className="container mx-auto max-w-6xl flex flex-1 overflow-hidden">
          <div className="flex w-full h-full">
            {/* Left sidebar */}
            <div className="w-1/3 bg-white border-r flex flex-col overflow-hidden">
              <div className="p-4 border-b flex-shrink-0">
                <button
                  onClick={() => {
                    isNavigatingInternally.current = true
                    router.back()
                  }}
                  className="flex items-center text-gray-700"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  <span className="text-xl font-semibold">Messages</span>
                </button>
              </div>
              <ChatSidebar
                threads={threads}
                loading={loadingThreads}
                selectedThreadId={threadId}
                onSelectThread={(thread) => {
                  isNavigatingInternally.current = true
                  router.push(`/dashboard/chat/${thread.id}`)
                }}
                currentUserId={currentUser?.uid || ""}
              />
            </div>

            {/* Chat area */}
            <div className="w-2/3 flex flex-col bg-white overflow-hidden">
              {threadNotFound && threadId ? (
                <div className="flex-grow flex items-center justify-center p-4">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Conversation not found</h3>
                    <p className="text-gray-600 mb-4">
                      The conversation with ID "{threadId}" doesn't exist or you don't have access to it.
                    </p>
                    <div className="flex flex-col gap-2 items-center">
                      <p className="text-gray-600 mb-2">
                        {threads.length > 0
                          ? "Redirecting to an available conversation..."
                          : "Redirecting to messages page..."}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            isNavigatingInternally.current = true
                            router.push("/dashboard/chat")
                          }}
                          variant="outline"
                        >
                          Go to Messages
                        </Button>
                        {threads.length > 0 && (
                          <Button
                            onClick={() => {
                              isNavigatingInternally.current = true
                              router.replace(`/dashboard/chat/${threads[0].id}`)
                            }}
                          >
                            Go to First Conversation
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : !threadId ? (
                <div className="flex-grow flex items-center justify-center p-4">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                    <p className="text-gray-600 mb-4">
                      Choose a conversation from the sidebar to start messaging.
                    </p>
                  </div>
                </div>
              ) : (
                <ChatWindow
                  messages={messages}
                  activeThread={activeThread}
                  loadingMessages={loadingMessages}
                  sendingMessage={sendingMessage}
                  currentUserId={currentUser?.uid || ""}
                  onSendMessage={handleSendMessage}
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  imagePreviewUrl={imagePreviewUrl}
                  uploadError={uploadError}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
