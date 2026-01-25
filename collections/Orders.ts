import type { CollectionConfig } from "payload"

export const Orders: CollectionConfig = {
  slug: "orders",

  access: {
    read: ({ req }) => {
      if (!req.user) return false

      const user = req.user as any;

      // Admin and Sellers can read orders (filtering happens on frontend for now to support legacy orders)
      if (user.role === "admin" || user.role === "seller") return true

      // User sees only their orders
      return {
        user: {
          equals: user.id,
        },
      } as any
    },

    create: ({ req }) => Boolean(req.user),

    // Sellers can update order item status, but only for their own items
    // (Logic for per-item restriction is best handled in hooks or custom access, 
    // but the overall update permission is set here)
    update: ({ req }) => {
      const role = (req.user as any)?.role;
      return role === "admin" || role === "seller";
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
      ],
    },

    {
      name: "items",
      type: "array",
      required: true,
      fields: [
        { name: "productId", type: "text", required: true },
        { name: "productName", type: "text", required: true },
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
      name: "tax",
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
      name: "razorpayOrderId",
      type: "text",
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
            (data.tax || 0) +
            (data.platformFee || 0)
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        // 1. Determine if stock should be reduced
        // Condition A: New COD order
        const isNewCOD = operation === 'create' && doc.paymentMethod === 'cod';
        
        // Condition B: Payment transitioned to 'paid' (Razorpay flow)
        const isPaidNow = operation === 'update' && 
                          doc.paymentStatus === 'paid' && 
                          previousDoc?.paymentStatus === 'pending';

        if (isNewCOD || isPaidNow) {
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
