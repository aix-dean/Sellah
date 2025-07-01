import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {/* Image placeholder */}
      <div className="w-full h-48 bg-gray-200 rounded-t-lg animate-pulse" />

      <div className="p-4">
        {/* Title placeholder */}
        <Skeleton className="h-5 w-3/4 mb-2" />

        {/* SKU placeholder */}
        <Skeleton className="h-4 w-1/2 mb-3" />

        {/* Price and rating row */}
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/6" />
        </div>

        {/* Stock and sales row */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>

        {/* Views and menu row */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function ProductListItemSkeleton() {
  return (
    <div className="p-6 hover:bg-gray-50 border-b border-gray-200">
      <div className="flex items-center space-x-6">
        {/* Image placeholder */}
        <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Skeleton className="h-5 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-8 text-sm">
          <div className="text-center">
            <Skeleton className="h-5 w-16 mb-1 mx-auto" />
            <Skeleton className="h-3 w-10 mx-auto" />
          </div>

          <div className="text-center">
            <Skeleton className="h-5 w-12 mb-1 mx-auto" />
            <Skeleton className="h-3 w-10 mx-auto" />
          </div>

          <div className="text-center">
            <Skeleton className="h-5 w-12 mb-1 mx-auto" />
            <Skeleton className="h-3 w-10 mx-auto" />
          </div>

          <div className="text-center">
            <Skeleton className="h-5 w-12 mb-1 mx-auto" />
            <Skeleton className="h-3 w-10 mx-auto" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </div>
  )
}
