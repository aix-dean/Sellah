"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, MapPin, Package, User, Calendar, CreditCard } from "lucide-react"
import { OrderSummaryModal } from "@/components/order-summary-modal"
import { useCompanyData } from "@/hooks/use-company-data"
import { useUserData } from "@/hooks/use-user-data"

interface OrdersCompletedTabProps {
  orders: any[]
  loading: boolean
}

export function OrdersCompletedTab({ orders, loading }: OrdersCompletedTabProps) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const { userData } = useUserData()
  const { company } = useCompanyData(userData?.company_id || null)

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch (error) {
      return "N/A"
    }
  }

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Completed", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      delivered: { label: "Delivered", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      picked_up: { label: "Picked Up", className: "bg-green-100 text-green-800 hover:bg-green-100" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status.replace("_", " "),
      className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    }

    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const handleViewSummary = (order: any) => {
    setSelectedOrder(order)
    setShowSummaryModal(true)
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

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No completed orders</h3>
        <p className="text-gray-500">Completed orders will appear here once they are delivered or picked up.</p>
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
                    <td className="py-4 px-4">
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
                            <span className="text-sm text-gray-700">
                              Pick-up <br/>  {order.pickup_info?.pickup_address || "Store"}
                            </span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-700">
                               Delivery <br /> {`${order.shipping_address?.street}, ${order.shipping_address.city}` || "N/A"}
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
                        onClick={() => handleViewSummary(order)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Order Summary
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewSummary(order)}
                  className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Order Summary
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Order Summary Modal */}
      <OrderSummaryModal
        open={showSummaryModal}
        onOpenChange={setShowSummaryModal}
        order={selectedOrder}
        userData={userData}
        companyData={company}
      />
    </>
  )
}
