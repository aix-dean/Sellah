"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function LobbyPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const totalSlides = 6

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top red bar */}
      <div className="bg-red-500 h-2 sm:h-8"></div>

      {/* Header */}
      <header className="bg-white px-4 sm:px-6 py-3 sm:py-4 shadow-sm relative">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-red-500 font-medium hover:text-red-600 transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-gray-400 font-medium hover:text-gray-600 transition-colors">
              About Sellah
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link href="/login">
              <Button className="bg-red-500 hover:bg-red-600 text-white border-0 px-6 py-2 rounded-md font-medium">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button
                variant="secondary"
                className="bg-gray-400 hover:bg-gray-500 text-white border-0 px-6 py-2 rounded-md font-medium"
              >
                Register
              </Button>
            </Link>
          </div>

          {/* Mobile Action Buttons */}
          <div className="md:hidden flex items-center space-x-2">
            <Link href="/login">
              <Button className="bg-red-500 hover:bg-red-600 text-white border-0 px-4 py-2 rounded-md font-medium text-sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button
                variant="secondary"
                className="bg-gray-400 hover:bg-gray-500 text-white border-0 px-4 py-2 rounded-md font-medium text-sm"
              >
                Register
              </Button>
            </Link>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t z-50">
            <div className="px-4 py-3 space-y-3">
              <Link
                href="/"
                className="block text-red-500 font-medium hover:text-red-600 transition-colors py-2"
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="block text-gray-600 font-medium hover:text-gray-800 transition-colors py-2"
                onClick={closeMobileMenu}
              >
                About Sellah
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Banner - Responsive */}
      <div className="relative bg-red-500 overflow-hidden">
        <div className="w-full">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lobby_banner-hlshNjDtRUeZHECOpbKC3vmCHu1XQb.png"
            alt="Business is now open - Sellah banner with shopping illustration"
            className="w-full h-auto max-h-[300px] sm:max-h-[400px] lg:max-h-none object-cover"
          />
        </div>

        {/* Carousel dots - Mobile optimized */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
                index === currentSlide ? "bg-orange-400" : "bg-gray-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation arrows - Touch optimized */}
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors touch-manipulation"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors touch-manipulation"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </button>
      </div>

      {/* Content area - Mobile optimized */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-8 leading-tight">
            Start Your Online Business Today
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-2">
            Join thousands of sellers who have made their business dreams come true with Sellah. Our platform makes it
            easy to start selling online with powerful tools and partnerships.
          </p>

          {/* Mobile CTA Buttons */}
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Link href="/register">
              <Button className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-md font-medium text-lg">
                Get Started Free
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-50 px-8 py-3 rounded-md font-medium text-lg"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer - Mobile optimized */}
      <footer className="bg-gray-50 text-gray-800 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Mobile-first grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center sm:text-left">
              <h4 className="text-xl font-bold mb-4 text-red-500">Sellah</h4>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Your ultimate ERP solution for the Out-of-Home industry.
              </p>
            </div>

            <div className="text-center sm:text-left">
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-600 hover:text-red-500 transition-colors text-sm sm:text-base">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-gray-600 hover:text-red-500 transition-colors text-sm sm:text-base"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-red-500 transition-colors text-sm sm:text-base"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-gray-600 hover:text-red-500 transition-colors text-sm sm:text-base"
                  >
                    Register
                  </Link>
                </li>
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-red-500 transition-colors text-sm sm:text-base">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-red-500 transition-colors text-sm sm:text-base">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-red-500 transition-colors text-sm sm:text-base">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm sm:text-base">
                <li className="text-gray-600">
                  <a href="mailto:info@sellah.com" className="hover:text-red-500 transition-colors">
                    info@sellah.com
                  </a>
                </li>
                <li className="text-gray-600">
                  <a href="tel:+15551234567" className="hover:text-red-500 transition-colors">
                    +1 (555) 123-4567
                  </a>
                </li>
                <li className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  123 Business Ave, Suite 100
                  <br />
                  San Francisco, CA 94107
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright - Mobile optimized */}
          <div className="mt-8 pt-6 sm:pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Sellah. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
