"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceFormShared } from "@/components/service-form-shared"
import { createService } from "@/lib/service-service"
import { Loader2 } from "lucide-react"
import type { Service } from "@/types/service"

export default function AddServicePage() {
  const { user, loading: userLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: Omit<Service, "id" | "createdAt" | "updatedAt" | "userId">) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to add a service.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const serviceId = await createService({ ...data, userId: user.uid })
      toast({
        title: "Service Added",
        description: `Service "${data.name}" has been successfully added.`,
        variant: "default",
      })
      router.push(`/dashboard/services/${serviceId}`)
    } catch (error: any) {
      console.error("Error adding service:", error)
      toast({
        title: "Error",
        description: `Failed to add service: ${error.message || "Please try again."}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen text-left">
      <div className="w-full max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Add New Service</CardTitle>
            <CardDescription>Fill out the form below to add a new service to your listings.</CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceFormShared onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
