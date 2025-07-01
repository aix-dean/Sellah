"use client"
import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, ChevronDown, Filter } from "lucide-react"
import DashboardLayout from "./dashboard-layout"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useUserData } from "@/hooks/use-user-data"
import { useOrdersPaginated } from "@/hooks/use-orders-paginated"
import { InfiniteScroll } from "./infinite-scroll"
import { useAnimatedSuccess } from "@/hooks/use-animated-success"
import { AnimatedSuccessMessage } from "./animated-success-message"
import { useRouter } from "next/navigation"
import { OrderApprovalDialog } from "./order-approval-dialog"
import { OrderRejectionDialog } from "./order-rejection-dialog"
import { PaymentProofModal } from "./payment-proof-modal"
import { updateOrderStatus, updateOrderOutForDelivery } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { getStatusCounts, debugStatusMapping, getOrdersByDisplayStatus } from "@/lib/status-utils"
import { OrderStatusDebugger } from "./order-status-debugger"

// Import tab components
import { OrdersAllTab } from "./orders/orders-all-tab"
import { OrdersUnpaidTab } from "./orders/orders-unpaid-tab"
import { OrdersToShipTab } from "./orders/orders-to-ship-tab"
import { OrdersShippingTab } from "./orders/orders-shipping-tab"
import { OrdersCompletedTab } from "./orders/orders-completed-tab"
import { OrdersCancelledTab } from "./orders/orders-cancelled-tab"

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("ALL")
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; order: any }>({ open: false, order: null })
  const [rejectionDialog, setRejectionDialog] = useState<{ open: boolean; order: any }>({ open: false, order: null })
  const [paymentProofModal, setPaymentProofModal] = useState<{ open: boolean; order: any }>({
    open: false,
    order: null,
  })
  const { toast } = useToast()
  const router = useRouter()

  // Use the animated success hook
  const { showSuccessAnimation, successMessage, isSuccessVisible, showAnimatedSuccess } = useAnimatedSuccess()

  // Use custom hooks for data fetching with pagination
  const { currentUser, loading: userLoading, error: userError } = useUserData()
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    hasMore,
    totalLoaded,
    loadMore,
    refresh,
  } = useOrdersPaginated(currentUser?.uid || null, 20)

  // Status tabs with counts using the utility function
  const statusTabs = useMemo(() => {
    const counts = getStatusCounts(orders)

    // Debug status mapping in development
    if (process.env.NODE_ENV === "development") {
      debugStatusMapping(orders)
    }

    return [
      { key: "ALL", label: "All", count: counts.all },
      { key: "UNPAID", label: "Unpaid", count: counts.unpaid },
      { key: "TO SHIP", label: "To Ship", count: counts.to_ship },
      { key: "SHIPPING", label: "Shipping", count: counts.shipping },
      { key: "COMPLETED", label: "Completed", count: counts.completed },
      { key: "CANCELLED", label: "Cancelled", count: counts.cancelled },
    ]
  }, [orders])

  // Filtered orders based on active tab and search
  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Filter by tab using the utility function
    if (activeTab !== "ALL") {
      const displayStatusMap = {
        UNPAID: "unpaid",
        "TO SHIP": "to_ship",
        SHIPPING: "shipping",
        COMPLETED: "completed",
        CANCELLED: "cancelled",
      }

      const targetDisplayStatus = displayStatusMap[activeTab as keyof typeof displayStatusMap]
      if (targetDisplayStatus) {
        filtered = getOrdersByDisplayStatus(orders, targetDisplayStatus)
      }
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter((order) => {
        return (
          order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.items.some((item) => item.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          order.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }

    return filtered
  }, [orders, activeTab, searchQuery])

  const loading = userLoading || ordersLoading

  // Navigate to order details page
  const handleViewOrder = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`)
  }

  // Force refresh orders with debugging
  const handleRefresh = async () => {
    console.log("🔄 Refreshing orders...")
    try {
      await refresh()
      console.log("✅ Orders refreshed successfully")
      toast({
        title: "Orders Refreshed",
        description: "Order data has been updated.",
      })
    } catch (error) {
      console.error("❌ Error refreshing orders:", error)
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh orders. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  const [shouldSwitchTab, setShouldSwitchTab] = useState<string | null>(null)

  // Handle order approval (for unpaid orders)
  const handleApproveOrder = async (order: any) => {
    console.log("🔄 Approving order:", order)
    try {
      await updateOrderStatus(
        order.id,
        "preparing",
        currentUser?.uid || "system",
        order.status,
        currentUser?.displayName || "System",
      )
      toast({
        title: "Order Approved",
        description: `Order ${order.order_number} has been approved successfully.`,
      })
      showAnimatedSuccess("Order approved successfully!")

      // Switch to "TO SHIP" tab after approval
      setActiveTab("TO SHIP")
      setShouldSwitchTab("TO SHIP")

      await handleRefresh() // Use the enhanced refresh function
    } catch (error) {
      console.error("Error approving order:", error)
      toast({
        title: "Error",
        description: "Failed to approve order. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle order rejection
  const handleRejectOrder = async (order: any, reason: string) => {
    console.log("🔄 Rejecting order:", order, "Reason:", reason)
    try {
      await updateOrderStatus(
        order.id,
        "CANCELLED",
        currentUser?.uid || "system",
        order.status,
        currentUser?.displayName || "System",
      )
      toast({
        title: "Order Rejected",
        description: `Order ${order.order_number} has been rejected. Reason: ${reason}`,
      })
      showAnimatedSuccess("Order rejected successfully!")

      // Switch to "CANCELLED" tab after rejection
      setActiveTab("CANCELLED")
      setShouldSwitchTab("CANCELLED")

      await handleRefresh() // Use the enhanced refresh function
    } catch (error) {
      console.error("Error rejecting order:", error)
      toast({
        title: "Error",
        description: "Failed to reject order. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle payment approval (ONLY refresh UI, don't change status)
  const handlePaymentApprovalSuccess = async () => {
    console.log("🔄 Payment approved - refreshing UI only, no status change")
    try {
      toast({
        title: "Payment Approved",
        description: `Payment has been approved successfully.`,
      })
      showAnimatedSuccess("Payment approved successfully!")
      await handleRefresh() // Only refresh to show updated approve_payment field
    } catch (error) {
      console.error("Error refreshing after payment approval:", error)
      toast({
        title: "Error",
        description: "Failed to refresh orders. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle payment rejection (for payment sent orders) - Enhanced with debugging
  const handleRejectPayment = async (order: any) => {
    console.log("🔄 Rejecting payment for order:", order)
    try {
      await updateOrderStatus(
        order.id,
        "settle payment",
        currentUser?.uid || "system",
        order.status,
        currentUser?.displayName || "System",
      )
      toast({
        title: "Payment Rejected",
        description: `Payment for order ${order.order_number} has been rejected.`,
      })
      showAnimatedSuccess("Payment rejected successfully!")
      await handleRefresh() // Use the enhanced refresh function
    } catch (error) {
      console.error("Error rejecting payment:", error)
      toast({
        title: "Error",
        description: "Failed to reject payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle ready to ship - change status to 'in transit'
  const handleReadyToShip = async (order: any, updateApprovePayment = false) => {
    console.log("🔄 Handling ready to ship for order:", order, "updateApprovePayment:", updateApprovePayment)
    try {
      // Always change status to 'in transit' when ready for shipping is clicked
      await updateOrderStatus(
        order.id,
        "in transit",
        currentUser?.uid || "system",
        order.status,
        currentUser?.displayName || "System",
      )
      toast({
        title: "Order Ready to Ship",
        description: `Order ${order.order_number} is now in transit and ready for shipping.`,
      })
      showAnimatedSuccess("Order is now in transit!")

      // Switch to "SHIPPING" tab after ready to ship
      setActiveTab("SHIPPING")
      setShouldSwitchTab("SHIPPING")

      await handleRefresh() // Use the enhanced refresh function
    } catch (error) {
      console.error("Error updating order to in transit:", error)
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle out for delivery - update out_of_delivery field to true (for delivery orders)
  const handleOutForDelivery = async (order: any) => {
    console.log("🚚 Handling out for delivery for order:", order)
    try {
      await updateOrderOutForDelivery(order.id, currentUser?.uid || "system", currentUser?.displayName || "System")
      toast({
        title: "Order Out for Delivery",
        description: `Order ${order.order_number} is now out for delivery.`,
      })
      showAnimatedSuccess("Order is out for delivery!")
      await handleRefresh()
    } catch (error) {
      console.error("Error updating order out for delivery:", error)
      toast({
        title: "Error",
        description: "Failed to update order delivery status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle picked up by buyer or order received - change status to 'order received' then 'completed'
  const handlePickedUpByBuyer = async (order: any) => {
    console.log("📦 Handling picked up by buyer/order received for order:", order)
    try {
      // First update to 'order received'
      await updateOrderStatus(
        order.id,
        "order received",
        currentUser?.uid || "system",
        order.status,
        currentUser?.displayName || "System",
      )

      // Then immediately update to 'completed'
      setTimeout(async () => {
        await updateOrderStatus(
          order.id,
          "completed",
          currentUser?.uid || "system",
          "order received",
          currentUser?.displayName || "System",
        )
        await handleRefresh()
      }, 500)

      const actionText = order.is_pickup ? "picked up by buyer" : "received by customer"
      toast({
        title: "Order Completed",
        description: `Order ${order.order_number} has been ${actionText} and is now completed.`,
      })
      showAnimatedSuccess(`Order ${actionText} successfully!`)

      // Switch to "COMPLETED" tab after completion
      setActiveTab("COMPLETED")
      setShouldSwitchTab("COMPLETED")

      await handleRefresh()
    } catch (error) {
      console.error("Error updating order to completed:", error)
      toast({
        title: "Error",
        description: "Failed to complete order. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add tab switching effect after the existing useEffect hooks
  useEffect(() => {
    if (shouldSwitchTab) {
      // Clear the switch flag after a short delay
      const timer = setTimeout(() => {
        setShouldSwitchTab(null)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [shouldSwitchTab])

  // Render the appropriate tab component
  const renderTabContent = () => {
    const commonProps = {
      orders: filteredOrders,
      loading,
      error: ordersError,
      onRefresh: handleRefresh,
      formatDate,
    }

    switch (activeTab) {
      case "ALL":
        return <OrdersAllTab {...commonProps} onViewOrder={handleViewOrder} />
      case "UNPAID":
        return (
          <OrdersUnpaidTab
            {...commonProps}
             onViewPaymentProof={(order) => {
              console.log("🔍 Opening payment proof modal for order:", order)
              setPaymentProofModal({ open: true, order })
            }}
            onApprove={(order) => setApprovalDialog({ open: true, order })}
            onReject={(order) => setRejectionDialog({ open: true, order })}
            onViewOrder={handleViewOrder}
          />
        )
      case "TO SHIP":
        return (
          <OrdersToShipTab
            {...commonProps}
            onViewPaymentProof={(order) => {
              console.log("🔍 Opening payment proof modal for order:", order)
              setPaymentProofModal({ open: true, order })
            }}
            onReadyToShip={handleReadyToShip}
            onViewOrder={handleViewOrder}
          />
        )
      case "SHIPPING":
        return (
          <OrdersShippingTab
            {...commonProps}
            onViewOrder={handleViewOrder}
            onOutForDelivery={handleOutForDelivery}
            onPickedUpByBuyer={handlePickedUpByBuyer}
          />
        )
      case "COMPLETED":
        return <OrdersCompletedTab {...commonProps} onViewOrder={handleViewOrder} />
      case "CANCELLED":
        return <OrdersCancelledTab {...commonProps} onViewOrder={handleViewOrder} />
      default:
        return <OrdersAllTab {...commonProps} onViewOrder={handleViewOrder} />
    }
  }

  if (userError) {
    return (
      <DashboardLayout activeItem="orders">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
            <p className="text-gray-500 mb-4">{userError}</p>
            <Button onClick={() => (window.location.href = "/login")}>Go to Login</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout activeItem="orders">
      <div className="min-h-screen bg-gray-50">
        {/* Animated Success Message */}
        <AnimatedSuccessMessage show={showSuccessAnimation} message={successMessage} isVisible={isSuccessVisible} />

        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
              <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center justify-center space-x-2">
                      <Filter className="w-4 h-4" />
                      <span className="hidden sm:inline">Status: {activeTab}</span>
                      <span className="sm:hidden">Filter</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {statusTabs.map((tab) => (
                      <DropdownMenuItem key={tab.key} onClick={() => setActiveTab(tab.key)}>
                        {tab.label} ({tab.count})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex space-x-8 border-b border-gray-200 overflow-x-auto scrollbar-hide mt-3">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.key
                  ? "text-red-600 border-red-600"
                  : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
              } ${shouldSwitchTab === tab.key ? "animate-pulse bg-red-50 rounded-t-md" : ""}`}
            >
              {tab.label}
              {tab.count > 0 && <span className="ml-1">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-6">
          {/* Order Count and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <h2 className="text-lg font-semibold text-gray-900">{filteredOrders.length} Orders</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center justify-center space-x-2">
                    <span>Order ID</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Order ID</DropdownMenuItem>
                  <DropdownMenuItem>Customer Name</DropdownMenuItem>
                  <DropdownMenuItem>Product Name</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="mt-6">
              <InfiniteScroll
                hasMore={hasMore}
                loading={loading}
                onLoadMore={loadMore}
                className="mt-6"
                loadingText="Loading more orders..."
                endText={`Showing all ${totalLoaded} orders`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Order Approval Dialog */}
      <OrderApprovalDialog
        open={approvalDialog.open}
        onOpenChange={(open) => setApprovalDialog({ open, order: null })}
        order={approvalDialog.order}
        onConfirm={() => handleApproveOrder(approvalDialog.order)}
      />

      {/* Order Rejection Dialog */}
      <OrderRejectionDialog
        open={rejectionDialog.open}
        onOpenChange={(open) => setRejectionDialog({ open, order: null })}
        order={rejectionDialog.order}
        onConfirm={(reason) => handleRejectOrder(rejectionDialog.order, reason)}
      />

      {/* Payment Proof Modal */}
      <PaymentProofModal
        open={paymentProofModal.open}
        onOpenChange={(open) => {
          console.log("🔒 Payment proof modal closing, open:", open)
          setPaymentProofModal({ open, order: null })
        }}
        order={paymentProofModal.order}
        onApprovePayment={handlePaymentApprovalSuccess}
        onRejectPayment={() => handleRejectPayment(paymentProofModal.order)}
      />

      {/* Debug Component - Only show in development */}
      {process.env.NODE_ENV === "development" && <OrderStatusDebugger />}
    </DashboardLayout>
  )
}
