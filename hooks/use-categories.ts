"use client"

import { useCallback } from "react"

interface Category {
  id: string
  name: string
  type: string
}

export function useCategories(type = "MERCHANDISE") {
  return useCallback(async () => {
    try {
      const { collection, query, where, getDocs, orderBy } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")

      const categoriesRef = collection(db, "categories")
      const q = query(
        categoriesRef,
        where("type", "==", "MERCHANDISE"),
        where("active", "==", true),
        where("deleted", "==", false),
        orderBy("name", "asc"),
      )
      console.log(categoriesRef)
      const querySnapshot = await getDocs(q)
      const fetchedCategories: any[] = []
      console.log(q)
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedCategories.push({
          id: doc.id,
          name: data.name || "Unnamed Category",
          description: data.description || "",
          type: data.type || "MERCHANDISE",
          active: data.active !== false,
          deleted: data.deleted === true ? true : false,
        })
      })

      console.log(`Fetched ${fetchedCategories.length} categories:`, fetchedCategories)
      return fetchedCategories
    } catch (error) {
      console.error("Error fetching categories:", error)
      throw error
    }
  }, []) // 30 minutes cache for categories
}
