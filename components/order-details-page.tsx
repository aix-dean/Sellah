"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Star,
  Phone,
  Mail,
  CheckCircle,
  X,
  Edit3,
  Loader2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { useUserData } from "@/hooks/use-user-data"
import { createOrderActivity } from "@/lib/order-activity"
import OrderActivityTimeline from "./order-activity-timeline"
import DashboardLayout from "./dashboard-layout"

interface OrderDetailsPageProps {
  orderId: string
}

export default function OrderDetailsPage({ orderId }: OrderDetailsPageProps) {
  const router = useRouter()
  const { currentUser } = useUserData()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [newNote, setNewNote] = useState("")

  const statusOptions = [
    { value: "PENDING", label: "PENDING", color: "bg-yellow-100 text-yellow-800" },
    { value: "CONFIRMED", label: "CONFIRMED", color: "bg-blue-100 text-blue-800" },
    { value: "PROCESSING", label: "PROCESSING", color: "bg-purple-100 text-purple-800" },
    { value: "SHIPPED", label: "SHIPPED", color: "bg-indigo-100 text-indigo-800" },
    { value: "DELIVERED", label: "DELIVERED", color: "bg-green-100 text-green-800" },
    { value: "COMPLETED", label: "COMPLETED", color: "bg-green-100 text-green-800" },
    { value: "CANCELLED", label: "CANCELLED", color: "bg-red-100 text-red-800" },
  ]

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return

      setLoading(true)
      try {
        const orderRef = doc(db, "orders", orderId)
        const orderSnap = await getDoc(orderRef)

        if (orderSnap.exists()) {
          const orderData = orderSnap.data()
          setOrder({ id: orderSnap.id, ...orderData })
        } else {
          toast({
            title: "Order not found",
            description: "The requested order could not be found.",
            variant: "destructive",
          })
          router.push("/dashboard/orders")
        }
      } catch (error) {
        console.error("Error fetching order:", error)
        toast({
          title: "Error",
          description: "Failed to load order details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, router])

  const updateOrderStatus = async (newStatus: string) => {
    if (!currentUser || !order) return

    setUpdating(true)
    try {
      const orderRef = doc(db, "orders", orderId)
      const oldStatus = order.status

      // Update the order
      await updateDoc(orderRef, {
        status: newStatus,
        updated_at: Timestamp.now(),
        status_history: arrayUnion({
          status: newStatus,
          timestamp: Timestamp.now(),
          note: `Status changed from ${oldStatus} to ${newStatus}`,
          updated_by: currentUser.uid,
        }),
      })

      // Create activity record
      await createOrderActivity({
        order_id: orderId,
        user_id: currentUser.uid,
        activity_type: "status_change",
        old_value: oldStatus,
        new_value: newStatus,
        description: `Order status changed from ${oldStatus} to ${newStatus}`,
        metadata: {
          user_name: currentUser.displayName || currentUser.email,
          timestamp: new Date().toISOString(),
        },
      })

      // Update local state
      setOrder({ ...order, status: newStatus })

      toast({
        title: "Status updated",
        description: `Order status changed to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Update failed",
        description: "Failed to update order status.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const addNote = async () => {
    if (!currentUser || !order || !newNote.trim()) return

    setUpdating(true)
    try {
      const orderRef = doc(db, "orders", orderId)

      // Add note to order
      await updateDoc(orderRef, {
        notes: arrayUnion({
          note: newNote.trim(),
          timestamp: Timestamp.now(),
          added_by: currentUser.uid,
          user_name: currentUser.displayName || currentUser.email,
        }),
        updated_at: Timestamp.now(),
      })

      // Create activity record
      await createOrderActivity({
        order_id: orderId,
        user_id: currentUser.uid,
        activity_type: "note_added",
        new_value: newNote.trim(),
        description: `Note added: ${newNote.trim().substring(0, 50)}${newNote.length > 50 ? "..." : ""}`,
        metadata: {
          user_name: currentUser.displayName || currentUser.email,
          full_note: newNote.trim(),
        },
      })

      setNewNote("")
      setShowNoteModal(false)

      toast({
        title: "Note added",
        description: "Your note has been added to the order.",
      })
    } catch (error) {
      console.error("Error adding note:", error)
      toast({
        title: "Failed to add note",
        description: "Could not add note to order.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyle = statusOptions.find((s) => s.value === status)
    return statusStyle?.color || "bg-gray-100 text-gray-800"
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  if (loading) {
    return (
      <DashboardLayout activeItem="orders">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout activeItem="orders">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
            <p className="text-gray-600 mb-4">The requested order could not be found.</p>
            <Button onClick={() => router.push("/dashboard/orders")}>Back to Orders</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeItem="orders">
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/orders")} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">#{order.order_number}</h1>
              <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/orders")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Orders</span>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
              <p className="text-gray-600 mt-1">{formatDate(order.created_at)}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(order.status)}`}>
                {order.status}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={updating}>
                    {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Edit3 className="w-4 h-4 mr-2" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {statusOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => updateOrderStatus(option.value)}
                      className={option.value === order.status ? "bg-gray-100 font-medium" : ""}
                    >
                      {option.value === order.status && <CheckCircle className="w-3 h-3 mr-2" />}
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 md:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-lg border p-4 md:p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Customer Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{order.customer_name}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${order.customer_email}`} className="hover:text-blue-600">
                        {order.customer_email}
                      </a>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${order.customer_phone}`} className="hover:text-blue-600">
                        {order.customer_phone}
                      </a>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-start space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{order.shipping_address.recipient_name}</p>
                        <p>{order.shipping_address.street}</p>
                        <p>{order.shipping_address.barangay}</p>
                        <p>
                          {order.shipping_address.city}, {order.shipping_address.province}
                        </p>
                        <p>{order.shipping_address.postal_code}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg border p-4 md:p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Package className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                </div>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <img
                        src="/placeholder.svg?height=60&width=60"
                        alt="Product"
                        className="w-15 h-15 rounded object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=60&width=60"
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} × ₱{item.unit_price.toLocaleString()}
                        </p>
                        {item.specifications && (
                          <p className="text-xs text-gray-500 mt-1">Specs: {JSON.stringify(item.specifications)}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-gray-900">₱{item.total_price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Shipping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border p-4 md:p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <CreditCard className="w-5 h-5 text-gray-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Method:</span>
                      <span className="font-medium">{order.payment_method}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`font-medium ${order.payment_status === "paid" ? "text-green-600" : "text-yellow-600"}`}
                      >
                        {order.payment_status}
                      </span>
                    </div>
                    {order.payment_reference && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Reference:</span>
                        <span className="font-medium">{order.payment_reference}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-4 md:p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Truck className="w-5 h-5 text-gray-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Shipping</h2>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Method:</span>
                      <span className="font-medium">{order.delivery_method}</span>
                    </div>
                    {order.tracking_number && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tracking:</span>
                        <span className="font-medium">{order.tracking_number}</span>
                      </div>
                    )}
                    {order.estimated_delivery && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Est. Delivery:</span>
                        <span className="font-medium">{formatDate(order.estimated_delivery)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary & Activity */}
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-lg border p-4 md:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₱{order.subtotal.toLocaleString()}</span>
                  </div>
                  {order.shipping_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">₱{order.shipping_fee.toLocaleString()}</span>
                    </div>
                  )}
                  {order.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">₱{order.tax_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-gray-900">₱{order.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="w-full bg-red-500 hover:bg-red-600 text-white" disabled={updating}>
                        {updating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Edit3 className="w-4 h-4 mr-2" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48">
                      {statusOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => updateOrderStatus(option.value)}
                          className={option.value === order.status ? "bg-gray-100 font-medium" : ""}
                        >
                          {option.value === order.status && <CheckCircle className="w-3 h-3 mr-2" />}
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="outline" className="w-full" onClick={() => setShowNoteModal(true)}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </div>

              {/* Customer Rating */}
              {order.customer_rating && (
                <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 md:p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <h2 className="text-lg font-semibold text-gray-900">Customer Rating</h2>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < order.customer_rating! ? "text-yellow-500 fill-current" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{order.customer_rating}/5</span>
                  </div>
                  {order.customer_review && <p className="text-sm text-gray-700 mt-2">{order.customer_review}</p>}
                </div>
              )}

              {/* Order Activity Timeline */}
              <OrderActivityTimeline orderId={orderId} />
            </div>
          </div>
        </div>

        {/* Add Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Add Note</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNoteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="p-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note here..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
                <div className="flex space-x-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowNoteModal(false)}
                    className="flex-1"
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addNote}
                    disabled={!newNote.trim() || updating}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  >
                    {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Add Note
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Action Buttons */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
          <div className="flex space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" disabled={updating}>
                  {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Edit3 className="w-4 h-4 mr-2" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                {statusOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => updateOrderStatus(option.value)}
                    className={option.value === order.status ? "bg-gray-100 font-medium" : ""}
                  >
                    {option.value === order.status && <CheckCircle className="w-3 h-3 mr-2" />}
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => setShowNoteModal(true)} className="flex-1">
              <Edit3 className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
