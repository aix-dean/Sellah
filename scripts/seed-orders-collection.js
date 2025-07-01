// Comprehensive Orders Collection Seeding Script for Sellah
// This script creates realistic order data specifically for the orders page table

import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, deleteDoc, Timestamp } from "firebase/firestore"

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

// Order statuses with realistic distribution
const ORDER_STATUSES = [
  { status: "pending", weight: 0.15 },
  { status: "confirmed", weight: 0.12 },
  { status: "processing", weight: 0.1 },
  { status: "shipped", weight: 0.08 },
  { status: "delivered", weight: 0.25 },
  { status: "completed", weight: 0.25 },
  { status: "cancelled", weight: 0.05 },
]

// Payment methods with realistic distribution for Philippines
const PAYMENT_METHODS = [
  { method: "cash_on_delivery", weight: 0.4 },
  { method: "gcash", weight: 0.3 },
  { method: "bank_transfer", weight: 0.12 },
  { method: "credit_card", weight: 0.1 },
  { method: "maya", weight: 0.05 },
  { method: "paypal", weight: 0.03 },
]

// Realistic customer profiles for Philippines
const CUSTOMER_PROFILES = [
  {
    id: "cust_001",
    username: "juan_dela_cruz",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@gmail.com",
    phone: "+639171234567",
    location: "Manila",
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
    location: "Quezon City",
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
    location: "Makati",
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
    location: "Pasig",
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
    location: "Taguig",
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
    location: "Quezon City",
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
    location: "Pasig",
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
    location: "Las Piñas",
    orderFrequency: "low",
    preferredPayment: "paypal",
    avgOrderValue: 700,
  },
  {
    id: "cust_009",
    username: "diego_morales",
    name: "Diego Morales",
    email: "diego.morales@gmail.com",
    phone: "+639901234567",
    location: "Muntinlupa",
    orderFrequency: "medium",
    preferredPayment: "gcash",
    avgOrderValue: 1100,
  },
  {
    id: "cust_010",
    username: "elena_castro",
    name: "Elena Castro",
    email: "elena.castro@gmail.com",
    phone: "+639011234567",
    location: "Parañaque",
    orderFrequency: "high",
    preferredPayment: "credit_card",
    avgOrderValue: 2000,
  },
]

// Sample products catalog for printing business
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
  { id: "prod_016", name: "Signage 4x8 ft", price: 1200, category: "Printing", seller_id: "seller_001" },
  { id: "prod_017", name: "Letterhead Design", price: 800, category: "Design", seller_id: "seller_002" },
  { id: "prod_018", name: "Calendar Printing (100pcs)", price: 2000, category: "Printing", seller_id: "seller_003" },
  { id: "prod_019", name: "Packaging Design", price: 3000, category: "Design", seller_id: "seller_002" },
  { id: "prod_020", name: "Roll-up Banner", price: 1500, category: "Printing", seller_id: "seller_001" },
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

// Delivery methods
const DELIVERY_METHODS = [
  { method: "standard", weight: 0.6 },
  { method: "express", weight: 0.25 },
  { method: "same_day", weight: 0.1 },
  { method: "pickup", weight: 0.05 },
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
  const carriers = ["LBC", "JRS", "2GO", "GRAB", "LALAMOVE", "NINJAVAN", "SHOPEE"]
  const carrier = getRandomElement(carriers)
  const number = Math.random().toString().slice(2, 12)
  return `${carrier}${number}`
}

function generatePaymentReference(paymentMethod) {
  if (paymentMethod === "cash_on_delivery") return null

  const prefixes = {
    gcash: "GC",
    maya: "MY",
    bank_transfer: "BT",
    credit_card: "CC",
    paypal: "PP",
  }

  const prefix = prefixes[paymentMethod] || "PAY"
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString(36).substr(2, 6).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

// Generate shipping address based on customer location
function generateShippingAddress(customer) {
  const addresses = {
    Manila: {
      street: getRandomElement(["123 Rizal Street", "456 Taft Avenue", "789 España Boulevard", "321 Recto Avenue"]),
      barangay: getRandomElement(["Poblacion", "Ermita", "Malate", "Sampaloc"]),
      city: "Manila",
      province: "Metro Manila",
      postal_code: "1000",
    },
    "Quezon City": {
      street: getRandomElement(["147 Commonwealth Avenue", "258 Katipunan Avenue", "369 EDSA", "741 Quezon Avenue"]),
      barangay: getRandomElement(["Batasan Hills", "Loyola Heights", "Diliman", "Project 4"]),
      city: "Quezon City",
      province: "Metro Manila",
      postal_code: "1100",
    },
    Makati: {
      street: getRandomElement(["456 Ayala Avenue", "789 Gil Puyat Avenue", "123 Makati Avenue", "654 Paseo de Roxas"]),
      barangay: getRandomElement(["Bel-Air", "Salcedo Village", "Legazpi Village", "San Lorenzo"]),
      city: "Makati",
      province: "Metro Manila",
      postal_code: "1200",
    },
    Pasig: {
      street: getRandomElement(["654 C5 Road", "258 Ortigas Avenue", "147 Marcos Highway", "369 Caruncho Avenue"]),
      barangay: getRandomElement(["Ugong", "San Antonio", "Kapitolyo", "Rosario"]),
      city: "Pasig",
      province: "Metro Manila",
      postal_code: "1600",
    },
    Taguig: {
      street: getRandomElement(["987 McKinley Parkway", "456 C6 Road", "123 Lawton Avenue", "789 FTI Complex"]),
      barangay: getRandomElement(["Fort Bonifacio", "Bagumbayan", "Western Bicutan", "Signal Village"]),
      city: "Taguig",
      province: "Metro Manila",
      postal_code: "1630",
    },
    "Las Piñas": {
      street: getRandomElement(["369 Alabang-Zapote Road", "147 Real Street", "258 CAA Road", "741 Naga Road"]),
      barangay: getRandomElement(["Almanza Uno", "Talon Uno", "Pilar", "Pamplona Uno"]),
      city: "Las Piñas",
      province: "Metro Manila",
      postal_code: "1750",
    },
    Muntinlupa: {
      street: getRandomElement([
        "123 Alabang-Zapote Road",
        "456 National Road",
        "789 Commerce Avenue",
        "321 Corporate Center",
      ]),
      barangay: getRandomElement(["Alabang", "Tunasan", "Putatan", "Sucat"]),
      city: "Muntinlupa",
      province: "Metro Manila",
      postal_code: "1770",
    },
    Parañaque: {
      street: getRandomElement([
        "654 Sucat Road",
        "258 Dr. A. Santos Avenue",
        "147 Doña Soledad Avenue",
        "369 Ninoy Aquino Avenue",
      ]),
      barangay: getRandomElement(["Sucat", "BF Homes", "San Dionisio", "La Huerta"]),
      city: "Parañaque",
      province: "Metro Manila",
      postal_code: "1700",
    },
  }

  const locationData = addresses[customer.location] || addresses["Manila"]

  return {
    recipient_name: customer.name,
    phone: customer.phone,
    street: locationData.street,
    barangay: locationData.barangay,
    city: locationData.city,
    province: locationData.province,
    postal_code: locationData.postal_code,
    country: "Philippines",
    address_type: "home",
  }
}

// Generate order items
function generateOrderItems(customer) {
  const items = []
  const numItems = getRandomNumber(1, 3) // 1-3 items per order
  const selectedProducts = []

  for (let i = 0; i < numItems; i++) {
    let product
    do {
      product = getRandomElement(SAMPLE_PRODUCTS)
    } while (selectedProducts.includes(product.id))

    selectedProducts.push(product.id)

    const quantity = getRandomNumber(1, 2) // Usually 1-2 quantity for printing services
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
    specs.material = getRandomElement(["Vinyl", "Tarpaulin", "Paper", "Canvas", "PVC"])
    specs.finish = getRandomElement(["Matte", "Glossy", "Satin"])
    if (product.name.includes("Tarpaulin") || product.name.includes("Banner")) {
      specs.size = getRandomElement(["3x6 ft", "2x8 ft", "4x6 ft", "2x4 ft"])
    }
    if (product.name.includes("Cards") || product.name.includes("Flyers")) {
      specs.paper_type = getRandomElement(["Art Paper", "Bond Paper", "Cardstock"])
    }
  } else if (product.category === "Design") {
    specs.format = getRandomElement(["AI", "PSD", "PDF", "PNG", "JPG"])
    specs.revisions = getRandomNumber(2, 5)
    specs.delivery_format = getRandomElement(["Digital Only", "Print Ready", "Both"])
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
      ["Green", "Yellow"],
    ])
  }

  return specs
}

// Calculate shipping fee based on location and order value
function calculateShippingFee(shippingAddress, orderTotal, deliveryMethod) {
  const baseRates = {
    standard: 100,
    express: 200,
    same_day: 400,
    pickup: 0,
  }

  const baseRate = baseRates[deliveryMethod] || 100
  const isMetroManila = shippingAddress.province === "Metro Manila"
  const locationMultiplier = isMetroManila ? 1 : 1.5

  // Free shipping for orders over 2000
  if (orderTotal >= 2000 && deliveryMethod === "standard") return 0

  return Math.round(baseRate * locationMultiplier)
}

// Generate status history
function generateStatusHistory(status, createdDate, deliveryMethod) {
  const history = []
  const statusFlow = ["pending", "confirmed", "processing", "shipped", "delivered", "completed"]
  const currentIndex = statusFlow.indexOf(status)

  let currentDate = new Date(createdDate)

  for (let i = 0; i <= currentIndex; i++) {
    if (i > 0) {
      // Add realistic time between status changes based on delivery method
      let hoursToAdd
      if (deliveryMethod === "same_day") {
        hoursToAdd = getRandomNumber(1, 6)
      } else if (deliveryMethod === "express") {
        hoursToAdd = getRandomNumber(4, 24)
      } else {
        hoursToAdd = getRandomNumber(12, 48)
      }
      currentDate = new Date(currentDate.getTime() + hoursToAdd * 60 * 60 * 1000)
    }

    history.push({
      status: statusFlow[i],
      timestamp: Timestamp.fromDate(currentDate),
      note: getStatusNote(statusFlow[i]),
      updated_by: i === 0 ? "system" : getRandomElement(["seller_001", "seller_002", "seller_003"]),
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

// Generate comprehensive order
function generateOrder() {
  const customer = getRandomElement(CUSTOMER_PROFILES)
  const shippingAddress = generateShippingAddress(customer)
  const createdDate = generateRandomDate(90) // Orders from last 3 months

  // Generate order items
  const items = generateOrderItems(customer)
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)

  // Select delivery method
  const deliveryMethod = getWeightedRandomElement(DELIVERY_METHODS).method
  const shippingFee = calculateShippingFee(shippingAddress, subtotal, deliveryMethod)
  const tax = Math.round(subtotal * 0.12) // 12% VAT
  const totalAmount = subtotal + shippingFee + tax

  // Determine order status based on age and delivery method
  const daysSinceOrder = (new Date() - createdDate) / (1000 * 60 * 60 * 24)
  let status

  if (deliveryMethod === "same_day") {
    if (daysSinceOrder < 0.5) {
      status = getWeightedRandomElement([
        { status: "pending", weight: 0.5 },
        { status: "confirmed", weight: 0.5 },
      ]).status
    } else if (daysSinceOrder < 1) {
      status = getWeightedRandomElement([
        { status: "processing", weight: 0.3 },
        { status: "delivered", weight: 0.7 },
      ]).status
    } else {
      status = "completed"
    }
  } else if (deliveryMethod === "express") {
    if (daysSinceOrder < 1) {
      status = getWeightedRandomElement([
        { status: "pending", weight: 0.4 },
        { status: "confirmed", weight: 0.6 },
      ]).status
    } else if (daysSinceOrder < 3) {
      status = getWeightedRandomElement([
        { status: "processing", weight: 0.4 },
        { status: "shipped", weight: 0.6 },
      ]).status
    } else if (daysSinceOrder < 7) {
      status = getWeightedRandomElement([
        { status: "delivered", weight: 0.8 },
        { status: "completed", weight: 0.2 },
      ]).status
    } else {
      status = "completed"
    }
  } else {
    // Standard delivery
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
  }

  // Small chance of cancellation for recent orders
  if (daysSinceOrder < 2 && Math.random() < 0.03) {
    status = "cancelled"
  }

  // Select payment method
  const paymentMethod =
    Math.random() < 0.7 ? customer.preferredPayment : getWeightedRandomElement(PAYMENT_METHODS).method

  // Generate payment reference
  const paymentReference = generatePaymentReference(paymentMethod)

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
            timestamp: Timestamp.fromDate(new Date(createdDate.getTime() + getRandomNumber(1, 48) * 60 * 60 * 1000)),
            note: getRandomElement(CANCEL_REASONS),
            updated_by: Math.random() < 0.5 ? "customer" : "seller",
          },
        ]
      : generateStatusHistory(status, createdDate, deliveryMethod)

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
    payment_reference: paymentReference,

    // Shipping information
    shipping_address: shippingAddress,
    delivery_method: deliveryMethod,
    estimated_delivery:
      status === "shipped" || status === "delivered" || status === "completed"
        ? Timestamp.fromDate(new Date(createdDate.getTime() + getRandomNumber(1, 7) * 24 * 60 * 60 * 1000))
        : null,
    tracking_number:
      status === "shipped" || status === "delivered" || status === "completed" ? generateTrackingNumber() : null,

    // Order lifecycle
    status_history: statusHistory,
    created_at: Timestamp.fromDate(createdDate),
    updated_at: Timestamp.fromDate(statusHistory[statusHistory.length - 1].timestamp.toDate()),

    // Additional information
    special_instructions:
      Math.random() < 0.2
        ? getRandomElement([
            "Please call before delivery",
            "Leave at the gate if no one is home",
            "Fragile - handle with care",
            "Rush order - needed ASAP",
            "Gift wrapping requested",
            "Office hours delivery only",
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
            "Fast turnaround time, highly recommended!",
            "Perfect print quality, thank you!",
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
async function seedOrdersCollection() {
  console.log("🌱 Starting orders collection seeding for Sellah...")
  console.log("📊 This will create realistic order data for the orders page table")

  try {
    const ordersRef = collection(db, "orders")
    const numberOfOrders = 75 // Number of orders to create

    console.log(`📦 Creating ${numberOfOrders} realistic orders...`)

    const orders = []
    for (let i = 0; i < numberOfOrders; i++) {
      const order = generateOrder()
      orders.push(order)

      if ((i + 1) % 15 === 0) {
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

        if (successCount % 15 === 0) {
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
    const deliveryMethodCounts = {}
    const customerCounts = {}
    const monthlyCounts = {}
    let totalRevenue = 0
    let totalItems = 0

    orders.forEach((order) => {
      // Status distribution
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1

      // Payment method distribution
      paymentMethodCounts[order.payment_method] = (paymentMethodCounts[order.payment_method] || 0) + 1

      // Delivery method distribution
      deliveryMethodCounts[order.delivery_method] = (deliveryMethodCounts[order.delivery_method] || 0) + 1

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

    console.log("\n🚚 Orders by Delivery Method:")
    Object.entries(deliveryMethodCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([method, count]) => {
        const percentage = ((count / orders.length) * 100).toFixed(1)
        console.log(`  ${method.padEnd(15)}: ${count.toString().padStart(3)} orders (${percentage}%)`)
      })

    console.log("\n👥 Top Customers:")
    Object.entries(customerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
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
      const ratedOrders = completedOrders.filter((o) => o.customer_rating)
      if (ratedOrders.length > 0) {
        const avgRating = ratedOrders.reduce((sum, o) => sum + o.customer_rating, 0) / ratedOrders.length
        console.log(`  Average Customer Rating: ${avgRating.toFixed(1)}/5 (${ratedOrders.length} ratings)`)
      }
    }

    console.log("\n🎉 Orders collection seeding completed successfully!")
    console.log("📝 The generated orders include:")
    console.log("   • Realistic customer profiles with Philippine addresses")
    console.log("   • Multiple items per order with detailed specifications")
    console.log("   • Complete status history and tracking information")
    console.log("   • Proper pricing with taxes and shipping fees")
    console.log("   • Payment information and references")
    console.log("   • Customer ratings and reviews")
    console.log("   • Realistic delivery methods and timeframes")
    console.log("   • Cancellation handling with reasons")
    console.log("\n🔍 You can now view these orders in your orders page table!")
  } catch (error) {
    console.error("❌ Error during orders collection seeding:", error)
  }
}

// Function to clear existing orders
async function clearOrdersCollection() {
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

// Function to seed orders with different patterns
async function seedOrdersWithPatterns() {
  console.log("🌱 Starting pattern-based orders seeding...")

  try {
    const patterns = [
      // Recent orders (last 7 days) - mostly pending/processing
      {
        name: "Recent Orders",
        count: 20,
        daysBack: 7,
        statusWeights: {
          pending: 0.35,
          confirmed: 0.25,
          processing: 0.2,
          shipped: 0.15,
          delivered: 0.05,
        },
      },
      // Medium term (7-30 days) - mixed statuses
      {
        name: "Medium Term Orders",
        count: 30,
        daysBack: 30,
        statusWeights: {
          processing: 0.1,
          shipped: 0.15,
          delivered: 0.35,
          completed: 0.35,
          cancelled: 0.05,
        },
      },
      // Older orders (30-90 days) - mostly completed
      {
        name: "Older Orders",
        count: 25,
        daysBack: 90,
        statusWeights: {
          delivered: 0.2,
          completed: 0.7,
          cancelled: 0.1,
        },
      },
    ]

    const ordersRef = collection(db, "orders")
    let totalCreated = 0

    for (const pattern of patterns) {
      console.log(`\n📦 Creating ${pattern.count} ${pattern.name}...`)

      for (let i = 0; i < pattern.count; i++) {
        const customer = getRandomElement(CUSTOMER_PROFILES)
        const shippingAddress = generateShippingAddress(customer)

        // Generate date within pattern range
        const now = new Date()
        const startDate = new Date(now.getTime() - pattern.daysBack * 24 * 60 * 60 * 1000)
        const endDate =
          pattern.daysBack === 7 ? now : new Date(now.getTime() - (pattern.daysBack - 7) * 24 * 60 * 60 * 1000)
        const createdDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))

        // Select status based on pattern weights
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

        // Generate order items
        const items = generateOrderItems(customer)
        const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
        const deliveryMethod = getWeightedRandomElement(DELIVERY_METHODS).method
        const shippingFee = calculateShippingFee(shippingAddress, subtotal, deliveryMethod)
        const tax = Math.round(subtotal * 0.12)
        const totalAmount = subtotal + shippingFee + tax

        const paymentMethod =
          Math.random() < 0.7 ? customer.preferredPayment : getWeightedRandomElement(PAYMENT_METHODS).method

        const statusHistory =
          selectedStatus === "cancelled"
            ? [
                {
                  status: "pending",
                  timestamp: Timestamp.fromDate(createdDate),
                  note: "Order received and awaiting confirmation",
                  updated_by: "system",
                },
                {
                  status: "cancelled",
                  timestamp: Timestamp.fromDate(
                    new Date(createdDate.getTime() + getRandomNumber(1, 24) * 60 * 60 * 1000),
                  ),
                  note: getRandomElement(CANCEL_REASONS),
                  updated_by: Math.random() < 0.5 ? "customer" : "seller",
                },
              ]
            : generateStatusHistory(selectedStatus, createdDate, deliveryMethod)

        const order = {
          order_number: generateOrderNumber(),
          order_id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          customer_id: customer.id,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          username: customer.username,
          items: items,
          subtotal: subtotal,
          shipping_fee: shippingFee,
          tax_amount: tax,
          total_amount: totalAmount,
          currency: "PHP",
          status: selectedStatus,
          order_type: "MERCHANDISE",
          priority: getRandomElement(["normal", "high", "urgent"]),
          payment_method: paymentMethod,
          payment_status:
            selectedStatus === "cancelled" ? "cancelled" : selectedStatus === "pending" ? "pending" : "paid",
          payment_reference: generatePaymentReference(paymentMethod),
          shipping_address: shippingAddress,
          delivery_method: deliveryMethod,
          estimated_delivery:
            selectedStatus === "shipped" || selectedStatus === "delivered" || selectedStatus === "completed"
              ? Timestamp.fromDate(new Date(createdDate.getTime() + getRandomNumber(1, 7) * 24 * 60 * 60 * 1000))
              : null,
          tracking_number:
            selectedStatus === "shipped" || selectedStatus === "delivered" || selectedStatus === "completed"
              ? generateTrackingNumber()
              : null,
          status_history: statusHistory,
          created_at: Timestamp.fromDate(createdDate),
          updated_at: Timestamp.fromDate(statusHistory[statusHistory.length - 1].timestamp.toDate()),
          special_instructions:
            Math.random() < 0.2
              ? getRandomElement([
                  "Please call before delivery",
                  "Leave at the gate if no one is home",
                  "Fragile - handle with care",
                  "Rush order - needed ASAP",
                  "Gift wrapping requested",
                ])
              : "",
          primary_seller_id: items[0].seller_id,
          multiple_sellers: items.length > 1 && new Set(items.map((item) => item.seller_id)).size > 1,
          customer_rating: selectedStatus === "completed" && Math.random() < 0.8 ? getRandomNumber(3, 5) : null,
          customer_review:
            selectedStatus === "completed" && Math.random() < 0.4
              ? getRandomElement([
                  "Great quality and fast delivery!",
                  "Exactly what I ordered. Very satisfied.",
                  "Good service, will order again.",
                  "Product quality could be better.",
                  "Excellent work and professional service.",
                ])
              : "",
          deleted: false,
          version: 1,
          source: "web",
          cancel_reason:
            selectedStatus === "cancelled" ? statusHistory.find((h) => h.status === "cancelled")?.note || "" : "",
          cancelled_by:
            selectedStatus === "cancelled" ? statusHistory.find((h) => h.status === "cancelled")?.updated_by || "" : "",
          cancelled_at:
            selectedStatus === "cancelled"
              ? statusHistory.find((h) => h.status === "cancelled")?.timestamp || null
              : null,
        }

        await addDoc(ordersRef, order)
        totalCreated++

        if (totalCreated % 10 === 0) {
          console.log(`✅ Created ${totalCreated} orders so far...`)
        }
      }
    }

    console.log(`\n🎉 Successfully created ${totalCreated} orders with realistic patterns!`)
  } catch (error) {
    console.error("❌ Error during pattern-based seeding:", error)
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || "seed"

  switch (command) {
    case "seed":
      await seedOrdersCollection()
      break
    case "patterns":
      await seedOrdersWithPatterns()
      break
    case "clear":
      await clearOrdersCollection()
      break
    default:
      console.log("Usage: node seed-orders-collection.js [seed|patterns|clear]")
      console.log("  seed     - Create comprehensive sample orders")
      console.log("  patterns - Create orders with realistic time-based patterns")
      console.log("  clear    - Delete all existing orders (DANGEROUS!)")
  }

  process.exit(0)
}

// Run the script
main().catch(console.error)
