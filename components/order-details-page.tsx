"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Package,
  User,
  CreditCard,
  Calendar,
  Truck,
  Store,
  AlertCircle,
  Loader2,
  Copy,
  Tag,
  Palette,
  Ruler,
  Weight,
  Activity,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import OrderActivityHistoryModal from "./order-activity-history-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface OrderDetailsPageProps {
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
  courier?: string
}

export function OrderDetailsPage({ orderId }: OrderDetailsPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showActivityModal, setShowActivityModal] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user || !orderId) return

      try {
        setLoading(true)
        const orderDoc = await getDoc(doc(db, "orders", orderId))

        if (orderDoc.exists()) {
          const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order
          setOrder(orderData)
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

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      "settle payment": "bg-red-100 text-red-800 border-red-200",
      "payment sent": "bg-orange-100 text-orange-800 border-orange-200",
      preparing: "bg-blue-100 text-blue-800 border-blue-200",
      "in transit": "bg-purple-100 text-purple-800 border-purple-200",
      out_for_delivery: "bg-indigo-100 text-indigo-800 border-indigo-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    }

    return statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    }

    return statusColors[status] || "bg-gray-100 text-gray-800"
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
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error || "The requested order could not be found."}</p>
          <Button onClick={() => router.push("/dashboard/orders")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/orders")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Orders</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600">Order #{order.order_number || order.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className={getStatusBadge(order.status)} variant="outline">
              {order.status.toUpperCase()}
            </Badge>
            <Badge className={getPaymentStatusBadge(order.payment_status)} variant="outline">
              {order.payment_status?.toUpperCase() || "PENDING"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActivityModal(true)}
              className="flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>Activity</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Order Items ({order.items?.length || 0})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={
                            item.product_image || item.variation_data?.media || "/placeholder.svg?height=64&width=64"
                          }
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product_name}</h3>
                        {item.variation_data?.name && (
                          <p className="text-sm text-gray-600">Variation: {item.variation_data.name}</p>
                        )}
                        {item.variation_data?.color && (
                          <p className="text-sm text-gray-600">Color: {item.variation_data.color}</p>
                        )}
                        {item.sku && (
                          <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block mt-1">
                            SKU: {item.sku}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                        {renderVariationData(item)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item.unit_price)}</p>
                      <p className="text-sm text-gray-600">each</p>
                      <p className="font-semibold text-lg text-gray-900 mt-1">{formatCurrency(item.total_price)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(order.subtotal || 0)}</span>
                </div>
                {order.shipping_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping Fee</span>
                    <span className="font-medium">{formatCurrency(order.shipping_fee)}</span>
                  </div>
                )}
                {order.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatCurrency(order.tax_amount)}</span>
                  </div>
                )}
                {order.discount_amount && order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Customer Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-gray-900">{order.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">{order.customer_email}</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.customer_email, "Email")}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900">{order.customer_phone}</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(order.customer_phone, "Phone")}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery/Pickup Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {order.is_pickup ? (
                    <>
                      <Store className="w-5 h-5 text-blue-600" />
                      <span>Pickup Information</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-5 h-5 text-green-600" />
                      <span>Delivery Information</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Method</label>
                  <div className="flex items-center space-x-2">
                    {order.is_pickup ? (
                      <>
                        <Store className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-800 font-medium">Store Pickup</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4 text-green-600" />
                        <span className="text-green-800 font-medium">Home Delivery</span>
                      </>
                    )}
                  </div>
                </div>

                {order.is_pickup ? (
                  // Pickup Information
                  <div className="space-y-3">
                    {order.pickup_info?.pickup_location && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Pickup Location</label>
                        <p className="text-gray-900">{order.pickup_info.pickup_location}</p>
                      </div>
                    )}
                    {order.pickup_info?.pickup_address && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Store Address</label>
                        <p className="text-gray-900">{order.pickup_info.pickup_address}</p>
                      </div>
                    )}
                    {order.pickup_info?.pickup_contact && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Contact Number</label>
                        <div className="flex items-center space-x-2">
                          <p className="text-gray-900">{order.pickup_info.pickup_contact}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(order.pickup_info?.pickup_contact || "", "Contact")}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {order.pickup_info?.pickup_hours && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Pickup Hours</label>
                        <p className="text-gray-900">{order.pickup_info.pickup_hours}</p>
                      </div>
                    )}
                    {order.pickup_info?.pickup_instructions && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Special Instructions</label>
                        <p className="text-gray-900">{order.pickup_info.pickup_instructions}</p>
                      </div>
                    )}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Pickup Notice</p>
                          <p>Please bring a valid ID and your order number when picking up your order.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Delivery Information
                  <div className="space-y-3">
                    {order.shipping_address && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Recipient</label>
                          <p className="text-gray-900">
                            {order.shipping_address.recipient_name || order.customer_name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Phone Number</label>
                          <div className="flex items-center space-x-2">
                            <p className="text-gray-900">
                              {order.shipping_address.phone_number || order.customer_phone}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(order.shipping_address?.phone_number || order.customer_phone, "Phone")
                              }
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Delivery Address</label>
                          <div className="text-gray-900 space-y-1">
                            <p>{order.shipping_address.street}</p>
                            <p>
                              {order.shipping_address.city && `${order.shipping_address.city}`}
                              {order.shipping_address.province && `, ${order.shipping_address.province}`}
                            </p>
                            <p>
                              {order.shipping_address.postal_code && `${order.shipping_address.postal_code} `}
                              {order.shipping_address.country || "Philippines"}
                            </p>
                          </div>
                        </div>
                        {order.shipping_address.notes && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Delivery Notes</label>
                            <p className="text-gray-900">{order.shipping_address.notes}</p>
                          </div>
                        )}
                      </>
                    )}
                    {order.tracking_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tracking Number</label>
                        <div className="flex items-center space-x-2">
                          <p className="text-gray-900 font-mono">{order.tracking_number}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(order.tracking_number || "", "Tracking Number")}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Method</label>
                  <p className="text-gray-900">{order.payment_method}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Status</label>
                  <Badge className={getPaymentStatusBadge(order.payment_status)} variant="outline">
                    {order.payment_status?.toUpperCase() || "PENDING"}
                  </Badge>
                </div>
                {order.payment_reference && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reference Number</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-900 font-mono">{order.payment_reference}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(order.payment_reference || "", "Reference Number")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Amount</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Order Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Order ID</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-gray-900 font-mono">{order.order_number || order.id}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(order.order_number || order.id, "Order ID")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Order Date</label>
                  <p className="text-gray-900">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-gray-900">{formatDate(order.updated_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Delivery Method</label>
                  <p className="text-gray-900">{order.is_pickup ? "Store Pickup" : "Home Delivery"}</p>
                </div>
                {order.special_instructions && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Special Instructions</label>
                    <p className="text-gray-900">{order.special_instructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Activity History Modal */}
        <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Activity History</DialogTitle>
            </DialogHeader>
            <OrderActivityHistoryModal orderId={orderId} orderNumber={order.order_number || order.id} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default OrderDetailsPage
