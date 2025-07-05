import { getDoc, getDocs, type DocumentData, type Query, type CollectionReference, type doc } from "firebase/firestore"

// Define a type for a logged Firestore read operation
interface FirestoreReadLog {
  timestamp: number
  collection: string
  documentId?: string
  query?: string // String representation of the query
  readCount: number
  cost: number
  duration: number // in milliseconds
  isExpensive: boolean
  isSlow: boolean
}

// Define a type for collection statistics
interface CollectionStats {
  totalReads: number
  totalCost: number
  totalDocumentsRead: number
  averageDuration: number
}

// Define a type for page statistics
interface PageStats {
  totalReads: number
  totalCost: number
  totalDocumentsRead: number
  averageDuration: number
}

// In-memory storage for logs and statistics
let firestoreReadLogs: FirestoreReadLog[] = []
let firestoreReadCount = 0
let totalSessionCost = 0
const READ_COST_PER_DOCUMENT = 0.00000006 // $0.06 per 100,000 reads in USD
const MAX_LOG_ENTRIES = 1000 // Limit the number of logs to prevent memory issues

// Thresholds for warnings
const SLOW_OPERATION_THRESHOLD_MS = 1000 // 1 second
const EXPENSIVE_OPERATION_THRESHOLD_DOCS = 10 // More than 10 documents read in a single operation

// Billing analysis thresholds (for development warnings)
const DAILY_COST_WARNING_THRESHOLD = 0.01 // $0.01
const MONTHLY_COST_WARNING_THRESHOLD = 0.1 // $0.10

// Function to log a Firestore read operation
export function logFirestoreRead(
  collectionName: string,
  readCount: number,
  duration: number,
  documentId?: string,
  queryDetails?: string,
) {
  const cost = readCount * READ_COST_PER_DOCUMENT
  firestoreReadCount += readCount
  totalSessionCost += cost

  const isExpensive = readCount > EXPENSIVE_OPERATION_THRESHOLD_DOCS
  const isSlow = duration > SLOW_OPERATION_THRESHOLD_MS

  const logEntry: FirestoreReadLog = {
    timestamp: Date.now(),
    collection: collectionName,
    documentId,
    query: queryDetails,
    readCount,
    cost,
    duration,
    isExpensive,
    isSlow,
  }

  firestoreReadLogs.push(logEntry)
  if (firestoreReadLogs.length > MAX_LOG_ENTRIES) {
    firestoreReadLogs.shift() // Remove oldest entry if limit exceeded
  }

  // Log to console for immediate feedback in development
  if (process.env.NODE_ENV === "development") {
    console.log(
      `📊 Firestore Read: ${collectionName}${documentId ? `/${documentId}` : ""}${
        queryDetails ? ` (${queryDetails})` : ""
      } - ${readCount} docs, ${duration.toFixed(2)}ms, $${(cost * 1000000).toFixed(2)}μ`,
    )
    if (isSlow) {
      console.warn(`⚠️ SLOW OPERATION: Firestore read took ${duration.toFixed(2)}ms for ${collectionName}`)
    }
    if (isExpensive) {
      console.warn(`⚠️ EXPENSIVE OPERATION: Firestore read ${readCount} documents from ${collectionName}`)
    }

    // Periodically print billing analysis
    if (firestoreReadLogs.length % 50 === 0) {
      printBillingAnalysis()
    }
  }
}

// Wrapper for getDoc to log reads
export async function loggedGetDoc<T extends DocumentData>(
  docRef: ReturnType<typeof doc>,
): Promise<ReturnType<typeof getDoc>> {
  const startTime = performance.now()
  const docSnap = await getDoc(docRef)
  const endTime = performance.now()
  const duration = endTime - startTime

  const collectionName = docRef.parent.id
  const documentId = docRef.id
  const readCount = docSnap.exists() ? 1 : 0 // 1 read if document exists, 0 if not found (still counts as a read operation)

  logFirestoreRead(collectionName, readCount, duration, documentId)
  return docSnap
}

// Wrapper for getDocs to log reads
export async function loggedGetDocs<T extends DocumentData>(
  queryRef: Query<T> | CollectionReference<T>,
): Promise<ReturnType<typeof getDocs>> {
  const startTime = performance.now()
  const querySnapshot = await getDocs(queryRef)
  const endTime = performance.now()
  const duration = endTime - startTime

  const collectionName = queryRef.path // For CollectionReference
  const readCount = querySnapshot.size

  let queryDetails = ""
  if ("_query" in queryRef) {
    // This is a simplified way to get query details, might need more robust parsing
    const filters = (queryRef as Query<T>)._query.filters
    const orderBy = (queryRef as Query<T>)._query.orderBy
    if (filters && filters.length > 0) {
      queryDetails += `Filters: ${filters.map((f: any) => `${f.field} ${f.op} ${f.value}`).join(", ")}`
    }
    if (orderBy && orderBy.length > 0) {
      queryDetails += `${queryDetails ? "; " : ""}OrderBy: ${orderBy.map((o: any) => `${o.field} ${o.direction}`).join(", ")}`
    }
  } else {
    queryDetails = "Collection Scan"
  }

  logFirestoreRead(collectionName, readCount, duration, undefined, queryDetails)
  return querySnapshot
}

// Get total Firestore read count for the current session
export function getFirestoreReadCount(): number {
  return firestoreReadCount
}

// Get total estimated cost for the current session
export function getTotalSessionCost(): number {
  return totalSessionCost
}

// Get statistics per collection
export function getCollectionStats(): Record<string, CollectionStats> {
  const stats: Record<string, CollectionStats> = {}
  firestoreReadLogs.forEach((log) => {
    if (!stats[log.collection]) {
      stats[log.collection] = {
        totalReads: 0,
        totalCost: 0,
        totalDocumentsRead: 0,
        averageDuration: 0,
      }
    }
    stats[log.collection].totalReads += 1
    stats[log.collection].totalCost += log.cost
    stats[log.collection].totalDocumentsRead += log.readCount
    stats[log.collection].averageDuration =
      (stats[log.collection].averageDuration * (stats[log.collection].totalReads - 1) + log.duration) /
      stats[log.collection].totalReads
  })
  return stats
}

// Get statistics per page (requires page context to be passed to logFirestoreRead)
// For now, this will just aggregate all reads. To make it page-specific,
// you'd need to pass the current page/route to logFirestoreRead.
export function getPageStats(): Record<string, PageStats> {
  // This is a placeholder. To implement properly, you'd need to pass
  // the current page/route to `logFirestoreRead` and store it in `FirestoreReadLog`.
  // For now, it will just return overall stats.
  const overallStats: PageStats = {
    totalReads: firestoreReadCount,
    totalCost: totalSessionCost,
    totalDocumentsRead: firestoreReadLogs.reduce((sum, log) => sum + log.readCount, 0),
    averageDuration: firestoreReadLogs.reduce((sum, log) => sum + log.duration, 0) / firestoreReadLogs.length || 0,
  }
  return { "Overall Application": overallStats }
}

// Get expensive operations (reads more than EXPENSIVE_OPERATION_THRESHOLD_DOCS documents)
export function getExpensiveOperations(): FirestoreReadLog[] {
  return firestoreReadLogs.filter((log) => log.isExpensive).sort((a, b) => b.readCount - a.readCount)
}

// Get slow operations (takes longer than SLOW_OPERATION_THRESHOLD_MS)
export function getSlowOperations(): FirestoreReadLog[] {
  return firestoreReadLogs.filter((log) => log.isSlow).sort((a, b) => b.duration - a.duration)
}

// Reset all logged data
export function resetFirestoreReadCount(): void {
  firestoreReadLogs = []
  firestoreReadCount = 0
  totalSessionCost = 0
  console.log("📊 Firestore read logs and counts reset.")
}

// Export all logs as JSON
export function exportReadLogs(): string {
  return JSON.stringify(firestoreReadLogs, null, 2)
}

// Print a detailed billing analysis to the console
export function printBillingAnalysis(): void {
  if (process.env.NODE_ENV !== "development") {
    console.log("Billing analysis is only available in development mode.")
    return
  }

  console.groupCollapsed("📊 Firestore Billing Analysis")
  console.log(`Total Firestore Reads (Session): ${firestoreReadCount}`)
  console.log(`Estimated Session Cost: $${totalSessionCost.toFixed(6)}`)

  const avgReadsPerMinute =
    firestoreReadCount /
      (firestoreReadLogs.length > 0 ? (Date.now() - firestoreReadLogs[0].timestamp) / (1000 * 60) : 1) || 0
  const avgCostPerMinute =
    totalSessionCost /
      (firestoreReadLogs.length > 0 ? (Date.now() - firestoreReadLogs[0].timestamp) / (1000 * 60) : 1) || 0

  const projectedDailyReads = avgReadsPerMinute * 60 * 24
  const projectedDailyCost = avgCostPerMinute * 60 * 24
  const projectedMonthlyCost = projectedDailyCost * 30 // Simple projection

  console.log(`\nProjected Daily Reads: ${projectedDailyReads.toFixed(0)}`)
  console.log(`Projected Daily Cost: $${projectedDailyCost.toFixed(6)}`)
  console.log(`Projected Monthly Cost: $${projectedMonthlyCost.toFixed(6)}`)

  if (projectedDailyCost > DAILY_COST_WARNING_THRESHOLD) {
    console.warn(
      `🚨 WARNING: Projected daily cost ($${projectedDailyCost.toFixed(6)}) exceeds threshold ($${DAILY_COST_WARNING_THRESHOLD}).`,
    )
  }
  if (projectedMonthlyCost > MONTHLY_COST_WARNING_THRESHOLD) {
    console.warn(
      `🚨 WARNING: Projected monthly cost ($${projectedMonthlyCost.toFixed(6)}) exceeds threshold ($${MONTHLY_COST_WARNING_THRESHOLD}).`,
    )
  }

  console.log("\n--- Collection Statistics ---")
  const collectionStats = getCollectionStats()
  for (const coll in collectionStats) {
    const stats = collectionStats[coll]
    console.log(
      `  ${coll}: Reads=${stats.totalReads}, Docs=${stats.totalDocumentsRead}, AvgDuration=${stats.averageDuration.toFixed(2)}ms, Cost=$${stats.totalCost.toFixed(6)}`,
    )
  }

  console.log("\n--- Slow Operations (duration > 1000ms) ---")
  const slowOps = getSlowOperations()
  if (slowOps.length > 0) {
    slowOps.forEach((op) =>
      console.log(
        `  ${op.collection}${op.documentId ? `/${op.documentId}` : ""}${
          op.query ? ` (${op.query})` : ""
        }: ${op.duration.toFixed(2)}ms, ${op.readCount} docs`,
      ),
    )
  } else {
    console.log("  No slow operations detected.")
  }

  console.log("\n--- Expensive Operations (reads > 10 docs) ---")
  const expensiveOps = getExpensiveOperations()
  if (expensiveOps.length > 0) {
    expensiveOps.forEach((op) =>
      console.log(
        `  ${op.collection}${op.documentId ? `/${op.documentId}` : ""}${
          op.query ? ` (${op.query})` : ""
        }: ${op.readCount} docs, ${op.duration.toFixed(2)}ms`,
      ),
    )
  } else {
    console.log("  No expensive operations detected.")
  }

  console.groupEnd()
}
