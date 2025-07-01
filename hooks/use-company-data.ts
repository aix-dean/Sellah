"use client"
import { useState, useEffect } from "react"
import { doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { loggedGetDoc } from "@/lib/firestore-logger"

interface CompanyData {
  id: string
  name: string
  business_type: string
  address: {
    street: string
    city: string
    province: string
    postal_code: string
  }
  website?: string
  created_by: string
  created_at: any
  updated_at: any
}

export function useCompanyData(companyId: string | null) {
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!companyId) {
      setCompany(null)
      setLoading(false)
      return
    }

    const fetchCompany = async () => {
      try {
        setLoading(true)
        setError(null)

        const companyRef = doc(db, "companies", companyId)
        const companySnap = await loggedGetDoc(companyRef)

        if (companySnap.exists()) {
          setCompany({
            id: companySnap.id,
            ...companySnap.data(),
          } as CompanyData)
        } else {
          setError("Company not found")
          setCompany(null)
        }
      } catch (err) {
        console.error("Error fetching company:", err)
        setError("Failed to fetch company data")
        setCompany(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [companyId])

  return { company, loading, error }
}
