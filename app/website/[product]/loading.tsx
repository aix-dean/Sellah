import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="h-10 w-20 bg-muted animate-pulse rounded"></div>
              <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="h-10 w-28 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </header>

      {/* Navigation Skeleton */}
      <nav className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <div className="flex space-x-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 w-24 bg-muted animate-pulse rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section Skeleton */}
      <section className="py-12 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 bg-muted animate-pulse rounded-lg"></div>
            <div>
              <div className="h-10 w-64 bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-6 w-96 bg-muted animate-pulse rounded"></div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded-full"></div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-muted animate-pulse rounded-lg aspect-video"></div>
            <Card>
              <CardHeader>
                <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                    </div>
                  ))}
                </div>
                <div className="h-10 w-full bg-muted animate-pulse rounded mt-4"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Content Skeleton - Enhanced for better loading experience */}
      <div className="py-16">
        <div className="container mx-auto px-4 space-y-16">
          {/* Product Types Section Skeleton */}
          <div className="space-y-8">
            <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-80 bg-muted animate-pulse rounded"></div>
            {[1, 2, 3].map((item) => (
              <div key={item} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-muted animate-pulse rounded-lg aspect-video"></div>
                <div className="space-y-4">
                  <div className="h-8 w-56 bg-muted animate-pulse rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
                  </div>
                  <div className="h-10 w-40 bg-muted animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Applications Carousel Skeleton */}
          <div className="space-y-6">
            <div className="h-8 w-56 bg-muted animate-pulse rounded"></div>
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex-shrink-0 w-80">
                  <div className="bg-muted animate-pulse rounded-lg aspect-video mb-4"></div>
                  <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Section Skeleton */}
          <div className="space-y-6">
            <div className="h-8 w-40 bg-muted animate-pulse rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <Card key={item}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-muted animate-pulse rounded-lg"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                        <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button Skeleton */}
      <div className="fixed bottom-8 right-8">
        <div className="h-12 w-12 bg-muted animate-pulse rounded-full"></div>
      </div>
    </div>
  )
}
