"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useUserData } from "@/hooks/use-user-data"
import { logOrderStatusChange } from "@/lib/order-activity-service"
import OrderActivityTimeline from "./order-activity-timeline"

interface OrderActivityModalProps {
  orderId: string
  orderNumber: string
  onClose?: () => void
  trigger?: React.ReactNode
  onStatusUpdate?: (newStatus: string) => void
}

export default function OrderActivityModal({
  orderId,
  orderNumber,
  onClose,
  trigger,
  onStatusUpdate,
}: OrderActivityModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const { currentUser } = useUserData()

  const statusOptions = [
    { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800 border-blue-200" },
    { value: "processing", label: "Processing", color: "bg-purple-100 text-purple-800 border-purple-200" },
    { value: "shipped", label: "Shipped", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800 border-green-200" },
    { value: "completed", label: "Completed", color: "bg-green-100 text-green-800 border-green-200" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200" },
  ]

  const fetchOrder = useCallback(async () => {
    if (!orderId || !isOpen) return

    try {
      const orderRef = doc(db, "orders", orderId)
      const orderSnap = await getDoc(orderRef)

      if (orderSnap.exists()) {
        const orderData = orderSnap.data()
        setOrder({ id: orderSnap.id, ...orderData })
      }
    } catch (error) {
      console.error("Error fetching order:", error)
      toast({
        title: "Error",
        description: "Failed to load order details.",
        variant: "destructive",
      })
    }
  }, [orderId, isOpen])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  const handleOpen = () => {
    setIsOpen(true)
  }

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  const getStatusBadge = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200"
    const statusStyle = statusOptions.find((s) => s.value === status)
    return statusStyle?.color || "bg-gray-100 text-gray-800 border-gray-200"
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
          description: `Order is already in ${newStatus} status.`,
        })
        setUpdating(false)
        return
      }

      const orderRef = doc(db, "orders", orderId)

      // Update the order
      await updateDoc(orderRef, {
        status: newStatus,
        updated_at: Timestamp.now(),
        status_history: arrayUnion({
          status: newStatus,
          timestamp: Timestamp.now(),
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
      } else if (newStatus === "cancelled") {
        await updateDoc(orderRef, {
          payment_status: "cancelled",
          cancelled_at: Timestamp.now(),
          cancelled_by: currentUser.uid,
        })
      }

      // Log the status change with notification
      await logOrderStatusChange(
        orderId,
        order.order_number,
        order.customer_id || order.user_id, // Customer ID
        currentUser.uid, // Admin/seller ID
        oldStatus,
        newStatus,
        {
          order_number: order.order_number,
          total_amount: order.total_amount,
          customer_name: order.customer_name,
          status_change_reason: "Updated from activity history",
          items_count: order.items?.length || 0,
          device_info: navigator.userAgent,
          timestamp_iso: new Date().toISOString(),
        },
      )

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

      // Notify parent component if callback provided
      if (onStatusUpdate) {
        onStatusUpdate(newStatus)
      }

      toast({
        title: "Status updated successfully",
        description: `Order status changed to ${newStatus}`,
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

  return (
    <>
      {trigger ? (
        <div onClick={handleOpen}>{trigger}</div>
      ) : (
        <Button variant="outline" size="sm" onClick={handleOpen} className="flex items-center gap-1 bg-transparent">
          <History className="w-4 h-4" />
          <span>Activity</span>
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Modal content without dark backdrop */}
          <Card
            ref={modalRef}
            className="w-full max-w-4xl max-h-[90vh] bg-white shadow-2xl border-2 border-gray-200 rounded-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
            }}
          >
            <CardHeader className="border-b border-gray-200 bg-gray-50/50 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <History className="w-5 h-5 text-blue-600" />
                  </div>
                  <span>Order Activity History - #{orderNumber}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  {order && (
                    <Badge className={getStatusBadge(order.status)} variant="outline">
                      {order.status.toUpperCase()}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-8 w-8 p-0 hover:bg-gray-200 rounded-full"
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[70vh] overflow-y-auto p-6 bg-gray-50/30">
                <OrderActivityTimeline orderId={orderId} />
              </div>
            </CardContent>
            {order && (
              <CardFooter className="border-t border-gray-200 p-4 bg-gray-50/50">
                <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-sm text-gray-600">
                    Update the order status to track progress and notify the customer.
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      )}
    </>
  )
}
