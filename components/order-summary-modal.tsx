"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, PrinterIcon as Print } from "lucide-react"

interface OrderSummaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
  userData?: any
  companyData?: any
}

export function OrderSummaryModal({ open, onOpenChange, order, userData, companyData }: OrderSummaryModalProps) {
  if (!order) return null

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      return "N/A"
    }
  }

  const formatCurrency = (amount: number) => {
    return `₱${amount.toFixed(2)}`
  }

  const numberToWords = (num: number) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ]

    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    const scales = ["", "Thousand", "Million", "Billion"]

    if (num === 0) return "Zero"

    const convertHundreds = (n: number): string => {
      let result = ""

      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + " Hundred "
        n %= 100
      }

      if (n >= 20) {
        result += tens[Math.floor(n / 10)]
        if (n % 10 !== 0) {
          result += "-" + ones[n % 10]
        }
      } else if (n > 0) {
        result += ones[n]
      }

      return result.trim()
    }

    const parts = []
    let scaleIndex = 0

    while (num > 0) {
      const chunk = num % 1000
      if (chunk !== 0) {
        const chunkWords = convertHundreds(chunk)
        if (scaleIndex > 0) {
          parts.unshift(chunkWords + " " + scales[scaleIndex])
        } else {
          parts.unshift(chunkWords)
        }
      }
      num = Math.floor(num / 1000)
      scaleIndex++
    }

    return parts.join(" ") + " Peso"
  }

  const totalQuantity = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)

  // Get seller name from user data
  const sellerName = userData?.display_name || userData?.first_name + " " + userData?.last_name || "VRC Store"

  // Get seller address from company data
  const getSellerAddress = () => {
    if (companyData?.address) {
      const addr = companyData.address
      return (
        <>
          {addr.street && (
            <>
              {addr.street}
              <br />
            </>
          )}
          {addr.city && addr.province && (
            <>
              {addr.city}, {addr.province}
              <br />
            </>
          )}
          {addr.postal_code && <>{addr.postal_code}</>}
        </>
      )
    }

    // Fallback address
    return (
      <>
        BLK16 A LOT50 PH3 E1
        <br />
        LANGARAY ST. PADAS ALLEY DAGAT-DAGATAN
        <br />
        Barangay 12, Caloocan City Metro Manila, Metro
        <br />
        Manila 1400
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-xl font-bold">Order Summary</DialogTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <Print className="w-4 h-4" />
              <span>Print</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center space-x-1">
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6 bg-white">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Seller & Buyer Info */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Seller Name:</h3>
                <p className="text-sm text-gray-700">{sellerName}</p>
                <h3 className="font-semibold text-gray-900 mt-3 mb-2">Seller Address:</h3>
                <p className="text-sm text-gray-700">{getSellerAddress()}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Buyer Name:</h3>
                <p className="text-sm text-gray-700">{order.customer_name}</p>
                <h3 className="font-semibold text-gray-900 mt-3 mb-2">Buyer Address:</h3>
                <p className="text-sm text-gray-700">
                  {order.is_pickup ? (
                    // Pickup Information
                    <>
                      {order.pickup_info?.pickup_location && (
                        <span>
                          {order.pickup_info.pickup_location}
                          <br />
                        </span>
                      )}
                      {order.pickup_info?.pickup_address && <span>{order.pickup_info.pickup_address}</span>}
                    </>
                  ) : (
                    // Shipping Address
                    <>
                      {order.shipping_address.street}
                      <br />
                      {order.shipping_address.barangay && (
                        <span>
                          {order.shipping_address.barangay}
                          <br />
                        </span>
                      )}
                      {order.shipping_address.city}, {order.shipping_address.province}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Right Column - Order Info */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Order Summary No.:</span>
                <span className="text-sm text-gray-700">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Date Issued:</span>
                <span className="text-sm text-gray-700">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Order ID:</span>
                <span className="text-sm text-gray-700">{order.id.substring(0, 15).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Order Paid Date:</span>
                <span className="text-sm text-gray-700">{formatDate(order.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Payment Method:</span>
                <span className="text-sm text-gray-700 capitalize">
                  {order.payment_method ? order.payment_method.replace("_", " ") : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Order Details Table */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">No.</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Product</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Variation</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Product Price</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Qty</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{index + 1}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{item.product_name}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">
                        {item.variation_data?.name || item.variation_name || "-"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-center">{item.quantity}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-right">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                  {/* Subtotal Row */}
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="border border-gray-300 px-3 py-2 text-sm font-semibold text-right">
                      Subtotal
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-center">
                      {totalQuantity}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-right">
                      {formatCurrency(order.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-3 py-2 text-sm font-semibold text-right">
                      Total Quantity
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-semibold text-right">
                      {totalQuantity} items
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Final Summary */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between py-1">
                <span className="font-semibold">Merchandise Subtotal</span>
                <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold">Shipping Fee</span>
                <span className="font-semibold">{formatCurrency(order.shipping_fee)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2">
                <div className="flex justify-between py-1">
                  <span className="font-bold text-lg">Grand Total</span>
                  <span className="font-bold text-lg">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total in Words */}
          <div className="text-center pt-4 border-t border-gray-300">
            <p className="font-semibold">Total amount in words</p>
            <p className="text-sm text-gray-700 mt-1">{numberToWords(Math.floor(order.total_amount))}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
