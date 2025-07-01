import { OrderStatusDebugger } from "@/components/order-status-debugger"

export default function DebugOrdersPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Order Status Debug Page</h1>
      <p className="text-gray-600 mb-8">
        This page helps debug order status display issues. Use the debug panel to inspect how database statuses are
        mapped to display statuses.
      </p>
      <OrderStatusDebugger />
    </div>
  )
}
