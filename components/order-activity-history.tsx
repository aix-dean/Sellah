"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { orderActivityService } from "@/lib/order-activity-service"

interface OrderActivity {
  id: string
  orderId: string
  activityType: string
  timestamp: Date
  details: string
}

interface OrderActivityHistoryProps {
  orderId: string
}

const OrderActivityHistory: React.FC<OrderActivityHistoryProps> = ({ orderId }) => {
  const [activityHistory, setActivityHistory] = useState<OrderActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivityHistory = async () => {
      setLoading(true)
      try {
        const activities = await orderActivityService.getActivityForOrder(orderId)
        setActivityHistory(activities)
        setLoading(false)
      } catch (err: any) {
        setError(err.message || "Failed to fetch order activity history.")
        setLoading(false)
      }
    }

    fetchActivityHistory()
  }, [orderId])

  if (loading) {
    return <div>Loading order activity history...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!activityHistory || activityHistory.length === 0) {
    return <div>No activity history found for this order.</div>
  }

  return (
    <div>
      <h3>Order Activity History</h3>
      <ul>
        {activityHistory.map((activity) => (
          <li key={activity.id}>
            <strong>{activity.activityType}:</strong> {activity.details} -{" "}
            {new Date(activity.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default OrderActivityHistory
