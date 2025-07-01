"use client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2, Package } from "lucide-react"

interface ProductToDelete {
  id: string
  name: string
  sku: string
}

interface DeleteProductDialogProps {
  product: ProductToDelete | null
  isOpen: boolean
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteProductDialog({ product, isOpen, isDeleting, onConfirm, onCancel }: DeleteProductDialogProps) {
  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">Delete Product</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                This will mark the product as deleted and remove it from your active inventory.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-start space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this product? This will remove it from your active inventory and it will
              no longer be visible to customers. The product data will be preserved in the database for record-keeping
              purposes.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Delete Product
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
