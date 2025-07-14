import { Suspense } from "react"
import AddProductPage from "@/components/add-product-page"
import { Loader2 } from "lucide-react"

// Loading component for Suspense
function AddProductLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <p className="text-gray-600">Loading add product page...</p>
      </div>
    </div>
  )
}

// Main page component
export default function AddProductPageRoute() {
  return  <AddProductPage />
}

// Metadata for the page
export const metadata = {
  title: "Add Product - Sellah Dashboard",
  description: "Add a new product to your inventory",
}
