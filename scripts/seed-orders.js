// Orders Collection Seeding Script for Sellah
// This script creates realistic order data in the 'booking' collection

import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBByUHvQmjYdalF2C1UIpzn-onB3iXGMhc",
  authDomain: "oh-app-bcf24.firebaseapp.com",
  projectId: "oh-app-bcf24",
  storageBucket: "oh-app-bcf24.appspot.com",
  messagingSenderId: "272363630855",
  appId: "1:272363630855:web:820601c723e85625d915a2",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Sample data for orders
const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "completed"]
const PAYMENT_METHODS = ["cash_on_delivery", "gcash", "bank_transfer", "credit_card", "paypal"]
const CANCEL_REASONS = [
  "Customer requested cancellation",
  "Out of stock",
  "Payment failed",
  "Shipping address invalid",
  "Product defect",
  "Customer changed mind",
]

// Sample seller IDs (you should replace these with actual seller IDs from your system)
const SAMPLE_SELLER_IDS = ["seller_001", "seller_002", "seller_003", "seller_004", "seller_005"]

// Sample product IDs (you should replace these with actual product IDs from your system)
const SAMPLE_PRODUCT_IDS = [
  "product_001",
  "product_002",
  "product_003",
  "product_004",
  "product_005",
  "product_006",
  "product_007",
  "product_008",
  "product_009",
  "product_010",
]

// Sample customer data
const SAMPLE_CUSTOMERS = [
  { id: "customer_001", username: "juan_dela_cruz", name: "Juan Dela Cruz" },
  { id: "customer_002", username: "maria_santos", name: "Maria Santos" },
  { id: "customer_003", username: "pedro_garcia", name: "Pedro Garcia" },
  { id: "customer_004", username: "ana_reyes", name: "Ana Reyes" },
  { id: "customer_005", username: "carlos_lopez", name: "Carlos Lopez" },
  { id: "customer_006", username: "sofia_martinez", name: "Sofia Martinez" },
  { id: "customer_007", username: "miguel_torres", name: "Miguel Torres" },
  { id: "customer_008", username: "lucia_flores", name: "Lucia Flores" },
  { id: "customer_009", username: "diego_morales", name: "Diego Morales" },
  { id: "customer_010", username: "elena_castro", name: "Elena Castro" },
]

// Helper function to get random element from array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)]
}

// Helper function to get random number between min and max
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper function to get random price
function getRandomPrice(min = 100, max = 5000) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper function to generate random date within last 6 months
function getRandomDate() {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
  return new Date(randomTime)
}

// Helper function to generate media order URL
function generateMediaOrderUrl() {
  const mediaTypes = ["image", "video", "document"]
  const mediaType = getRandomElement(mediaTypes)
  return `https://storage.googleapis.com/sellah-media/orders/${mediaType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${mediaType === "image" ? "jpg" : mediaType === "video" ? "mp4" : "pdf"}`
}

// Function to create a single order
function createOrder() {
  const customer = getRandomElement(SAMPLE_CUSTOMERS)
  const sellerId = getRandomElement(SAMPLE_SELLER_IDS)
  const productId = getRandomElement(SAMPLE_PRODUCT_IDS)
  const status = getRandomElement(ORDER_STATUSES)
  const quantity = getRandomNumber(1, 5)
  const cost = getRandomPrice(150, 2000)
  const totalCost = cost * quantity
  const paymentMethod = getRandomElement(PAYMENT_METHODS)
  const createdDate = getRandomDate()

  const order = {
    // Customer information
    user_id: customer.id,
    username: customer.username,

    // Product information
    product_id: productId,
    product_owner: sellerId,
    seller_id: sellerId,

    // Order details
    quantity: quantity,
    cost: cost,
    total_cost: totalCost,

    // Status and tracking
    status: status,
    type: "MERCHANDISE",

    // Payment information
    payment_method: paymentMethod,

    // Media and attachments
    media_order: Math.random() > 0.7 ? generateMediaOrderUrl() : "",

    // Cancellation (only for cancelled orders)
    cancel_reason: status === "cancelled" ? getRandomElement(CANCEL_REASONS) : "",

    // Ratings and feedback
    rated: status === "completed" ? Math.random() > 0.3 : false,

    // System fields
    deleted: false,
    created: createdDate,
    updated: createdDate,
  }

  return order
}

// Function to seed orders
async function seedOrders() {
  console.log("🌱 Starting orders seeding...")

  try {
    const ordersRef = collection(db, "orders")
    const numberOfOrders = 50 // Number of orders to create

    console.log(`📦 Creating ${numberOfOrders} sample orders...`)

    const orders = []
    for (let i = 0; i < numberOfOrders; i++) {
      const order = createOrder()
      orders.push(order)
    }

    // Add orders to Firestore
    let successCount = 0
    let errorCount = 0

    for (const order of orders) {
      try {
        await addDoc(ordersRef, order)
        successCount++
        console.log(`✅ Order ${successCount}/${numberOfOrders} created successfully`)
      } catch (error) {
        errorCount++
        console.error(`❌ Error creating order ${successCount + errorCount}:`, error.message)
      }
    }

    console.log("\n📊 Seeding Summary:")
    console.log(`✅ Successfully created: ${successCount} orders`)
    console.log(`❌ Failed to create: ${errorCount} orders`)
    console.log(`📈 Total orders in collection: ${successCount}`)

    // Display statistics
    console.log("\n📈 Order Statistics:")
    const statusCounts = {}
    const paymentMethodCounts = {}

    orders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
      paymentMethodCounts[order.payment_method] = (paymentMethodCounts[order.payment_method] || 0) + 1
    })

    console.log("\n📋 Orders by Status:")
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} orders`)
    })

    console.log("\n💳 Orders by Payment Method:")
    Object.entries(paymentMethodCounts).forEach(([method, count]) => {
      console.log(`  ${method}: ${count} orders`)
    })

    const totalRevenue = orders.reduce((sum, order) => sum + order.total_cost, 0)
    console.log(`\n💰 Total Revenue: ₱${totalRevenue.toLocaleString()}`)

    console.log("\n🎉 Orders seeding completed successfully!")
  } catch (error) {
    console.error("❌ Error during seeding:", error)
  }
}

// Function to create more realistic orders with better distribution
async function seedRealisticOrders() {
  console.log("🌱 Starting realistic orders seeding...")

  try {
    const ordersRef = collection(db, "orders")

    // Create orders with realistic patterns
    const orderPatterns = [
      // Recent orders (last 30 days) - mostly pending/processing
      { count: 15, statusWeights: { pending: 0.4, confirmed: 0.3, processing: 0.2, shipped: 0.1 }, daysBack: 30 },

      // Medium term orders (30-90 days) - mostly completed/delivered
      { count: 20, statusWeights: { delivered: 0.5, completed: 0.3, cancelled: 0.1, shipped: 0.1 }, daysBack: 90 },

      // Older orders (90-180 days) - mostly completed
      { count: 15, statusWeights: { completed: 0.7, delivered: 0.2, cancelled: 0.1 }, daysBack: 180 },
    ]

    let totalOrders = 0

    for (const pattern of orderPatterns) {
      console.log(`\n📦 Creating ${pattern.count} orders for ${pattern.daysBack} days back pattern...`)

      for (let i = 0; i < pattern.count; i++) {
        const customer = getRandomElement(SAMPLE_CUSTOMERS)
        const sellerId = getRandomElement(SAMPLE_SELLER_IDS)
        const productId = getRandomElement(SAMPLE_PRODUCT_IDS)

        // Select status based on weights
        const rand = Math.random()
        let cumulativeWeight = 0
        let selectedStatus = "pending"

        for (const [status, weight] of Object.entries(pattern.statusWeights)) {
          cumulativeWeight += weight
          if (rand <= cumulativeWeight) {
            selectedStatus = status
            break
          }
        }

        const quantity = getRandomNumber(1, 3)
        const cost = getRandomPrice(200, 1500)
        const totalCost = cost * quantity

        // Generate date within the specified range
        const now = new Date()
        const startDate = new Date(now.getTime() - pattern.daysBack * 24 * 60 * 60 * 1000)
        const endDate =
          pattern.daysBack === 30 ? now : new Date(now.getTime() - (pattern.daysBack - 30) * 24 * 60 * 60 * 1000)
        const createdDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))

        const order = {
          user_id: customer.id,
          username: customer.username,
          product_id: productId,
          product_owner: sellerId,
          seller_id: sellerId,
          quantity: quantity,
          cost: cost,
          total_cost: totalCost,
          status: selectedStatus,
          type: "MERCHANDISE",
          payment_method: getRandomElement(PAYMENT_METHODS),
          media_order: Math.random() > 0.8 ? generateMediaOrderUrl() : "",
          cancel_reason: selectedStatus === "cancelled" ? getRandomElement(CANCEL_REASONS) : "",
          rated: selectedStatus === "completed" ? Math.random() > 0.2 : false,
          deleted: false,
          created: createdDate,
          updated: createdDate,
        }

        await addDoc(ordersRef, order)
        totalOrders++
        console.log(`✅ Order ${totalOrders} created (${selectedStatus})`)
      }
    }

    console.log(`\n🎉 Successfully created ${totalOrders} realistic orders!`)
  } catch (error) {
    console.error("❌ Error during realistic seeding:", error)
  }
}

// Function to clear existing orders (use with caution!)
async function clearOrders() {
  console.log("🗑️  WARNING: This will delete ALL orders in the orders collection!")
  console.log("⏳ Waiting 5 seconds... Press Ctrl+C to cancel")

  await new Promise((resolve) => setTimeout(resolve, 5000))

  try {
    const ordersRef = collection(db, "orders")
    const snapshot = await getDocs(ordersRef)

    console.log(`🗑️  Deleting ${snapshot.size} existing orders...`)

    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref))
    await Promise.all(deletePromises)

    console.log("✅ All orders deleted successfully!")
  } catch (error) {
    console.error("❌ Error clearing orders:", error)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || "seed"

  switch (command) {
    case "seed":
      await seedOrders()
      break
    case "realistic":
      await seedRealisticOrders()
      break
    case "clear":
      await clearOrders()
      break
    default:
      console.log("Usage: node seed-orders.js [seed|realistic|clear]")
      console.log("  seed     - Create random sample orders")
      console.log("  realistic - Create orders with realistic patterns")
      console.log("  clear    - Delete all existing orders (DANGEROUS!)")
  }

  process.exit(0)
}

// Run the script
main().catch(console.error)
