"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { XCircle, Package, User, Calendar, CreditCard, AlertTriangle } from "lucide-react"

interface OrderRejectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
  onConfirm: (reason: string) => void
}

export function OrderRejectionDialog({ open, onOpenChange, order, onConfirm }: OrderRejectionDialogProps) {
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleConfirm = async () => {
    if (!reason.trim()) return

    setIsSubmitting(true)
    try {
      await onConfirm(reason.trim())
      onOpenChange(false)
      setReason("")
    } catch (error) {
      console.error("Error rejecting order:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    setReason("")
  }

  const commonReasons = [
    "Insufficient stock",
    "Payment verification failed",
    "Invalid customer information",
    "Shipping address issues",
    "Product discontinued",
    "Pricing error",
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span>Reject Order</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800 mb-2">You are about to reject this order. This action will:</p>
                <ul className="text-xs text-red-700 space-y-1 ml-2">
                  <li>• Cancel the order permanently</li>
                  <li>• Move order to "Cancelled" tab</li>
                  <li>• Notify the customer with reason</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{order.order_number}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {order.status}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</div>
                <div className="text-xs text-gray-500">{order.items?.length || 0} items</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{order.customer_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{order.is_pickup ? "Pickup" : "Delivery"}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 capitalize">{order.payment_method || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Rejection Reason */}
          <div className="space-y-3">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason for rejection <span className="text-red-500">*</span>
            </Label>

            {/* Quick Reason Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {commonReasons.map((commonReason) => (
                <Button
                  key={commonReason}
                  variant="outline"
                  size="sm"
                  onClick={() => setReason(commonReason)}
                  className="text-xs h-8 justify-start"
                >
                  {commonReason}
                </Button>
              ))}
            </div>

            <Textarea
              id="reason"
              placeholder="Enter the reason for rejecting this order..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">{reason.length}/500</div>
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason.trim() || isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <XCircle className="w-4 h-4 mr-2" />
            {isSubmitting ? "Rejecting..." : "Reject Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
