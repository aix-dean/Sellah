"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, X } from 'lucide-react'
import Image from "next/image"
import type { Service, CreateServiceData } from "@/types/service"
import type { ServiceSchedule } from "@/types/schedule"

interface ServiceFormSharedProps {
  initialData?: Service | null
  onSubmit: (serviceData: CreateServiceData, existingImageUrls: string[], newImageFiles: File[]) => Promise<void>
  isLoading: boolean
  submitButtonText: string
}

export default function ServiceFormShared({
  initialData,
  onSubmit,
  isLoading,
  submitButtonText,
}: ServiceFormSharedProps) {
  const { toast } = useToast()
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [category, setCategory] = useState(initialData?.category || "")
  const [price, setPrice] = useState(initialData?.price || 0)
  const [duration, setDuration] = useState(initialData?.duration || "")
  const [availability, setAvailability] = useState(initialData?.availability || "available")
  const [scope, setScope] = useState(initialData?.scope || "nationwide")
  const [regions, setRegions] = useState<string[]>(initialData?.regions || [])
  const [schedule, setSchedule] = useState<ServiceSchedule>(initialData?.schedule || {})
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(initialData?.imageUrls || [])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setDescription(initialData.description)
      setCategory(initialData.category)
      setPrice(initialData.price)
      setDuration(initialData.duration || "")
      setAvailability(initialData.availability)
      setScope(initialData.scope)
      setRegions(initialData.regions || [])
      setSchedule(initialData.schedule || {})
      setExistingImageUrls(initialData.imageUrls || [])
    }
  }, [initialData])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setNewImageFiles((prev) => [...prev, ...filesArray])

      const newPreviews = filesArray.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...newPreviews])
    }
  }

  const removeExistingImage = (urlToRemove: string) => {
    setExistingImageUrls((prev) => prev.filter((url) => url !== urlToRemove))
  }

  const removeNewImage = (indexToRemove: number) => {
    setNewImageFiles((prev) => prev.filter((_, index) => index !== indexToRemove))
    setImagePreviews((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleScheduleChange = useCallback(
    (day: keyof ServiceSchedule, field: "enabled" | "startTime" | "endTime", value: any) => {
      setSchedule((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          [field]: value,
        },
      }))
    },
    [],
  )

  const validateForm = () => {
    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Service name is required.", variant: "destructive" })
      return false
    }
    if (!description.trim()) {
      toast({ title: "Validation Error", description: "Service description is required.", variant: "destructive" })
      return false
    }
    if (!category.trim()) {
      toast({ title: "Validation Error", description: "Service category is required.", variant: "destructive" })
      return false
    }
    if (price <= 0) {
      toast({ title: "Validation Error", description: "Price must be greater than 0.", variant: "destructive" })
      return false
    }
    if (!duration.trim()) {
      toast({ title: "Validation Error", description: "Duration is required.", variant: "destructive" })
      return false
    }
    if (scope === "regional" && regions.length === 0) {
      toast({ title: "Validation Error", description: "Please select at least one region for regional scope.", variant: "destructive" })
      return false
    }

    // Basic schedule validation (e.g., if enabled, start/end times should be present)
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
    for (const day of days) {
      const daySchedule = schedule[day];
      if (daySchedule?.enabled) {
        if (!daySchedule.startTime || !daySchedule.endTime) {
          toast({ title: "Validation Error", description: `Start and end times are required for ${day}.`, variant: "destructive" });
          return false;
        }
        if (daySchedule.startTime >= daySchedule.endTime) {
          toast({ title: "Validation Error", description: `Start time must be before end time for ${day}.`, variant: "destructive" });
          return false;
        }
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("ServiceFormShared: handleSubmit triggered")

    if (!validateForm()) {
      console.log("ServiceFormShared: Validation failed.")
      return
    }

    const serviceData: CreateServiceData = {
      name,
      description,
      category,
      price,
      duration,
      availability,
      scope,
      regions: scope === "regional" ? regions : [],
      schedule,
    }

    console.log("ServiceFormShared: Calling onSubmit with data:", serviceData)
    await onSubmit(serviceData, existingImageUrls, newImageFiles)
  }

  const allRegions = [
    { code: "US-AL", name: "Alabama" }, { code: "US-AK", name: "Alaska" }, { code: "US-AZ", name: "Arizona" },
    { code: "US-AR", name: "Arkansas" }, { code: "US-CA", name: "California" }, { code: "US-CO", name: "Colorado" },
    { code: "US-CT", name: "Connecticut" }, { code: "US-DE", name: "Delaware" }, { code: "US-FL", name: "Florida" },
    { code: "US-GA", name: "Georgia" }, { code: "US-HI", name: "Hawaii" }, { code: "US-ID", name: "Idaho" },
    { code: "US-IL", name: "Illinois" }, { code: "US-IN", name: "Indiana" }, { code: "US-IA", name: "Iowa" },
    { code: "US-KS", name: "Kansas" }, { code: "US-KY", name: "Kentucky" }, { code: "US-LA", name: "Louisiana" },
    { code: "US-ME", name: "Maine" }, { code: "US-MD", name: "Maryland" }, { code: "US-MA", name: "Massachusetts" },
    { code: "US-MI", name: "Michigan" }, { code: "US-MN", name: "Minnesota" }, { code: "US-MS", name: "Mississippi" },
    { code: "US-MO", name: "Missouri" }, { code: "US-MT", name: "Montana" }, { code: "US-NE", name: "Nebraska" },
    { code: "US-NV", name: "Nevada" }, { code: "US-NH", name: "New Hampshire" }, { code: "US-NJ", name: "New Jersey" },
    { code: "US-NM", name: "New Mexico" }, { code: "US-NY", name: "New York" }, { code: "US-NC", name: "North Carolina" },
    { code: "US-ND", name: "North Dakota" }, { code: "US-OH", name: "Ohio" }, { code: "US-OK", name: "Oklahoma" },
    { code: "US-OR", name: "Oregon" }, { code: "US-PA", name: "Pennsylvania" }, { code: "US-RI", name: "Rhode Island" },
    { code: "US-SC", name: "South Carolina" }, { code: "US-SD", name: "South Dakota" }, { code: "US-TN", name: "Tennessee" },
    { code: "US-TX", name: "Texas" }, { code: "US-UT", name: "Utah" }, { code: "US-VT", name: "Vermont" },
    { code: "US-VA", name: "Virginia" }, { code: "US-WA", name: "Washington" }, { code: "US-WV", name: "West Virginia" },
    { code: "US-WI", name: "Wisconsin" }, { code: "US-WY", name: "Wyoming" },
  ]

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="grid gap-6 p-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Service Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Online Yoga Class" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide a detailed description of your service" rows={5} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Fitness, Consulting, Art" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" value={price} onChange={(e) => setPrice(parseFloat(e.target.value))} placeholder="0.00" min="0.01" step="0.01" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 60 minutes, 2 hours" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="availability">Availability</Label>
              <Select value={availability} onValueChange={(value: "available" | "unavailable") => setAvailability(value)}>
                <SelectTrigger id="availability">
                  <SelectValue placeholder="Select availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="scope">Service Scope</Label>
            <Select value={scope} onValueChange={(value: "nationwide" | "regional") => setScope(value)}>
              <SelectTrigger id="scope">
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nationwide">Nationwide</SelectItem>
                <SelectItem value="regional">Specific Regions Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === "regional" && (
            <div className="grid gap-2">
              <Label>Regions</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto border p-3 rounded-md">
                {allRegions.map((region) => (
                  <div key={region.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`region-${region.code}`}
                      checked={regions.includes(region.code)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setRegions((prev) => [...prev, region.code])
                        } else {
                          setRegions((prev) => prev.filter((code) => code !== region.code))
                        }
                      }}
                    />
                    <Label htmlFor={`region-${region.code}`}>{region.name}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4">
            <Label>Schedule</Label>
            {daysOfWeek.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <Checkbox
                  id={`schedule-${day}`}
                  checked={schedule[day]?.enabled || false}
                  onCheckedChange={(checked) => handleScheduleChange(day, "enabled", checked)}
                />
                <Label htmlFor={`schedule-${day}`} className="capitalize min-w-[80px]">
                  {day}
                </Label>
                {schedule[day]?.enabled && (
                  <>
                    <Input
                      type="time"
                      value={schedule[day]?.startTime || ""}
                      onChange={(e) => handleScheduleChange(day, "startTime", e.target.value)}
                      className="w-full"
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      type="time"
                      value={schedule[day]?.endTime || ""}
                      onChange={(e) => handleScheduleChange(day, "endTime", e.target.value)}
                      className="w-full"
                    />
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="images">Service Images</Label>
            <Input id="images" type="file" multiple onChange={handleImageChange} accept="image/*" />
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {existingImageUrls.map((url, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <Image src={url || "/placeholder.svg"} alt={`Service image ${index + 1}`} width={150} height={150} className="w-full h-auto object-cover rounded-md" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeExistingImage(url)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {imagePreviews.map((preview, index) => (
                <div key={`new-${index}`} className="relative group">
                  <Image src={preview || "/placeholder.svg"} alt={`New image ${index + 1}`} width={150} height={150} className="w-full h-auto object-cover rounded-md" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeNewImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end p-6">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
