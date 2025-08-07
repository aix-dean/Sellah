import { useState } from "react"
import { useRouter } from "next/navigation"
import ServiceFormShared from "@/components/service-form-shared"
import { ServiceService } from "@/lib/service-service"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import type { CreateServiceData } from "@/types/service"

export function AddServicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (
    serviceData: CreateServiceData,
    existingImageUrls: string[], // Not used for creation, but kept for consistent signature
    newImageFiles: File[],
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create a service.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // For creation, pass the service data with seller_id and the image files
      await ServiceService.createService(
        { ...serviceData, seller_id: user.uid },
        newImageFiles,
      )
      toast({
        title: "Service Created",
        description: "Your new service has been successfully added.",
      })
      router.push("/dashboard/services") // Redirect to services list
    } catch (error) {
      console.error("Failed to create service:", error)
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Service</h1>
      <ServiceFormShared
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitButtonText="Create Service"
      />
    </div>
  )
}
