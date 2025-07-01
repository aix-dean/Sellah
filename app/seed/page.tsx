"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Database, Trash2, BarChart3, ShoppingCart, AlertTriangle } from "lucide-react"

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runSeed = async (type: "comprehensive" | "patterns" | "clear") => {
    setIsSeeding(true)
    setProgress(0)
    setLogs([])
    setStats(null)
    setError(null)

    try {
      addLog(`Starting ${type} seeding...`)

      // Import Firebase modules
      const { initializeApp } = await import("firebase/app")
      const { getFirestore, collection, addDoc, getDocs, deleteDoc, Timestamp } = await import("firebase/firestore")

      // Firebase configuration
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

      // Helper function to generate order (simplified version)
      const generateOrder = () => {
        const customers = [
          {
            id: "cust_001",
            name: "Juan Dela Cruz",
            email: "juan@gmail.com",
            phone: "+639171234567",
            location: "Manila",
          },
          {
            id: "cust_002",
            name: "Maria Santos",
            email: "maria@gmail.com",
            phone: "+639281234567",
            location: "Quezon City",
          },
          {
            id: "cust_003",
            name: "Pedro Garcia",
            email: "pedro@gmail.com",
            phone: "+639391234567",
            location: "Makati",
          },
        ]

        const products = [
          { id: "prod_001", name: "Custom Tarpaulin 3x6 ft", price: 450 },
          { id: "prod_002", name: "Business Cards (500pcs)", price: 350 },
          { id: "prod_003", name: "Wedding Invitation Set", price: 1200 },
        ]

        const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED"]
        const paymentMethods = ["cash_on_delivery", "gcash", "bank_transfer", "credit_card"]

        const customer = customers[Math.floor(Math.random() * customers.length)]
        const product = products[Math.floor(Math.random() * products.length)]
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]

        const quantity = Math.floor(Math.random() * 3) + 1
        const subtotal = product.price * quantity
        const shippingFee = Math.floor(Math.random() * 200) + 50
        const tax = Math.round(subtotal * 0.12)
        const totalAmount = subtotal + shippingFee + tax

        const createdDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)

        return {
          order_number: `ORD-${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          order_id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          customer_id: customer.id,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          items: [
            {
              product_id: product.id,
              product_name: product.name,
              quantity: quantity,
              unit_price: product.price,
              total_price: subtotal,
            },
          ],
          subtotal: subtotal,
          shipping_fee: shippingFee,
          tax_amount: tax,
          total_amount: totalAmount,
          currency: "PHP",
          status: status,
          payment_method: paymentMethod,
          payment_status: status === "cancelled" ? "cancelled" : status === "pending" ? "pending" : "paid",
          shipping_address: {
            recipient_name: customer.name,
            phone: customer.phone,
            street: "123 Sample Street",
            city: customer.location,
            province: "Metro Manila",
            postal_code: "1000",
            country: "Philippines",
          },
          created_at: Timestamp.fromDate(createdDate),
          updated_at: Timestamp.fromDate(createdDate),
          deleted: false,
          version: 1,
          source: "web",
        }
      }

      if (type === "clear") {
        addLog("Clearing existing orders...")
        const ordersRef = collection(db, "orders")
        const snapshot = await getDocs(ordersRef)

        addLog(`Found ${snapshot.size} orders to delete`)
        setProgress(25)

        const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref))
        await Promise.all(deletePromises)

        addLog("All orders deleted successfully!")
        setProgress(100)
        setIsSeeding(false)
        return
      }

      // Generate sample data
      const numberOfOrders = type === "comprehensive" ? 75 : 50
      addLog(`Generating ${numberOfOrders} orders...`)
      setProgress(10)

      const orders = []
      for (let i = 0; i < numberOfOrders; i++) {
        const order = generateOrder()
        orders.push(order)

        if ((i + 1) % 15 === 0) {
          addLog(`Generated ${i + 1}/${numberOfOrders} orders`)
          setProgress(10 + ((i + 1) / numberOfOrders) * 40)
        }
      }

      // Save to database
      addLog("Saving orders to database...")
      setProgress(50)

      const ordersRef = collection(db, "orders")
      let successCount = 0

      for (const order of orders) {
        try {
          await addDoc(ordersRef, order)
          successCount++

          if (successCount % 10 === 0) {
            addLog(`Saved ${successCount}/${numberOfOrders} orders`)
            setProgress(50 + (successCount / numberOfOrders) * 40)
          }
        } catch (err) {
          console.error("Error saving order:", err)
        }
      }

      // Generate statistics
      addLog("Generating statistics...")
      setProgress(90)

      const generatedStats = generateStatistics(orders)
      setStats(generatedStats)

      addLog(`Successfully created ${successCount} orders!`)
      setProgress(100)
    } catch (err) {
      console.error("Seeding error:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      addLog(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsSeeding(false)
    }
  }

  const generateStatistics = (orders: any[]) => {
    const statusCounts: Record<string, number> = {}
    const paymentCounts: Record<string, number> = {}
    let totalRevenue = 0

    orders.forEach((order) => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
      paymentCounts[order.payment_method] = (paymentCounts[order.payment_method] || 0) + 1
      totalRevenue += order.total_amount
    })

    return {
      totalOrders: orders.length,
      totalRevenue,
      averageOrderValue: Math.round(totalRevenue / orders.length),
      statusDistribution: statusCounts,
      paymentDistribution: paymentCounts,
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Database className="h-8 w-8 text-blue-600" />
            Database Seeding Tool
          </h1>
          <p className="text-gray-600">Generate sample data for testing and development</p>
        </div>

        {/* Warning */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Warning:</strong> This tool is for development purposes only. Use with caution in production
            environments.
          </AlertDescription>
        </Alert>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                Comprehensive Seed
              </CardTitle>
              <CardDescription>Generate 75 realistic orders with complete data structure</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => runSeed("comprehensive")} disabled={isSeeding} className="w-full">
                Generate Orders
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Pattern-Based Seed
              </CardTitle>
              <CardDescription>Generate 50 orders with realistic time-based patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => runSeed("patterns")} disabled={isSeeding} className="w-full" variant="outline">
                Generate Patterns
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Clear Database
              </CardTitle>
              <CardDescription>Delete all existing orders from the database</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => runSeed("clear")} disabled={isSeeding} className="w-full" variant="destructive">
                Clear Orders
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        {isSeeding && (
          <Card>
            <CardHeader>
              <CardTitle>Seeding Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600">{progress}% Complete</p>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Seeding Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
                  <div className="text-sm text-gray-600">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">₱{stats.totalRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">₱{stats.averageOrderValue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Avg Order Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Object.keys(stats.statusDistribution).length}
                  </div>
                  <div className="text-sm text-gray-600">Status Types</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold">Order Status Distribution</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.statusDistribution).map(([status, count]) => (
                    <Badge key={status} variant="outline">
                      {status}: {count as number}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Payment Method Distribution</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.paymentDistribution).map(([method, count]) => (
                    <Badge key={method} variant="secondary">
                      {method}: {count as number}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Seeding Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
