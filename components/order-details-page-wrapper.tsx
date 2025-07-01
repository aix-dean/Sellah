"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Phone,
  Mail,
  CheckCircle,
  X,
  Edit3,
  Loader2,
  Calendar,
  Receipt,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Tag,
  Palette,
  Ruler,
  Weight,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { useUserData } from "@/hooks/use-user-data"
import { createOrderActivity } from "@/lib/order-activity"
import DashboardLayout from "./dashboard-layout"
import OrderActivityModal from "./order-activity-modal"
import { PaymentProofModal } from "./payment-proof-modal"
import { OrderApprovalDialog } from "./order-approval-dialog"
import { OrderRejectionDialog } from "./order-rejection-dialog"

interface OrderDetailsPageWrapperProps {
  orderId: string
}

interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  specifications?: any
  image_url?: string
  sku?: string
  variation_data?: {
    color?: string
    height?: string
    id?: string
    length?: string
    media?: string
    name?: string
    price?: number
    sku?: string
    stock?: number
    weight?: string
    [key: string]: any
  }
  variation_id?: string
  variation_name?: string
}

interface ShippingAddress {
  recipient_name: string
  street: string
  barangay?: string
  city: string
  province: string
  postal_code: string
  country?: string
  phone?: string
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  items: OrderItem[]
  subtotal: number
  shipping_fee: number
  tax_amount: number
  discount_amount?: number
  total_amount: number
  payment_method: string
  payment_reference?: string
  shipping_address: ShippingAddress
  billing_address?: ShippingAddress
  delivery_method: string
  tracking_number?: string
  estimated_delivery?: any
  special_instructions?: string
  created_at: any
  updated_at: any
  customer_rating?: number
  customer_review?: string
  notes?: Array<{
    note: string
    timestamp: any
    added_by: string
    user_name: string
  }>
  approve_payment?: boolean
  is_pickup?: boolean
  pickup_info?: {
    pickup_location?: string
    pickup_address?: string
    pickup_contact?: string
    pickup_hours?: string
    pickup_instructions?: string
    [key: string]: any
  }
  cancelled_by_user?: boolean
  cancelled_at?: any
  cancellation_reason?: string
  cancellation_message?: string
  refund_status?: string
}

export default function OrderDetailsPageWrapper({ orderId }: OrderDetailsPageWrapperProps) {
  const router = useRouter()
  const { currentUser } = useUserData()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [newNote, setNewNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; order: any }>({ open: false, order: null })
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; order: any }>({ open: false, order: null })
  const [paymentProofModal, setPaymentProofModal] = useState<{ open: boolean; order: any }>({
    open: false,
    order: null,
  })

  const statusOptions = [
    { value: "pending", label: "PENDING", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { value: "confirmed", label: "CONFIRMED", color: "bg-blue-100 text-blue-800 border-blue-200" },
    { value: "processing", label: "PROCESSING", color: "bg-purple-100 text-purple-800 border-purple-200" },
    { value: "shipped", label: "SHIPPED", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    { value: "delivered", label: "DELIVERED", color: "bg-green-100 text-green-800 border-green-200" },
    { value: "completed", label: "COMPLETED", color: "bg-green-100 text-green-800 border-green-200" },
    { value: "cancelled", label: "CANCELLED", color: "bg-red-100 text-red-800 border-red-200" },
  ]

  const paymentStatusOptions = [
    { value: "pending", label: "PENDING", color: "bg-yellow-100 text-yellow-800" },
    { value: "paid", label: "PAID", color: "bg-green-100 text-green-800" },
    { value: "failed", label: "FAILED", color: "bg-red-100 text-red-800" },
    { value: "refunded", label: "REFUNDED", color: "bg-gray-100 text-gray-800" },
    { value: "cancelled", label: "CANCELLED", color: "bg-red-100 text-red-800" },
  ]

  const fetchOrder = useCallback(async () => {
    if (!orderId) return

    setLoading(true)
    setError(null)

    try {
      const orderRef = doc(db, "orders", orderId)
      const orderSnap = await getDoc(orderRef)

      if (orderSnap.exists()) {
        const orderData = orderSnap.data()
        const orderWithId = { id: orderSnap.id, ...orderData } as Order
        setOrder(orderWithId)
      } else {
        setError("Order not found. The requested order could not be found in our system.")
      }
    } catch (error) {
      console.error("Error fetching order:", error)
      setError("Failed to load order details. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!currentUser || !order) return

    setUpdating(true)
    try {
      const oldStatus = order.status

      // Don't update if status hasn't changed
      if (oldStatus === newStatus) {
        toast({
          title: "No change",
          description: `Order is already in ${newStatus.toUpperCase()} status.`,
        })
        setUpdating(false)
        return
      }

      const orderRef = doc(db, "orders", orderId)
      const now = Timestamp.now()

      // Update the order
      await updateDoc(orderRef, {
        status: newStatus,
        updated_at: now,
        status_history: arrayUnion({
          status: newStatus,
          timestamp: now,
          note: `Status changed from ${oldStatus} to ${newStatus}`,
          updated_by: currentUser.uid,
          user_name: currentUser.displayName || currentUser.email,
        }),
      })

      // Update payment status if order is completed or cancelled
      if (newStatus === "completed" || newStatus === "delivered") {
        await updateDoc(orderRef, {
          payment_status: "paid",
        })

        // Create payment update activity
        await createOrderActivity({
          order_id: orderId,
          user_id: currentUser.uid,
          activity_type: "payment_update",
          old_value: order.payment_status,
          new_value: "paid",
          description: `Payment status updated to paid due to order ${newStatus}`,
          metadata: {
            user_name: currentUser.displayName || currentUser.email,
            order_number: order.order_number,
            total_amount: order.total_amount,
            customer_name: order.customer_name,
            payment_method: order.payment_method,
            status_change: newStatus,
          },
        })
      } else if (newStatus === "cancelled") {
        await updateDoc(orderRef, {
          payment_status: "cancelled",
          cancelled_at: now,
          cancelled_by: currentUser.uid,
        })

        // Create payment update activity
        await createOrderActivity({
          order_id: orderId,
          user_id: currentUser.uid,
          activity_type: "payment_update",
          old_value: order.payment_status,
          new_value: "cancelled",
          description: `Payment status updated to cancelled due to order cancellation`,
          metadata: {
            user_name: currentUser.displayName || currentUser.email,
            order_number: order.order_number,
            total_amount: order.total_amount,
            customer_name: order.customer_name,
            payment_method: order.payment_method,
          },
        })
      }

      // Create status change activity record
      await createOrderActivity({
        order_id: orderId,
        user_id: currentUser.uid,
        activity_type: "status_change",
        old_value: oldStatus,
        new_value: newStatus,
        description: `Order status changed from ${oldStatus} to ${newStatus}`,
        metadata: {
          user_name: currentUser.displayName || currentUser.email,
          order_number: order.order_number,
          total_amount: order.total_amount,
          customer_name: order.customer_name,
          status_change_reason: "Manual update by user",
          items_count: order.items.length,
          device_info: navigator.userAgent,
          timestamp_iso: new Date().toISOString(),
        },
      })

      // Update local state
      setOrder({
        ...order,
        status: newStatus,
        updated_at: now,
        payment_status:
          newStatus === "completed" || newStatus === "delivered"
            ? "paid"
            : newStatus === "cancelled"
              ? "cancelled"
              : order.payment_status,
      })

      toast({
        title: "Status updated successfully",
        description: `Order status changed to ${newStatus.toUpperCase()}`,
      })
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Update failed",
        description: "Failed to update order status. Please try again.",
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
      const now = Timestamp.now()

      // Add note to order
      await updateDoc(orderRef, {
        notes: arrayUnion({
          note: newNote.trim(),
          timestamp: now,
          added_by: currentUser.uid,
          user_name: currentUser.displayName || currentUser.email,
        }),
        updated_at: now,
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
          note_length: newNote.trim().length,
          order_number: order.order_number,
          customer_name: order.customer_name,
          timestamp_iso: new Date().toISOString(),
        },
      })

      setNewNote("")
      setShowNoteModal(false)

      toast({
        title: "Note added successfully",
        description: "Your note has been added to the order.",
      })

      // Refresh order to show new note
      handleRetry()
    } catch (error) {
      console.error("Error adding note:", error)
      toast({
        title: "Failed to add note",
        description: "Could not add note to order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to clipboard",
        description: `${label} copied successfully`,
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string, type: "order" | "payment" = "order") => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200"
    const options = type === "order" ? statusOptions : paymentStatusOptions
    const statusStyle = options.find((s) => s.value === status)
    return statusStyle?.color || "bg-gray-100 text-gray-800 border-gray-200"
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
        hour12: true,
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  // Handle order approval (for unpaid orders)
  const handleApproveOrder = async () => {
    if (!currentUser || !order) return

    setUpdating(true)
    try {
      await updateOrderStatus("preparing")

      toast({
        title: "Order Approved",
        description: `Order ${order.order_number} has been approved successfully.`,
      })
    } catch (error) {
      console.error("Error approving order:", error)
      toast({
        title: "Error",
        description: "Failed to approve order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Handle order rejection
  const handleRejectOrder = async (reason: string) => {
    if (!currentUser || !order) return

    setUpdating(true)
    try {
      await updateOrderStatus("cancelled")

      toast({
        title: "Order Rejected",
        description: `Order ${order.order_number} has been rejected. Reason: ${reason}`,
      })
    } catch (error) {
      console.error("Error rejecting order:", error)
      toast({
        title: "Error",
        description: "Failed to reject order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Handle payment approval
  const handleApprovePayment = async () => {
    if (!currentUser || !order) return

    setUpdating(true)
    try {
      await updateOrderStatus("in transit")

      toast({
        title: "Payment Approved",
        description: `Payment for order ${order.order_number} has been approved.`,
      })
    } catch (error) {
      console.error("Error approving payment:", error)
      toast({
        title: "Error",
        description: "Failed to approve payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Handle payment rejection
  const handleRejectPayment = async () => {
    if (!currentUser || !order) return

    setUpdating(true)
    try {
      await updateOrderStatus("settle payment")

      toast({
        title: "Payment Rejected",
        description: `Payment for order ${order.order_number} has been rejected.`,
      })
    } catch (error) {
      console.error("Error rejecting payment:", error)
      toast({
        title: "Error",
        description: "Failed to reject payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  // Handle ready to ship
  const handleReadyForFulfillment = async () => {
    if (!currentUser || !order) return

    setUpdating(true)
    try {
      await updateOrderStatus("in transit")

      toast({
        title: order.is_pickup ? "Order Ready for Pickup" : "Order Ready to Ship",
        description: `Order ${order.order_number} is now ${order.is_pickup ? "ready for pickup" : "in transit and ready for shipping"}.`,
      })
    } catch (error) {
      console.error("Error updating order to in transit:", error)
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const getDynamicStatusDisplay = () => {
    if (!order) return null

    const status = order.status?.toLowerCase() || ""

    // For payment sent orders, show as unpaid status (no paid button)
    if (status === "payment sent") {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200" variant="outline">
          UNPAID
        </Badge>
      )
    }

    // For other statuses, show regular badge
    return (
      <Badge className={getStatusBadge(order.status)} variant="outline">
        {order.status.toUpperCase()}
      </Badge>
    )
  }

  const getDynamicActionButtons = () => {
    if (!order) return null

    const status = order.status?.toLowerCase() || ""

    // Hide update status button for completed orders
    if (status === "completed") {
      return null
    }

    // Unpaid orders (settle payment, payment sent)
    if (status === "settle payment" || status === "payment sent") {
      return (
        <div className="flex flex-col space-y-2">
          <Button
            onClick={() => setApprovalDialog({ open: true, order })}
            disabled={updating}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Approve Order"}
          </Button>
          <Button
            onClick={() => setRejectionDialog({ open: true, order })}
            disabled={updating}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
          >
            Reject Order
          </Button>
        </div>
      )
    }

    // To ship orders (preparing) - show ready to ship if payment approved
    if (status === "preparing") {
      const isPaymentApproved = order.approve_payment === true || status === "in transit"

      return (
        <div className="flex flex-col space-y-2">
          <Button
            onClick={handleReadyForFulfillment}
            disabled={updating || !isPaymentApproved}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            {updating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : order.is_pickup ? (
              "Ready for Pickup"
            ) : (
              "Ready for Shipping"
            )}
          </Button>
          {!isPaymentApproved && (
            <p className="text-xs text-gray-500 text-center">Payment approval required before shipping</p>
          )}
        </div>
      )
    }

    // For other statuses, show generic update status dropdown
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={updating}
            size="default"
            className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 font-medium"
          >
            {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Edit3 className="w-4 h-4 mr-2" />}
            Update Status
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
              {option.label.toUpperCase()}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Render variation data for an item
  const renderVariationData = (item: OrderItem) => {
    if (!item.variation_data) return null

    const variationData = item.variation_data
    const hasVariationInfo = variationData.name || variationData.color || variationData.sku || variationData.price

    if (!hasVariationInfo) return null

    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center space-x-2 mb-2">
          <Tag className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Product Variation</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {variationData.name && (
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 font-medium text-gray-900">{variationData.name}</span>
            </div>
          )}

          {variationData.color && (
            <div className="flex items-center">
              <Palette className="w-3 h-3 text-gray-500 mr-1" />
              <span className="text-gray-600">Color:</span>
              <span className="ml-2 font-medium text-gray-900">{variationData.color}</span>
            </div>
          )}

          {variationData.sku && (
            <div>
              <span className="text-gray-600">SKU:</span>
              <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">{variationData.sku}</span>
            </div>
          )}

          {variationData.price && (
            <div>
              <span className="text-gray-600">Price:</span>
              <span className="ml-2 font-medium text-gray-900">{formatCurrency(variationData.price)}</span>
            </div>
          )}

          {variationData.stock && (
            <div>
              <span className="text-gray-600">Stock:</span>
              <span className="ml-2 font-medium text-gray-900">{variationData.stock}</span>
            </div>
          )}

          {(variationData.height || variationData.length || variationData.weight) && (
            <div className="col-span-2">
              <div className="flex items-center space-x-4">
                {variationData.height && (
                  <div className="flex items-center">
                    <Ruler className="w-3 h-3 text-gray-500 mr-1" />
                    <span className="text-gray-600">H:</span>
                    <span className="ml-1 text-gray-900">{variationData.height}</span>
                  </div>
                )}
                {variationData.length && (
                  <div className="flex items-center">
                    <Ruler className="w-3 h-3 text-gray-500 mr-1" />
                    <span className="text-gray-600">L:</span>
                    <span className="ml-1 text-gray-900">{variationData.length}</span>
                  </div>
                )}
                {variationData.weight && (
                  <div className="flex items-center">
                    <Weight className="w-3 h-3 text-gray-500 mr-1" />
                    <span className="text-gray-600">Weight:</span>
                    <span className="ml-1 text-gray-900">{variationData.weight}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {variationData.media && (
          <div className="mt-3">
            <span className="text-sm text-gray-600">Variation Image:</span>
            <img
              src={variationData.media || "/placeholder.svg"}
              alt={`${variationData.name || "Variation"} image`}
              className="mt-2 w-16 h-16 rounded-lg object-cover border border-gray-200"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          </div>
        )}
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <DashboardLayout activeItem="orders">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Order</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleRetry} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/dashboard/orders")} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Orders
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  // Loading State
  if (loading) {
    return (
      <DashboardLayout activeItem="orders">
        <div className="min-h-screen bg-gray-50">
          {/* Loading Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Content */}
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout activeItem="orders">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h3>
                <p className="text-gray-600 mb-6">The requested order could not be found in our system.</p>
                <Button onClick={() => router.push("/dashboard/orders")} className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeItem="orders">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
            {/* Mobile Header */}
            <div className="md:hidden">
              <div className="flex items-center space-x-3 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboard/orders")}
                  className="p-2"
                  aria-label="Back to orders"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-semibold text-gray-900 truncate">#{order.order_number}</h1>
                  <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                </div>

                {/* Mobile Status Display */}
                {getDynamicStatusDisplay()}
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block">
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

              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order #{order.order_number}</h1>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Placed on {formatDate(order.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Receipt className="w-4 h-4" />
                      <span>
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4">
                  <div className="flex flex-wrap gap-2">{getDynamicStatusDisplay()}</div>

                  {/* Desktop Activity History Button */}
                  <OrderActivityModal
                    orderId={orderId}
                    orderNumber={order.order_number}
                    onStatusUpdate={(newStatus) => {
                      setOrder({
                        ...order,
                        status: newStatus,
                        updated_at: Timestamp.now(),
                        payment_status:
                          newStatus === "completed" || newStatus === "delivered"
                            ? "paid"
                            : newStatus === "cancelled"
                              ? "cancelled"
                              : order.payment_status,
                      })
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span>Customer Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Customer Name</label>
                        <p className="text-base font-medium text-gray-900">{order.customer_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email Address</label>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <a
                            href={`mailto:${order.customer_email}`}
                            className="text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {order.customer_email}
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(order.customer_email, "Email address")}
                            className="p-1"
                            aria-label="Copy email address"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone Number</label>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a
                            href={`tel:${order.customer_phone}`}
                            className="text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {order.customer_phone}
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(order.customer_phone, "Phone number")}
                            className="p-1"
                            aria-label="Copy phone number"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-gray-500" />
                    <span>Order Items ({order.items.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <img
                            src={item.image_url || "/placeholder.svg?height=80&width=80"}
                            alt={item.product_name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg?height=80&width=80"
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-medium text-gray-900 truncate">{item.product_name}</h4>
                              {item.sku && (
                                <p className="text-sm text-gray-500 mt-1">
                                  SKU: <span className="font-mono">{item.sku}</span>
                                </p>
                              )}
                              {item.specifications && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-500">Specifications:</p>
                                  <div className="text-sm text-gray-700 mt-1">
                                    {typeof item.specifications === "object"
                                      ? Object.entries(item.specifications).map(([key, value]) => (
                                          <span key={key} className="inline-block mr-4">
                                            {key}: {String(value)}
                                          </span>
                                        ))
                                      : String(item.specifications)}
                                  </div>
                                </div>
                              )}

                              {/* Render variation data */}
                              {renderVariationData(item)}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm text-gray-600">
                                Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                              </p>
                              <p className="text-lg font-semibold text-gray-900 mt-1">
                                {formatCurrency(item.total_price)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              {order.notes && order.notes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Order Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.notes.map((note, index) => (
                        <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                          <p className="text-sm text-gray-700">{note.note}</p>
                          <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                            <span>Added by {note.user_name}</span>
                            <span>•</span>
                            <span>{formatDate(note.timestamp)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cancellation Information */}
              {order.status?.toLowerCase() === "cancelled" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-600">
                      <X className="w-5 h-5" />
                      <span>Cancellation Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-red-700">Cancelled By</label>
                          <p className="text-base font-medium text-red-900">
                            {order.cancelled_by_user ? "Seller" : "Buyer"}
                          </p>
                        </div>
                        {order.cancelled_at && (
                          <div>
                            <label className="text-sm font-medium text-red-700">Cancelled Date</label>
                            <p className="text-base text-red-900">{formatDate(order.cancelled_at)}</p>
                          </div>
                        )}
                      </div>
                      
                      {order.cancellation_reason && (
                        <div className="mt-4">
                          <label className="text-sm font-medium text-red-700">Cancellation Reason</label>
                          <p className="text-base text-red-900 mt-1">{order.cancellation_reason}</p>
                        </div>
                      )}
                      
                      {order.cancellation_message && (
                        <div className="mt-4">
                          <label className="text-sm font-medium text-red-700">Additional Message</label>
                          <p className="text-sm text-red-800 bg-red-100 p-3 rounded-md mt-1">
                            {order.cancellation_message}
                          </p>
                        </div>
                      )}
                      
                      {order.refund_status && (
                        <div className="mt-4">
                          <label className="text-sm font-medium text-red-700">Refund Status</label>
                          <div className="mt-1">
                            <Badge 
                              className={`${
                                order.refund_status === "completed" 
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : order.refund_status === "processing"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                              }`} 
                              variant="outline"
                            >
                              {order.refund_status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Order Summary & Actions */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping Fee</span>
                      <span className="font-medium">{formatCurrency(order.shipping_fee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">{formatCurrency(order.tax_amount)}</span>
                    </div>
                    {order.discount_amount && order.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Discount</span>
                        <span className="font-medium text-green-600">-{formatCurrency(order.discount_amount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(order.total_amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-gray-500" />
                    <span>Payment Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Method</label>
                    <p className="text-base font-medium text-gray-900 capitalize">
                      {order.payment_method ? order.payment_method.replace("_", " ") : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusBadge(order.payment_status, "payment")} variant="outline">
                        {order.payment_status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  {order.payment_reference && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Reference</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-base font-mono text-gray-900">{order.payment_reference}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(order.payment_reference!, "Payment reference")}
                          className="p-1"
                          aria-label="Copy payment reference"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping/Pickup Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="w-5 h-5 text-gray-500" />
                    <span>{order.is_pickup ? "Pickup Information" : "Shipping Information"}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Delivery Method</label>
                    <p className="text-base font-medium text-gray-900">
                      {order.is_pickup ? "For Pickup" : "For Delivery"}
                    </p>
                  </div>

                  {/* Address Information */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      {order.is_pickup ? "Pickup Address" : "Shipping Address"}
                    </label>
                    <div className="flex items-start space-x-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-gray-900">
                        {order.is_pickup ? (
                          // Pickup Information
                          <>
                            {order.pickup_info?.pickup_location && (
                              <p className="font-medium">{order.pickup_info.pickup_location}</p>
                            )}
                            {order.pickup_info?.pickup_address && <p>{order.pickup_info.pickup_address}</p>}
                            {order.pickup_info?.pickup_contact && <p>Contact: {order.pickup_info.pickup_contact}</p>}
                            {order.pickup_info?.pickup_hours && <p>Hours: {order.pickup_info.pickup_hours}</p>}
                            {order.pickup_info?.pickup_instructions && (
                              <p className="text-xs text-gray-600 mt-1">
                                Instructions: {order.pickup_info.pickup_instructions}
                              </p>
                            )}
                          </>
                        ) : (
                          // Shipping Address
                          <>
                            <p className="font-medium">{order.shipping_address.recipient_name}</p>
                            <p>{order.shipping_address.street}</p>
                            {order.shipping_address.barangay && <p>{order.shipping_address.barangay}</p>}
                            <p>
                              {order.shipping_address.city}, {order.shipping_address.province}
                            </p>
                            <p>{order.shipping_address.postal_code}</p>
                            {order.shipping_address.country && <p>{order.shipping_address.country}</p>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {order.tracking_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tracking Number</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-base font-mono text-gray-900">{order.tracking_number}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(order.tracking_number!, "Tracking number")}
                          className="p-1"
                          aria-label="Copy tracking number"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(`https://www.google.com/search?q=${order.tracking_number}`, "_blank")
                          }
                          className="p-1"
                          aria-label="Track package"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {order.estimated_delivery && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        {order.is_pickup ? "Estimated Pickup Date" : "Estimated Delivery"}
                      </label>
                      <p className="text-base text-gray-900">{formatDate(order.estimated_delivery)}</p>
                    </div>
                  )}
                  {order.special_instructions && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Special Instructions</label>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md mt-1">
                        {order.special_instructions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getDynamicActionButtons()}
                  
                  <Button
                    onClick={() => setShowNoteModal(true)}
                    variant="outline"
                    className="w-full"
                    disabled={updating}
                  >
                    Add Note
                  </Button>

                  {/* Mobile Activity History Button */}
                  <div className="md:hidden">
                    <OrderActivityModal
                      orderId={orderId}
                      orderNumber={order.order_number}
                      onStatusUpdate={(newStatus) => {
                        setOrder({
                          ...order,
                          status: newStatus,
                          updated_at: Timestamp.now(),
                          payment_status:
                            newStatus === "completed" || newStatus === "delivered"
                              ? "paid"
                              : newStatus === "cancelled"
                                ? "cancelled"
                                : order.payment_status,
                        })
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Add Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add Note to Order</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNoteModal(false)}
                  className="p-1"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <textarea
                    id="note"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your note here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
                <div className="flex space-x-3">
                  <Button onClick={addNote} disabled={!newNote.trim() || updating} className="flex-1">
                    {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Add Note"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowNoteModal(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Approval Dialog */}
        <OrderApprovalDialog
          open={approvalDialog.open}
          onOpenChange={(open) => setApprovalDialog({ open, order: null })}
          order={approvalDialog.order}
          onConfirm={() => {
            handleApproveOrder()
            setApprovalDialog({ open: false, order: null })
          }}
        />

        {/* Order Rejection Dialog */}
        <OrderRejectionDialog
          open={rejectionDialog.open}
          onOpenChange={(open) => setRejectionDialog({ open, order: null })}
          order={rejectionDialog.order}
          onConfirm={(reason) => {
            handleRejectOrder(reason)
            setRejectionDialog({ open: false, order: null })
          }}
        />

        {/* Payment Proof Modal */}
        <PaymentProofModal
          open={paymentProofModal.open}
          onOpenChange={(open) => setPaymentProofModal({ open, order: null })}
          order={paymentProofModal.order}
          onApprovePayment={() => {
            handleApprovePayment()
            setPaymentProofModal({ open: false, order: null })
          }}
          onRejectPayment={() => {
            handleRejectPayment()
            setPaymentProofModal({ open: false, order: null })
          }}
        />
      </div>
    </DashboardLayout>
  )
}
