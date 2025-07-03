"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download, Printer, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface OrderSummaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: any
}

export function OrderSummaryModal({ open, onOpenChange, order }: OrderSummaryModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const printRef = useRef<HTMLDivElement>(null)

  if (!order) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  const numberToWords = (num: number): string => {
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

    if (num === 0) return "Zero"
    if (num < 20) return ones[num]
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "")
    if (num < 1000)
      return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " " + numberToWords(num % 100) : "")
    if (num < 1000000)
      return (
        numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "")
      )

    return num.toString()
  }

  // Calculate correct grand total
  const merchandiseSubtotal = order.subtotal || 0
  const shippingFee = order.shipping_fee || 0
  const taxAmount = order.tax_amount || 0
  const discountAmount = order.discount_amount || 0
  const grandTotal = merchandiseSubtotal + shippingFee + taxAmount - discountAmount

  const handlePrint = () => {
    if (!printRef.current) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Summary - ${order.order_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 12px; 
              line-height: 1.4; 
              color: #000;
              padding: 20px;
            }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 18px; margin-bottom: 5px; }
            .info-section { margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
            .info-item { margin-bottom: 8px; }
            .info-label { font-weight: bold; margin-bottom: 2px; }
            .info-value { margin-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals-section { margin-top: 20px; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .grand-total { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 5px; }
            .amount-words { margin-top: 15px; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ORDER SUMMARY</h1>
            <p>Order #${order.order_number}</p>
          </div>

          <div class="info-grid">
            <div>
              <div class="info-item">
                <div class="info-label">Seller Name:</div>
                <div class="info-value">${order.seller_name || "N/A"}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Seller Address:</div>
                <div class="info-value">${order.seller_address || "N/A"}</div>
              </div>
            </div>
            <div>
              <div class="info-item">
                <div class="info-label">Buyer Name:</div>
                <div class="info-value">${order.customer_name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Buyer Address:</div>
                <div class="info-value">
                  ${order.shipping_address?.street || ""}<br>
                  ${order.shipping_address?.city || ""}, ${order.shipping_address?.province || ""}
                </div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <div class="info-item">
              <div class="info-label">Order Id:</div>
              <div class="info-value">${order.order_number}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date Issued:</div>
              <div class="info-value">${formatDate(order.created_at)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Order Paid Date:</div>
              <div class="info-value">${formatDate(order.updated_at)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Payment Method:</div>
              <div class="info-value">${order.payment_method || "N/A"}</div>
            </div>
          </div>

          <h3>Order Details</h3>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Product</th>
                <th>Variation</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                order.items
                  ?.map(
                    (item: any, index: number) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${item.product_name}</td>
                  <td>${item.variation_data?.name || item.variation_name || "N/A"}</td>
                  <td class="text-right">${formatCurrency(item.unit_price)}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.total_price)}</td>
                </tr>
              `,
                  )
                  .join("") || ""
              }
              <tr>
                <td colspan="4" class="text-right"><strong>Subtotal</strong></td>
                <td class="text-center">${order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}</td>
                <td class="text-right"><strong>${formatCurrency(merchandiseSubtotal)}</strong></td>
              </tr>
              <tr>
                <td colspan="5" class="text-right"><strong>Total Quantity</strong></td>
                <td class="text-right">${order.items?.length || 0} items</td>
              </tr>
            </tbody>
          </table>

          <div class="totals-section">
            <div class="total-row">
              <span><strong>Merchandise Subtotal</strong></span>
              <span><strong>${formatCurrency(merchandiseSubtotal)}</strong></span>
            </div>
            <div class="total-row">
              <span><strong>Shipping Fee</strong></span>
              <span><strong>${formatCurrency(shippingFee)}</strong></span>
            </div>
            ${
              taxAmount > 0
                ? `
              <div class="total-row">
                <span><strong>Tax</strong></span>
                <span><strong>${formatCurrency(taxAmount)}</strong></span>
              </div>
            `
                : ""
            }
            ${
              discountAmount > 0
                ? `
              <div class="total-row">
                <span><strong>Discount</strong></span>
                <span><strong>-${formatCurrency(discountAmount)}</strong></span>
              </div>
            `
                : ""
            }
            <div class="total-row grand-total">
              <span><strong>Grand Total</strong></span>
              <span><strong>${formatCurrency(grandTotal)}</strong></span>
            </div>
          </div>

          <div class="amount-words">
            <strong>Total amount in words</strong><br>
            ${numberToWords(Math.floor(grandTotal))} Peso${grandTotal % 1 !== 0 ? ` and ${Math.round((grandTotal % 1) * 100)} Centavos` : ""}
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()

    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return

    setIsDownloading(true)
    try {
      // Create a temporary container for PDF generation
      const tempContainer = document.createElement("div")
      tempContainer.style.position = "absolute"
      tempContainer.style.left = "-9999px"
      tempContainer.style.top = "0"
      tempContainer.style.width = "210mm" // A4 width
      tempContainer.style.backgroundColor = "white"
      tempContainer.style.padding = "15mm"
      tempContainer.style.fontFamily = "Arial, sans-serif"
      tempContainer.style.fontSize = "11px"
      tempContainer.style.lineHeight = "1.4"
      tempContainer.style.color = "#000"

      tempContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 18px; margin-bottom: 5px; font-weight: bold;">ORDER SUMMARY</h1>
          <p style="font-size: 12px;">Order #${order.order_number}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
          <div>
            <div style="margin-bottom: 8px;">
              <div style="font-weight: bold; margin-bottom: 2px;">Seller Name:</div>
              <div style="margin-left: 10px;">${order.seller_name || "N/A"}</div>
            </div>
            <div style="margin-bottom: 8px;">
              <div style="font-weight: bold; margin-bottom: 2px;">Seller Address:</div>
              <div style="margin-left: 10px;">${order.seller_address || "N/A"}</div>
            </div>
          </div>
          <div>
            <div style="margin-bottom: 8px;">
              <div style="font-weight: bold; margin-bottom: 2px;">Buyer Name:</div>
              <div style="margin-left: 10px;">${order.customer_name}</div>
            </div>
            <div style="margin-bottom: 8px;">
              <div style="font-weight: bold; margin-bottom: 2px;">Buyer Address:</div>
              <div style="margin-left: 10px;">
                ${order.shipping_address?.street || ""}<br>
                ${order.shipping_address?.city || ""}, ${order.shipping_address?.province || ""}
              </div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 15px;">
          <div style="margin-bottom: 8px;">
            <span style="font-weight: bold;">Order Id:</span>
            <span style="margin-left: 10px;">${order.order_number}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="font-weight: bold;">Date Issued:</span>
            <span style="margin-left: 10px;">${formatDate(order.created_at)}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="font-weight: bold;">Order Paid Date:</span>
            <span style="margin-left: 10px;">${formatDate(order.updated_at)}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="font-weight: bold;">Payment Method:</span>
            <span style="margin-left: 10px;">${order.payment_method || "N/A"}</span>
          </div>
        </div>

        <h3 style="margin: 15px 0 10px 0; font-size: 14px;">Order Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #000; padding: 6px; text-align: center;">No.</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: left;">Product</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: left;">Variation</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: right;">Price</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: center;">Qty</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              order.items
                ?.map(
                  (item: any, index: number) => `
              <tr>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #000; padding: 6px;">${item.product_name}</td>
                <td style="border: 1px solid #000; padding: 6px;">${item.variation_data?.name || item.variation_name || "N/A"}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatCurrency(item.unit_price)}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${item.quantity}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatCurrency(item.total_price)}</td>
              </tr>
            `,
                )
                .join("") || ""
            }
            <tr>
              <td colspan="4" style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">Subtotal</td>
              <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}</td>
              <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${formatCurrency(merchandiseSubtotal)}</td>
            </tr>
            <tr>
              <td colspan="5" style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">Total Quantity</td>
              <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${order.items?.length || 0} items</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 20px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span style="font-weight: bold;">Merchandise Subtotal</span>
            <span style="font-weight: bold;">${formatCurrency(merchandiseSubtotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span style="font-weight: bold;">Shipping Fee</span>
            <span style="font-weight: bold;">${formatCurrency(shippingFee)}</span>
          </div>
          ${
            taxAmount > 0
              ? `
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span style="font-weight: bold;">Tax</span>
              <span style="font-weight: bold;">${formatCurrency(taxAmount)}</span>
            </div>
          `
              : ""
          }
          ${
            discountAmount > 0
              ? `
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span style="font-weight: bold;">Discount</span>
              <span style="font-weight: bold;">-${formatCurrency(discountAmount)}</span>
            </div>
          `
              : ""
          }
          <div style="display: flex; justify-content: space-between; margin: 5px 0; font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 5px;">
            <span>Grand Total</span>
            <span>${formatCurrency(grandTotal)}</span>
          </div>
        </div>

        <div style="margin-top: 15px; font-style: italic;">
          <strong>Total amount in words</strong><br>
          ${numberToWords(Math.floor(grandTotal))} Peso${grandTotal % 1 !== 0 ? ` and ${Math.round((grandTotal % 1) * 100)} Centavos` : ""}
        </div>
      `

      document.body.appendChild(tempContainer)

      // Generate canvas from the temporary container
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: tempContainer.offsetWidth,
        height: tempContainer.offsetHeight,
      })

      document.body.removeChild(tempContainer)

      // Create PDF
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")

      const pdfWidth = 210 // A4 width in mm
      const pdfHeight = 297 // A4 height in mm
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // If content is taller than page, scale it down
      if (imgHeight > pdfHeight) {
        const scaleFactor = pdfHeight / imgHeight
        const scaledWidth = imgWidth * scaleFactor
        const scaledHeight = pdfHeight
        const xOffset = (pdfWidth - scaledWidth) / 2

        pdf.addImage(imgData, "PNG", xOffset, 0, scaledWidth, scaledHeight)
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      }

      pdf.save(`order-summary-${order.order_number}.pdf`)

      toast({
        title: "PDF Downloaded",
        description: "Order summary has been downloaded successfully",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <div className="sticky top-0 bg-white z-10 border-b pb-4">
          <DialogHeader className="relative">
            <DialogTitle className="text-lg sm:text-xl font-bold text-center pr-8">Order Summary</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="absolute right-0 top-0 h-6 w-6 p-0 print-hide"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {/* Action Buttons - Desktop */}
          <div className="hidden sm:flex justify-center space-x-3 mt-4 print-hide">
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 bg-transparent"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 bg-transparent"
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>{isDownloading ? "Generating..." : "Download PDF"}</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div ref={contentRef} className="p-4 sm:p-6 space-y-4 sm:space-y-6 print:p-0">
            {/* Order Header */}
            <div className="text-center border-b pb-4 print:border-b-2 print:border-black">
              <h2 className="text-xl sm:text-2xl font-bold">ORDER SUMMARY</h2>
              <p className="text-sm sm:text-base text-gray-600 print:text-black">Order #{order.order_number}</p>
            </div>

            {/* Seller and Buyer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm">
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="font-semibold">Seller Name:</p>
                  <p className="break-words">{order.seller_name || "N/A"}</p>
                </div>
                <div>
                  <p className="font-semibold">Seller Address:</p>
                  <p className="break-words">{order.seller_address || "N/A"}</p>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="font-semibold">Buyer Name:</p>
                  <p className="break-words">{order.customer_name}</p>
                </div>
                <div>
                  <p className="font-semibold">Buyer Address:</p>
                  <p className="break-words">
                    {order.shipping_address?.street}
                    <br />
                    {order.shipping_address?.city}, {order.shipping_address?.province}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="font-semibold">Order Id:</span>
                <span className="ml-2 break-all">{order.order_number}</span>
              </div>
              <div>
                <span className="font-semibold">Date Issued:</span>
                <span className="ml-2">{formatDate(order.created_at)}</span>
              </div>
              <div>
                <span className="font-semibold">Order Paid Date:</span>
                <span className="ml-2">{formatDate(order.updated_at)}</span>
              </div>
              <div>
                <span className="font-semibold">Payment Method:</span>
                <span className="ml-2">{order.payment_method || "N/A"}</span>
              </div>
            </div>

            {/* Order Details Table */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3">Order Details</h3>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 print:border-black text-xs">
                  <thead>
                    <tr className="bg-gray-50 print:bg-gray-200">
                      <th className="border border-gray-300 print:border-black p-2 text-center">No.</th>
                      <th className="border border-gray-300 print:border-black p-2 text-left">Product</th>
                      <th className="border border-gray-300 print:border-black p-2 text-left">Variation</th>
                      <th className="border border-gray-300 print:border-black p-2 text-right">Price</th>
                      <th className="border border-gray-300 print:border-black p-2 text-center">Qty</th>
                      <th className="border border-gray-300 print:border-black p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="border border-gray-300 print:border-black p-2 text-center">{index + 1}</td>
                        <td className="border border-gray-300 print:border-black p-2 break-words">
                          {item.product_name}
                        </td>
                        <td className="border border-gray-300 print:border-black p-2 break-words">
                          {item.variation_data?.name || item.variation_name || "N/A"}
                        </td>
                        <td className="border border-gray-300 print:border-black p-2 text-right">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="border border-gray-300 print:border-black p-2 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 print:border-black p-2 text-right">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 print:bg-gray-200">
                      <td
                        colSpan={4}
                        className="border border-gray-300 print:border-black p-2 text-right font-semibold"
                      >
                        Subtotal
                      </td>
                      <td className="border border-gray-300 print:border-black p-2 text-center font-semibold">
                        {order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}
                      </td>
                      <td className="border border-gray-300 print:border-black p-2 text-right font-semibold">
                        {formatCurrency(merchandiseSubtotal)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={5}
                        className="border border-gray-300 print:border-black p-2 text-right font-semibold"
                      >
                        Total Quantity
                      </td>
                      <td className="border border-gray-300 print:border-black p-2 text-right font-semibold">
                        {order.items?.length || 0} items
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="border border-gray-300 rounded p-3 text-xs">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold">#{index + 1}</span>
                      <span className="font-semibold">{formatCurrency(item.total_price)}</span>
                    </div>
                    <div className="space-y-1">
                      <p>
                        <span className="font-medium">Product:</span> {item.product_name}
                      </p>
                      <p>
                        <span className="font-medium">Variation:</span>{" "}
                        {item.variation_data?.name || item.variation_name || "N/A"}
                      </p>
                      <div className="flex justify-between">
                        <span>
                          <span className="font-medium">Price:</span> {formatCurrency(item.unit_price)}
                        </span>
                        <span>
                          <span className="font-medium">Qty:</span> {item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t-2 border-gray-300 pt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold">
                      Subtotal ({order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0} items):
                    </span>
                    <span className="font-semibold">{formatCurrency(merchandiseSubtotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Totals Section */}
            <div className="space-y-2 text-sm sm:text-base">
              <div className="flex justify-between">
                <span className="font-semibold">Merchandise Subtotal</span>
                <span className="font-semibold">{formatCurrency(merchandiseSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Shipping Fee</span>
                <span className="font-semibold">{formatCurrency(shippingFee)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="font-semibold">Tax</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="font-semibold">Discount</span>
                  <span className="font-semibold text-green-600">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t-2 border-gray-300 print:border-black pt-2">
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Amount in Words */}
            <div className="text-xs sm:text-sm italic">
              <p className="font-semibold">Total amount in words</p>
              <p>
                {numberToWords(Math.floor(grandTotal))} Peso
                {grandTotal % 1 !== 0 ? ` and ${Math.round((grandTotal % 1) * 100)} Centavos` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="sm:hidden flex space-x-2 p-4 border-t print-hide">
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="flex-1 flex items-center justify-center space-x-2 bg-transparent"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            variant="outline"
            size="sm"
            className="flex-1 flex items-center justify-center space-x-2 bg-transparent"
          >
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>{isDownloading ? "Generating..." : "Download PDF"}</span>
          </Button>
        </div>

        {/* Hidden Print Content */}
        <div ref={printRef} className="hidden">
          {/* This will be used for print functionality */}
        </div>
      </DialogContent>
    </Dialog>
  )
}
