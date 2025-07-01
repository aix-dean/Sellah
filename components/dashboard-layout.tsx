"use client"

import type React from "react"
import { Loader2 } from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import FirestoreDebugPanel from "./firestore-debug-panel"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Home, Package, ShoppingCart, Users, Menu, Bell, MessageSquare, ChevronDown, LogOut, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"

interface DashboardLayoutProps {
  children: React.ReactNode
  activeItem?: string
  userName?: string
}

export default function DashboardLayout({ children, activeItem = "home", userName = "" }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState(userName)
  const [userData, setUserData] = useState<any>(null)

  const menuItems = [
    { id: "home", label: "Home", icon: Home, href: "/dashboard" },
    { id: "products", label: "Products", icon: Package, href: "/dashboard/products" },
    { id: "orders", label: "Orders", icon: ShoppingCart, href: "/dashboard/orders" },
    { id: "account", label: "Account", icon: Users, href: "/dashboard/account" },
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
    setSidebarOpen(false) // Close mobile sidebar after navigation
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await signOut()

      // Clear any component state
      setCurrentUser(null)
      setUserData(null)
      setDisplayName("")

      // Redirect to login page
      window.location.href = "/login"
    } catch (error) {
      console.error("Error signing out:", error)
      alert("Failed to logout. Please try again.")
    } finally {
      setLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [showUserMenu])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        try {
          const userRef = doc(db, "iboard_users", user.uid)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            const firestoreUserData = userSnap.data()
            setUserData(firestoreUserData)

            const firstName = firestoreUserData.first_name || ""
            const lastName = firestoreUserData.last_name || ""
            const firstNameAlt = firestoreUserData.firstName || ""
            const lastNameAlt = firestoreUserData.lastName || ""

            if ((firstName && lastName) || (firstNameAlt && lastNameAlt)) {
              const displayFirstName = firstName || firstNameAlt
              const displayLastName = lastName || lastNameAlt
              setDisplayName(`${displayFirstName} ${displayLastName}`)
            } else if (user.phoneNumber) {
              setDisplayName(user.phoneNumber)
            } else if (user.email) {
              setDisplayName(user.email.split("@")[0])
            } else {
              setDisplayName(userName)
            }
          } else {
            setUserData(null)
            if (user.phoneNumber) {
              setDisplayName(user.phoneNumber)
            } else if (user.email) {
              setDisplayName(user.email.split("@")[0])
            } else if (user.displayName) {
              setDisplayName(user.displayName)
            } else {
              setDisplayName(userName)
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUserData(null)
          if (user.phoneNumber) {
            setDisplayName(user.phoneNumber)
          } else if (user.email) {
            setDisplayName(user.email.split("@")[0])
          } else {
            setDisplayName(userName)
          }
        }
      } else {
        setUserData(null)
      }
    })

    return () => unsubscribe()
  }, [userName])

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      setCurrentUser(null)
      setUserData(null)
      setDisplayName("")
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-red-500 text-white px-4 py-3 flex items-center justify-between h-[64px] relative z-10">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button - only visible on mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:bg-red-600 hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-red-500 font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl">SELLAH</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-white hover:bg-red-600">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-red-600">
            <MessageSquare className="w-5 h-5" />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-red-600 flex items-center space-x-2"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
                <img
                  src={
                    userData?.photo_url ||
                    currentUser?.photoURL ||
                    "/placeholder.svg?height=32&width=32&query=user profile" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg"
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="hidden md:block font-medium">{displayName}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      handleNavigation("/dashboard/account")
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2 md:hidden"
                  >
                    <Users className="w-4 h-4" />
                    <span>Account Settings</span>
                  </button>
                  <hr className="my-1 md:hidden" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      setShowLogoutModal(true)
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Desktop Sidebar - hidden on mobile */}
        <aside className="hidden md:block bg-pink-100 w-64 fixed top-[64px] bottom-0 overflow-y-auto z-30">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeItem === item.id

              return (
                <div key={item.id}>
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full justify-start text-left h-12 ${
                      isActive ? "bg-red-500 text-white hover:bg-red-600" : "text-gray-700 hover:bg-pink-200"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="flex-1">{item.label}</span>
                  </Button>
                </div>
              )
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar - only visible when open on mobile */}
        <aside
          className={`bg-pink-100 w-64 fixed top-[64px] bottom-0 transition-transform duration-300 overflow-y-auto z-40 md:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeItem === item.id

              return (
                <div key={item.id}>
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full justify-start text-left h-12 ${
                      isActive ? "bg-red-500 text-white hover:bg-red-600" : "text-gray-700 hover:bg-pink-200"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="flex-1">{item.label}</span>
                  </Button>
                </div>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto ml-0 md:ml-64 w-full">
          {children}
          {/* Firestore Debug Panel - only in development */}
          {process.env.NODE_ENV === "development" && <FirestoreDebugPanel />}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Bottom Navigation - only visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40 md:hidden">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.href)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                  isActive ? "text-red-500 bg-red-50" : "text-gray-600 hover:text-red-500 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogoutModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                Are you sure you want to logout? You will need to sign in again to access your account.
              </p>
              <div className="flex space-x-3 justify-end">
                <Button variant="outline" onClick={() => setShowLogoutModal(false)} disabled={loggingOut}>
                  Cancel
                </Button>
                <Button onClick={handleLogout} disabled={loggingOut} className="bg-red-500 hover:bg-red-600 text-white">
                  {loggingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
