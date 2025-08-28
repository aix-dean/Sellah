"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import AboutUsEditDialog from "@/components/about-us-edit-dialog"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top red bar */}
      <div className="bg-red-500 h-8"></div>

      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-gray-400 font-medium hover:text-gray-600 transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-red-500 font-medium hover:text-red-600 transition-colors">
              About Sellah
            </Link>
          </div>
          <div className="flex items-center space-x-3">
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
        </nav>
      </header>

      {/* About Section */}
      <AboutUsEditDialog>
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl font-bold text-red-500 mb-6">About Sellah</h1>
                <p className="text-gray-700 text-lg mb-6">
                  Welcome to Sellah, your ultimate ERP solution tailored specifically for sellers looking to thrive in
                  the dynamic world of the Out-of-Home (OOH) industry. Sellah empowers sellers to seamlessly list and
                  manage their products on OHSHOP, a leading online marketplace dedicated to the OOH sector.Lorem Ipsum
                </p>
              </div>
              <div className="flex justify-center">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/girl_2-Y1E19iSu8qru3tSCYyfSsFtW742DAc.png"
                  alt="Woman with shopping bag and gift box"
                  className="max-w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>
      </AboutUsEditDialog>

      {/* Mission Section */}
      <AboutUsEditDialog>
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/girl_1-VcUXXOnAbAaaAN8JaAOP3iwzkhw3w8.png"
                  alt="Woman with shopping cart full of gifts"
                  className="max-w-full h-auto"
                />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-5xl font-bold text-red-500 mb-6">Our Mission</h2>
                <p className="text-gray-700 text-lg mb-6">
                  At Sellah, our mission is clear: to simplify and enhance the selling experience for businesses
                  operating within the Out-of-Home advertising space. We understand the unique challenges sellers face
                  in this fast-paced industry, and we're here to provide tools and support to help you succeed.
                </p>
              </div>
            </div>
          </div>
        </section>
      </AboutUsEditDialog>

      {/* CTA Section */}
      <AboutUsEditDialog>
        <section className="py-16 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <p className="text-gray-700 text-lg mb-8">
              Ready to take your selling efforts to new heights on OHSHOP? Join the growing community of sellers who
              trust Sellah to streamline their operations and drive success in the OOH industry. Contact us today to
              schedule a demo or learn more about how Sellah can transform your business.
            </p>
            <h3 className="text-3xl font-bold text-red-500 mb-8">Empower your business with Sellah!</h3>
            <Button className="bg-red-500 hover:bg-red-600 text-white border-0 px-8 py-3 rounded-md font-medium text-lg">
              Contact Us
            </Button>
          </div>
        </section>
      </AboutUsEditDialog>

      {/* Footer */}
      <footer className="bg-white text-gray py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-xl font-bold mb-4">Sellah</h4>
            <p className="text-gray-800">Your ultimate ERP solution for the Out-of-Home industry.</p>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-800 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-800 hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-800 hover:text-white transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-800 hover:text-white transition-colors">
                  Register
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-800 hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-800 hover:text-white transition-colors">
                  API
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-800 hover:text-white transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-gray-800">Email: info@sellah.com</li>
              <li className="text-gray-800">Phone: +1 (555) 123-4567</li>
              <li className="text-gray-800">Address: 123 Business Ave, Suite 100, San Francisco, CA 94107</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-700 text-center text-gray-800">
          <p>&copy; {new Date().getFullYear()} Sellah. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
