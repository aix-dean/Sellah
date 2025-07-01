"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Order } from "@/types"
import { useState } from "react"
import { updateOrderApprovePayment } from "@/lib/api"

interface PaymentProofModalProps {
  order: Order | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprovePayment: () => void
  onRejectPayment: () => void
}

export function PaymentProofModal({
  order,
  open,
  onOpenChange,
  onApprovePayment,
  onRejectPayment,
}: PaymentProofModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  if (!order) return null

  const handleApprove = async () => {
    console.log("🔄 Approving payment for order:", order.id)
    console.log("📄 Current order status before approval:", order.status)
    setIsProcessing(true)

    try {
      // IMPORTANT: Use updateOrderApprovePayment - this ONLY updates approve_payment field
      // It does NOT change the status - status should remain 'preparing'
      await updateOrderApprovePayment(order.id, "system", "System")

      console.log("✅ Payment approved successfully - status should still be 'preparing'")

      // Call the parent callback which will refresh the UI
      onApprovePayment()
      onOpenChange(false)
    } catch (error) {
      console.error("❌ Error approving payment:", error)
      alert(`Error approving payment: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = () => {
    console.log("🔄 Rejecting payment for order:", order.id)
    onRejectPayment()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment Proof - Order #{order.order_number}</DialogTitle>
          <DialogDescription>
            Review the payment proof submitted by the customer. Approving will mark payment as approved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Order Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Customer:</span>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              <div>
                <span className="text-gray-500">Total Amount:</span>
                <p className="font-medium">
                  ₱{order.total_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Current Status:</span>
                <p className="font-medium capitalize">Unpaid</p>
              </div>
            </div>
          </div>

          {/* Payment Proof */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Payment Proof</h3>

            {/* Payment Reference */}
            <div>
              <span className="text-sm text-gray-500">Reference Number:</span>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {order.payment_proof?.transaction_number || "No reference provided"}
              </p>
            </div>

            {/* Payment Image */}
            <div>
              <span className="text-sm text-gray-500">Payment Screenshot:</span>
              <div className="mt-2 border rounded-lg p-4 bg-gray-50">
                {order.payment_proof?.image_url ? (
                  <img
                    src={order.payment_proof.image_url || "/placeholder.svg"}
                    alt="Payment proof"
                    className="max-w-full h-auto rounded border"
                    style={{ maxHeight: "300px" }}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No payment image provided</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
            Reject Payment
          </Button>
          <Button onClick={handleApprove} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
            {isProcessing ? "Approving Payment..." : "Approve Payment Only"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
