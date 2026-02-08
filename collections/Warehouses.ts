import type { CollectionConfig } from "payload"

export const Warehouses: CollectionConfig = {
  slug: "warehouses",

  access: {
    read: ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === "admin") return true

      return {
        user: {
          equals: req.user.id,
        },
      }
    },

    create: ({ req }) => {
      return Boolean(req.user) && ((req.user as any).role === "seller" || (req.user as any).role === "admin")
    },

    update: ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === "admin") return true

      return {
        user: {
          equals: req.user.id,
        },
      }
    },

    delete: ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === "admin") return true

      return {
        user: {
          equals: req.user.id,
        },
      }
    },
  },

  admin: {
    useAsTitle: "label",
    defaultColumns: ["label", "city", "phone"],
  },

  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      admin: {
        position: "sidebar",
        readOnly: true,
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
      ({ data, req, operation }) => {
        if (operation === "create" && req.user) {
          data.user = req.user.id
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
