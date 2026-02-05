"use client";

import React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderItem {
  productName: string;
  quantity: number;
  priceAtPurchase: number;
}

interface Order {
  id: string;
  orderNumber?: string;
  orderDate?: string;
  createdAt?: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  gst: number;
  discountAmount?: number;
  discountCode?: string;
  discountSource?: string;
  total: number;
  guestPhone?: string;
}

interface Address {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface InvoiceButtonProps {
  order: Order;
  address: Address;
}

export default function InvoiceButton({ order, address }: InvoiceButtonProps) {
  const handlePrint = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const orderId = order.id.slice(-8).toUpperCase();
      
      // Branding Palette
      const primaryColor = "#f97316"; // Orange 500
      const textColor = "#1f2937"; // Gray 800

      // Add Logo
      const logoUrl = "https://res.cloudinary.com/ddyp4krsd/image/upload/v1769238624/logoston_rsgzgk.jpg";
      try {
        doc.addImage(logoUrl, "JPEG", 160, 10, 35, 35);
      } catch (err) {
        console.error("Logo failed to load", err);
      }

      // Header Info
      doc.setFontSize(22);
      doc.setTextColor(textColor);
      doc.text("INVOICE", 15, 25);
      
      doc.setFontSize(10);
      doc.text(`Order Number: ${order.orderNumber || 'N/A'}`, 15, 35);
      doc.text(`Internal ID: #${order.id}`, 15, 40);
      doc.text(`Date: ${new Date(order.orderDate || order.createdAt || Date.now()).toLocaleDateString()}`, 15, 45);

      // Shipping & Billing
      doc.setFontSize(12);
      doc.setTextColor(primaryColor);
      doc.text("CUSTOMER DETAILS", 15, 60);
      doc.setTextColor(textColor);
      doc.setFontSize(10);
      doc.text(`${address?.firstName || ''} ${address?.lastName || ''}`, 15, 67);
      doc.text(address?.address || 'Address not found', 15, 72, { maxWidth: 80 });
      doc.text(`${address?.city || ''}, ${address?.state || ''} - ${address?.postalCode || ''}`, 15, 82);
      doc.text(`Phone: ${address?.phone || order.guestPhone || 'N/A'}`, 15, 87);

      // Items Table
      const tableData = order.items.map((item: OrderItem) => [
        item.productName,
        item.quantity,
        `INR ${item.priceAtPurchase.toLocaleString()}`,
        `INR ${(item.priceAtPurchase * item.quantity).toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: 100,
        head: [['Product', 'Qty', 'Price', 'Total']],
        body: tableData,
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 9 }
      });

      // Financials
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`Subtotal: INR ${order.subtotal.toLocaleString()}`, 140, finalY);
      doc.text(`Shipping: INR ${order.shippingCost.toLocaleString()}`, 140, finalY + 5);
      doc.text(`GST: INR ${order.gst.toLocaleString()}`, 140, finalY + 10);
      
      let yOffset = 15;
      if (order.discountAmount && order.discountAmount > 0) {
        doc.setTextColor("#16a34a"); // Green color
        const sourceLabel = order.discountSource === 'seller' ? 'Seller' : 'Store';
        doc.text(
          `${sourceLabel} Discount (${order.discountCode || "Applied"}): -INR ${order.discountAmount.toLocaleString()}`,
          140,
          finalY + yOffset
        );
        doc.setTextColor(textColor); // Reset color
        yOffset += 5;
      }
      
      doc.setFontSize(12);
      doc.text(`Total amount: INR ${order.total.toLocaleString()}`, 140, finalY + yOffset + 5);

      // Signatory
      doc.setFontSize(8);
      doc.setTextColor("#9ca3af");
      doc.text("Digitally Verified by Stond Emporium Hub", 15, 280);
      doc.text(`Auth Code: ${order.id.slice(0, 10)}`, 15, 285);

      doc.save(`invoice-${orderId}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <Button 
      onClick={handlePrint}
      variant="outline"
      className="rounded-xl border-orange-100 bg-white hover:bg-orange-50 text-orange-600 font-bold h-11 px-6 shadow-sm flex items-center gap-2"
    >
      <Printer className="h-4 w-4" />
      Print Invoice
    </Button>
  );
}
