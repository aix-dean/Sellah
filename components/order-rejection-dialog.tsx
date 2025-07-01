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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { XCircle, Loader2 } from "lucide-react"

interface OrderRejectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
  onConfirm: (reason: string) => Promise<void>
}

const REJECTION_REASONS = [
  "Out of stock",
  "Wrong listing",
  "Invalid shipping address",
  "Buyer requested cancellation",
  "Other",
]

export function OrderRejectionDialog({ open, onOpenChange, order, onConfirm }: OrderRejectionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [customReason, setCustomReason] = useState("")
  const [showCustomReason, setShowCustomReason] = useState(false)

  const handleReasonChange = (reason: string, checked: boolean) => {
    if (reason === "Other") {
      setShowCustomReason(checked)
      if (!checked) {
        setCustomReason("")
      }
    }

    if (checked) {
      setSelectedReasons((prev) => [...prev, reason])
    } else {
      setSelectedReasons((prev) => prev.filter((r) => r !== reason))
    }
  }

  const handleConfirm = async () => {
    if (selectedReasons.length === 0) {
      return
    }

    setIsLoading(true)
    try {
      let finalReason = selectedReasons.filter((r) => r !== "Other").join(", ")
      if (selectedReasons.includes("Other") && customReason.trim()) {
        finalReason = finalReason ? `${finalReason}, ${customReason.trim()}` : customReason.trim()
      }

      await onConfirm(finalReason)
      onOpenChange(false)
      // Reset form
      setSelectedReasons([])
      setCustomReason("")
      setShowCustomReason(false)
    } catch (error) {
      console.error("Error rejecting order:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset form
    setSelectedReasons([])
    setCustomReason("")
    setShowCustomReason(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span>Reject Order</span>
          </DialogTitle>
          <DialogDescription>
            Please select the reason(s) for rejecting this order. This action will cancel the order and notify the
            customer.
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
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Reason for rejection:</h4>
              {REJECTION_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <Checkbox
                    id={reason}
                    checked={selectedReasons.includes(reason)}
                    onCheckedChange={(checked) => handleReasonChange(reason, checked as boolean)}
                  />
                  <label htmlFor={reason} className="text-sm text-gray-700 cursor-pointer">
                    {reason}
                  </label>
                </div>
              ))}
            </div>

            {showCustomReason && (
              <div className="space-y-2">
                <label htmlFor="custom-reason" className="text-sm font-medium text-gray-700">
                  Please specify:
                </label>
                <Textarea
                  id="custom-reason"
                  placeholder="Enter your reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              isLoading || selectedReasons.length === 0 || (selectedReasons.includes("Other") && !customReason.trim())
            }
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Reject Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
