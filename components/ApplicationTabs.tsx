"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ApplicationTabsProps {
  theme?: any
  config?: {
    tabs: Array<{ id: string; label: string; enabled: boolean }>
    activeTabColor: string
    inactiveTabColor: string
    activeTextColor: string
    inactiveTextColor: string
  }
  content?: {
    [key: string]: {
      title: string
      description: string
      applications: Array<{ name: string; image?: string }>
      image?: string
    }
  }
}

export default function ApplicationTabs({ theme, config, content }: ApplicationTabsProps) {
  const [activeTab, setActiveTab] = useState("Indoor")
  const [selectedApplication, setSelectedApplication] = useState<number>(0)

  const tabs = config?.tabs?.filter((tab) => tab.enabled) || [
    { id: "Indoor", label: "Indoor", enabled: true },
    { id: "Outdoor", label: "Outdoor", enabled: true },
    { id: "Rental", label: "Rental", enabled: true },
    { id: "Sports", label: "Sports", enabled: true },
    { id: "Lighting", label: "Lighting", enabled: true },
  ]

  const defaultTabContent = {
    Indoor: {
      title: "Indoor",
      description:
        "From control rooms to governments to retail, Unilumin LED display presents exceptional images in mission-critical places and indoor commercial space.",
      applications: [
        { name: "Broadcast Room" },
        { name: "Education & Medical" },
        { name: "Control Room" },
        { name: "Corporate" },
        { name: "Hospitality" },
        { name: "Retail" },
      ],
      image: "/placeholder.svg?height=400&width=600",
    },
    Outdoor: {
      title: "Outdoor",
      description:
        "Weather-resistant LED displays designed for outdoor advertising, digital billboards, and large-scale installations with high brightness and durability.",
      applications: [
        { name: "Digital Billboards" },
        { name: "Stadium Displays" },
        { name: "Transportation Hubs" },
        { name: "Outdoor Advertising" },
        { name: "Public Information" },
        { name: "Event Venues" },
      ],
      image: "/placeholder.svg?height=400&width=600",
    },
    Rental: {
      title: "Rental",
      description:
        "Portable and modular LED display solutions perfect for events, concerts, trade shows, and temporary installations with quick setup and breakdown.",
      applications: [
        { name: "Concerts & Events" },
        { name: "Trade Shows" },
        { name: "Corporate Events" },
        { name: "Weddings" },
        { name: "Conferences" },
        { name: "Stage Backdrops" },
      ],
      image: "/placeholder.svg?height=400&width=600",
    },
    Sports: {
      title: "Sports",
      description:
        "High-performance LED displays for sports venues, stadiums, and arenas with fast refresh rates and excellent visibility for live events.",
      applications: [
        { name: "Stadium Scoreboards" },
        { name: "Perimeter Displays" },
        { name: "Video Walls" },
        { name: "Sports Bars" },
        { name: "Training Facilities" },
        { name: "Broadcasting" },
      ],
      image: "/placeholder.svg?height=400&width=600",
    },
    Lighting: {
      title: "Lighting",
      description:
        "Energy-efficient LED lighting solutions for commercial, industrial, and residential applications with smart controls and long lifespan.",
      applications: [
        { name: "Street Lighting" },
        { name: "Industrial Lighting" },
        { name: "Architectural Lighting" },
        { name: "Landscape Lighting" },
        { name: "Emergency Lighting" },
        { name: "Smart City Solutions" },
      ],
      image: "/placeholder.svg?height=400&width=600",
    },
  }

  const currentContent = content?.[activeTab] || defaultTabContent[activeTab as keyof typeof defaultTabContent]

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setSelectedApplication(0)
  }

  const getDisplayImage = () => {
    if (!currentContent) {
      console.log("[v0] No current content, using fallback")
      return "/placeholder.svg?height=400&width=600"
    }

    // If no applications exist, always show the main tab image
    if (
      !currentContent.applications ||
      !Array.isArray(currentContent.applications) ||
      currentContent.applications.length === 0
    ) {
      console.log("[v0] No applications available, using main tab image:", currentContent.image)
      return currentContent.image || "/placeholder.svg?height=400&width=600"
    }

    // If selectedApplication is out of bounds, use main tab image
    if (selectedApplication < 0 || selectedApplication >= currentContent.applications.length) {
      console.log("[v0] Selected application index out of bounds, using main tab image:", currentContent.image)
      return currentContent.image || "/placeholder.svg?height=400&width=600"
    }

    const application = currentContent.applications[selectedApplication]
    console.log("[v0] Selected application:", application)

    // If application has an image, use it; otherwise use main tab image
    if (application && typeof application === "object" && application.image) {
      console.log("[v0] Using application image:", application.image)
      return application.image
    }

    console.log("[v0] Using main tab image:", currentContent.image)
    return currentContent.image || "/placeholder.svg?height=400&width=600"
  }

  const handleApplicationClick = (index: number) => {
    if (currentContent?.applications && index >= 0 && index < currentContent.applications.length) {
      console.log("[v0] Application clicked:", index)
      setSelectedApplication(index)
    }
  }

  if (!currentContent) {
    return (
      <div className="container mx-auto px-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Content not available for this tab.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => handleTabChange(tab.id)}
            className="px-6 py-2 rounded-full transition-all"
            style={{
              backgroundColor:
                activeTab === tab.id
                  ? config?.activeTabColor || theme?.primaryColor || "#3b82f6"
                  : config?.inactiveTabColor || "#ffffff",
              borderColor:
                activeTab === tab.id ? config?.activeTabColor || theme?.primaryColor || "#3b82f6" : "#d1d5db",
              color:
                activeTab === tab.id ? config?.activeTextColor || "#ffffff" : config?.inactiveTextColor || "#374151",
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Image */}
        <div className="order-2 lg:order-1">
          <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={getDisplayImage() || "/placeholder.svg"}
              alt={`${currentContent.title} LED Display`}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.log("[v0] Image failed to load:", getDisplayImage())
                e.currentTarget.src = "/placeholder.svg?height=400&width=600"
              }}
            />
          </div>
        </div>

        {/* Right side - Content */}
        <div className="order-1 lg:order-2">
          <h3 className="text-3xl font-bold mb-6 text-foreground">{currentContent.title}</h3>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{currentContent.description}</p>

          <div className="space-y-3 mb-8">
            {currentContent.applications && Array.isArray(currentContent.applications) ? (
              currentContent.applications.map((application, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 cursor-pointer p-2 rounded-md transition-all hover:bg-gray-50 ${
                    selectedApplication === index ? "bg-blue-50 border-l-4 border-blue-600" : ""
                  }`}
                  onClick={() => handleApplicationClick(index)}
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      selectedApplication === index ? "bg-blue-600" : "bg-blue-400"
                    }`}
                  ></div>
                  <span
                    className={`text-foreground ${selectedApplication === index ? "font-medium text-blue-900" : ""}`}
                  >
                    {typeof application === "string" ? application : application.name}
                  </span>
                  {typeof application === "object" && application.image && (
                    <div className="w-1 h-1 bg-green-500 rounded-full ml-auto"></div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No applications available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
