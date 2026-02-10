import type { CollectionConfig } from "payload"

export const Warehouses: CollectionConfig = {
  slug: "warehouses",

  access: {
    read: async ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === "admin") return true

      const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
      const allowedSellers = await getSellersWithPermission(req.payload, req.user.id, 'warehouse.view');
      
      return {
        seller: { in: allowedSellers },
      } as any
    },

    create: async ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === "admin") return true

      const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
      const allowedSellers = await getSellersWithPermission(req.payload, req.user.id, 'warehouse.view'); // Broad check for create permission?
      return allowedSellers.length > 0
    },

    update: async ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === "admin") return true

      const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
      const allowedSellers = await getSellersWithPermission(req.payload, req.user.id, 'seller.manage');
      
      return {
        seller: { in: allowedSellers },
      } as any
    },

    delete: async ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === "admin") return true

      const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
      const allowedSellers = await getSellersWithPermission(req.payload, req.user.id, 'seller.manage');
      
      return {
        seller: { in: allowedSellers },
      } as any
    },
  },

  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "city", "phone"],
  },

  fields: [
    {
      name: "seller",
      type: "relationship",
      relationTo: "sellers" as any,
      required: true,
      admin: {
        position: "sidebar",
      },
    },

    {
      name: "label",
      type: "text",
      required: true,
      label: "Warehouse Name/Label",
    },

    {
      name: "firstName",
      type: "text",
      required: true,
      label: "Contact Person First Name",
    },
    {
      name: "lastName",
      type: "text",
      required: true,
      label: "Contact Person Last Name",
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "phone",
      type: "text",
      required: true,
    },
    {
      name: "address",
      type: "text",
      required: true,
    },
    {
      name: "apartment",
      type: "text",
    },
    {
      name: "city",
      type: "text",
      required: true,
    },
    {
      name: "state",
      type: "text",
      required: true,
    },
    {
      name: "postalCode",
      type: "text",
      required: true,
    },
    {
      name: "country",
      type: "text",
      defaultValue: "India",
      required: true,
    },
  ],

  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === "create" && req.user) {
          // If seller not provided, try to auto-assign if they only have one
          if (!data.seller) {
            const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
            const allowedSellers = await getSellersWithPermission(req.payload, req.user.id, 'warehouse.view');
            if (allowedSellers.length === 1) {
              data.seller = allowedSellers[0];
            }
          }
          
          if (!data.seller && (req.user as any).role !== 'admin') {
            throw new Error("Seller organization is required");
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        if (operation === 'create') {
          try {
            const { registerWarehouse } = await import('@/lib/delhivery');
            await registerWarehouse({
              name: doc.label,
              phone: doc.phone,
              address: doc.address,
              city: doc.city,
              pin: doc.postalCode,
              email: doc.email,
            });
          } catch (error) {
            console.error('Failed to register warehouse with Delhivery:', error);
          }
        }
      },
    ],
  },
}
