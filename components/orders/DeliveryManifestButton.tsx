"use client";

import React from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderItem {
  productName: string;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber?: string;
  items: OrderItem[];
  paymentMethod?: string;
  total: number;
  guestPhone?: string;
  delivery?: {
    pickupWarehouse?: {
      label?: string;
      city?: string;
      state?: string;
    };
  };
}

interface Address {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface DeliveryManifestButtonProps {
  order: Order;
  address: Address;
}

export default function DeliveryManifestButton({ order, address }: DeliveryManifestButtonProps) {
  const generateManifest = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({
        unit: "mm",
        format: "a5", // Using A5 for a more "label" like feel
      });

      const orderId = order.id.slice(-8).toUpperCase();
      const primaryColor = "#f97316"; 
      const darkColor = "#1e293b";

      // --- Privacy Masking Helpers ---
      const maskName = (first?: string, last?: string) => {
        if (!first) return "Valued Customer";
        const lastInitial = last ? ` ${last[0]}.` : "";
        return `${first}${lastInitial}`;
      };



      // --- 1. Header Section ---
      doc.setFillColor(darkColor);
      doc.rect(0, 0, 148, 25, "F"); // Header background

      doc.setTextColor("#ffffff");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("DELIVERY MANIFEST", 10, 16);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("Logistics Copy • Privacy Protected", 10, 21);

      // --- 2. Tracking / Order ID Section ---
      doc.setTextColor(darkColor);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("SHIPPING REFERENCE", 10, 35);
      
      doc.setFontSize(14);
      doc.setTextColor(primaryColor);
      const trackingRef = order.orderNumber || `ST-${order.id.slice(-10).toUpperCase()}`;
      doc.text(trackingRef, 10, 42);

      // --- 3. Delivery & Dispatch Addresses (Privacy Focused) ---
      
      // DISPATCH (Pickup)
      const pickup = order.delivery?.pickupWarehouse || {};
      doc.setDrawColor("#e2e8f0");
      doc.line(10, 48, 138, 48);

      doc.setTextColor(darkColor);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("DISPATCH FROM", 10, 55);
      doc.setFont("helvetica", "normal");
      
      const dispatchName = pickup.label || "STOND CENTRAL HUB";
      doc.text(dispatchName.toUpperCase(), 10, 60);
      
      doc.setFontSize(8);
      doc.setTextColor("#64748b");
      if (pickup.city && pickup.state) {
        doc.text(`${pickup.city}, ${pickup.state}`, 10, 64);
      } else {
        doc.text("Returns & Support: operations@stondemporium.tech", 10, 64);
      }

      // RECEIPIENT (Deliver To)
      doc.setTextColor(darkColor);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("DELIVER TO", 75, 55);
      doc.setFont("helvetica", "normal");
      doc.text(maskName(address?.firstName, address?.lastName), 75, 60);
      doc.text(`Phone (Delivery Only): ${address?.phone || order.guestPhone || 'N/A'}`, 75, 64);
      
      // Full Address (Essential for courier)
      doc.setFontSize(8);
      const fullAddressParts = [
        address?.address,
        address?.apartment,
        `${address?.city}, ${address?.state} - ${address?.postalCode}`
      ].filter(Boolean);
      
      let currentY = 69;
      fullAddressParts.forEach(part => {
        const splitText = doc.splitTextToSize(part || '', 60);
        doc.text(splitText, 75, currentY);
        currentY += (splitText.length * 4);
      });

      // --- 4. Product Info (Vague/Generic) ---
      const tableData = order.items.map((item: OrderItem) => [
        "PARCEL ITEM", // Generic description
        item.quantity
      ]);

      const tableStartY = Math.max(currentY + 5, 85);
      autoTable(doc, {
        startY: tableStartY,
        margin: { left: 10, right: 10 },
        head: [['Shipment Contents', 'Qty']],
        body: tableData,
        theme: 'plain',
        headStyles: { 
            fillColor: "#f8fafc", 
            textColor: darkColor, 
            fontStyle: 'bold', 
            fontSize: 9,
            lineWidth: 0.1,
            lineColor: "#e2e8f0"
        },
        styles: { 
            fontSize: 8, 
            textColor: "#475569",
            cellPadding: 4
        },
        columnStyles: {
            1: { halign: 'center' }
        }
      });

      // --- 5. Payment / Logistics Info ---
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setDrawColor("#e2e8f0");
      doc.rect(10, finalY, 128, 15);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      if (order.paymentMethod?.toLowerCase() === 'cod') {
        doc.setTextColor("#ef4444");
        doc.text("COLLECT CASH ON DELIVERY (COD)", 15, finalY + 6);
        doc.setFontSize(12);
        doc.text(`INR ${order.total.toLocaleString("en-IN")}`, 15, finalY + 12);
      } else {
        doc.setTextColor("#10b981");
        doc.text("PREPAID ORDER - DO NOT COLLECT CASH", 15, finalY + 9);
      }

      // --- 6. Footer ---
      doc.setTextColor("#94a3b8");
      doc.setFontSize(7);
      doc.text("This manifest contains minimal information for delivery purposes only.", 10, 195);
      doc.text("SCAN QR ON HUB FOR RETURNS & SUPPORT • STOND OPS NODE", 10, 200);

      doc.save(`DELIVERY-${orderId}.pdf`);
    } catch (error) {
      console.error("Manifest Generation Error:", error);
      alert("Failed to generate delivery manifest.");
    }
  };

  return (
    <Button 
      onClick={generateManifest}
      variant="outline"
      className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold h-11 px-6 shadow-sm flex items-center gap-2"
    >
      <Package className="h-4 w-4" />
      Delivery Invoice
    </Button>
  );
}
