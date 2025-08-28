"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Edit3 } from "lucide-react"

interface FeaturedProductsEditDialogProps {
  children: React.ReactNode
}

export default function FeaturedProductsEditDialog({ children }: FeaturedProductsEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    sectionDescription:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    buttonText: "View More",
    backgroundColor: "#ffffff",
    textColor: "#111827",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = () => {
    // Here you would typically save to Firebase or your backend
    console.log("Saving featured products data:", formData)
    setIsOpen(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("[v0] Featured products section clicked, opening dialog")
    setIsOpen(true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="relative cursor-pointer" onClick={handleClick}>
        {children}
        <div className="absolute inset-0 bg-blue-500/20 opacity-0 flex items-center justify-center pointer-events-none">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-lg">
            <Edit3 className="h-5 w-5" />
            <span className="text-sm font-medium">Click to Edit Featured Products</span>
          </div>
        </div>
      </div>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Featured Products Section</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section Header */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Section Header</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="sectionDescription">Section Description</Label>
                <Textarea
                  id="sectionDescription"
                  value={formData.sectionDescription}
                  onChange={(e) => handleInputChange("sectionDescription", e.target.value)}
                  placeholder="Section description..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Product Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Content</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="buttonText">Button Text</Label>
                <Input
                  id="buttonText"
                  value={formData.buttonText}
                  onChange={(e) => handleInputChange("buttonText", e.target.value)}
                  placeholder="View More"
                />
              </div>
            </div>
          </div>

          {/* Styling Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Styling</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => handleInputChange("backgroundColor", e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.backgroundColor}
                    onChange={(e) => handleInputChange("backgroundColor", e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={formData.textColor}
                    onChange={(e) => handleInputChange("textColor", e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={formData.textColor}
                    onChange={(e) => handleInputChange("textColor", e.target.value)}
                    placeholder="#111827"
                    className="flex-1"
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
