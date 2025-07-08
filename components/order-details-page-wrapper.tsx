"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  CheckCircle,
  Edit3,
  Loader2,
  AlertCircle,
  RefreshCw,
  Tag,
  Palette,
  Ruler,
  Weight,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { useUserData } from "@/hooks/use-user-data"
import { updateOrderStatusWithStockManagement } from "@/lib/order-status-handler"
import { useAuth } from "@/hooks/use-auth"
import { OrderDetailsPage } from "./order-details-page"

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
  product_image?: string
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
  recipient_name?: string
  phone_number?: string
  street?: string
  city?: string
  province?: string
  postal_code?: string
  country?: string
  notes?: string
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
  shipping_address?: ShippingAddress
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

interface OrderData {
  id: string
  order_number: string
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  shipping_address?: ShippingAddress | null
  status: string
  total_amount: number
  created_at: any
  updated_at: any
  items: any[]
  payment_method?: string
  payment_status?: string
  tracking_number?: string
  courier?: string
  notes?: string
  cancellation_reason?: string
  cancelled_at?: any
  cancelled_by?: string
}

// Helper function to safely mask strings
const maskString = (str: string | undefined | null, visibleChars = 3): string => {
  if (!str || typeof str !== "string") return "***"
  if (str.length <= visibleChars) return str
  return str.substring(0, visibleChars) + "*".repeat(Math.max(0, str.length - visibleChars))
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
  const { user } = useAuth()

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
    const fetchOrder = async () => {
      if (!user || !orderId) return

      try {
        setLoading(true)
        const orderDoc = await getDoc(doc(db, "orders", orderId))

        if (orderDoc.exists()) {
          const orderData = { id: orderDoc.id, ...orderDoc.data() } as OrderData
          setOrder(orderData as any)
        } else {
          setError("Order not found")
        }
      } catch (err) {
        console.error("Error fetching order:", err)
        setError("Failed to load order details")
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [user, orderId])

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

      // Use the new stock management handler
      const result = await updateOrderStatusWithStockManagement(
        orderId,
        newStatus,
        currentUser.uid,
        oldStatus,
        currentUser.displayName || currentUser.email || "User",
        order,
      )

      if (!result.success) {
        throw new Error(result.error || "Failed to update order status")
      }

      // Update payment status if order is completed or cancelled
      const orderRef = doc(db, "orders", orderId)
      if (newStatus === "completed" || newStatus === "delivered") {
        await updateDoc(orderRef, {
          payment_status: "paid",
        })
      } else if (newStatus === "cancelled") {
        await updateDoc(orderRef, {
          payment_status: "cancelled",
          cancelled_at: Timestamp.now(),
          cancelled_by: currentUser.uid,
        })
      }

      // Update local state
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

      let toastMessage = `Order status changed to ${newStatus.toUpperCase()}`
      if (result.stockDeductionResult) {
        if (result.stockDeductionResult.success) {
          toastMessage += ` and stock deducted successfully`
        } else {
          toastMessage += ` (stock deduction had some issues)`
        }
      }

      toast({
        title: "Status updated successfully",
        description: toastMessage,
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
        description: "Failed to approve payment. Please try again.",
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

        <div className="grid grid-cols-2 gap-3 text-sm text-left">
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
                e.currentTarget.src = "/placeholder.svg?height=80&width=80"
              }}
            />
          </div>
        )}
      </div>
    )
  }

  // Helper function to mask sensitive information
  const maskStringOld = (str: string, visibleStart = 1, visibleEnd = 1) => {
    if (!str || str.length <= visibleStart + visibleEnd) return str
    const start = str.substring(0, visibleStart)
    const end = str.substring(str.length - visibleEnd)
    const middle = "*".repeat(Math.max(6, str.length - visibleStart - visibleEnd))
    return start + middle + end
  }

  // Error State
  if (error) {
    return (
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
    )
  }

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600">{error || "The requested order could not be found."}</p>
        </div>
      </div>
    )
  }

  // For cancelled orders, show simplified layout with masked information
  if (order.status === "cancelled") {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <h1 className="text-xl font-bold text-red-800">Order Cancelled</h1>
          </div>
          <p className="text-red-600 mt-1">This order has been cancelled and is no longer active.</p>
        </div>

        {/* Order ID */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Order ID</label>
              <p className="text-gray-800 font-mono">{order.order_number || order.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <p className="text-red-600 font-medium capitalize">{order.status}</p>
            </div>
          </div>
        </div>

        {/* Masked Delivery Address */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Delivery Address (Masked)</h2>
          <div className="space-y-2 text-gray-600">
            <p>
              <span className="font-medium">Recipient:</span>{" "}
              {maskString(order.shipping_address?.recipient_name || order.customer_name, 2)}
            </p>
            <p>
              <span className="font-medium">Phone:</span>{" "}
              {maskString(order.shipping_address?.phone_number || order.customer_phone, 3)}
            </p>
            <p>
              <span className="font-medium">Address:</span>{" "}
              {order.shipping_address
                ? `${maskString(order.shipping_address.street, 5)}, ${order.shipping_address.city || "***"}, ${order.shipping_address.province || "***"}`
                : "Address information not available"}
            </p>
          </div>
        </div>

        {/* Logistic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Logistic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Courier</label>
              <p className="text-gray-800">{order.courier || "Not specified"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Tracking Number</label>
              <p className="text-gray-800 font-mono">{order.tracking_number || "Not available"}</p>
            </div>
          </div>
        </div>

        {/* Cancellation Reason */}
        {order.cancellation_reason && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Cancellation Reason</h2>
            <p className="text-gray-700">{order.cancellation_reason}</p>
            {order.cancelled_at && (
              <p className="text-sm text-gray-500 mt-2">
                Cancelled on: {new Date(order.cancelled_at.toDate()).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // For non-cancelled orders, show the full order details page
  return <OrderDetailsPage />
}
