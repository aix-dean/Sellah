"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { User, MapPin, Package, Calendar, CreditCard, Truck, Eye } from "lucide-react"
import { OrderDetailsModal } from "../order-details-modal"

interface OrdersToShipTabProps {
  orders: any[]
  loading: boolean
  error: string | null
  onViewPaymentProof: (order: any) => void
  onReadyToShip: (order: any, showNotification?: boolean) => void
  onViewOrder: (orderId: string) => void
  onRefresh: () => void
  formatDate: (timestamp: any) => string
}

export function OrdersToShipTab({
  orders,
  loading,
  error,
  onViewPaymentProof,
  onReadyToShip,
  onViewOrder,
  onRefresh,
  formatDate,
}: OrdersToShipTabProps) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`
  }

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

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId])
    } else {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map((order) => order.id))
    } else {
      setSelectedOrders([])
    }
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
        <Truck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders to ship</h3>
        <p className="text-gray-500">All orders are either pending payment or already shipped.</p>
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
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    <Checkbox checked={selectedOrders.length === orders.length} onCheckedChange={handleSelectAll} />
                  </th>
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
                {orders.map((order) => {
                  const isSelected = selectedOrders.includes(order.id)

                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, checked)}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <button
                            onClick={() => handleOrderClick(order)}
                            className="font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                          >
                            {order.order_number}
                          </button>
                          <div className="text-sm text-gray-500">{order.items?.length || 0} items</div>
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
                              <span className="text-sm text-gray-700">
                                Pick-up <br /> {order.pickup_info?.pickup_address || "Store"}
                              </span>
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-gray-700">
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
                            variant="outline"
                            size="sm"
                            onClick={() => onViewOrder(order.id)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              onReadyToShip(order, false)
                              // Add visual feedback that the action is processing
                            }}
                            disabled={order.approve_payment !== true}
                            className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            {order.is_pickup ? "Ready for Pickup" : "Ready for Shipping"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {orders.map((order) => {
            const isSelected = selectedOrders.includes(order.id)

            return (
              <Card key={order.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOrder(order.id, checked)}
                      />
                      <div>
                        <button
                          onClick={() => handleOrderClick(order)}
                          className="font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          {order.order_number}
                        </button>
                        <div className="text-sm text-gray-500">{order.items?.length || 0} items</div>
                      </div>
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
                      variant="outline"
                      size="sm"
                      onClick={() => onViewOrder(order.id)}
                      className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        onReadyToShip(order, false)
                        // Add visual feedback that the action is processing
                      }}
                      disabled={order.approve_payment !== true}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      {order.is_pickup ? "Pickup" : "Ship"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
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
