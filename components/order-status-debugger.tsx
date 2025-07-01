"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getStatusDisplay, debugStatusMapping, STATUS_MAPPINGS } from "@/lib/status-utils"
import { useOrders } from "@/hooks/use-orders"
import { useUserData } from "@/hooks/use-user-data"

export function OrderStatusDebugger() {
  const [showDebug, setShowDebug] = useState(false)
  const { currentUser } = useUserData()
  const { orders } = useOrders(currentUser?.uid || null)

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowDebug(true)}
          variant="outline"
          size="sm"
          className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
        >
          🐛 Debug Status
        </Button>
      </div>
    )
  }

  const statusBreakdown: Record<string, { count: number; orders: any[] }> = {}

  orders.forEach((order) => {
    const dbStatus = order.status || "undefined"
    if (!statusBreakdown[dbStatus]) {
      statusBreakdown[dbStatus] = { count: 0, orders: [] }
    }
    statusBreakdown[dbStatus].count++
    statusBreakdown[dbStatus].orders.push(order)
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order Status Debug Information</CardTitle>
          <Button onClick={() => setShowDebug(false)} variant="outline" size="sm">
            Close
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Mapping Reference */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Status Mapping Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STATUS_MAPPINGS.map((mapping, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">"{mapping.dbStatus}"</code>
                  </div>
                  <div className="text-center">→</div>
                  <div>
                    <Badge className={mapping.color}>{mapping.displayLabel}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Orders Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Current Orders ({orders.length} total)</h3>
            <div className="space-y-3">
              {Object.entries(statusBreakdown).map(([dbStatus, data]) => {
                const statusInfo = getStatusDisplay(dbStatus)
                return (
                  <div key={dbStatus} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">"{dbStatus}"</code>
                      <span className="text-gray-500">({data.count} orders)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>→</span>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sample Orders */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Sample Orders</h3>
            <div className="space-y-2 max-h-60 overflow-auto">
              {orders.slice(0, 10).map((order) => {
                const statusInfo = getStatusDisplay(order.status)
                return (
                  <div key={order.id} className="flex items-center justify-between p-2 text-sm border rounded">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs">{order.order_number}</span>
                      <span className="text-gray-500">{order.customer_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{order.status}</code>
                      <span>→</span>
                      <Badge className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Debug Actions */}
          <div className="flex space-x-2">
            <Button onClick={() => debugStatusMapping(orders)} variant="outline" size="sm">
              Log to Console
            </Button>
            <Button
              onClick={() => {
                const data = {
                  totalOrders: orders.length,
                  statusBreakdown,
                  mappings: STATUS_MAPPINGS,
                }
                navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                alert("Debug data copied to clipboard!")
              }}
              variant="outline"
              size="sm"
            >
              Copy Debug Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
