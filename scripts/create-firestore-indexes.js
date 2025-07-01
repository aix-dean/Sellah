// This script helps create the necessary Firestore indexes for optimal performance
// Run this in the Firebase Console or use the Firebase CLI

console.log("Creating Firestore indexes for order activity optimization...")

// Index configurations for order_activity collection
const indexConfigurations = [
  {
    collection: "order_activity",
    fields: [
      { field: "order_id", mode: "ASCENDING" },
      { field: "timestamp", mode: "DESCENDING" },
    ],
    description: "Composite index for fetching order activities by order_id, sorted by timestamp (newest first)",
  },
  {
    collection: "order_activity",
    fields: [
      { field: "order_id", mode: "ASCENDING" },
      { field: "activity_type", mode: "ASCENDING" },
      { field: "timestamp", mode: "DESCENDING" },
    ],
    description: "Composite index for filtering activities by type within an order",
  },
  {
    collection: "order_activity",
    fields: [
      { field: "user_id", mode: "ASCENDING" },
      { field: "timestamp", mode: "DESCENDING" },
    ],
    description: "Index for fetching activities by user",
  },
  {
    collection: "orders",
    fields: [
      { field: "status", mode: "ASCENDING" },
      { field: "updated_at", mode: "DESCENDING" },
    ],
    description: "Index for filtering orders by status and sorting by update time",
  },
]

// Firebase CLI commands to create these indexes
console.log("\n=== Firebase CLI Commands ===")
console.log("Run these commands in your terminal to create the indexes:\n")

indexConfigurations.forEach((config, index) => {
  console.log(`# ${config.description}`)
  const fieldsStr = config.fields.map((f) => `${f.field}:${f.mode.toLowerCase()}`).join(",")
  console.log(`firebase firestore:indexes:create --collection-group=${config.collection} --field-config=${fieldsStr}`)
  console.log("")
})

// Alternative: Firestore Rules for security
console.log("\n=== Firestore Security Rules ===")
console.log("Add these rules to your firestore.rules file:\n")

const securityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Order activity rules
    match /order_activity/{activityId} {
      allow read, write: if request.auth != null;
      allow create: if request.auth != null 
        && request.resource.data.user_id == request.auth.uid
        && request.resource.data.timestamp is timestamp;
    }
    
    // Orders rules
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
      allow update: if request.auth != null 
        && request.resource.data.updated_at is timestamp;
    }
  }
}
`

console.log(securityRules)

// Performance monitoring setup
console.log("\n=== Performance Monitoring ===")
console.log("Monitor these metrics in Firebase Console:")
console.log("1. Query performance for order_activity collection")
console.log("2. Read/write operations per minute")
console.log("3. Index usage statistics")
console.log("4. Error rates for database operations")

console.log("\n=== Optimization Tips ===")
console.log("1. Use pagination for large activity lists")
console.log("2. Cache frequently accessed order data")
console.log("3. Batch write operations when possible")
console.log("4. Monitor query costs and optimize as needed")
console.log("5. Consider using Firestore offline persistence for better UX")

console.log("\nIndexes creation guide completed!")
