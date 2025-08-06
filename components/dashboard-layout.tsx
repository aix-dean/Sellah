"use client"

import type React from "react"
import { Loader2 } from "lucide-react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingCart, Users, Bell, MessageSquare, ChevronDown, LogOut, X } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { signOut } from "@/lib/auth"

interface DashboardLayoutProps {
  children: React.ReactNode
  activeItem?: string
  userName?: string
}

export default function DashboardLayout({ children, activeItem, userName = "" }: DashboardLayoutProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState(userName)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Main navigation items
  const menuItems = [
    { id: "inventory", label: "Inventory", icon: Package, href: "/dashboard/products" },
    { id: "orders", label: "Orders", icon: ShoppingCart, href: "/dashboard/orders" },
    { id: "account", label: "Account", icon: Users, href: "/dashboard/account" },
  ]

  // Determine active item based on current pathname if not explicitly provided
  const getActiveItem = () => {
    if (activeItem) return activeItem

    if (pathname.startsWith("/dashboard/products")) return "inventory"
    if (pathname.startsWith("/dashboard/orders")) return "orders"
    if (pathname.startsWith("/dashboard/account")) return "account"

    return "inventory" // default fallback
  }

  const currentActiveItem = getActiveItem()

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await signOut()
      setCurrentUser(null)
      setUserData(null)
      setDisplayName("")
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      alert("Failed to logout. Please try again.")
    } finally {
      setLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  const handleChat = () => {
    router.push('/dashboard/chat')
  }
  // Get status badge configuration
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return {
          label: "VERIFIED",
          variant: "default" as const,
          className: "bg-green-500 hover:bg-green-600 text-white border-green-500",
        }
      case "BASIC":
        return {
          label: "BASIC",
          variant: "secondary" as const,
          className: "bg-blue-500 hover:bg-blue-600 text-white border-blue-500",
        }
      default:
        return {
          label: "UNKNOWN",
          variant: "destructive" as const,
          className: "bg-gray-500 hover:bg-gray-600 text-white border-gray-500",
        }
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
      setLoading(true)

      if (user) {
        try {
          const userRef = doc(db, "iboard_users", user.uid)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            const firestoreUserData = userSnap.data()
            setUserData(firestoreUserData)

            const firstName = firestoreUserData.first_name || ""
            const lastName = firestoreUserData.last_name || ""

            if (firstName && lastName) {
              setDisplayName(`${firstName} ${lastName}`)
            } else if (user.phoneNumber) {
              setDisplayName(user.phoneNumber)
            } else if (user.email) {
              setDisplayName(user.email.split("@")[0])
            } else {
              setDisplayName(userName)
            }
          } else {
            // Set default user data if no Firestore document exists
            setUserData({
              status: "UNKNOWN",
              first_name: "",
              last_name: "",
              photo_url: "",
            })

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
          // Set fallback user data
          setUserData({
            status: "UNKNOWN",
            first_name: "",
            last_name: "",
            photo_url: "",
          })

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
        setDisplayName("")
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [userName])

  useEffect(() => {
    return () => {
      setCurrentUser(null)
      setUserData(null)
      setDisplayName("")
    }
  }, [])


      const userStatus = userData?.status || "UNKNOWN"
    const statusBadge = getStatusBadge(userStatus)
    console.log('statusBadge:', statusBadge)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <header className="bg-red-500 text-white px-4 py-3 flex items-center justify-between h-16 fixed top-0 left-0 right-0 z-50 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
             <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
          </div>

          {/* Status Badge - Only show when not loading and userData exists */}
                 {!loading && userData && (
            <Badge
              variant={statusBadge.variant}
              className={`${statusBadge.className} text-xs font-semibold px-2 py-1 ml-2`}
            >
              {statusBadge.label}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-white hover:bg-red-600">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-red-600" onClick={handleChat}>
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
                  src={userData?.photo_url || currentUser?.photoURL || "/placeholder.svg"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="hidden md:block font-medium">{displayName}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      handleNavigation("/dashboard/account")
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Account Settings</span>
                  </button>
                  <hr className="my-1" />
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

      {/* Layout Body */}
      <div className="flex min-h-screen pt-16 text-left">
        {/* Sidebar */}
        <aside className="bg-pink-100 w-64 min-h-[calc(100vh-4rem)] fixed left-0 top-16 overflow-y-auto z-40 shadow-inner hidden md:block">
          <div className="p-3">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentActiveItem === item.id
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full justify-start text-left h-12 ${
                      isActive ? "bg-red-500 text-white hover:bg-red-600" : "text-gray-700 hover:bg-pink-200"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="flex-1">{item.label}</span>
                  </Button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-none px-4 py-6 md:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40 md:hidden">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentActiveItem === item.id
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

      {/* Logout Modal */}
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
