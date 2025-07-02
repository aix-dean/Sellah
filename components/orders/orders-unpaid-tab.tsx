"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { User, MapPin, Package, Calendar, CreditCard, CheckCircle, XCircle } from "lucide-react"
import { useState } from "react"
import { OrderDetailsModal } from "../order-details-modal"

interface OrdersUnpaidTabProps {
  orders: any[]
  loading: boolean
  error: string | null
  onViewPaymentProof: (order: any) => void    
  onApprove: (order: any) => void
  onReject: (order: any) => void
  onViewOrder: (orderId: string) => void
  onRefresh: () => void
  formatDate: (timestamp: any) => string
}

export function OrdersUnpaidTab({
  orders,
  loading,
  error,
  onViewPaymentProof,
  onApprove,
  onReject,
  onViewOrder,
  onRefresh,
  formatDate,
}: OrdersUnpaidTabProps) {
  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`
  }

  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)


  const getStatusBadge = (order: any) => {
    if (order.approve_payment === false) {
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 hover:bg-blue-100 cursor-pointer"
          onClick={() => onViewPaymentProof(order)}
        >
          Payment Proof
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
        Payment Approved
      </Badge>
    )
  }

  const handleOrderClick = (order: any) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }



  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Error loading orders: {error}</div>
        <Button onClick={onRefresh}>Try Again</Button>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No unpaid orders</h3>
        <p className="text-gray-500">All orders have been processed or there are no pending payments.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Channel</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-left">
                      <div className="text-left">
                        <button
                          onClick={() => handleOrderClick(order)}
                          className="font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer text-left"
                        >
                          {order.order_number}
                        </button>
                        <div className="text-sm text-gray-500 text-left">{order.items?.length || 0} items</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900">{order.customer_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {order.is_pickup ? (
                          <>
                            <Package className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-700 text-left">
                              Pick-up <br /> {order.pickup_info?.pickup_address || "Store"}
                            </span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-700 text-left">
                              Delivery <br />{" "}
                              {`${order.shipping_address?.street}, ${order.shipping_address.city}` || "N/A"}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{formatDate(order.created_at)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900">{formatCurrency(order.total_amount)}</div>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(order)}</td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => onApprove(order)}
                          disabled={!order.approve_payment}
                          className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onReject(order)}
                          className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200 hover:scale-105"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <button
                      onClick={() => handleOrderClick(order)}
                      className="font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      {order.order_number}
                    </button>
                    <div className="text-sm text-gray-500">{order.items?.length || 0} items</div>
                  </div>
                  {getStatusBadge(order)}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{order.customer_name}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {order.is_pickup ? (
                      <>
                        <Package className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-700">
                          Pick-up • {order.pickup_info?.company_name || "Store"}
                        </span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-700">
                          Delivery • {order.shipping_address?.city || "N/A"}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{formatDate(order.created_at)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => onApprove(order)}
                    disabled={!order.approve_payment}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onReject(order)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white transition-all duration-200 hover:scale-105"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {/* Order Details Modal */}
      <OrderDetailsModal
        open={showOrderModal}
        onOpenChange={setShowOrderModal}
        order={selectedOrder}
        onViewFullOrder={onViewOrder}
      />
    </>
  )
}
