import type { CollectionConfig } from "payload"
import { getEmailTemplate, generateOrderItemRows, formatCurrency } from "@/lib/email-templates"
import { getSellersWithPermission } from "@/lib/rbac/permissions"

export const Orders: CollectionConfig = {
  slug: "orders",

  access: {
    read: async ({ req }) => {
      if (!req.user) return false;
      const user = req.user as any;
      if (user.role === "admin") return true;
      
      // Get sellers where user has order.view permission
      const allowedSellers = await getSellersWithPermission(req.payload, user.id, 'order.view');
      
      return {
        or: [
          { user: { equals: user.id } }, // Buyer: their own orders
          { seller: { in: allowedSellers } } // Seller/Team: for their organization
        ]
      } as any;
    },

    create: ({ req }) => Boolean(req.user),

    update: async ({ req }) => {
      if (!req.user) return false;
      const user = req.user as any;
      if (user.role === "admin") return true;
      
      // Get sellers where user has permission to update orders
      const allowedSellers = await getSellersWithPermission(req.payload, user.id, 'order.update_status');
      
      if (allowedSellers.length === 0) return false;

      return {
        or: [
          { seller: { in: allowedSellers } },
          { "items.seller": { in: allowedSellers } }
        ]
      } as any;
    },

    delete: ({ req }) => (req.user as any)?.role === "admin",
  },

  admin: {
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "user", "status", "total"],
  },

  fields: [
    {
      name: "orderNumber",
      type: "text",
      required: true,
      unique: true,
      defaultValue: () =>
        `ORD-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase()}`,
    },

    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      admin: { position: "sidebar", readOnly: true },
    },

    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "PENDING",
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Accepted", value: "ACCEPTED" },
        { label: "Processing", value: "PROCESSING" },
        { label: "Shipped", value: "SHIPPED" },
        { label: "Delivered", value: "DELIVERED" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
    },

    {
      name: "seller",
      type: "relationship",
      relationTo: "sellers" as any,
      required: true,
      admin: { position: "sidebar" },
    },

    {
      name: "delivery",
      type: "group",
      fields: [
        { name: "provider", type: "text" },
        { name: "cost", type: "number" },
        { name: "gst", type: "number" },
        { name: "scheduledAt", type: "date" },
        {
          name: "pickupWarehouse",
          type: "relationship",
          relationTo: "warehouses" as any,
          admin: {
            description: "The warehouse where the order will be picked up from.",
          },
        },
        { name: "trackingId", type: "text", admin: { readOnly: true } },
        { name: "carrierResponse", type: "json", admin: { readOnly: true } },
      ],
    },

    {
      name: "items",
      type: "array",
      required: true,
      fields: [
        { name: "productId", type: "text", required: true },
        { name: "productName", type: "text", required: true },
        { name: "productImage", type: "text" },
        { name: "variantId", type: "text" },
        { name: "priceAtPurchase", type: "number", required: true },
        { name: "quantity", type: "number", required: true, min: 1 },
        { 
          name: "seller", 
          type: "relationship", 
          relationTo: "sellers" as any, 
          required: true,
          admin: { readOnly: true }
        },
        {
          name: "status",
          type: "select",
          defaultValue: "PENDING",
          options: [
            { label: "Pending", value: "PENDING" },
            { label: "Accepted", value: "ACCEPTED" },
            { label: "Processing", value: "PROCESSING" },
            { label: "Shipped", value: "SHIPPED" },
            { label: "Delivered", value: "DELIVERED" },
            { label: "Cancelled", value: "CANCELLED" },
          ],
        },
      ],
    },

    {
      name: "subtotal",
      type: "number",
      required: true,
    },
    {
      name: "shippingCost",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "gst",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "platformFee",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "total",
      type: "number",
      required: true,
    },

    {
      name: "discountCode",
      type: "text",
      admin: {
        description: "Discount code applied to this order",
        position: "sidebar",
      },
    },
    {
      name: "discountSource",
      type: "select",
      options: [
        { label: "Store", value: "store" },
        { label: "Seller", value: "seller" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "discountType",
      type: "select",
      options: [
        { label: "Percentage", value: "percentage" },
        { label: "Fixed Amount", value: "fixed" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "discountValue",
      type: "number",
      admin: {
        description: "Original discount value (percentage or fixed amount)",
        position: "sidebar",
      },
    },
    {
      name: "discountAmount",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Actual discount amount deducted from order total",
        position: "sidebar",
      },
    },

    {
      name: "paymentMethod",
      type: "select",
      required: true,
      options: [
        { label: "Razorpay", value: "razorpay" },
        { label: "COD", value: "cod" },
      ],
    },

    {
      name: "paymentStatus",
      type: "select",
      defaultValue: "pending",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Paid", value: "paid" },
        { label: "Failed", value: "failed" },
        { label: "Refunded", value: "refunded" },
      ],
    },

    {
      name: "checkoutId",
      type: "text",
      index: true,
    },
    {
      name: "razorpayPaymentId",
      type: "text",
    },
    {
      name: "razorpaySignature",
      type: "text",
    },

    {
      name: "shippingAddress",
      type: "relationship",
      relationTo: "addresses" as any,
      required: true,
    },
    {
      name: "guestEmail",
      type: "email",
    },
    {
      name: "guestPhone",
      type: "text",
    },
    {
      name: "orderDate",
      type: "date",
      defaultValue: () => new Date(),
    },
  ],

  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === "create" && req.user) {
          data.user = req.user.id
        }

        if (operation === "create") {
          data.subtotal = data.items.reduce(
            (sum: number, i: any) =>
              sum + i.priceAtPurchase * i.quantity,
            0
          )

          data.total =
            data.subtotal +
            (data.shippingCost || 0) +
            (data.gst || 0) +
            (data.platformFee || 0) -
            (data.discountAmount || 0)
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const { payload } = req;
        
        const isNewSuccess = operation === 'create' && (doc.paymentMethod === 'cod' || doc.paymentStatus === 'paid');
        const isPaidNow = operation === 'update' && doc.paymentStatus === 'paid' && previousDoc?.paymentStatus === 'pending';

        if (isNewSuccess || isPaidNow) {
          const sellerItemsMap: Record<string, any[]> = {};
          
          for (const item of doc.items) {
            try {
              const sellerId = typeof item.seller === 'string' ? item.seller : item.seller?.id;
              if (sellerId) {
                if (!sellerItemsMap[sellerId]) sellerItemsMap[sellerId] = [];
                sellerItemsMap[sellerId].push(item);
              }

              const product = await (payload as any).findByID({
                collection: 'products',
                id: item.productId,
              });

              if (!product) continue;

              let newStock = 0;
              if (item.variantId && product.variants) {
                const variant = product.variants.find((v: any) => v.id === item.variantId);
                newStock = Math.max(0, (variant?.stock || 0) - item.quantity);
                
                await (payload as any).update({
                  collection: 'products',
                  id: product.id,
                  data: {
                    variants: product.variants.map((v: any) =>
                      v.id === item.variantId ? { ...v, stock: newStock } : v
                    ),
                  },
                });
              } else {
                newStock = Math.max(0, (product.stock || 0) - item.quantity);
                await (payload as any).update({
                  collection: 'products',
                  id: product.id,
                  data: { stock: newStock },
                });
              }

              if (newStock < 5) {
                // Fetch owner of the seller organization
                const sellerOrg = await (payload as any).findByID({
                  collection: 'sellers' as any,
                  id: sellerId,
                });

                if (sellerOrg && sellerOrg.owner) {
                   const owner = typeof sellerOrg.owner === 'string' 
                     ? await (payload as any).findByID({ collection: 'users', id: sellerOrg.owner })
                     : sellerOrg.owner;

                   if (owner) {
                    const lowStockHtml = getEmailTemplate('low-stock-alert', {
                      productName: product.name,
                      currentStock: newStock.toString(),
                      variantInfo: item.variantId ? `<p style="margin: 4px 0 0 0; color: #ef4444; font-size: 14px; font-weight: 600;">Variant: ${item.productName.split('(')[1]?.replace(')', '') || 'Selected variant'}</p>` : '',
                      restockLink: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/seller/products/${product.id}`
                    });

                    await payload.sendEmail({
                      to: owner.email,
                      subject: `⚠️ Low Stock Alert: ${product.name}`,
                      html: lowStockHtml,
                    });
                   }
                }
              }
            } catch (err) {
              console.error(`Order Processing Error:`, err);
            }
          }

          // Buyer Confirmation
          try {
            const buyer = await (payload as any).findByID({
              collection: 'users',
              id: typeof doc.user === 'string' ? doc.user : doc.user?.id,
            });

            if (buyer) {
              const itemsTable = generateOrderItemRows(doc.items.map((i: any) => ({
                name: i.productName,
                image: i.productImage,
                quantity: i.quantity,
                price: i.priceAtPurchase,
                variant: i.variantId ? i.productName.split('(')[1]?.replace(')', '') : null
              })));

              const confirmationHtml = getEmailTemplate('order-confirmation', {
                username: buyer.username || 'Friend',
                orderNumber: doc.orderNumber,
                itemsTable,
                subtotal: formatCurrency(doc.subtotal),
                deliveryFee: formatCurrency(doc.shippingCost || 0),
                total: formatCurrency(doc.total),
                paymentMethod: doc.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment (Prepaid)',
                deliveryEta: '5-7 Business Days',
                orderLink: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/orders/${doc.id}`,
                supportLink: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/contact`
              });

              await payload.sendEmail({
                to: buyer.email,
                subject: `Order Confirmed 🎉 | Order #${doc.orderNumber}`,
                html: confirmationHtml,
              });
            }
          } catch (err) {
            console.error('Buyer Confirmation Email Error:', err);
          }

          // Seller Notifications (to owner of organization)
          for (const [sellerId, items] of Object.entries(sellerItemsMap)) {
            try {
              const sellerOrg = await (payload as any).findByID({
                collection: 'sellers' as any,
                id: sellerId,
              });

              if (sellerOrg && sellerOrg.owner) {
                const owner = typeof sellerOrg.owner === 'string' 
                   ? await (payload as any).findByID({ collection: 'users', id: sellerOrg.owner })
                   : sellerOrg.owner;

                const address = typeof doc.shippingAddress === 'string' 
                  ? await (payload as any).findByID({ collection: 'addresses', id: doc.shippingAddress })
                  : doc.shippingAddress;

                if (owner) {
                  const sellerItemsTable = generateOrderItemRows(items.map((i: any) => ({
                    name: i.productName,
                    image: i.productImage,
                    quantity: i.quantity,
                    price: i.priceAtPurchase,
                    variant: i.variantId ? i.productName.split('(')[1]?.replace(')', '') : null
                  })));

                  const sellerHtml = getEmailTemplate('seller-order-notification', {
                    location: address ? `${address.city}, ${address.pincode}` : 'Not provided',
                    paymentStatus: doc.paymentStatus === 'paid' ? '✅ Paid' : '⏳ COD - Collect Cash',
                    sellerItemsTable,
                    orderLink: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/seller/orders/${doc.id}`
                  });

                  await payload.sendEmail({
                    to: owner.email,
                    subject: `🆕 New Order Received | #${doc.orderNumber}`,
                    html: sellerHtml,
                  });
                }
              }
            } catch (err) {
              console.error(`Seller Notification Error (${sellerId}):`, err);
            }
          }
        }
      }
    ]
  },
}
