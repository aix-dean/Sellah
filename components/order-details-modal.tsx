"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { User, MapPin, Package, CreditCard, Phone, Mail, Tag, Palette, Ruler, Weight, ExternalLink } from "lucide-react"

interface OrderDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
  onViewFullOrder?: (orderId: string) => void
}

export function OrderDetailsModal({ open, onOpenChange, order, onViewFullOrder }: OrderDetailsModalProps) {
  if (!order) return null

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
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
    return `₱${amount.toFixed(2)}`
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "payment sent": { label: "Payment Sent", className: "bg-yellow-100 text-yellow-800" },
      pending: { label: "Pending", className: "bg-orange-100 text-orange-800" },
      unpaid: { label: "Unpaid", className: "bg-red-100 text-red-800" },
      preparing: { label: "Preparing", className: "bg-blue-100 text-blue-800" },
      "in transit": { label: "In Transit", className: "bg-purple-100 text-purple-800" },
      completed: { label: "Completed", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800" },
    }

    const config = statusConfig[status?.toLowerCase() as keyof typeof statusConfig] || {
      label: status?.replace("_", " ") || "Unknown",
      className: "bg-gray-100 text-gray-800",
    }

    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const renderVariationData = (item: any) => {
    if (!item.variation_data) return null

    const variationData = item.variation_data
    const hasVariationInfo = variationData.name || variationData.color || variationData.sku || variationData.price

    if (!hasVariationInfo) return null

    return (
      <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100">
        <div className="flex items-center space-x-1 mb-1">
          <Tag className="w-3 h-3 text-blue-600" />
          <span className="text-xs font-medium text-blue-800">Variation</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {variationData.name && (
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="ml-1 font-medium text-gray-900">{variationData.name}</span>
            </div>
          )}

          {variationData.color && (
            <div className="flex items-center">
              <Palette className="w-2 h-2 text-gray-500 mr-1" />
              <span className="text-gray-600">Color:</span>
              <span className="ml-1 font-medium text-gray-900">{variationData.color}</span>
            </div>
          )}

          {variationData.sku && (
            <div className="col-span-2">
              <span className="text-gray-600">SKU:</span>
              <span className="ml-1 font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{variationData.sku}</span>
            </div>
          )}

          {variationData.price && (
            <div>
              <span className="text-gray-600">Price:</span>
              <span className="ml-1 font-medium text-gray-900">{formatCurrency(variationData.price)}</span>
            </div>
          )}

          {variationData.stock && (
            <div>
              <span className="text-gray-600">Stock:</span>
              <span className="ml-1 font-medium text-gray-900">{variationData.stock}</span>
            </div>
          )}

          {(variationData.height || variationData.length || variationData.weight) && (
            <div className="col-span-2">
              <div className="flex items-center space-x-2">
                {variationData.height && (
                  <div className="flex items-center">
                    <Ruler className="w-2 h-2 text-gray-500 mr-1" />
                    <span className="text-gray-600">H:</span>
                    <span className="ml-1 text-gray-900">{variationData.height}</span>
                  </div>
                )}
                {variationData.length && (
                  <div className="flex items-center">
                    <Ruler className="w-2 h-2 text-gray-500 mr-1" />
                    <span className="text-gray-600">L:</span>
                    <span className="ml-1 text-gray-900">{variationData.length}</span>
                  </div>
                )}
                {variationData.weight && (
                  <div className="flex items-center">
                    <Weight className="w-2 h-2 text-gray-500 mr-1" />
                    <span className="text-gray-600">Weight:</span>
                    <span className="ml-1 text-gray-900">{variationData.weight}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {variationData.media && (
          <div className="mt-2">
            <img
              src={variationData.media || "/placeholder.svg"}
              alt={`${variationData.name || "Variation"} image`}
              className="w-12 h-12 rounded object-cover border border-gray-200"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div>
            <DialogTitle className="text-xl font-bold">Order #{order.order_number}</DialogTitle>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusBadge(order.status)}
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
            </div>
          </div>
          {onViewFullOrder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onViewFullOrder(order.id)
                onOpenChange(false)
              }}
              className="flex items-center space-x-1"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Full Details</span>
            </Button>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Customer Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm text-gray-900">{order.customer_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <p className="text-sm text-gray-900">{order.customer_email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <p className="text-sm text-gray-900">{order.customer_phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information - Only show if not pickup */}
            {!order.is_pickup && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    Shipping Address
                  </h3>
                  <div className="text-sm text-gray-900 space-y-1">
                    <p className="font-medium">{order.shipping_address?.recipient_name}</p>
                    <p>{order.shipping_address?.street}</p>
                    {order.shipping_address?.barangay && <p>{order.shipping_address.barangay}</p>}
                    <p>
                      {order.shipping_address?.city}, {order.shipping_address?.province}
                    </p>
                    <p>{order.shipping_address?.postal_code}</p>
                    {order.shipping_address?.country && <p>{order.shipping_address.country}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Pickup Information - Only show if pickup */}
            {order.is_pickup && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="w-4 h-4 mr-2 text-gray-500" />
                    Pickup Information
                  </h3>
                  <div className="text-sm text-gray-900 space-y-1">
                    {order.pickup_info?.pickup_location && (
                      <p className="font-medium">{order.pickup_info.pickup_location}</p>
                    )}
                    {order.pickup_info?.pickup_address && <p>{order.pickup_info.pickup_address}</p>}
                    {order.pickup_info?.pickup_contact && <p>Contact: {order.pickup_info.pickup_contact}</p>}
                    {order.pickup_info?.pickup_hours && <p>Hours: {order.pickup_info.pickup_hours}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2 text-gray-500" />
              Order Items ({order.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {order.items?.map((item: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <img
                      src={item.product_image || "/placeholder.svg?height=60&width=60"}
                      alt={item.product_name}
                      className="w-12 h-12 rounded object-cover border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=60&width=60"
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{item.product_name}</h4>
                        {item.sku && (
                          <p className="text-xs text-gray-500 mt-1">
                            SKU: <span className="font-mono">{item.sku}</span>
                          </p>
                        )}

                        {/* Render variation data */}
                        {renderVariationData(item)}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-600">
                          Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{formatCurrency(item.total_price)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
              Order Summary
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
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
                  <span className="font-medium">{formatCurrency(order.tax_amount || 0)}</span>
                </div>
                {order.discount_amount && order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-green-600">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Payment Information</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="capitalize">{order.payment_method?.replace("_", " ") || "N/A"}</span>
                </div>
               
                {order.payment_reference && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-mono text-xs">{order.payment_reference}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Delivery Information</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span>{order.is_pickup ? "For Pickup" : "For Delivery"}</span>
                </div>
                {order.tracking_number && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tracking:</span>
                    <span className="font-mono text-xs">{order.tracking_number}</span>
                  </div>
                )}
                {order.estimated_delivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{order.is_pickup ? "Pickup Date:" : "Estimated:"}</span>
                    <span>{formatDate(order.estimated_delivery)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {order.special_instructions && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Special Instructions</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{order.special_instructions}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
