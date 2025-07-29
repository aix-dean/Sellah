import { Skeleton } from "@/components/ui/skeleton"

export default function ChatLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Left sidebar skeleton */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b flex-shrink-0">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-10 w-full rounded-full" />
        </div>
        <div className="flex-1 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border-b">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex-shrink-0">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* Chat window skeleton */}
      <div className="w-2/3 flex flex-col">
        {/* Header skeleton */}
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <div className="flex items-center">
            <Skeleton className="h-12 w-12 rounded-full mr-3" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        {/* Messages area skeleton */}
        <div className="flex-grow p-4 space-y-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <Skeleton className="h-16 w-64 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Input area skeleton */}
        <div className="border-t p-3 flex-shrink-0">
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 rounded-full mr-2" />
            <Skeleton className="flex-1 h-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full ml-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
