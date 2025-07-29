import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  getDocs,
  updateDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import type { ChatThread, ChatMessage } from "../types/chat"

export class ChatService {
  static async createThread(participants: string[], name?: string): Promise<string> {
    try {
      const threadsRef = collection(db, "threads")
      const newThread = {
        participants,
        name: name || null,
        isGroup: participants.length > 2,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessageTimestamp: serverTimestamp(), // Initialize timestamp for new threads
      }

      const docRef = await addDoc(threadsRef, newThread)
      return docRef.id
    } catch (error) {
      console.error("Error creating thread:", error)
      throw error
    }
  }

  static async getThread(threadId: string): Promise<ChatThread | null> {
    try {
      const threadRef = doc(db, "threads", threadId)
      const threadSnap = await getDoc(threadRef)

      if (threadSnap.exists()) {
        const data = threadSnap.data()
        return {
          id: threadSnap.id,
          ...data,
        } as ChatThread
      }

      return null
    } catch (error) {
      console.error("Error getting thread:", error)
      throw error
    }
  }

  static async getUserThreads(userId: string): Promise<ChatThread[]> {
    try {
      const threadsRef = collection(db, "threads")
      const q = query(
        threadsRef,
        where("participants", "array-contains", userId),
        orderBy("lastMessageTimestamp", "desc"),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          lastMessageTimestamp:
            data.lastMessageTimestamp instanceof Timestamp ? data.lastMessageTimestamp.toDate() : null,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
        } as ChatThread
      })
    } catch (error) {
      console.error("Error fetching user threads:", error)
      throw error
    }
  }

  static async sendMessage(
    threadId: string,
    senderId: string,
    content: string,
    fileData?: { fileUrl: string; fileName: string; fileType: string; fileSize: number },
  ): Promise<string> {
    try {
      // Determine message type
      let messageType: "TEXT" | "IMAGE" | "FILE" = "TEXT"
      if (fileData) {
        messageType = fileData.fileType.startsWith("image/") ? "IMAGE" : "FILE"
      }

      // Add message to chat_messages collection
      const messageRef = await addDoc(collection(db, "chat_messages"), {
        threadId,
        senderId,
        content,
        timestamp: serverTimestamp(),
        read: false,
        type: messageType,
        ...(fileData && {
          fileUrl: fileData.fileUrl,
          fileName: fileData.fileName,
          fileType: fileData.fileType,
          fileSize: fileData.fileSize,
          imageUrl: messageType === "IMAGE" ? fileData.fileUrl : undefined,
        }),
      })

      // Update thread with last message
      const threadRef = doc(db, "threads", threadId)
      await updateDoc(threadRef, {
        lastMessage: fileData ? content || `Sent a ${messageType.toLowerCase()}` : content,
        lastMessageTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return messageRef.id
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  static async getThreadMessages(threadId: string): Promise<ChatMessage[]> {
    try {
      const messagesRef = collection(db, "chat_messages")
      const q = query(messagesRef, where("threadId", "==", threadId), orderBy("timestamp", "asc"))

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : null,
        } as ChatMessage
      })
    } catch (error) {
      console.error("Error fetching thread messages:", error)
      throw error
    }
  }

  static async markMessagesAsRead(threadId: string, userId: string): Promise<void> {
    try {
      const messagesRef = collection(db, "chat_messages")
      const messagesQuery = query(
        messagesRef,
        where("threadId", "==", threadId),
        where("senderId", "!=", userId),
        where("read", "==", false),
      )

      const snapshot = await getDocs(messagesQuery)

      const batch = snapshot.docs.map((doc) => {
        const messageRef = doc.ref
        return updateDoc(messageRef, { read: true })
      })

      await Promise.all(batch)
    } catch (error) {
      console.error("Error marking messages as read:", error)
      throw error
    }
  }

  static subscribeToThreads(userId: string, callback: (threads: ChatThread[]) => void): () => void {
    const threadsRef = collection(db, "threads")
    const threadsQuery = query(
      threadsRef,
      where("participants", "array-contains", userId),
      orderBy("lastMessageTimestamp", "desc"),
    )

    return onSnapshot(threadsQuery, (snapshot) => {
      const threads = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          lastMessageTimestamp:
            data.lastMessageTimestamp instanceof Timestamp ? data.lastMessageTimestamp.toDate() : null,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
        } as ChatThread
      })

      callback(threads)
    })
  }

  static subscribeToMessages(threadId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const messagesRef = collection(db, "chat_messages")
    const messagesQuery = query(messagesRef, where("threadId", "==", threadId), orderBy("timestamp", "asc"))

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : null,
        } as ChatMessage
      })

      callback(messages)
    })
  }
}

// Export helper functions that use the ChatService class
export async function getUserThreads(userId: string): Promise<ChatThread[]> {
  return ChatService.getUserThreads(userId)
}

export async function getThreadMessages(threadId: string): Promise<ChatMessage[]> {
  return ChatService.getThreadMessages(threadId)
}
