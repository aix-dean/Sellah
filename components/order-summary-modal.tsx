"use client"
import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, PrinterIcon as Print, X } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useToast } from "@/hooks/use-toast"

interface OrderSummaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
  userData?: any
  companyData?: any
}

export function OrderSummaryModal({ open, onOpenChange, order, userData, companyData }: OrderSummaryModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

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

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Summary - ${order.order_number}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-section {
              border: 1px solid #ccc;
              padding: 10px;
            }
            .info-title {
              font-weight: bold;
              margin-bottom: 5px;
              text-decoration: underline;
            }
            .order-info {
              margin-bottom: 20px;
            }
            .order-info div {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .summary {
              float: right;
              width: 300px;
              margin-bottom: 20px;
            }
            .summary div {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              padding: 3px 0;
            }
            .grand-total {
              border-top: 2px solid #000;
              font-weight: bold;
              font-size: 14px;
            }
            .words {
              clear: both;
              text-align: center;
              margin-top: 20px;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; padding: 15px; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handleDownloadPdf = async () => {
    if (!contentRef.current) {
      toast({
        title: "Error",
        description: "Could not capture content for PDF. Please try again.",
        variant: "destructive",
      })
      return
    }

    setIsDownloading(true)
    try {
      // Create a temporary container for PDF generation
      const tempContainer = document.createElement("div")
      tempContainer.style.position = "absolute"
      tempContainer.style.left = "-9999px"
      tempContainer.style.top = "0"
      tempContainer.style.width = "210mm"
      tempContainer.style.backgroundColor = "white"
      tempContainer.style.padding = "15mm"
      tempContainer.style.fontFamily = "Arial, sans-serif"
      tempContainer.style.fontSize = "11px"
      tempContainer.style.lineHeight = "1.3"
      tempContainer.style.color = "#000"

      // Clone and optimize content for PDF
      const clonedContent = contentRef.current.cloneNode(true) as HTMLElement

      // Apply PDF-specific styles
      const style = document.createElement("style")
      style.textContent = `
        .pdf-container * {
          font-size: 11px !important;
          line-height: 1.3 !important;
        }
        .pdf-container h3 {
          font-size: 13px !important;
          margin-bottom: 5px !important;
        }
        .pdf-container .space-y-4 > * + * {
          margin-top: 8px !important;
        }
        .pdf-container .space-y-6 > * + * {
          margin-top: 12px !important;
        }
        .pdf-container .bg-gray-50 {
          background-color: #f8f9fa !important;
          border: 1px solid #dee2e6 !important;
          padding: 8px !important;
        }
        .pdf-container table {
          font-size: 10px !important;
        }
        .pdf-container th, .pdf-container td {
          padding: 4px !important;
        }
        .pdf-container .grid {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 15px !important;
        }
      `

      clonedContent.className = "pdf-container"
      tempContainer.appendChild(style)
      tempContainer.appendChild(clonedContent)
      document.body.appendChild(tempContainer)

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 794, // A4 width at 96 DPI
        logging: false,
      })

      document.body.removeChild(tempContainer)

      const imgData = canvas.toDataURL("image/png", 1.0)
      const pdf = new jsPDF("p", "mm", "a4")

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Calculate dimensions to use most of the page
      const imgWidth = pdfWidth - 20 // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const yPosition = 10 // Start 10mm from top

      if (imgHeight <= pdfHeight - 20) {
        // Content fits on one page
        pdf.addImage(imgData, "PNG", 10, yPosition, imgWidth, imgHeight)
      } else {
        // Content needs to be scaled down to fit on one page
        const scaledHeight = pdfHeight - 20
        const scaledWidth = (canvas.width * scaledHeight) / canvas.height
        const xPosition = (pdfWidth - scaledWidth) / 2

        pdf.addImage(imgData, "PNG", xPosition, yPosition, scaledWidth, scaledHeight)
      }

      pdf.save(`Order_Summary_${order.order_number || order.id}.pdf`)

      toast({
        title: "Success",
        description: "Order summary downloaded successfully!",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-none sm:max-w-[90vw] md:max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        {/* Fixed Header with Close Button */}
        <DialogHeader className="sticky top-0 z-10 bg-white border-b p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-bold">Order Summary</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center space-x-1 bg-transparent"
                onClick={handlePrint}
              >
                <Print className="w-4 h-4" />
                <span>Print</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center space-x-1 bg-transparent"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? "Downloading..." : "Download"}</span>
              </Button>
              <Button variant="ghost" size="sm" className="p-2" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex sm:hidden space-x-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 flex items-center justify-center space-x-1 bg-transparent"
              onClick={handlePrint}
            >
              <Print className="w-4 h-4" />
              <span>Print</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 flex items-center justify-center space-x-1 bg-transparent"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? "Downloading..." : "Download"}</span>
            </Button>
          </div>
        </DialogHeader>

        <div ref={contentRef} className="p-4 sm:p-6 bg-white">
          {/* Header Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Left Column - Seller & Buyer Info */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Seller Name:</h3>
                <p className="text-xs sm:text-sm text-gray-700">{sellerName}</p>
                <h3 className="font-semibold text-gray-900 mt-3 mb-2 text-sm sm:text-base">Seller Address:</h3>
                <p className="text-xs sm:text-sm text-gray-700">{getSellerAddress()}</p>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Buyer Name:</h3>
                <p className="text-xs sm:text-sm text-gray-700">{order.customer_name}</p>
                <h3 className="font-semibold text-gray-900 mt-3 mb-2 text-sm sm:text-base">Buyer Address:</h3>
                <p className="text-xs sm:text-sm text-gray-700">
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
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-semibold text-gray-900 text-sm sm:text-base">Order Summary No.:</span>
                <span className="text-xs sm:text-sm text-gray-700">{order.order_number}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-semibold text-gray-900 text-sm sm:text-base">Date Issued:</span>
                <span className="text-xs sm:text-sm text-gray-700">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-semibold text-gray-900 text-sm sm:text-base">Order ID:</span>
                <span className="text-xs sm:text-sm text-gray-700">{order.id.substring(0, 15).toUpperCase()}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-semibold text-gray-900 text-sm sm:text-base">Order Paid Date:</span>
                <span className="text-xs sm:text-sm text-gray-700">{formatDate(order.updated_at)}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-semibold text-gray-900 text-sm sm:text-base">Payment Method:</span>
                <span className="text-xs sm:text-sm text-gray-700 capitalize">
                  {order.payment_method ? order.payment_method.replace("_", " ") : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Order Details Table */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-4 text-sm sm:text-base">Order Details</h3>
            <div className="w-full overflow-hidden">
              <div className="min-w-full">
                <table className="w-full border-collapse border border-gray-300 text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-1 sm:px-3 py-2 text-left font-semibold">No.</th>
                      <th className="border border-gray-300 px-1 sm:px-3 py-2 text-left font-semibold">Product</th>
                      <th className="border border-gray-300 px-1 sm:px-3 py-2 text-left font-semibold hidden sm:table-cell">
                        Variation
                      </th>
                      <th className="border border-gray-300 px-1 sm:px-3 py-2 text-right font-semibold">Price</th>
                      <th className="border border-gray-300 px-1 sm:px-3 py-2 text-center font-semibold">Qty</th>
                      <th className="border border-gray-300 px-1 sm:px-3 py-2 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-1 sm:px-3 py-2">{index + 1}</td>
                        <td className="border border-gray-300 px-1 sm:px-3 py-2">
                          <div className="break-words">
                            {item.product_name}
                            <div className="sm:hidden text-xs text-gray-500 mt-1">
                              {item.variation_data?.name || item.variation_name || "-"}
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-1 sm:px-3 py-2 hidden sm:table-cell">
                          {item.variation_data?.name || item.variation_name || "-"}
                        </td>
                        <td className="border border-gray-300 px-1 sm:px-3 py-2 text-right">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="border border-gray-300 px-1 sm:px-3 py-2 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 px-1 sm:px-3 py-2 text-right">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                    {/* Subtotal Row */}
                    <tr className="bg-gray-50">
                      <td
                        colSpan={3}
                        className="border border-gray-300 px-1 sm:px-3 py-2 font-semibold text-right sm:table-cell"
                      >
                        <span className="hidden sm:inline">Subtotal</span>
                        <span className="sm:hidden">Sub</span>
                      </td>
                      <td className="border border-gray-300 px-1 sm:px-3 py-2 font-semibold text-center hidden sm:table-cell">
                        {totalQuantity}
                      </td>
                      <td className="border border-gray-300 px-1 sm:px-3 py-2 font-semibold text-center sm:hidden">
                        {totalQuantity}
                      </td>
                      <td className="border border-gray-300 px-1 sm:px-3 py-2 font-semibold text-right">
                        {formatCurrency(order.subtotal)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={4}
                        className="border border-gray-300 px-1 sm:px-3 py-2 font-semibold text-right sm:table-cell"
                      >
                        <span className="hidden sm:inline">Total Quantity</span>
                        <span className="sm:hidden">Total Qty</span>
                      </td>
                      <td className="border border-gray-300 px-1 sm:px-3 py-2 font-semibold text-center hidden sm:table-cell"></td>
                      <td className="border border-gray-300 px-1 sm:px-3 py-2 font-semibold text-right">
                        {totalQuantity} items
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Final Summary */}
          <div className="flex justify-end mb-6">
            <div className="w-full sm:w-auto sm:max-w-sm space-y-2">
              <div className="flex justify-between py-1">
                <span className="font-semibold text-sm sm:text-base">Merchandise Subtotal</span>
                <span className="font-semibold text-sm sm:text-base">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-sm sm:text-base">Shipping Fee</span>
                <span className="font-semibold text-sm sm:text-base">{formatCurrency(order.shipping_fee)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2">
                <div className="flex justify-between py-1">
                  <span className="font-bold text-base sm:text-lg">Grand Total</span>
                  <span className="font-bold text-base sm:text-lg">
                    {formatCurrency(order.subtotal + (order.shipping_fee || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total in Words */}
          <div className="text-center pt-4 border-t border-gray-300">
            <p className="font-semibold text-sm sm:text-base">Total amount in words</p>
            <p className="text-xs sm:text-sm text-gray-700 mt-1 break-words">
              {numberToWords(Math.floor(order.subtotal + (order.shipping_fee || 0)))}
            </p>
          </div>
        </div>

        {/* Hidden Print Content */}
        <div ref={printRef} style={{ display: "none" }}>
          <div className="header">
            <h1>ORDER SUMMARY</h1>
            <p>Order No: {order.order_number}</p>
          </div>

          <div className="info-grid">
            <div className="info-section">
              <div className="info-title">Seller Information</div>
              <div>
                <strong>Name:</strong> {sellerName}
              </div>
              <div>
                <strong>Address:</strong>
              </div>
              <div>{getSellerAddress()}</div>
            </div>

            <div className="info-section">
              <div className="info-title">Buyer Information</div>
              <div>
                <strong>Name:</strong> {order.customer_name}
              </div>
              <div>
                <strong>Address:</strong>
              </div>
              <div>
                {order.is_pickup ? (
                  <>
                    {order.pickup_info?.pickup_location && <div>{order.pickup_info.pickup_location}</div>}
                    {order.pickup_info?.pickup_address && <div>{order.pickup_info.pickup_address}</div>}
                  </>
                ) : (
                  <>
                    <div>{order.shipping_address.street}</div>
                    {order.shipping_address.barangay && <div>{order.shipping_address.barangay}</div>}
                    <div>
                      {order.shipping_address.city}, {order.shipping_address.province}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="order-info">
            <div>
              <span>
                <strong>Date Issued:</strong>
              </span>{" "}
              <span>{formatDate(order.created_at)}</span>
            </div>
            <div>
              <span>
                <strong>Order ID:</strong>
              </span>{" "}
              <span>{order.id.substring(0, 15).toUpperCase()}</span>
            </div>
            <div>
              <span>
                <strong>Order Paid Date:</strong>
              </span>{" "}
              <span>{formatDate(order.updated_at)}</span>
            </div>
            <div>
              <span>
                <strong>Payment Method:</strong>
              </span>{" "}
              <span>{order.payment_method ? order.payment_method.replace("_", " ") : "N/A"}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Product</th>
                <th>Variation</th>
                <th className="text-right">Price</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any, index: number) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.product_name}</td>
                  <td>{item.variation_data?.name || item.variation_name || "-"}</td>
                  <td className="text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <td colSpan={4} className="text-right">
                  <strong>Subtotal</strong>
                </td>
                <td className="text-center">
                  <strong>{totalQuantity}</strong>
                </td>
                <td className="text-right">
                  <strong>{formatCurrency(order.subtotal)}</strong>
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="text-right">
                  <strong>Total Quantity</strong>
                </td>
                <td className="text-right">
                  <strong>{totalQuantity} items</strong>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="summary">
            <div>
              <span>Merchandise Subtotal:</span> <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div>
              <span>Shipping Fee:</span> <span>{formatCurrency(order.shipping_fee)}</span>
            </div>
            <div className="grand-total">
              <span>Grand Total:</span> <span>{formatCurrency(order.subtotal + (order.shipping_fee || 0))}</span>
            </div>
          </div>

          <div className="words">
            <strong>Total amount in words:</strong>
            <br />
            {numberToWords(Math.floor(order.subtotal + (order.shipping_fee || 0)))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
