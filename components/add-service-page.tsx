"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { ServiceFormShared } from "./service-form-shared"
import { createService } from "@/lib/service-service"
import type { ServiceFormData } from "@/types/service"

const initialFormData: ServiceFormData = {
  name: "",
  description: "",
  categories: [],
  unit: "per_hour",
  service_images: [],
  service_video: null,
  media: [],
  availability: {
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
  },
  is_pre_order: false,
  pre_order_days: "",
  payment_methods: {
    ewallet: false,
    bank_transfer: false,
    gcash: false,
    maya: false,
    manual: false,
  },
  variations: [],
}

export default function AddServicePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a service.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("Service name is required")
      }
      if (!formData.description.trim()) {
        throw new Error("Service description is required")
      }
      if (formData.categories.length === 0) {
        throw new Error("At least one category is required")
      }
      if (formData.variations.length === 0) {
        throw new Error("At least one service variation is required")
      }

      // Convert form data to service data
      const serviceData = {
        name: formData.name,
        description: formData.description,
        categories: formData.categories,
        unit: formData.unit,
        media: formData.media,
        availability: formData.availability,
        is_pre_order: formData.is_pre_order,
        pre_order_days: formData.is_pre_order ? Number.parseInt(formData.pre_order_days) || 0 : 0,
        payment_methods: formData.payment_methods,
        variations: formData.variations.map((variation) => ({
          id: variation.id,
          name: variation.name,
          duration: variation.duration,
          price: Number.parseFloat(variation.price) || 0,
          slots: Number.parseInt(variation.slots) || 0,
          media: variation.media,
        })),
        user_id: user.uid,
        status: "active" as const,
      }

      const serviceId = await createService(serviceData)

      toast({
        title: "Success",
        description: "Service created successfully!",
        variant: "default",
      })

      router.push("/dashboard/products")
    } catch (error: any) {
      console.error("Error creating service:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ServiceFormShared
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Create Service"
      title="Add New Service"
      description="Create a new service for your business"
    />
  )
}
