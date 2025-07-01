"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, AlertCircle, Clock, User, ChevronDown, ChevronUp } from "lucide-react"
import {
  orderActivityService,
  type OrderActivity,
  getActivityIcon,
  getActivityColor,
  getStatusBadgeColor,
  formatTimestamp,
  formatRelativeTime,
} from "@/lib/order-activity-service"

interface OrderActivityTimelineProps {
  orderId: string
}

export default function OrderActivityTimeline({ orderId }: OrderActivityTimelineProps) {
  const [activities, setActivities] = useState<OrderActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchActivities()
  }, [orderId])

  const fetchActivities = async () => {
    if (!orderId) return

    setLoading(true)
    setError(null)

    try {
      const result = await orderActivityService.getOrderActivities(orderId)
      setActivities(Array.isArray(result) ? result : [])
    } catch (error) {
      console.error("Error fetching order activities:", error)
      setError("Failed to load order activity history.")
    } finally {
      setLoading(false)
    }
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

  // Group activities by date using Firestore Timestamps
  const groupedActivities = Array.isArray(activities)
    ? activities.reduce<Record<string, OrderActivity[]>>((groups, activity) => {
        const date = activity.timestamp.toDate()
        const dateKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

        if (!groups[dateKey]) {
          groups[dateKey] = []
        }

        groups[dateKey].push(activity)
        return groups
      }, {})
    : {}

  const sortedDates = Object.keys(groupedActivities).sort((a, b) => {
    const dateA = new Date(a).getTime()
    const dateB = new Date(b).getTime()
    return dateB - dateA // Newest first
  })

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-3">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-sm text-gray-700 mb-4">{error}</p>
        <Button onClick={fetchActivities} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  if (!Array.isArray(activities) || activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-sm text-gray-500">No activity recorded for this order yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sortedDates.map((dateKey) => (
        <div key={dateKey}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0 bg-gray-100 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-gray-700">{dateKey}</span>
            </div>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <div className="space-y-4">
            {groupedActivities[dateKey].map((activity, index) => {
              // Get the appropriate icon for this activity type
              const activityIcon = getActivityIcon(activity.activity_type)

              return (
                <div key={activity.id || index} className="relative pl-10 pb-6">
                  {/* Timeline connector */}
                  {index < groupedActivities[dateKey].length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                  )}

                  {/* Activity dot with icon */}
                  <div
                    className={`absolute left-0 top-2 w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(
                      activity.activity_type,
                    )} shadow-sm border-2 border-white`}
                  >
                    <span className="text-sm">{activityIcon}</span>
                  </div>

                  {/* Activity content */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
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

                        {/* Status change visualization with icons */}
                        {activity.activity_type === "status_change" && (
                          <div className="flex items-center space-x-3 mb-3">
                            {activity.old_value && (
                              <>
                                <Badge
                                  variant="outline"
                                  className={`${getStatusBadgeColor(activity.old_value)} text-xs flex items-center gap-1`}
                                >
                                  <span>
                                    {activity.old_value.toUpperCase()}
                                  </span>
                                </Badge>
                                <span className="text-gray-400 text-sm">→</span>
                              </>
                            )}
                            <Badge
                              variant="outline"
                              className={`${getStatusBadgeColor(activity.new_value)} text-xs flex items-center gap-1`}
                            >
                              <span>{activity.new_value.toUpperCase()}</span>
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
                            <span>{formatTimestamp(activity.timestamp)}</span>
                          </div>
                        </div>

                        {/* Metadata toggle */}
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
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
                        {expandedItems.has(activity.id || `${index}`) && activity.metadata && (
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
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
