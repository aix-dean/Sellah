"use client"

import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import ServiceFormShared from "./service-form-shared"

export default function AddServicePage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Service created successfully!",
    })
    router.push("/dashboard/products")
  }

  const handleCancel = () => {
    router.push("/dashboard/products")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ServiceFormShared
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}
