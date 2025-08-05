"use client"

import { useRouter } from "next/navigation"
import { ServiceFormShared } from "@/components/service-form-shared"
import { ServiceService } from "@/lib/service-service"
import { useAuth } from "@/hooks/use-auth"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CreateServiceData } from "@/types/service"

export function AddServicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: CreateServiceData, existingImageUrls: string[], newImageFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add a service.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // ServiceService.createService now handles image uploads internally
      // It expects the full service data and the new image files
      const newService = await ServiceService.createService(
        {
          ...data,
          seller_id: user.uid,
          type: "SERVICES", // Ensure type is explicitly SERVICES
          imageUrls: existingImageUrls, // Pass existing URLs if any (for edit scenarios, though this is add page)
        },
        newImageFiles, // Pass new image files for upload
      )

      if (newService) {
        router.push("/dashboard/products") // Redirect to products page after creation
      }
    } catch (error) {
      console.error("Failed to add service:", error)
      toast({
        title: "Error adding service",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Service</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceFormShared onSubmit={handleSubmit} isLoading={isLoading} userId={user?.uid || ""} />
        </CardContent>
      </Card>
    </div>
  )
}
