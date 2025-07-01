"use client"

import { useState, useEffect, useMemo } from "react"
import DashboardLayout from "./dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  Calendar,
  Clock,
} from "lucide-react"
import { auth } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { useOrders } from "@/hooks/use-orders"
import { useProducts } from "@/hooks/use-products"

export default function DashboardHome() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const totalSlides = 4

  const getCurrentDate = () => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return now.toLocaleDateString("en-US", options)
  }

  const getCurrentTime = () => {
    const now = new Date()
    return now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const [currentTime, setCurrentTime] = useState(getCurrentTime())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const [user] = useAuthState(auth)
  const { orders, loading: ordersLoading } = useOrders(user?.uid || "")
  const { products, loading: productsLoading } = useProducts(user?.uid || "")

  // Calculate real-time stats with data validation
  const stats = useMemo(() => {
    // Validate and calculate total revenue
    const totalRevenue = orders.reduce((sum, order) => {
      const amount = typeof order.total_amount === "number" ? order.total_amount : 0
      return sum + (order.status === "completed" ? amount : 0)
    }, 0)

    // Validate and count completed orders
    const completedOrders = orders.filter((order) => order.status === "completed" && !order.deleted).length

    // Validate and count active products
    const activeProducts = products.filter((product) => !product.deleted && product.status === "active").length

    // Calculate unique customers with validation
    const uniqueCustomers = new Set(
      orders.filter((order) => order.customer_id && !order.deleted).map((order) => order.customer_id),
    ).size

    // Calculate growth percentages (mock calculation for demo)
    const revenueGrowth = totalRevenue > 0 ? "+15%" : "0%"
    const ordersGrowth = completedOrders > 0 ? "+8%" : "0%"
    const productsGrowth = activeProducts > 0 ? "+12%" : "0%"
    const customersGrowth = uniqueCustomers > 0 ? "+5%" : "0%"

    return [
      {
        title: "Total Revenue",
        value: `₱${totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`,
        change: revenueGrowth,
        trend: totalRevenue > 0 ? "up" : "neutral",
        icon: DollarSign,
        color: totalRevenue > 0 ? "text-green-600" : "text-gray-600",
        bgColor: totalRevenue > 0 ? "bg-green-50" : "bg-gray-50",
        loading: ordersLoading,
      },
      {
        title: "Total Orders",
        value: completedOrders.toString(),
        change: ordersGrowth,
        trend: completedOrders > 0 ? "up" : "neutral",
        icon: ShoppingCart,
        color: completedOrders > 0 ? "text-blue-600" : "text-gray-600",
        bgColor: completedOrders > 0 ? "bg-blue-50" : "bg-gray-50",
        loading: ordersLoading,
      },
      {
        title: "Products",
        value: activeProducts.toString(),
        change: productsGrowth,
        trend: activeProducts > 0 ? "up" : "neutral",
        icon: Package,
        color: activeProducts > 0 ? "text-purple-600" : "text-gray-600",
        bgColor: activeProducts > 0 ? "bg-purple-50" : "bg-gray-50",
        loading: productsLoading,
      },
      {
        title: "Customers",
        value: uniqueCustomers.toString(),
        change: customersGrowth,
        trend: uniqueCustomers > 0 ? "up" : "neutral",
        icon: Users,
        color: uniqueCustomers > 0 ? "text-orange-600" : "text-gray-600",
        bgColor: uniqueCustomers > 0 ? "bg-orange-50" : "bg-gray-50",
        loading: ordersLoading,
      },
    ]
  }, [orders, products, ordersLoading, productsLoading])

  const hasDataError = !user || (!ordersLoading && !productsLoading && orders.length === 0 && products.length === 0)

  if (hasDataError) {
    // Show a message when no data is available
    return (
      <DashboardLayout activeItem="home">
        <div className="space-y-6">
          {/* Keep existing welcome section and banner */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back!</h1>
              <p className="text-gray-600 mt-1">Here's what's happening with your store today.</p>
            </div>
            <div className="flex flex-col md:items-end text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{getCurrentDate()}</span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="w-4 h-4" />
                <span>{currentTime}</span>
              </div>
            </div>
          </div>

          {/* Main Banner */}
          <div className="relative bg-red-500 rounded-lg overflow-hidden">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lobby_banner-hlshNjDtRUeZHECOpbKC3vmCHu1XQb.png"
              alt="Business is now open - Sellah banner"
              className="w-full h-auto"
            />

            {/* Carousel dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide ? "bg-orange-400" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeItem="home">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back!</h1>
            <p className="text-gray-600 mt-1">Here's what's happening with your store today.</p>
          </div>
          <div className="flex flex-col md:items-end text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{getCurrentDate()}</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Clock className="w-4 h-4" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Main Banner */}
        <div className="relative bg-red-500 rounded-lg overflow-hidden">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lobby_banner-hlshNjDtRUeZHECOpbKC3vmCHu1XQb.png"
            alt="Business is now open - Sellah banner"
            className="w-full h-auto"
          />

          {/* Carousel dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? "bg-orange-400" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const TrendIcon = stat.trend === "up" ? TrendingUp : stat.trend === "down" ? TrendingDown : TrendingUp

            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
                    </div>
                    {!stat.loading && stat.trend !== "neutral" && (
                      <div className={`flex items-center space-x-1 text-xs ${stat.color}`}>
                        <TrendIcon className="w-3 h-3" />
                        <span>{stat.change}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1">{stat.title}</h3>
                  <p className="text-xl md:text-2xl font-bold text-gray-800">
                    {stat.loading ? (
                      <span className="animate-pulse bg-gray-200 rounded h-6 w-16 inline-block"></span>
                    ) : (
                      stat.value
                    )}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button className="h-auto p-4 flex flex-col space-y-2 bg-red-500 hover:bg-red-600">
                <Plus className="w-5 h-5" />
                <span className="text-sm">Add Product</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col space-y-2">
                <Eye className="w-5 h-5" />
                <span className="text-sm">View Orders</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col space-y-2">
                <Edit className="w-5 h-5" />
                <span className="text-sm">Edit Profile</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col space-y-2">
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-sm">More</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Month's Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">₱45K</p>
                <p className="text-sm text-gray-600">Revenue</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">156</p>
                <p className="text-sm text-gray-600">Orders</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">89</p>
                <p className="text-sm text-gray-600">Customers</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">4.8</p>
                <p className="text-sm text-gray-600">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
