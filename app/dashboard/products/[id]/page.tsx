import ProductDetailsPage from "@/components/product-details-page"

export default function ProductDetails({ params }: { params: { id: string } }) {
  return <ProductDetailsPage productId={params.id} />
}
