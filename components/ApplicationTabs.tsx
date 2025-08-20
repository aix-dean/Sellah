"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ApplicationTabsProps {
  theme?: any
}

export default function ApplicationTabs({ theme }: ApplicationTabsProps) {
  const [activeTab, setActiveTab] = useState("Indoor")

  const tabs = [
    { id: "Indoor", label: "Indoor" },
    { id: "Outdoor", label: "Outdoor" },
    { id: "Rental", label: "Rental" },
    { id: "Sports", label: "Sports" },
    { id: "Lighting", label: "Lighting" },
  ]

  const tabContent = {
    Indoor: {
      title: "Indoor",
      description:
        "From control rooms to governments to retail, Unilumin LED display presents exceptional images in mission-critical places and indoor commercial space.",
      applications: ["Broadcast Room", "Education & Medical", "Control Room", "Corporate", "Hospitality", "Retail"],
      image: "/placeholder.svg?height=400&width=600",
    },
    Outdoor: {
      title: "Outdoor",
      description:
        "Weather-resistant LED displays designed for outdoor advertising, digital billboards, and large-scale installations with high brightness and durability.",
      applications: [
        "Digital Billboards",
        "Stadium Displays",
        "Transportation Hubs",
        "Outdoor Advertising",
        "Public Information",
        "Event Venues",
      ],
      image: "/placeholder.svg?height=400&width=600",
    },
    Rental: {
      title: "Rental",
      description:
        "Portable and modular LED display solutions perfect for events, concerts, trade shows, and temporary installations with quick setup and breakdown.",
      applications: [
        "Concerts & Events",
        "Trade Shows",
        "Corporate Events",
        "Weddings",
        "Conferences",
        "Stage Backdrops",
      ],
      image: "/placeholder.svg?height=400&width=600",
    },
    Sports: {
      title: "Sports",
      description:
        "High-performance LED displays for sports venues, stadiums, and arenas with fast refresh rates and excellent visibility for live events.",
      applications: [
        "Stadium Scoreboards",
        "Perimeter Displays",
        "Video Walls",
        "Sports Bars",
        "Training Facilities",
        "Broadcasting",
      ],
      image: "/placeholder.svg?height=400&width=600",
    },
    Lighting: {
      title: "Lighting",
      description:
        "Energy-efficient LED lighting solutions for commercial, industrial, and residential applications with smart controls and long lifespan.",
      applications: [
        "Street Lighting",
        "Industrial Lighting",
        "Architectural Lighting",
        "Landscape Lighting",
        "Emergency Lighting",
        "Smart City Solutions",
      ],
      image: "/placeholder.svg?height=400&width=600",
    },
  }

  const currentContent = tabContent[activeTab as keyof typeof tabContent]

  return (
    <div className="container mx-auto px-4">
      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-full transition-all ${
              activeTab === tab.id
                ? theme?.primaryColor
                  ? `text-white`
                  : "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
            style={
              activeTab === tab.id && theme?.primaryColor
                ? {
                    backgroundColor: theme.primaryColor,
                    borderColor: theme.primaryColor,
                    color: "#ffffff",
                  }
                : {}
            }
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
              src={currentContent.image || "/placeholder.svg"}
              alt={`${currentContent.title} LED Display`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right side - Content */}
        <div className="order-1 lg:order-2">
          <h3 className="text-3xl font-bold mb-6 text-foreground">{currentContent.title}</h3>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{currentContent.description}</p>

          <div className="space-y-3 mb-8">
            {currentContent.applications.map((application, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                <span className="text-foreground">{application}</span>
              </div>
            ))}
          </div>

          <Button variant="ghost" className="text-blue-600 hover:text-blue-700 p-0 h-auto font-semibold">
            View More →
          </Button>
        </div>
      </div>
    </div>
  )
}
