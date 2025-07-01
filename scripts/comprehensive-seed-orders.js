// Comprehensive Orders Collection Seeding Script for Sellah
// This script creates realistic order data with detailed customer information, shipping addresses, and order items

import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, Timestamp, deleteDoc } from "firebase/firestore"

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

// Order statuses with realistic progression
const ORDER_STATUSES = [
  { status: "pending", weight: 0.15 },
  { status: "confirmed", weight: 0.12 },
  { status: "processing", weight: 0.1 },
  { status: "shipped", weight: 0.08 },
  { status: "delivered", weight: 0.25 },
  { status: "completed", weight: 0.25 },
  { status: "cancelled", weight: 0.05 },
]

// Payment methods with realistic distribution
const PAYMENT_METHODS = [
  { method: "cash_on_delivery", weight: 0.35 },
  { method: "gcash", weight: 0.3 },
  { method: "bank_transfer", weight: 0.15 },
  { method: "credit_card", weight: 0.12 },
  { method: "paypal", weight: 0.05 },
  { method: "maya", weight: 0.03 },
]

// Comprehensive customer profiles with realistic Philippine data
const CUSTOMER_PROFILES = [
  {
    id: "cust_001",
    username: "juan_dela_cruz",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@gmail.com",
    phone: "+639171234567",
    addresses: [
      {
        type: "home",
        street: "123 Rizal Street",
        barangay: "Poblacion",
        city: "Manila",
        province: "Metro Manila",
        postal_code: "1000",
        country: "Philippines",
        is_default: true,
      },
      {
        type: "office",
        street: "456 Ayala Avenue",
        barangay: "Bel-Air",
        city: "Makati",
        province: "Metro Manila",
        postal_code: "1226",
        country: "Philippines",
        is_default: false,
      },
    ],
    orderFrequency: "high",
    preferredPayment: "gcash",
    avgOrderValue: 1500,
  },
  {
    id: "cust_002",
    username: "maria_santos",
    name: "Maria Santos",
    email: "maria.santos@yahoo.com",
    phone: "+639281234567",
    addresses: [
      {
        type: "home",
        street: "789 Commonwealth Avenue",
        barangay: "Batasan Hills",
        city: "Quezon City",
        province: "Metro Manila",
        postal_code: "1126",
        country: "Philippines",
        is_default: true,
      },
    ],
    orderFrequency: "medium",
    preferredPayment: "cash_on_delivery",
    avgOrderValue: 800,
  },
  {
    id: "cust_003",
    username: "pedro_garcia",
    name: "Pedro Garcia",
    email: "pedro.garcia@outlook.com",
    phone: "+639391234567",
    addresses: [
      {
        type: "home",
        street: "321 EDSA",
        barangay: "Guadalupe Nuevo",
        city: "Makati",
        province: "Metro Manila",
        postal_code: "1212",
        country: "Philippines",
        is_default: true,
      },
    ],
    orderFrequency: "high",
    preferredPayment: "credit_card",
    avgOrderValue: 2500,
  },
  {
    id: "cust_004",
    username: "ana_reyes",
    name: "Ana Reyes",
    email: "ana.reyes@gmail.com",
    phone: "+639451234567",
    addresses: [
      {
        type: "home",
        street: "654 C5 Road",
        barangay: "Ugong",
        city: "Pasig",
        province: "Metro Manila",
        postal_code: "1604",
        country: "Philippines",
        is_default: true,
      },
    ],
    orderFrequency: "low",
    preferredPayment: "bank_transfer",
    avgOrderValue: 600,
  },
  {
    id: "cust_005",
    username: "carlos_lopez",
    name: "Carlos Lopez",
    email: "carlos.lopez@gmail.com",
    phone: "+639561234567",
    addresses: [
      {
        type: "home",
        street: "987 McKinley Parkway",
        barangay: "Fort Bonifacio",
        city: "Taguig",
        province: "Metro Manila",
        postal_code: "1634",
        country: "Philippines",
        is_default: true,
      },
    ],
    orderFrequency: "medium",
    preferredPayment: "gcash",
    avgOrderValue: 1200,
  },
  {
    id: "cust_006",
    username: "sofia_martinez",
    name: "Sofia Martinez",
    email: "sofia.martinez@gmail.com",
    phone: "+639671234567",
    addresses: [
      {
        type: "home",
        street: "147 Katipunan Avenue",
        barangay: "Loyola Heights",
        city: "Quezon City",
        province: "Metro Manila",
        postal_code: "1108",
        country: "Philippines",
        is_default: true,
      },
    ],
    orderFrequency: "high",
    preferredPayment: "maya",
    avgOrderValue: 1800,
  },
  {
    id: "cust_007",
    username: "miguel_torres",
    name: "Miguel Torres",
    email: "miguel.torres@yahoo.com",
    phone: "+639781234567",
    addresses: [
      {
        type: "home",
        street: "258 Ortigas Avenue",
        barangay: "San Antonio",
        city: "Pasig",
        province: "Metro Manila",
        postal_code: "1605",
        country: "Philippines",
        is_default: true,
      },
    ],
    orderFrequency: "medium",
    preferredPayment: "cash_on_delivery",
    avgOrderValue: 950,
  },
  {
    id: "cust_008",
    username: "lucia_flores",
    name: "Lucia Flores",
    email: "lucia.flores@gmail.com",
    phone: "+639891234567",
    addresses: [
      {
        type: "home",
        street: "369 Alabang-Zapote Road",
        barangay: "Almanza Uno",
        city: "Las Piñas",
        province: "Metro Manila",
        postal_code: "1750",
        country: "Philippines",
        is_default: true,
      },
    ],
    orderFrequency: "low",
    preferredPayment: "paypal",
    avgOrderValue: 700,
  },
]

// Sample product catalog with realistic pricing
const SAMPLE_PRODUCTS = [
  { id: "prod_001", name: "Custom Tarpaulin 3x6 ft", price: 450, category: "Printing", seller_id: "seller_001" },
  { id: "prod_002", name: "Business Cards (500pcs)", price: 350, category: "Printing", seller_id: "seller_001" },
  { id: "prod_003", name: "Wedding Invitation Set", price: 1200, category: "Printing", seller_id: "seller_002" },
  { id: "prod_004", name: "Vinyl Stickers 2x4 ft", price: 280, category: "Printing", seller_id: "seller_001" },
  { id: "prod_005", name: "Photo Canvas 16x20 inches", price: 850, category: "Printing", seller_id: "seller_003" },
  { id: "prod_006", name: "Corporate Brochure Design", price: 2500, category: "Design", seller_id: "seller_002" },
  { id: "prod_007", name: "Logo Design Package", price: 3500, category: "Design", seller_id: "seller_002" },
  { id: "prod_008", name: "T-shirt Printing (10pcs)", price: 1500, category: "Apparel", seller_id: "seller_003" },
  { id: "prod_009", name: "Mug Printing (6pcs)", price: 900, category: "Merchandise", seller_id: "seller_003" },
  { id: "prod_010", name: "Banner 2x8 ft", price: 650, category: "Printing", seller_id: "seller_001" },
  { id: "prod_011", name: "Flyers (1000pcs)", price: 400, category: "Printing", seller_id: "seller_001" },
  { id: "prod_012", name: "Photo Book 20 pages", price: 750, category: "Printing", seller_id: "seller_003" },
  { id: "prod_013", name: "Car Decal Set", price: 1800, category: "Automotive", seller_id: "seller_002" },
  { id: "prod_014", name: "Poster Printing A1 Size", price: 180, category: "Printing", seller_id: "seller_001" },
  { id: "prod_015", name: "ID Lace with Logo", price: 250, category: "Merchandise", seller_id: "seller_003" },
]

// Cancellation reasons
const CANCEL_REASONS = [
  "Customer requested cancellation",
  "Out of stock",
  "Payment failed",
  "Shipping address invalid",
  "Product defect reported",
  "Customer changed mind",
  "Duplicate order",
  "Price error",
  "Delivery delay",
  "Customer unavailable",
]

// Helper functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function getWeightedRandomElement(weightedArray) {
  const totalWeight = weightedArray.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight

  for (const item of weightedArray) {
    random -= item.weight
    if (random <= 0) {
      return item
    }
  }
  return weightedArray[0]
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateRandomDate(daysBack) {
  const now = new Date()
  const pastDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime())
  return new Date(randomTime)
}

function generateOrderNumber() {
  const prefix = "ORD"
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `${prefix}-${timestamp}${random}`
}

function generateTrackingNumber() {
  const carriers = ["LBC", "JRS", "2GO", "GRAB", "LALAMOVE"]
  const carrier = getRandomElement(carriers)
  const number = Math.random().toString().slice(2, 12)
  return `${carrier}${number}`
}

// Generate order status history
function generateStatusHistory(status, createdDate) {
  const history = []
  const statusFlow = ["pending", "confirmed", "processing", "shipped", "delivered", "completed"]
  const currentIndex = statusFlow.indexOf(status)

  let currentDate = new Date(createdDate)

  for (let i = 0; i <= currentIndex; i++) {
    if (i > 0) {
      // Add random hours between status changes
      const hoursToAdd = getRandomNumber(2, 48)
      currentDate = new Date(currentDate.getTime() + hoursToAdd * 60 * 60 * 1000)
    }

    history.push({
      status: statusFlow[i],
      timestamp: Timestamp.fromDate(currentDate),
      note: getStatusNote(statusFlow[i]),
      updated_by: i === 0 ? "system" : "seller_001",
    })
  }

  return history
}

function getStatusNote(status) {
  const notes = {
    pending: "Order received and awaiting confirmation",
    confirmed: "Order confirmed by seller",
    processing: "Order is being prepared",
    shipped: "Order has been shipped",
    delivered: "Order delivered to customer",
    completed: "Order completed successfully",
    cancelled: "Order has been cancelled",
  }
  return notes[status] || "Status updated"
}

// Generate order items
function generateOrderItems(customer) {
  const items = []
  const numItems = getRandomNumber(1, 4) // 1-4 items per order
  const selectedProducts = []

  for (let i = 0; i < numItems; i++) {
    let product
    do {
      product = getRandomElement(SAMPLE_PRODUCTS)
    } while (selectedProducts.includes(product.id))

    selectedProducts.push(product.id)

    const quantity = getRandomNumber(1, 3)
    const unitPrice = product.price
    const totalPrice = unitPrice * quantity

    items.push({
      product_id: product.id,
      product_name: product.name,
      quantity: quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      seller_id: product.seller_id,
      specifications: generateProductSpecifications(product),
    })
  }

  return items
}

function generateProductSpecifications(product) {
  const specs = {}

  if (product.category === "Printing") {
    specs.material = getRandomElement(["Vinyl", "Tarpaulin", "Paper", "Canvas"])
    specs.finish = getRandomElement(["Matte", "Glossy", "Satin"])
    if (product.name.includes("Tarpaulin") || product.name.includes("Banner")) {
      specs.size = getRandomElement(["3x6 ft", "2x8 ft", "4x6 ft", "2x4 ft"])
    }
  } else if (product.category === "Design") {
    specs.format = getRandomElement(["AI", "PSD", "PDF", "PNG"])
    specs.revisions = getRandomNumber(2, 5)
  } else if (product.category === "Apparel") {
    specs.sizes = getRandomElement([
      ["S", "M", "L"],
      ["M", "L", "XL"],
      ["XS", "S", "M", "L"],
    ])
    specs.colors = getRandomElement([
      ["Black", "White"],
      ["Navy", "Gray"],
      ["Red", "Blue"],
    ])
  }

  return specs
}

// Calculate shipping fee based on location and order value
function calculateShippingFee(shippingAddress, orderTotal) {
  const baseRate = 100
  const isMetroManila = shippingAddress.province === "Metro Manila"
  const locationMultiplier = isMetroManila ? 1 : 1.5

  // Free shipping for orders over 2000
  if (orderTotal >= 2000) return 0

  return Math.round(baseRate * locationMultiplier)
}

// Generate comprehensive order
function generateOrder() {
  const customer = getRandomElement(CUSTOMER_PROFILES)
  const shippingAddress = getRandomElement(customer.addresses)
  const createdDate = generateRandomDate(180) // Orders from last 6 months

  // Generate order items
  const items = generateOrderItems(customer)
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
  const shippingFee = calculateShippingFee(shippingAddress, subtotal)
  const tax = Math.round(subtotal * 0.12) // 12% VAT
  const totalAmount = subtotal + shippingFee + tax

  // Determine order status based on age
  const daysSinceOrder = (new Date() - createdDate) / (1000 * 60 * 60 * 24)
  let status

  if (daysSinceOrder < 1) {
    status = getWeightedRandomElement([
      { status: "pending", weight: 0.7 },
      { status: "confirmed", weight: 0.3 },
    ]).status
  } else if (daysSinceOrder < 3) {
    status = getWeightedRandomElement([
      { status: "confirmed", weight: 0.4 },
      { status: "processing", weight: 0.6 },
    ]).status
  } else if (daysSinceOrder < 7) {
    status = getWeightedRandomElement([
      { status: "processing", weight: 0.3 },
      { status: "shipped", weight: 0.7 },
    ]).status
  } else if (daysSinceOrder < 14) {
    status = getWeightedRandomElement([
      { status: "shipped", weight: 0.2 },
      { status: "delivered", weight: 0.8 },
    ]).status
  } else {
    status = getWeightedRandomElement([
      { status: "delivered", weight: 0.3 },
      { status: "completed", weight: 0.7 },
    ]).status
  }

  // Small chance of cancellation
  if (Math.random() < 0.05) {
    status = "cancelled"
  }

  // Select payment method
  const paymentMethod =
    Math.random() < 0.7 ? customer.preferredPayment : getWeightedRandomElement(PAYMENT_METHODS).method

  // Generate status history
  const statusHistory =
    status === "cancelled"
      ? [
          {
            status: "pending",
            timestamp: Timestamp.fromDate(createdDate),
            note: "Order received and awaiting confirmation",
            updated_by: "system",
          },
          {
            status: "cancelled",
            timestamp: Timestamp.fromDate(new Date(createdDate.getTime() + getRandomNumber(1, 72) * 60 * 60 * 1000)),
            note: getRandomElement(CANCEL_REASONS),
            updated_by: Math.random() < 0.5 ? "customer" : "seller",
          },
        ]
      : generateStatusHistory(status, createdDate)

  const order = {
    // Order identification
    order_number: generateOrderNumber(),
    order_id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

    // Customer information
    customer_id: customer.id,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    username: customer.username,

    // Order items and pricing
    items: items,
    subtotal: subtotal,
    shipping_fee: shippingFee,
    tax_amount: tax,
    total_amount: totalAmount,
    currency: "PHP",

    // Order status and tracking
    status: status,
    order_type: "MERCHANDISE",
    priority: getRandomElement(["normal", "high", "urgent"]),

    // Payment information
    payment_method: paymentMethod,
    payment_status: status === "cancelled" ? "cancelled" : status === "pending" ? "pending" : "paid",
    payment_reference:
      paymentMethod !== "cash_on_delivery"
        ? `PAY${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        : null,

    // Shipping information
    shipping_address: {
      recipient_name: customer.name,
      phone: customer.phone,
      street: shippingAddress.street,
      barangay: shippingAddress.barangay,
      city: shippingAddress.city,
      province: shippingAddress.province,
      postal_code: shippingAddress.postal_code,
      country: shippingAddress.country,
      address_type: shippingAddress.type,
    },

    delivery_method: getRandomElement(["standard", "express", "same_day"]),
    estimated_delivery:
      status === "shipped" || status === "delivered" || status === "completed"
        ? Timestamp.fromDate(new Date(createdDate.getTime() + getRandomNumber(3, 7) * 24 * 60 * 60 * 1000))
        : null,
    tracking_number:
      status === "shipped" || status === "delivered" || status === "completed" ? generateTrackingNumber() : null,

    // Order lifecycle
    status_history: statusHistory,
    created_at: Timestamp.fromDate(createdDate),
    updated_at: Timestamp.fromDate(statusHistory[statusHistory.length - 1].timestamp.toDate()),

    // Additional information
    special_instructions:
      Math.random() < 0.3
        ? getRandomElement([
            "Please call before delivery",
            "Leave at the gate if no one is home",
            "Fragile - handle with care",
            "Rush order - needed ASAP",
            "Gift wrapping requested",
          ])
        : "",

    // Seller information
    primary_seller_id: items[0].seller_id,
    multiple_sellers: items.length > 1 && new Set(items.map((item) => item.seller_id)).size > 1,

    // Ratings and feedback
    customer_rating: status === "completed" && Math.random() < 0.8 ? getRandomNumber(3, 5) : null,
    customer_review:
      status === "completed" && Math.random() < 0.4
        ? getRandomElement([
            "Great quality and fast delivery!",
            "Exactly what I ordered. Very satisfied.",
            "Good service, will order again.",
            "Product quality could be better.",
            "Excellent work and professional service.",
          ])
        : "",

    // System fields
    deleted: false,
    version: 1,
    source: "web",

    // Cancel information (if applicable)
    cancel_reason: status === "cancelled" ? statusHistory.find((h) => h.status === "cancelled")?.note || "" : "",
    cancelled_by: status === "cancelled" ? statusHistory.find((h) => h.status === "cancelled")?.updated_by || "" : "",
    cancelled_at:
      status === "cancelled" ? statusHistory.find((h) => h.status === "cancelled")?.timestamp || null : null,
  }

  return order
}

// Main seeding function
async function seedComprehensiveOrders() {
  console.log("🌱 Starting comprehensive orders seeding...")
  console.log("📊 This will create realistic orders with detailed information")

  try {
    const ordersRef = collection(db, "orders")
    const numberOfOrders = 100 // Number of orders to create

    console.log(`📦 Creating ${numberOfOrders} comprehensive orders...`)

    const orders = []
    for (let i = 0; i < numberOfOrders; i++) {
      const order = generateOrder()
      orders.push(order)

      if ((i + 1) % 10 === 0) {
        console.log(`📝 Generated ${i + 1}/${numberOfOrders} orders...`)
      }
    }

    // Add orders to Firestore
    console.log("\n💾 Saving orders to database...")
    let successCount = 0
    let errorCount = 0

    for (const order of orders) {
      try {
        await addDoc(ordersRef, order)
        successCount++

        if (successCount % 20 === 0) {
          console.log(`✅ Saved ${successCount}/${numberOfOrders} orders`)
        }
      } catch (error) {
        errorCount++
        console.error(`❌ Error creating order ${successCount + errorCount}:`, error.message)
      }
    }

    // Generate comprehensive statistics
    console.log("\n📊 Seeding Summary:")
    console.log(`✅ Successfully created: ${successCount} orders`)
    console.log(`❌ Failed to create: ${errorCount} orders`)

    // Analyze the generated data
    const statusCounts = {}
    const paymentMethodCounts = {}
    const customerCounts = {}
    const monthlyCounts = {}
    let totalRevenue = 0
    let totalItems = 0

    orders.forEach((order) => {
      // Status distribution
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1

      // Payment method distribution
      paymentMethodCounts[order.payment_method] = (paymentMethodCounts[order.payment_method] || 0) + 1

      // Customer distribution
      customerCounts[order.customer_name] = (customerCounts[order.customer_name] || 0) + 1

      // Monthly distribution
      const month = order.created_at.toDate().toISOString().slice(0, 7)
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1

      // Revenue and items
      totalRevenue += order.total_amount
      totalItems += order.items.length
    })

    console.log("\n📈 Detailed Statistics:")

    console.log("\n📋 Orders by Status:")
    Object.entries(statusCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([status, count]) => {
        const percentage = ((count / orders.length) * 100).toFixed(1)
        console.log(`  ${status.padEnd(12)}: ${count.toString().padStart(3)} orders (${percentage}%)`)
      })

    console.log("\n💳 Orders by Payment Method:")
    Object.entries(paymentMethodCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([method, count]) => {
        const percentage = ((count / orders.length) * 100).toFixed(1)
        console.log(`  ${method.padEnd(20)}: ${count.toString().padStart(3)} orders (${percentage}%)`)
      })

    console.log("\n👥 Orders by Customer:")
    Object.entries(customerCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([customer, count]) => {
        console.log(`  ${customer.padEnd(20)}: ${count.toString().padStart(3)} orders`)
      })

    console.log("\n📅 Orders by Month:")
    Object.entries(monthlyCounts)
      .sort()
      .forEach(([month, count]) => {
        console.log(`  ${month}: ${count.toString().padStart(3)} orders`)
      })

    console.log("\n💰 Financial Summary:")
    console.log(`  Total Revenue: ₱${totalRevenue.toLocaleString()}`)
    console.log(`  Average Order Value: ₱${Math.round(totalRevenue / orders.length).toLocaleString()}`)
    console.log(`  Total Items Sold: ${totalItems.toLocaleString()}`)
    console.log(`  Average Items per Order: ${(totalItems / orders.length).toFixed(1)}`)

    const completedOrders = orders.filter((o) => o.status === "completed")
    if (completedOrders.length > 0) {
      const avgRating =
        completedOrders.filter((o) => o.customer_rating).reduce((sum, o) => sum + o.customer_rating, 0) /
        completedOrders.filter((o) => o.customer_rating).length
      console.log(`  Average Customer Rating: ${avgRating.toFixed(1)}/5`)
    }

    console.log("\n🎉 Comprehensive orders seeding completed successfully!")
    console.log("📝 The generated orders include:")
    console.log("   • Realistic customer profiles with addresses")
    console.log("   • Multiple items per order with specifications")
    console.log("   • Complete status history and tracking")
    console.log("   • Proper pricing with taxes and shipping")
    console.log("   • Payment information and references")
    console.log("   • Customer ratings and reviews")
    console.log("   • Cancellation handling")
  } catch (error) {
    console.error("❌ Error during comprehensive seeding:", error)
  }
}

// Function to clear existing orders
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
      await seedComprehensiveOrders()
      break
    case "clear":
      await clearOrders()
      break
    default:
      console.log("Usage: node comprehensive-seed-orders.js [seed|clear]")
      console.log("  seed  - Create comprehensive sample orders")
      console.log("  clear - Delete all existing orders (DANGEROUS!)")
  }

  process.exit(0)
}

// Run the script
main().catch(console.error)
