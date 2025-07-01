import EditProductPage from "@/components/edit-product-page"

export default function EditProduct({ params }: { params: { id: string } }) {
  return <EditProductPage productId={params.id} />
}
