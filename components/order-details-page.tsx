"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Package, User, MapPin, Calendar, Clock, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { getOrderById, updateOrderStatus, completeOrder, addOrderNote } from "@/lib/api"
import { orderActivityService } from "@/lib/order-activity-service"
import type { Order } from "@/types/order"

interface OrderDetailsPageProps {
  orderId: string
}

export function OrderDetailsPage({ orderId }: OrderDetailsPageProps) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrderDetails()
    fetchOrderActivities()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const orderData = await getOrderById(orderId)
      setOrder(orderData as Order)
    } catch (err) {
      console.error("Error fetching order:", err)
      setError("Failed to load order details")
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderActivities = async () => {
    try {
      const { activities } = await orderActivityService.getOrderActivities(orderId, { limit: 20 })
      setActivities(activities)
    } catch (err) {
      console.error("Error fetching activities:", err)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return

    try {
      setUpdating(true)
      await updateOrderStatus(orderId, newStatus, "admin", order.status)

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      })

      // Refresh order details and activities
      await fetchOrderDetails()
      await fetchOrderActivities()
    } catch (err) {
      console.error("Error updating status:", err)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleCompleteOrder = async () => {
    try {
      setUpdating(true)
      await completeOrder(orderId, "admin")

      toast({
        title: "Success",
        description: "Order completed successfully",
      })

      // Refresh order details and activities
      await fetchOrderDetails()
      await fetchOrderActivities()
    } catch (err) {
      console.error("Error completing order:", err)
      toast({
        title: "Error",
        description: "Failed to complete order",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleAddNote = async (note: string) => {
    try {
      await addOrderNote(orderId, note, "admin")

      toast({
        title: "Success",
        description: "Note added successfully",
      })

      // Refresh order details and activities
      await fetchOrderDetails()
      await fetchOrderActivities()
    } catch (err) {
      console.error("Error adding note:", err)
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"

    let dateObj: Date
    if (date.toDate && typeof date.toDate === "function") {
      dateObj = date.toDate()
    } else if (date instanceof Date) {
      dateObj = date
    } else {
      dateObj = new Date(date)
    }

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
          <p className="text-gray-500 mb-4">{error || "The requested order could not be found."}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order Details</h1>
            <p className="text-gray-500">Order #{order.id}</p>
          </div>
        </div>
        <Badge className={getStatusColor(order.status)}>
          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.price)}</p>
                      <p className="text-sm text-gray-500">Total: {formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal || order.totalAmount)}</span>
                </div>
                {order.tax && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                )}
                {order.shipping && (
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{formatCurrency(order.shipping)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-gray-500">{formatDate(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No activity recorded yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-gray-500">{order.customerEmail}</p>
                {order.customerPhone && <p className="text-sm text-gray-500">{order.customerPhone}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          {order.shipping_address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p>{order.shipping_address.street}</p>
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.state}
                  </p>
                  <p>
                    {order.shipping_address.zip} {order.shipping_address.country}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium">{order.payment_method || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <Badge variant="outline" className="mt-1">
                  {order.payment_status || "Pending"}
                </Badge>
              </div>
              {order.tracking_number && (
                <div>
                  <p className="text-sm text-gray-500">Tracking Number</p>
                  <p className="font-medium">{order.tracking_number}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.status === "pending" && (
                <Button onClick={() => handleStatusUpdate("processing")} disabled={updating} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Order
                </Button>
              )}

              {order.status === "processing" && (
                <Button onClick={() => handleStatusUpdate("shipped")} disabled={updating} className="w-full">
                  Mark as Shipped
                </Button>
              )}

              {order.status === "shipped" && (
                <Button onClick={() => handleStatusUpdate("delivered")} disabled={updating} className="w-full">
                  Mark as Delivered
                </Button>
              )}

              {order.status === "delivered" && (
                <Button onClick={handleCompleteOrder} disabled={updating} className="w-full">
                  Complete Order
                </Button>
              )}

              {order.status !== "cancelled" && order.status !== "completed" && (
                <Button
                  onClick={() => handleStatusUpdate("cancelled")}
                  disabled={updating}
                  variant="destructive"
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Export both default and named export for compatibility
export default OrderDetailsPage
