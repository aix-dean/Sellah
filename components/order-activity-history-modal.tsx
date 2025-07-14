"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Calendar, TrendingUp, BarChart3, Activity } from "lucide-react"
import { format } from "date-fns"

interface ActivityItem {
  id: string
  timestamp: string
  type: string
  description: string
  details: any
}

interface LifecycleSummary {
  created: string
  currentStatus: string
  statusChanges: number
  totalActivities: number
}

interface OrderActivityHistoryModalProps {
  orderId: string
  onClose: () => void
}

const OrderActivityHistoryModal: React.FC<OrderActivityHistoryModalProps> = ({ orderId, onClose }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [lifecycleSummary, setLifecycleSummary] = useState<LifecycleSummary>({
    created: "N/A",
    currentStatus: "Unknown",
    statusChanges: 0,
    totalActivities: 0,
  })

  useEffect(() => {
    fetchActivities()
    fetchLifecycleSummary()
  }, [orderId])

  const fetchActivities = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    const mockActivities: ActivityItem[] = [
      {
        id: "1",
        timestamp: "2023-01-01T12:00:00Z",
        type: "status_change",
        description: "Order placed",
        details: { oldStatus: null, newStatus: "placed" },
      },
      {
        id: "2",
        timestamp: "2023-01-02T14:30:00Z",
        type: "payment",
        description: "Payment received",
        details: { amount: 100, currency: "USD" },
      },
      {
        id: "3",
        timestamp: "2023-01-03T09:15:00Z",
        type: "shipping",
        description: "Order shipped",
        details: { trackingNumber: "1Z12345E1234567890" },
      },
      {
        id: "4",
        timestamp: "2023-01-04T18:45:00Z",
        type: "note",
        description: "Customer added a note",
        details: { note: "Please deliver after 3 PM" },
      },
      {
        id: "5",
        timestamp: "2023-01-05T10:00:00Z",
        type: "system",
        description: "System automatically updated status",
        details: { status: "in transit" },
      },
      {
        id: "6",
        timestamp: "2023-01-06T16:20:00Z",
        type: "status_change",
        description: "Order delivered",
        details: { oldStatus: "in transit", newStatus: "delivered" },
      },
    ]

    setActivities(mockActivities)
    setLoading(false)
  }

  const fetchLifecycleSummary = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300))

    const mockSummary: LifecycleSummary = {
      created: format(new Date(), "MMM dd, yyyy"),
      currentStatus: "Delivered",
      statusChanges: 2,
      totalActivities: 6,
    }

    setLifecycleSummary(mockSummary)
  }

  const exportActivities = () => {
    // Implement export functionality here
    alert("Exporting activities...")
  }

  const filteredActivities = activities.filter((activity) => {
    const searchTermLower = searchTerm.toLowerCase()
    const descriptionLower = activity.description.toLowerCase()

    const matchesSearchTerm = searchTerm === "" || descriptionLower.includes(searchTermLower)
    const matchesFilterType = filterType === "" || activity.type === filterType

    return matchesSearchTerm && matchesFilterType
  })

  const sortedActivities = [...filteredActivities].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime()
    const dateB = new Date(b.timestamp).getTime()

    return sortOrder === "asc" ? dateA - dateB : dateB - dateA
  })

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl mx-auto mt-20 p-8 bg-white rounded-lg">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
          X
        </button>
        <h2 className="text-2xl font-bold mb-4">Order Activity History</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Created</span>
            </div>
            <p className="text-lg font-bold text-blue-900">{lifecycleSummary.created || "N/A"}</p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Current Status</span>
            </div>
            <p className="text-lg font-bold text-green-900">{lifecycleSummary.currentStatus || "Unknown"}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Status Changes</span>
            </div>
            <p className="text-lg font-bold text-purple-900">{lifecycleSummary.statusChanges}</p>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Total Activities</span>
            </div>
            <p className="text-lg font-bold text-orange-900">{lifecycleSummary.totalActivities}</p>
          </div>
        </div>

        {/* Activities Timeline */}
        <div className="mt-6">
          {sortedActivities.map((activity) => (
            <div key={activity.id} className="mb-4 p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{activity.description}</span>
                <span className="text-gray-500">{format(new Date(activity.timestamp), "MMM dd, yyyy hh:mm a")}</span>
              </div>
              {showDetails && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">Type: {activity.type}</p>
                  <pre className="text-xs bg-gray-100 p-2 rounded-md overflow-x-auto">
                    {JSON.stringify(activity.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OrderActivityHistoryModal
