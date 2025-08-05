import { useQuery } from "react-query"
import { getProducts } from "../api/products"

const useRealTimeProducts = () => {
  const { data, isLoading, error } = useQuery("realTimeProducts", () =>
    getProducts({
      where: {
        type: {
          in: ["MERCHANDISE", "Merchandise", "SERVICES"],
        },
      },
    }),
  )

  return { data, isLoading, error }
}

export default useRealTimeProducts
