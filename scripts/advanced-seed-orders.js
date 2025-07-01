// Advanced Orders Seeding Script with Real Product Integration
import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBByUHvQmjYdalF2C1UIpzn-onB3iXGMhc",
  authDomain: "oh-app-bcf24.firebaseapp.com",
  projectId: "oh-app-bcf24",
  storageBucket: "oh-app-bcf24.appspot.com",
  messagingSenderId: "272363630855",
  appId: "1:272363630855:web:820601c723e85625d915a2",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Enhanced customer profiles with more realistic data
const CUSTOMER_PROFILES = [
  {
    id: "cust_001",
    username: "juan_dela_cruz",
    name: "Juan Dela Cruz",
    location: "Manila",
    orderFrequency: "high", // high, medium, low
    preferredPayment: "gcash",
    avgOrderValue: 1500,
  },
  {
    id: "cust_002",
    username: "maria_santos",
    name: "Maria Santos",
    location: "Quezon City",
    orderFrequency: "medium",
    preferredPayment: "cash_on_delivery",
    avgOrderValue: 800,
  },
  {
    id: "cust_003",
    username: "pedro_garcia",
    name: "Pedro Garcia",
    location: "Makati",
    orderFrequency: "high",
    preferredPayment: "credit_card",
    avgOrderValue: 2500,
  },
  {
    id: "cust_004",
    username: "ana_reyes",
    name: "Ana Reyes",
    location: "Pasig",
    orderFrequency: "low",
    preferredPayment: "bank_transfer",
    avgOrderValue: 600,
  },
  {
    id: "cust_005",
    username: "carlos_lopez",
    name: "Carlos Lopez",
    location: "Taguig",
    orderFrequency: "medium",
    preferredPayment: "gcash",
    avgOrderValue: 1200,
  },
]

// Business scenarios for realistic order patterns
const BUSINESS_SCENARIOS = {
  // Holiday season boost
  holiday_rush: {
    multiplier: 2.5,
    statusDistribution: { pending: 0.3, confirmed: 0.4, processing: 0.2, shipped: 0.1 },
    months: [11, 12], // November, December
  },

  // Regular business
  normal_period: {
    multiplier: 1.0,
    statusDistribution: { pending: 0.2, confirmed: 0.2, processing: 0.2, shipped: 0.1, delivered: 0.2, completed: 0.1 },
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },

  // Slow period
  slow_period: {
    multiplier: 0.6,
    statusDistribution: { pending: 0.1, confirmed: 0.1, processing: 0.1, delivered: 0.3, completed: 0.4 },
    months: [1, 2], // January, February (post-holiday)
  },
}

// Function to fetch real products from Firestore
async function fetchRealProducts() {
  console.log("📦 Fetching real products from database...")

  try {
    const productsRef = collection(db, "products")
    const q = query(
      productsRef,
      where("type", "in", ["MERCHANDISE", "Merchandise"]),
      where("active", "==", true),
      where("deleted", "==", false),
    )

    const snapshot = await getDocs(q)
    const products = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      products.push({
        id: doc.id,
        name: data.name,
        price: data.price,
        seller_id: data.seller_id,
        stock: data.stock || 0,
      })
    })

    console.log(`✅ Found ${products.length} real products`)
    return products
  } catch (error) {
    console.error("❌ Error fetching products:", error)
    return []
  }
}

// Function to fetch real sellers
async function fetchRealSellers() {
  console.log("👥 Fetching real sellers from database...")

  try {
    const usersRef = collection(db, "iboard_users")
    const q = query(usersRef, where("type", "==", "SELLAH"))

    const snapshot = await getDocs(q)
    const sellers = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      sellers.push({
        id: doc.id,
        name: data.display_name || `${data.first_name} ${data.last_name}`,
        email: data.email,
      })
    })

    console.log(`✅ Found ${sellers.length} real sellers`)
    return sellers
  } catch (error) {
    console.error("❌ Error fetching sellers:", error)
    return []
  }
}

// Generate orders based on customer behavior
function generateCustomerOrders(customer, products, timeframe) {
  const orders = []
  const { orderFrequency, preferredPayment, avgOrderValue } = customer

  // Determine number of orders based on frequency
  const baseOrderCount = {
    high: 8,
    medium: 4,
    low: 2,
  }

  const orderCount = Math.floor(baseOrderCount[orderFrequency] * Math.random() * 1.5)

  for (let i = 0; i < orderCount; i++) {
    const product = products[Math.floor(Math.random() * products.length)]
    if (!product) continue

    // Generate realistic quantity based on product price
    const maxQty = product.price > 1000 ? 2 : product.price > 500 ? 3 : 5
    const quantity = Math.floor(Math.random() * maxQty) + 1

    // Use customer's preferred payment method 70% of the time
    const paymentMethods = ["cash_on_delivery", "gcash", "bank_transfer", "credit_card"]
    const paymentMethod =
      Math.random() < 0.7 ? preferredPayment : paymentMethods[Math.floor(Math.random() * paymentMethods.length)]

    // Generate realistic order date within timeframe
    const orderDate = new Date(
      timeframe.start.getTime() + Math.random() * (timeframe.end.getTime() - timeframe.start.getTime()),
    )

    // Determine status based on order age
    const daysSinceOrder = (new Date() - orderDate) / (1000 * 60 * 60 * 24)
    let status

    if (daysSinceOrder < 1) {
      status = Math.random() < 0.7 ? "pending" : "confirmed"
    } else if (daysSinceOrder < 3) {
      status = ["confirmed", "processing"][Math.floor(Math.random() * 2)]
    } else if (daysSinceOrder < 7) {
      status = ["processing", "shipped"][Math.floor(Math.random() * 2)]
    } else if (daysSinceOrder < 14) {
      status = ["shipped", "delivered"][Math.floor(Math.random() * 2)]
    } else {
      status = Math.random() < 0.9 ? "completed" : "delivered"
    }

    // Small chance of cancellation
    if (Math.random() < 0.05) {
      status = "cancelled"
    }

    const order = {
      user_id: customer.id,
      username: customer.username,
      product_id: product.id,
      product_owner: product.seller_id,
      seller_id: product.seller_id,
      quantity: quantity,
      cost: product.price,
      total_cost: product.price * quantity,
      status: status,
      type: "MERCHANDISE",
      payment_method: paymentMethod,
      media_order:
        Math.random() > 0.85 ? `https://storage.googleapis.com/sellah-media/orders/receipt_${Date.now()}.jpg` : "",
      cancel_reason: status === "cancelled" ? "Customer requested cancellation" : "",
      rated: status === "completed" ? Math.random() > 0.3 : false,
      deleted: false,
      created: orderDate,
      updated: orderDate,
    }

    orders.push(order)
  }

  return orders
}

// Main seeding function with real data
async function seedOrdersWithRealData() {
  console.log("🌱 Starting advanced orders seeding with real data...")

  try {
    // Fetch real data
    const products = await fetchRealProducts()
    const sellers = await fetchRealSellers()

    if (products.length === 0) {
      console.log("⚠️  No products found. Please add some products first.")
      return
    }

    if (sellers.length === 0) {
      console.log("⚠️  No sellers found. Using sample seller data.")
    }

    // Generate orders for different time periods
    const timeframes = [
      {
        name: "Last 30 days",
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
      {
        name: "Last 90 days",
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        name: "Last 180 days",
        start: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    ]

    const allOrders = []

    for (const timeframe of timeframes) {
      console.log(`\n📅 Generating orders for: ${timeframe.name}`)

      for (const customer of CUSTOMER_PROFILES) {
        const customerOrders = generateCustomerOrders(customer, products, timeframe)
        allOrders.push(...customerOrders)
        console.log(`  👤 ${customer.name}: ${customerOrders.length} orders`)
      }
    }

    // Add orders to Firestore
    console.log(`\n💾 Saving ${allOrders.length} orders to database...`)

    const ordersRef = collection(db, "orders")
    let successCount = 0

    for (const order of allOrders) {
      try {
        await addDoc(ordersRef, order)
        successCount++

        if (successCount % 10 === 0) {
          console.log(`✅ Saved ${successCount}/${allOrders.length} orders`)
        }
      } catch (error) {
        console.error(`❌ Error saving order:`, error.message)
      }
    }

    // Generate summary statistics
    console.log("\n📊 Seeding Summary:")
    console.log(`✅ Successfully created: ${successCount} orders`)

    const statusCounts = {}
    const paymentCounts = {}
    let totalRevenue = 0

    allOrders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
      paymentCounts[order.payment_method] = (paymentCounts[order.payment_method] || 0) + 1
      totalRevenue += order.total_cost
    })

    console.log("\n📈 Order Statistics:")
    console.log("Status Distribution:")
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = ((count / allOrders.length) * 100).toFixed(1)
      console.log(`  ${status}: ${count} (${percentage}%)`)
    })

    console.log("\nPayment Methods:")
    Object.entries(paymentCounts).forEach(([method, count]) => {
      const percentage = ((count / allOrders.length) * 100).toFixed(1)
      console.log(`  ${method}: ${count} (${percentage}%)`)
    })

    console.log(`\n💰 Total Revenue: ₱${totalRevenue.toLocaleString()}`)
    console.log(`📊 Average Order Value: ₱${Math.round(totalRevenue / allOrders.length).toLocaleString()}`)

    console.log("\n🎉 Advanced orders seeding completed successfully!")
  } catch (error) {
    console.error("❌ Error during advanced seeding:", error)
  }
}

// Run the advanced seeding
seedOrdersWithRealData()
  .then(() => {
    console.log("✨ Script completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Script failed:", error)
    process.exit(1)
  })
