import type { CollectionConfig } from "payload"

export const Orders: CollectionConfig = {
  slug: "orders",

  access: {
    read: ({ req }) => {
      if (!req.user) return false;
      const user = req.user as any;
      if (user.role === "admin") return true;
      if (user.role === "seller") {
        return {
          seller: { equals: user.id },
        } as any;
      }
      return {
        user: { equals: user.id },
      } as any;
    },

    create: ({ req }) => Boolean(req.user),

    update: ({ req }) => {
      if (!req.user) return false;
      const user = req.user as any;
      if (user.role === "admin") return true;
      if (user.role === "seller") {
        return {
          seller: { equals: user.id },
        } as any;
      }
      return false;
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
        { label: "Pending", value: "pending" },
        { label: "Accepted", value: "ACCEPTED" },
        { label: "Processing", value: "PROCESSING" },
        { label: "Processing", value: "processing" },
        { label: "Shipped", value: "SHIPPED" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "DELIVERED" },
        { label: "Delivered", value: "delivered" },
        { label: "Cancelled", value: "CANCELLED" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },

    {
      name: "seller",
      type: "relationship",
      relationTo: "users",
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
          relationTo: "users", 
          required: true,
          admin: { readOnly: true }
        },
        {
          name: "status",
          type: "select",
          defaultValue: "PENDING",
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Pending", value: "pending" },
        { label: "Accepted", value: "ACCEPTED" },
        { label: "Processing", value: "PROCESSING" },
        { label: "Processing", value: "processing" },
        { label: "Shipped", value: "SHIPPED" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "DELIVERED" },
        { label: "Delivered", value: "delivered" },
        { label: "Cancelled", value: "CANCELLED" },
        { label: "Cancelled", value: "cancelled" },
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
      // Used for grouping multiple orders from the same checkout (split by seller)
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
            (data.platformFee || 0)
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        // 1. Determine if stock should be reduced
        // Condition A: New COD order or New PAID order (Created after verified payment)
        const isNewSuccess = operation === 'create' && (doc.paymentMethod === 'cod' || doc.paymentStatus === 'paid');
        
        // Condition B: Payment transitioned to 'paid' (Webhook/Background flow)
        const isPaidNow = operation === 'update' && 
                          doc.paymentStatus === 'paid' && 
                          previousDoc?.paymentStatus === 'pending';

        if (isNewSuccess || isPaidNow) {
          const { payload } = req;
          
          for (const item of doc.items) {
            try {
              // Fetch product to get current stock/variants
              const product = await (payload as any).findByID({
                collection: 'products',
                id: item.productId,
              });

              if (!product) {
                console.error(`Stock Update Error: Product ${item.productId} not found`);
                continue;
              }

              if (item.variantId && product.variants) {
                // Update specific variant stock
                await (payload as any).update({
                  collection: 'products',
                  id: product.id,
                  data: {
                    variants: product.variants.map((v: any) =>
                      v.id === item.variantId
                        ? { ...v, stock: Math.max(0, (v.stock || 0) - item.quantity) }
                        : v
                    ),
                  },
                });
              } else {
                // Update base product stock
                await (payload as any).update({
                  collection: 'products',
                  id: product.id,
                  data: {
                    stock: Math.max(0, (product.stock || 0) - item.quantity),
                  },
                });
              }
            } catch (err) {
              console.error(`Stock Update Error: Failed for product ${item.productId}:`, err);
            }
          }
        }
      }
    ]
  },
}
