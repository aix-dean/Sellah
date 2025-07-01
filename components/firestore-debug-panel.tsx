"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Database, RotateCcw, TrendingUp, AlertTriangle, Download, BarChart3 } from "lucide-react"
import {
  getFirestoreReadCount,
  resetFirestoreReadCount,
  getTotalSessionCost,
  getCollectionStats,
  getPageStats,
  getExpensiveOperations,
  printBillingAnalysis,
  exportReadLogs,
} from "@/lib/firestore-logger"

export default function FirestoreDebugPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "collections" | "pages" | "expensive">("overview")
  const [readCount, setReadCount] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [collectionStats, setCollectionStats] = useState<any>({})
  const [pageStats, setPageStats] = useState<any>({})
  const [expensiveOps, setExpensiveOps] = useState<any>([])

  // Update stats every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setReadCount(getFirestoreReadCount())
      setTotalCost(getTotalSessionCost())
      setCollectionStats(getCollectionStats())
      setPageStats(getPageStats())
      setExpensiveOps(getExpensiveOperations(5))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  const formatCost = (cost: number) => {
    if (cost < 0.000001) return "<$0.000001"
    return `$${cost.toFixed(6)}`
  }

  const downloadLogs = () => {
    const logs = exportReadLogs()
    const blob = new Blob([logs], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `firestore-logs-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className={`shadow-lg text-white ${
            totalCost > 0.0001
              ? "bg-red-600 hover:bg-red-700"
              : totalCost > 0.00001
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-blue-600 hover:bg-blue-700"
          }`}
          size="sm"
        >
          <Database className="w-4 h-4 mr-2" />
          {readCount} reads ({formatCost(totalCost)}){totalCost > 0.0001 && <AlertTriangle className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-96 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center">
          <Database className="w-4 h-4 mr-2 text-blue-600" />
          Firestore Billing Monitor
        </h3>
        <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm" className="p-1 h-6 w-6">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "collections", label: "Collections", icon: Database },
          { id: "pages", label: "Pages", icon: TrendingUp },
          { id: "expensive", label: "Expensive", icon: AlertTriangle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-2 py-2 text-xs font-medium flex items-center justify-center space-x-1 ${
              activeTab === tab.id
                ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <tab.icon className="w-3 h-3" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-64 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded p-2">
                <div className="text-xs text-blue-600 font-medium">Total Reads</div>
                <div className="text-lg font-bold text-blue-800">{readCount}</div>
              </div>
              <div
                className={`rounded p-2 ${
                  totalCost > 0.0001 ? "bg-red-50" : totalCost > 0.00001 ? "bg-yellow-50" : "bg-green-50"
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    totalCost > 0.0001 ? "text-red-600" : totalCost > 0.00001 ? "text-yellow-600" : "text-green-600"
                  }`}
                >
                  Session Cost
                </div>
                <div
                  className={`text-lg font-bold ${
                    totalCost > 0.0001 ? "text-red-800" : totalCost > 0.00001 ? "text-yellow-800" : "text-green-800"
                  }`}
                >
                  {formatCost(totalCost)}
                </div>
              </div>
            </div>

            {totalCost > 0.00001 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <div className="flex items-center text-yellow-800 text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  High cost detected! Check expensive operations.
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "collections" && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600 mb-2">Collections by Cost</div>
            {Object.entries(collectionStats)
              .sort(([, a]: any, [, b]: any) => b.totalCost - a.totalCost)
              .slice(0, 8)
              .map(([collection, stats]: any) => (
                <div key={collection} className="flex justify-between items-center text-xs">
                  <span className="font-medium text-gray-700">{collection}</span>
                  <div className="text-right">
                    <div className="text-gray-600">{stats.totalDocuments} docs</div>
                    <div className="font-mono text-blue-600">{formatCost(stats.totalCost)}</div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeTab === "pages" && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600 mb-2">Pages by Cost</div>
            {Object.entries(pageStats)
              .sort(([, a]: any, [, b]: any) => b.cost - a.cost)
              .slice(0, 8)
              .map(([page, stats]: any) => (
                <div key={page} className="text-xs">
                  <div className="font-medium text-gray-700 truncate">{page}</div>
                  <div className="flex justify-between text-gray-600">
                    <span>{stats.documents} docs</span>
                    <span className="font-mono text-blue-600">{formatCost(stats.cost)}</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {activeTab === "expensive" && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600 mb-2">Most Expensive Operations</div>
            {expensiveOps.map((op: any, index: number) => (
              <div key={index} className="text-xs border-l-2 border-red-300 pl-2">
                <div className="font-medium text-red-700">{op.collection}</div>
                <div className="text-gray-600">{op.page}</div>
                <div className="flex justify-between">
                  <span>{op.documentCount} docs</span>
                  <span className="font-mono text-red-600">{formatCost(op.cost)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t p-3 bg-gray-50 flex space-x-2">
        <Button
          onClick={() => {
            resetFirestoreReadCount()
            setReadCount(0)
            setTotalCost(0)
          }}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
        <Button onClick={printBillingAnalysis} variant="outline" size="sm" className="flex-1">
          <BarChart3 className="w-3 h-3 mr-1" />
          Analyze
        </Button>
        <Button onClick={downloadLogs} variant="outline" size="sm" className="flex-1">
          <Download className="w-3 h-3 mr-1" />
          Export
        </Button>
      </div>
    </div>
  )
}
