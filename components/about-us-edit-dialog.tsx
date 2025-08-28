"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Edit3, Upload, X, Loader2 } from "lucide-react"
import { optimizeImage } from "@/lib/media-optimizer"

interface AboutUsEditDialogProps {
  children: React.ReactNode
}

export default function AboutUsEditDialog({ children }: AboutUsEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: "About Sellah",
    description:
      "Welcome to Sellah, your ultimate ERP solution tailored specifically for sellers looking to thrive in the dynamic world of the Out-of-Home (OOH) industry. Sellah empowers sellers to seamlessly list and manage their products on OHSHOP, a leading online marketplace dedicated to the OOH sector.Lorem Ipsum",
    missionTitle: "Our Mission",
    missionDescription:
      "At Sellah, our mission is clear: to simplify and enhance the selling experience for businesses operating within the Out-of-Home advertising space. We understand the unique challenges sellers face in this fast-paced industry, and we're here to provide tools and support to help you succeed.",
    ctaText:
      "Ready to take your selling efforts to new heights on OHSHOP? Join the growing community of sellers who trust Sellah to streamline their operations and drive success in the OOH industry. Contact us today to schedule a demo or learn more about how Sellah can transform your business.",
    ctaTitle: "Empower your business with Sellah!",
    buttonText: "Contact Us",
    aboutImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/girl_2-Y1E19iSu8qru3tSCYyfSsFtW742DAc.png",
    missionImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/girl_1-VcUXXOnAbAaaAN8JaAOP3iwzkhw3w8.png",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageUpload = async (field: "aboutImage" | "missionImage", file: File) => {
    if (!file) return

    setUploading(true)
    try {
      // Optimize the image before upload
      const optimized = await optimizeImage(file, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.8,
      })

      // Create a temporary URL for preview (in a real app, you'd upload to Firebase Storage)
      const imageUrl = URL.createObjectURL(optimized.optimizedFile)

      handleInputChange(field, imageUrl)

      console.log(`[v0] Image optimized: ${optimized.originalSize} -> ${optimized.optimizedSize} bytes`)
    } catch (error) {
      console.error("[v0] Error optimizing image:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = () => {
    // Here you would typically save to Firebase or your backend
    console.log("Saving about us data:", formData)
    setIsOpen(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("[v0] About us section clicked, opening dialog")
    setIsOpen(true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="relative cursor-pointer" onClick={handleClick}>
        {children}
        <div className="absolute inset-0 bg-blue-500/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg">
            <Edit3 className="h-5 w-5" />
            <span className="text-sm font-medium">Click to Edit About Us</span>
          </div>
        </div>
      </div>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit About Us Section</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">About Section</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="About Sellah"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="About description..."
                    rows={4}
                  />
                </div>
              </div>
              <div>
                <Label>About Image</Label>
                <div className="space-y-3">
                  {formData.aboutImage && (
                    <div className="relative group inline-block">
                      <img
                        src={formData.aboutImage || "/placeholder.svg"}
                        alt="About section image"
                        className="w-full h-32 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=128&width=200"
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleInputChange("aboutImage", "")}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload("aboutImage", file)
                    }}
                    className="hidden"
                    id="about-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("about-image-upload")?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {formData.aboutImage ? "Replace Image" : "Upload Image"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Mission Section</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="missionTitle">Mission Title</Label>
                  <Input
                    id="missionTitle"
                    value={formData.missionTitle}
                    onChange={(e) => handleInputChange("missionTitle", e.target.value)}
                    placeholder="Our Mission"
                  />
                </div>
                <div>
                  <Label htmlFor="missionDescription">Mission Description</Label>
                  <Textarea
                    id="missionDescription"
                    value={formData.missionDescription}
                    onChange={(e) => handleInputChange("missionDescription", e.target.value)}
                    placeholder="Mission description..."
                    rows={4}
                  />
                </div>
              </div>
              <div>
                <Label>Mission Image</Label>
                <div className="space-y-3">
                  {formData.missionImage && (
                    <div className="relative group inline-block">
                      <img
                        src={formData.missionImage || "/placeholder.svg"}
                        alt="Mission section image"
                        className="w-full h-32 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=128&width=200"
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleInputChange("missionImage", "")}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload("missionImage", file)
                    }}
                    className="hidden"
                    id="mission-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("mission-image-upload")?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {formData.missionImage ? "Replace Image" : "Upload Image"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Call to Action</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="ctaText">CTA Text</Label>
                <Textarea
                  id="ctaText"
                  value={formData.ctaText}
                  onChange={(e) => handleInputChange("ctaText", e.target.value)}
                  placeholder="CTA description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ctaTitle">CTA Title</Label>
                  <Input
                    id="ctaTitle"
                    value={formData.ctaTitle}
                    onChange={(e) => handleInputChange("ctaTitle", e.target.value)}
                    placeholder="Empower your business with Sellah!"
                  />
                </div>
                <div>
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input
                    id="buttonText"
                    value={formData.buttonText}
                    onChange={(e) => handleInputChange("buttonText", e.target.value)}
                    placeholder="Contact Us"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
