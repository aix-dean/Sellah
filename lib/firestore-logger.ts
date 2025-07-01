import {
  getDoc,
  getDocs,
  type DocumentReference,
  type Query,
  type DocumentSnapshot,
  type QuerySnapshot,
} from "firebase/firestore"

// Enhanced tracking for billing analysis
interface FirestoreReadLog {
  timestamp: number
  collection: string
  operation: "getDoc" | "getDocs"
  documentCount: number
  duration: number
  caller: string
  page?: string
  cost: number // Estimated cost in reads
}

interface CollectionStats {
  totalReads: number
  totalDocuments: number
  totalCost: number
  operations: FirestoreReadLog[]
}

let readLogs: FirestoreReadLog[] = []
let collectionStats: Record<string, CollectionStats> = {}
let totalReadCount = 0
let sessionStartTime = Date.now()

// Get current page/route for better tracking
function getCurrentPage(): string {
  if (typeof window === "undefined") return "server"

  const path = window.location.pathname
  const searchParams = window.location.search

  // Map common paths to readable names
  const pageMap: Record<string, string> = {
    "/dashboard": "Dashboard Home",
    "/dashboard/products": "Products List",
    "/dashboard/products/add": "Add Product",
    "/dashboard/orders": "Orders List",
    "/dashboard/account": "Account Settings",
    "/login": "Login Page",
    "/register": "Registration",
  }

  // Check for dynamic routes
  if (path.includes("/dashboard/products/edit/")) return "Edit Product"
  if (path.includes("/dashboard/products/") && !path.includes("/add")) return "Product Details"

  return pageMap[path] || path + searchParams
}

// Get caller information for debugging
function getCaller(): string {
  const stack = new Error().stack
  if (!stack) return "unknown"

  const lines = stack.split("\n")
  // Skip the first few lines (this function, wrapper function)
  for (let i = 3; i < Math.min(lines.length, 8); i++) {
    const line = lines[i]
    if (line && !line.includes("firestore-logger") && !line.includes("node_modules")) {
      // Extract file name and line number
      const match = line.match(/at.*$$(.+):(\d+):(\d+)$$/) || line.match(/at (.+):(\d+):(\d+)/)
      if (match) {
        const [, file, lineNum] = match
        const fileName = file.split("/").pop() || file
        return `${fileName}:${lineNum}`
      }
    }
  }
  return "unknown"
}

// Calculate estimated cost (Firestore pricing: $0.06 per 100K reads)
function calculateCost(documentCount: number): number {
  return (documentCount * 0.06) / 100000
}

// Log a Firestore read operation
function logRead(collection: string, operation: "getDoc" | "getDocs", documentCount: number, duration: number) {
  const caller = getCaller()
  const page = getCurrentPage()
  const cost = calculateCost(documentCount)

  const log: FirestoreReadLog = {
    timestamp: Date.now(),
    collection,
    operation,
    documentCount,
    duration,
    caller,
    page,
    cost,
  }

  readLogs.push(log)
  totalReadCount += documentCount

  // Update collection stats
  if (!collectionStats[collection]) {
    collectionStats[collection] = {
      totalReads: 0,
      totalDocuments: 0,
      totalCost: 0,
      operations: [],
    }
  }

  collectionStats[collection].totalReads += 1
  collectionStats[collection].totalDocuments += documentCount
  collectionStats[collection].totalCost += cost
  collectionStats[collection].operations.push(log)

  // Enhanced console logging with cost information
  const costFormatted = cost < 0.000001 ? "<$0.000001" : `$${cost.toFixed(6)}`


}

// Logged version of getDoc
export async function loggedGetDoc(docRef: DocumentReference): Promise<DocumentSnapshot> {
  const startTime = Date.now()

  try {
    const result = await getDoc(docRef)
    const duration = Date.now() - startTime
    const collection = docRef.path.split("/")[0]

    logRead(collection, "getDoc", 1, duration)
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    const collection = docRef.path.split("/")[0]
    console.error(`❌ Firestore getDoc failed for ${collection}:`, error)
    throw error
  }
}

// Logged version of getDocs
export async function loggedGetDocs(queryRef: Query): Promise<QuerySnapshot> {
  const startTime = Date.now()

  try {
    const result = await getDocs(queryRef)
    const duration = Date.now() - startTime

    // Extract collection name from query
    let collectionName = "unknown"
    try {
      // This is a bit hacky but works for most cases
      const queryStr = queryRef.toString()
      const match = queryStr.match(/Query$$([^)]+)$$/)
      if (match) {
        collectionName = match[1].split("/")[0]
      }
    } catch (e) {
      // Fallback - try to get from converter or other properties
      if ((queryRef as any)._query?.path?.segments) {
        collectionName = (queryRef as any)._query.path.segments[0]
      }
    }

    logRead(collectionName, "getDocs", result.size, duration)
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`❌ Firestore getDocs failed:`, error)
    throw error
  }
}

// Get total read count
export function getFirestoreReadCount(): number {
  return totalReadCount
}

// Get total session cost
export function getTotalSessionCost(): number {
  return readLogs.reduce((total, log) => total + log.cost, 0)
}

// Get collection statistics
export function getCollectionStats(): Record<string, CollectionStats> {
  return { ...collectionStats }
}

// Get page statistics
export function getPageStats(): Record<string, { reads: number; documents: number; cost: number }> {
  const pageStats: Record<string, { reads: number; documents: number; cost: number }> = {}

  readLogs.forEach((log) => {
    const page = log.page || "unknown"
    if (!pageStats[page]) {
      pageStats[page] = { reads: 0, documents: 0, cost: 0 }
    }
    pageStats[page].reads += 1
    pageStats[page].documents += log.documentCount
    pageStats[page].cost += log.cost
  })

  return pageStats
}

// Get recent expensive operations
export function getExpensiveOperations(limit = 10): FirestoreReadLog[] {
  return readLogs
    .filter((log) => log.documentCount > 10 || log.cost > 0.000005)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, limit)
}

// Reset counters
export function resetFirestoreReadCount(): void {
  readLogs = []
  collectionStats = {}
  totalReadCount = 0
  sessionStartTime = Date.now()

}

// Export detailed logs for analysis
export function exportReadLogs(): string {
  const sessionDuration = (Date.now() - sessionStartTime) / 1000 / 60 // minutes
  const summary = {
    sessionDuration: `${sessionDuration.toFixed(1)} minutes`,
    totalReads: totalReadCount,
    totalCost: getTotalSessionCost(),
    collectionStats,
    pageStats: getPageStats(),
    expensiveOperations: getExpensiveOperations(),
    allLogs: readLogs,
  }

  return JSON.stringify(summary, null, 2)
}

// Print billing analysis to console
export function printBillingAnalysis(): void {


  const totalCost = getTotalSessionCost()
  const sessionDuration = (Date.now() - sessionStartTime) / 1000 / 60



}
