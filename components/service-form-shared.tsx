"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { Service } from "@/types/service"

const serviceFormSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  service_type: z.enum(["Online", "In-person", "Hybrid"]),
  duration_minutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  schedule: z.record(
    z.string(),
    z.array(
      z.object({
        start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
        end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
      }),
    ),
  ),
})

type ServiceFormValues = z.infer<typeof serviceFormSchema>

interface ServiceFormSharedProps {
  initialData?: Service | null
  onSubmit: (data: ServiceFormValues, imageUrls: string[], newImageFiles: File[]) => Promise<void>
  isLoading: boolean
  userId: string
}

export function ServiceFormShared({ initialData, onSubmit, isLoading, userId }: ServiceFormSharedProps) {
  const router = useRouter()
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(initialData?.imageUrls || [])

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      category: initialData?.category || "",
      service_type: initialData?.service_type || "Online",
      duration_minutes: initialData?.duration_minutes || 60,
      schedule: initialData?.schedule || {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
      },
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        description: initialData.description,
        price: initialData.price,
        category: initialData.category,
        service_type: initialData.service_type,
        duration_minutes: initialData.duration_minutes,
        schedule: initialData.schedule,
      })
      setExistingImageUrls(initialData.imageUrls || [])
    }
  }, [initialData, form])

  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files)
      setImageFiles((prev) => [...prev, ...files])

      const newPreviews = files.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...newPreviews])
    }
  }, [])

  const removeImage = useCallback(
    (index: number, isExisting: boolean) => {
      if (isExisting) {
        const urlToRemove = existingImageUrls[index]
        setExistingImageUrls((prev) => prev.filter((_, i) => i !== index))
        // Optionally, call a service to delete from storage immediately
        // ServiceService.deleteServiceImage(urlToRemove);
      } else {
        const fileToRemove = imageFiles[index]
        const previewToRemove = imagePreviews[index]

        setImageFiles((prev) => prev.filter((_, i) => i !== index))
        setImagePreviews((prev) => prev.filter((_, i) => i !== index))
        URL.revokeObjectURL(previewToRemove)
      }
    },
    [imageFiles, imagePreviews, existingImageUrls],
  )

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  const handleScheduleChange = (day: string, index: number, field: "start" | "end", value: string) => {
    const currentSchedule = form.getValues("schedule")
    const updatedDaySchedule = [...(currentSchedule[day] || [])]
    if (updatedDaySchedule[index]) {
      updatedDaySchedule[index] = { ...updatedDaySchedule[index], [field]: value }
    }
    form.setValue("schedule", { ...currentSchedule, [day]: updatedDaySchedule })
  }

  const addTimeSlot = (day: string) => {
    const currentSchedule = form.getValues("schedule")
    const updatedDaySchedule = [...(currentSchedule[day] || []), { start: "09:00", end: "17:00" }]
    form.setValue("schedule", { ...currentSchedule, [day]: updatedDaySchedule })
  }

  const removeTimeSlot = (day: string, index: number) => {
    const currentSchedule = form.getValues("schedule")
    const updatedDaySchedule = (currentSchedule[day] || []).filter((_, i) => i !== index)
    form.setValue("schedule", { ...currentSchedule, [day]: updatedDaySchedule })
  }

  const onSubmitHandler = async (values: ServiceFormValues) => {
    await onSubmit(values, existingImageUrls, imageFiles)
    // Clear new image files and previews after successful submission
    setImageFiles([])
    setImagePreviews([])
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Online Coaching Session" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Consulting">Consulting</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                      <SelectItem value="Creative Services">Creative Services</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="service_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="In-person">In-person</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 60" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your service" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {existingImageUrls.map((url, index) => (
                <div
                  key={`existing-${index}`}
                  className="relative w-full aspect-square rounded-md overflow-hidden border"
                >
                  <Image
                    src={url || "/placeholder.svg"}
                    alt={`Service Image ${index + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={() => removeImage(index, true)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove image</span>
                  </Button>
                </div>
              ))}
              {imagePreviews.map((preview, index) => (
                <div key={`new-${index}`} className="relative w-full aspect-square rounded-md overflow-hidden border">
                  <Image
                    src={preview || "/placeholder.svg"}
                    alt={`New Service Image ${index + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={() => removeImage(index, false)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove image</span>
                  </Button>
                </div>
              ))}
              <div className="relative w-full aspect-square rounded-md border-2 border-dashed flex items-center justify-center">
                <Label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
                >
                  <Plus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground mt-2">Add Image(s)</span>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleImageSelect}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Upload up to 5 images. Max file size 5MB.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {daysOfWeek.map((day) => (
              <div key={day} className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-semibold">{day}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addTimeSlot(day)}>
                    Add Time Slot
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.watch(`schedule.${day}`)?.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) => handleScheduleChange(day, index, "start", e.target.value)}
                        className="w-auto"
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) => handleScheduleChange(day, index, "end", e.target.value)}
                        className="w-auto"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeTimeSlot(day, index)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove time slot</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Service"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
