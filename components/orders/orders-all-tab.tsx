"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, User, MapPin, Package, Calendar, CreditCard } from "lucide-react"
import { getStatusDisplay } from "@/lib/status-utils"
import { formatDate } from "@/lib/utils" // Corrected import path

interface OrdersAllTabProps {
  orders: any[]
  loading: boolean
  error: string | null
  onViewOrder: (orderId: string) => void
  onRefresh: () => void
  formatDate: (timestamp: any) => string // This prop is now redundant if using the imported one
}

export function OrdersAllTab({ orders, loading, error, onViewOrder, onRefresh }: OrdersAllTabProps) {
  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`
  }

  const getStatusBadge = (status: string) => {
    const statusDisplay = getStatusDisplay(status)
    return (
      <Badge variant="secondary" className={statusDisplay.color}>
        {statusDisplay.label}
      </Badge>
    )
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
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
        <p className="text-gray-500">You haven't received any orders yet.</p>
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
                      <div>
                        <div className="font-medium text-gray-900">{order.order_number}</div>
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
                    <td className="py-4 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-4 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewOrder(order.id)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Check Details
                      </Button>
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
                    <div className="font-medium text-gray-900">{order.order_number}</div>
                    <div className="text-sm text-gray-500">{order.items?.length || 0} items</div>
                  </div>
                  {getStatusBadge(order.status)}
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
                          Pick-up <br /> {order.pickup_info?.company_name || "Store"}
                        </span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-700">
                          Delivery • <br /> {order.shipping_address?.city || "N/A"}
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewOrder(order.id)}
                  className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Check Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
