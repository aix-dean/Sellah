"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Calendar,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  TrendingUp,
  BarChart3,
} from "lucide-react"
import {
  orderActivityService,
  type OrderActivity,
  getActivityIcon,
  getActivityColor,
  getActivityPriority,
} from "@/lib/order-activity-service"
import { toast } from "@/hooks/use-toast"

interface OrderActivityHistoryModalProps {
  orderId: string
  orderNumber: string
}

export default function OrderActivityHistoryModal({ orderId, orderNumber }: OrderActivityHistoryModalProps) {
  const [activities, setActivities] = useState<OrderActivity[]>([])
  const [filteredActivities, setFilteredActivities] = useState<OrderActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showMetadata, setShowMetadata] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [lifecycleSummary, setLifecycleSummary] = useState<any>(null)

  const activityTypes = [
    { value: "all", label: "All Activities" },
    { value: "order_created", label: "Order Created" },
    { value: "status_change", label: "Status Changes" },
    { value: "payment_update", label: "Payment Updates" },
    { value: "shipping_update", label: "Shipping Updates" },
    { value: "note_added", label: "Notes Added" },
    { value: "order_updated", label: "Order Updates" },
  ]

  useEffect(() => {
    fetchActivities()
    fetchLifecycleSummary()
  }, [orderId])

  useEffect(() => {
    applyFilters()
  }, [activities, searchTerm, filterType, sortOrder])

  const fetchActivities = async () => {
    if (!orderId) return

    setLoading(true)
    setError(null)

    try {
      const activitiesData = await orderActivityService.getOrderActivities(orderId)
      setActivities(activitiesData)
    } catch (error) {
      console.error("Error fetching order activities:", error)
      setError("Failed to load order activity history.")
    } finally {
      setLoading(false)
    }
  }

  const fetchLifecycleSummary = async () => {
    try {
      const summary = await orderActivityService.getOrderLifecycleSummary(orderId)
      setLifecycleSummary(summary)
    } catch (error) {
      console.error("Error fetching lifecycle summary:", error)
    }
  }

  const applyFilters = () => {
    let filtered = [...activities]

    if (searchTerm) {
      filtered = filtered.filter(
        (activity) =>
          activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.new_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (activity.old_value && activity.old_value.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (activity.metadata?.user_name &&
            activity.metadata.user_name.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (filterType !== "all") {
      filtered = filtered.filter((activity) => activity.activity_type === filterType)
    }

    filtered.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0)
      const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0)

      if (sortOrder === "desc") {
        return bTime.getTime() - aTime.getTime()
      } else {
        return aTime.getTime() - bTime.getTime()
      }
    })

    setFilteredActivities(filtered)
  }

  const toggleExpanded = (activityId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId)
    } else {
      newExpanded.add(activityId)
    }
    setExpandedItems(newExpanded)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  const formatRelativeTime = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return formatDate(timestamp)
    } catch (error) {
      return "Invalid Date"
    }
  }

  const exportActivities = () => {
    const csvContent = [
      ["Timestamp", "Type", "Description", "Old Value", "New Value", "User", "Details"].join(","),
      ...filteredActivities.map((activity) =>
        [
          formatDate(activity.timestamp),
          activity.activity_type,
          `"${activity.description}"`,
          activity.old_value || "",
          activity.new_value,
          activity.metadata?.user_name || "",
          activity.metadata ? `"${JSON.stringify(activity.metadata)}"` : "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `order-${orderNumber}-activity-history.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Activity history has been exported to CSV.",
    })
  }

  // Group activities by date
  const groupedActivities = filteredActivities.reduce<Record<string, OrderActivity[]>>((groups, activity) => {
    const date = activity.timestamp?.toDate?.() || new Date(activity.timestamp || 0)
    const dateKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

    if (!groups[dateKey]) {
      groups[dateKey] = []
    }

    groups[dateKey].push(activity)
    return groups
  }, {})

  const sortedDates = Object.keys(groupedActivities).sort((a, b) => {
    const dateA = new Date(a).getTime()
    const dateB = new Date(b).getTime()
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading activity history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-sm text-gray-700 mb-4">{error}</p>
        <Button onClick={fetchActivities} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {lifecycleSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-gray-600 mb-1">Created</p>
            <p className="text-sm font-semibold text-gray-900">
              {lifecycleSummary.created_at ? formatRelativeTime({ toDate: () => lifecycleSummary.created_at }) : "N/A"}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs text-gray-600 mb-1">Current Status</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {lifecycleSummary.current_status || "Unknown"}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xs text-gray-600 mb-1">Status Changes</p>
            <p className="text-sm font-semibold text-gray-900">{lifecycleSummary.status_changes}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-xs text-gray-600 mb-1">Total Activities</p>
            <p className="text-sm font-semibold text-gray-900">{lifecycleSummary.total_activities}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {filteredActivities.length} {filteredActivities.length === 1 ? "activity" : "activities"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setShowMetadata(!showMetadata)} className="text-gray-500">
            {showMetadata ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="ml-1 hidden sm:inline">{showMetadata ? "Hide" : "Show"} Details</span>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={exportActivities}>
            <Download className="w-4 h-4" />
            <span className="ml-1 hidden sm:inline">Export</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchActivities}>
            <RefreshCw className="w-4 h-4" />
            <span className="ml-1 hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {activityTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Activity Timeline */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {searchTerm || filterType !== "all"
              ? "No activities match your filters."
              : "No activity recorded for this order yet."}
          </p>
          {(searchTerm || filterType !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("")
                setFilterType("all")
              }}
              className="mt-2"
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{dateKey}</span>
                </div>
                <div className="flex-1 h-px bg-gray-200"></div>
                <Badge variant="outline" className="text-xs">
                  {groupedActivities[dateKey].length}{" "}
                  {groupedActivities[dateKey].length === 1 ? "activity" : "activities"}
                </Badge>
              </div>

              <div className="space-y-4">
                {groupedActivities[dateKey]
                  .sort((a, b) => {
                    const priorityDiff = getActivityPriority(a.activity_type) - getActivityPriority(b.activity_type)
                    if (priorityDiff !== 0) return priorityDiff

                    const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp || 0)
                    const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp || 0)
                    return sortOrder === "desc" ? bTime.getTime() - aTime.getTime() : aTime.getTime() - bTime.getTime()
                  })
                  .map((activity, index) => (
                    <div key={activity.id || index} className="relative pl-10 pb-6">
                      {/* Timeline connector */}
                      {index < groupedActivities[dateKey].length - 1 && (
                        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                      )}

                      {/* Activity dot */}
                      <div
                        className={`absolute left-0 top-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getActivityColor(activity.activity_type)} shadow-sm border-2 border-white`}
                      >
                        {getActivityIcon(activity.activity_type)}
                      </div>

                      {/* Activity content */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Badge
                                variant="outline"
                                className={`${getActivityColor(activity.activity_type)} text-xs font-medium`}
                              >
                                {activity.activity_type.replace("_", " ").toUpperCase()}
                              </Badge>
                              <span className="text-xs text-gray-500 font-medium">
                                {formatRelativeTime(activity.timestamp)}
                              </span>
                            </div>

                            <p className="text-sm font-medium text-gray-900 mb-2">{activity.description}</p>

                            {/* Status change visualization */}
                            {activity.activity_type === "status_change" && (
                              <div className="flex items-center space-x-3 mb-3">
                                {activity.old_value && (
                                  <>
                                    <Badge variant="outline" className="bg-gray-100 text-gray-600 text-xs">
                                      {activity.old_value.charAt(0).toUpperCase() + activity.old_value.slice(1)}
                                    </Badge>
                                    <span className="text-gray-400 text-sm">→</span>
                                  </>
                                )}
                                <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                                  {activity.new_value.charAt(0).toUpperCase() + activity.new_value.slice(1)}
                                </Badge>
                              </div>
                            )}

                            {/* User and timestamp */}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {activity.metadata?.user_name && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-3 h-3" />
                                  <span>{activity.metadata.user_name}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(activity.timestamp)}</span>
                              </div>
                            </div>

                            {/* Metadata toggle */}
                            {activity.metadata && Object.keys(activity.metadata).length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(activity.id || `${index}`)}
                                className="mt-3 h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                              >
                                {expandedItems.has(activity.id || `${index}`) ? (
                                  <>
                                    <ChevronUp className="w-3 h-3 mr-1" />
                                    Hide Details
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3 mr-1" />
                                    Show Details
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Expanded metadata */}
                            {(showMetadata || expandedItems.has(activity.id || `${index}`)) && activity.metadata && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                                <h5 className="text-xs font-semibold text-gray-700 mb-3">Additional Details</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {Object.entries(activity.metadata)
                                    .filter(([key]) => !["user_name", "created_at", "source"].includes(key))
                                    .map(([key, value]) => (
                                      <div key={key} className="flex flex-col space-y-1">
                                        <span className="text-xs text-gray-500 capitalize font-medium">
                                          {key.replace(/_/g, " ")}:
                                        </span>
                                        <span className="text-xs text-gray-700 font-mono bg-white px-2 py-1 rounded border">
                                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
