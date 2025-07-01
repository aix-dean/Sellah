import { Skeleton } from "@/components/ui/skeleton"

export function OrderCardSkeleton() {
  return (
    <div className="relative bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4">
        {/* Order Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-5 w-5" />
        </div>

        {/* Customer Info */}
        <div className="flex items-center space-x-3 mb-3">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-5 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-3">
          <div className="flex items-center space-x-3 mb-2">
            <Skeleton className="w-10 h-10 rounded flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <Skeleton className="w-10 h-10 rounded flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>

        {/* Order Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="text-right">
            <Skeleton className="h-5 w-20 mb-1" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function OrderTableRowSkeleton() {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-4 rounded" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-5 w-24 mb-1" />
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="px-6 py-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-8 mx-auto" />
          <Skeleton className="h-4 w-8 mx-auto" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-6 w-24 rounded-full mb-1" />
        <Skeleton className="h-4 w-16" />
      </td>
      <td className="px-6 py-4">
        <div className="text-right space-y-2">
          <Skeleton className="h-6 w-20 ml-auto" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-24 ml-auto" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-3 w-16" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-8 w-16 rounded-md mb-1 mx-auto" />
        <Skeleton className="h-4 w-12 mx-auto" />
      </td>
    </tr>
  )
}

export function OrderDetailsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div>
                <Skeleton className="h-5 w-5 mb-1" />
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="w-15 h-15 rounded" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-5 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2 mb-1" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg border p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>

          {/* Order Activity Timeline */}
          <div className="bg-white rounded-lg border p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex">
                  <div className="mr-3 relative">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    {i !== 3 && <div className="absolute top-8 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-gray-200" />}
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2 mb-1" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
