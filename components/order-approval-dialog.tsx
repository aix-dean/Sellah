"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Package, User, Calendar, CreditCard } from "lucide-react"

interface OrderApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
  onConfirm: () => void
}

export function OrderApprovalDialog({ open, onOpenChange, order, onConfirm }: OrderApprovalDialogProps) {
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

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Approve Order</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 mb-2">You are about to approve this order. This action will:</p>
            <ul className="text-xs text-green-700 space-y-1 ml-4">
              <li>• Change order status to "Preparing"</li>
              <li>• Move order to "To Ship" tab</li>
              <li>• Notify the customer</li>
              <li>• Begin order processing</li>
            </ul>
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
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
