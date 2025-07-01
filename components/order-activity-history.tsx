"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "lucide-react"
import {
  orderActivityService,
  type OrderActivity,
  getActivityIcon,
  getActivityColor,
  getActivityPriority,
  formatTimestamp,
  formatRelativeTime,
} from "@/lib/order-activity-service"
import { toast } from "@/hooks/use-toast"

interface OrderActivityHistoryProps {
  orderId: string
  className?: string
  showFilters?: boolean
  maxHeight?: string
  isModal?: boolean
}

export default function OrderActivityHistory({
  orderId,
  className = "",
  showFilters = true,
  maxHeight = "600px",
  isModal = false,
}: OrderActivityHistoryProps) {
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
    { value: "item_added", label: "Items Added" },
    { value: "item_removed", label: "Items Removed" },
    { value: "address_updated", label: "Address Updates" },
    { value: "refund_processed", label: "Refunds Processed" },
    { value: "cancellation_requested", label: "Cancellation Requests" },
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
      toast({
        title: "Error",
        description: "Failed to load order activity history.",
        variant: "destructive",
      })
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

    // Apply search filter
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

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter((activity) => activity.activity_type === filterType)
    }

    // Apply sorting using Firestore Timestamps
    filtered.sort((a, b) => {
      if (sortOrder === "desc") {
        return b.timestamp.toMillis() - a.timestamp.toMillis()
      } else {
        return a.timestamp.toMillis() - b.timestamp.toMillis()
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

  const exportActivities = () => {
    const csvContent = [
      ["Timestamp", "Type", "Description", "Old Value", "New Value", "User", "Details"].join(","),
      ...filteredActivities.map((activity) =>
        [
          formatTimestamp(activity.timestamp),
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
    a.download = `order-${orderId}-activity-history.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: "Activity history has been exported to CSV.",
    })
  }

  // Group activities by date for better organization
  const groupedActivities = filteredActivities.reduce<Record<string, OrderActivity[]>>((groups, activity) => {
    const date = activity.timestamp.toDate()
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

  const ContentWrapper = isModal ? "div" : Card
  const HeaderWrapper = isModal ? "div" : CardHeader
  const BodyWrapper = isModal ? "div" : CardContent

  if (loading) {
    return (
      <ContentWrapper className={isModal ? className : `${className}`}>
        <HeaderWrapper>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-500" />
            <span>Order Activity History</span>
          </CardTitle>
        </HeaderWrapper>
        <BodyWrapper className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading activity history...</p>
          </div>
        </BodyWrapper>
      </ContentWrapper>
    )
  }

  if (error) {
    return (
      <ContentWrapper className={isModal ? className : `${className}`}>
        <HeaderWrapper>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-500" />
            <span>Order Activity History</span>
          </CardTitle>
        </HeaderWrapper>
        <BodyWrapper>
          <div className="text-center py-6">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-700 mb-4">{error}</p>
            <Button onClick={fetchActivities} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </BodyWrapper>
      </ContentWrapper>
    )
  }

  return (
    <ContentWrapper className={isModal ? className : `${className}`}>
      <HeaderWrapper className={isModal ? "mb-6" : ""}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-500" />
            <span>Order Activity History</span>
            <Badge variant="outline" className="ml-2">
              {filteredActivities.length} {filteredActivities.length === 1 ? "activity" : "activities"}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setShowMetadata(!showMetadata)} className="text-gray-500">
              {showMetadata ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={exportActivities}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchActivities}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Lifecycle Summary */}
        {lifecycleSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm font-medium">
                {lifecycleSummary.created_at
                  ? formatRelativeTime({ toDate: () => lifecycleSummary.created_at })
                  : "N/A"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Current Status</p>
              <p className="text-sm font-medium capitalize">{lifecycleSummary.current_status || "Unknown"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Status Changes</p>
              <p className="text-sm font-medium">{lifecycleSummary.status_changes}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Total Activities</p>
              <p className="text-sm font-medium">{lifecycleSummary.total_activities}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
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
        )}
      </HeaderWrapper>

      <BodyWrapper>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
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
          <div className="space-y-6" style={{ maxHeight, overflowY: "auto" }}>
            {sortedDates.map((dateKey) => (
              <div key={dateKey}>
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-600">{dateKey}</h4>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <div className="space-y-4">
                  {groupedActivities[dateKey]
                    .sort((a, b) => {
                      // Sort by priority first, then by time
                      const priorityDiff = getActivityPriority(a.activity_type) - getActivityPriority(b.activity_type)
                      if (priorityDiff !== 0) return priorityDiff

                      return sortOrder === "desc"
                        ? b.timestamp.toMillis() - a.timestamp.toMillis()
                        : a.timestamp.toMillis() - b.timestamp.toMillis()
                    })
                    .map((activity, index) => (
                      <div key={activity.id || index} className="relative pl-8 pb-4">
                        {/* Timeline connector */}
                        {index < groupedActivities[dateKey].length - 1 && (
                          <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200"></div>
                        )}

                        {/* Activity dot */}
                        <div
                          className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs ${getActivityColor(activity.activity_type)}`}
                        >
                          {getActivityIcon(activity.activity_type)}
                        </div>

                        {/* Activity content */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline" className={getActivityColor(activity.activity_type)}>
                                  {activity.activity_type.replace("_", " ").toUpperCase()}
                                </Badge>
                                <span className="text-xs text-gray-500">{formatRelativeTime(activity.timestamp)}</span>
                              </div>

                              <p className="text-sm font-medium text-gray-900 mb-1">{activity.description}</p>

                              {/* Status change visualization */}
                              {activity.activity_type === "status_change" && (
                                <div className="flex items-center space-x-2 mt-2">
                                  {activity.old_value && (
                                    <>
                                      <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                        {activity.old_value.charAt(0).toUpperCase() + activity.old_value.slice(1)}
                                      </Badge>
                                      <span className="text-gray-400">→</span>
                                    </>
                                  )}
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                    {activity.new_value.charAt(0).toUpperCase() + activity.new_value.slice(1)}
                                  </Badge>
                                </div>
                              )}

                              {/* User and timestamp */}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                {activity.metadata?.user_name && (
                                  <div className="flex items-center space-x-1">
                                    <User className="w-3 h-3" />
                                    <span>{activity.metadata.user_name}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTimestamp(activity.timestamp)}</span>
                                </div>
                              </div>

                              {/* Metadata toggle */}
                              {activity.metadata && Object.keys(activity.metadata).length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpanded(activity.id || `${index}`)}
                                  className="mt-2 h-6 px-2 text-xs"
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
                                <div className="mt-3 p-3 bg-gray-50 rounded border">
                                  <h5 className="text-xs font-medium text-gray-700 mb-2">Additional Details</h5>
                                  <div className="space-y-1">
                                    {Object.entries(activity.metadata)
                                      .filter(([key]) => !["user_name", "created_at", "source"].includes(key))
                                      .map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-xs">
                                          <span className="text-gray-500 capitalize">{key.replace(/_/g, " ")}:</span>
                                          <span className="text-gray-700 font-mono">
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
      </BodyWrapper>
    </ContentWrapper>
  )
}
