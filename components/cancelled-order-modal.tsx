"use client"

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FileX, Package, MapPin, Truck, MessageSquare, Hash } from "lucide-react"

interface CancelledOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
}

export function CancelledOrderModal({ open, onOpenChange, order }: CancelledOrderModalProps) {
  if (!order) return null

  const getCancellationInfo = () => {
    // Check if order was cancelled by buyer or seller
    const cancelledBy = order.cancelled_by || "buyer"
    const cancelReason = order.cancel_reason || order.cancellation_reason || "Others"

    return {
      cancelledBy: cancelledBy === "buyer" ? "Cancelled by buyer" : "Cancelled by seller",
      reason: cancelReason,
    }
  }

  const cancellationInfo = getCancellationInfo()
  console.log(JSON.stringify(order.items))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FileX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cancelled</h2>
              <p className="text-sm text-gray-600">{cancellationInfo.cancelledBy}</p>
              <p className="text-sm text-gray-500">Cancel Reason: {cancellationInfo.reason}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order ID */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Hash className="w-4 h-4 text-orange-500" />
              <h3 className="font-medium text-gray-900">Order ID</h3>
            </div>
            <p className="text-sm text-gray-700 font-mono bg-gray-50 p-2 rounded">{order.order_number}</p>
          </div>

          {/* Delivery Address - Only show if not pickup */}
          {!order.is_pickup && order.shipping_address && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-red-500" />
                <h3 className="font-medium text-gray-900">Delivery Address</h3>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p>{order.shipping_address.recipient_name || order.customer_name}</p>
                <p>{order.shipping_address.street}</p>
                {order.shipping_address.barangay && <p>{order.shipping_address.barangay}</p>}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.province}, {order.shipping_address.postal_code}
                </p>
              </div>
            </div>
          )}

          {/* Logistic Information */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <h3 className="font-medium text-gray-900">Logistic Information</h3>
            </div>

            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Package 1:</span>
                <span className="ml-2 text-gray-600">
                  {order.is_pickup ? "For Pickup" : "Standard Local"} |
                  {order.shipping_method || order.courier || "Standard Delivery"}
                </span>
              </div>

              {/* Product Summary with Image */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {order.items && order.items.length > 0 ? (
                    <img
                      src={order.items[0].image_url || "/placeholder.svg?height=40&width=40"}
                      alt="Product"
                      className="w-10 h-10 rounded object-cover border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Total {order.items?.length || 0} product{(order.items?.length || 0) !== 1 ? "s" : ""}
                  </p>
                  {order.items && order.items.length > 0 && (
                    <p className="text-xs text-gray-500 truncate">
                      {order.items[0].product_name}
                      {order.items.length > 1 && ` +${order.items.length - 1} more`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reason from Buyer */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              <h3 className="font-medium text-gray-900">
                Reason from {order.cancelled_by === "seller" ? "Seller" : "Buyer"}
              </h3>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">{order.cancel_reason || order.cancellation_reason || "Others"}</p>
              {order.cancel_message && <p className="text-sm text-gray-600 mt-2 italic">"{order.cancel_message}"</p>}
            </div>
          </div>

          {/* Additional Cancellation Details */}
          {(order.cancelled_at || order.refund_status) && (
            <div className="pt-4 border-t border-gray-200">
              <div className="space-y-2 text-sm">
                {order.cancelled_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cancelled Date:</span>
                    <span className="text-gray-900">
                      {new Date(
                        order.cancelled_at.toDate ? order.cancelled_at.toDate() : order.cancelled_at,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {order.refund_status && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Status:</span>
                    <Badge
                      variant="secondary"
                      className={
                        order.refund_status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {order.refund_status.charAt(0).toUpperCase() + order.refund_status.slice(1)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
