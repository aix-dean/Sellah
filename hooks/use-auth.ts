import { useState, useEffect, createContext, useContext, useMemo } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"

interface AuthContextType {
  user: FirebaseUser | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const memoedValue = useMemo(
    () => ({
      user,
      loading,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={memoedValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
