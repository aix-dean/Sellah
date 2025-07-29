import { Suspense } from "react"
import AddServicePage from "@/components/add-service-page"
import { Loader2 } from "lucide-react"

// Loading component for Suspense
function AddServiceLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <p className="text-gray-600">Loading add service page...</p>
      </div>
    </div>
  )
}

// Main page component
export default function AddServicePageRoute() {
  return (
    <Suspense fallback={<AddServiceLoading />}>
      <AddServicePage />
    </Suspense>
  )
}

// Metadata for the page
export const metadata = {
  title: "Add Service - Sellah Dashboard",
  description: "Add a new service offering to your business",
}
