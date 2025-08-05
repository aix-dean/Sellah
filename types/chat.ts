import type { FieldValue, Timestamp } from "firebase/firestore"

export interface ChatThread {
  id: string
  participants: string[] // Array of user UIDs
  name?: string // For group chats
  isGroup: boolean
  lastMessage?: string | { text: string; timestamp: any } // Can be string or object
  lastMessageTimestamp?: Date | Timestamp | FieldValue | null
  createdAt?: Date | Timestamp | FieldValue | null
  updatedAt?: Date | Timestamp | FieldValue | null
  // Additional fields for display in sidebar
  receiver_name?: string // Name of the other participant for 1:1 chats
  seller_photo?: string // Photo of the other participant/seller
  productName?: string // Name of the product related to the chat
  receiverId?: string // ID of the other participant
  company_id?: string // Company ID associated with the thread
}

export interface ChatMessage {
  id: string
  threadId: string
  senderId: string
  content: string // The actual message text
  timestamp: Date | Timestamp | FieldValue | null
  read: boolean
  // For file messages
  fileUrl?: string
  fileName?: string
  fileType?: string
  fileSize?: number
  imageUrl?: string // For image messages specifically
  type?: "TEXT" | "IMAGE" | "FILE" // Type of message content
}
