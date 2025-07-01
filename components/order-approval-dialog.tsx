"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, Loader2 } from "lucide-react"

interface OrderApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
  onConfirm: () => Promise<void>
}

export function OrderApprovalDialog({ open, onOpenChange, order, onConfirm }: OrderApprovalDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error("Error approving order:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Approve Order</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to approve this order? This action will change the order status to "Confirmed" and
            notify the customer.
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Order ID:</span>
                  <p className="text-gray-900">{order.order_number}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Customer:</span>
                  <p className="text-gray-900">{order.customer_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total Amount:</span>
                  <p className="text-gray-900">
                    ₱{order.total_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Items:</span>
                  <p className="text-gray-900">{order.items.length} item(s)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              "Approve Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
