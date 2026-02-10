import type { CollectionConfig } from "payload"

export const Wishlist: CollectionConfig = {
  slug: "wishlist",
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
    create: ({ req }) => Boolean(req.user),
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
    useAsTitle: "user",
    defaultColumns: ["user", "updatedAt"],
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      unique: true,
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
    {
      name: "products",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      required: false,
      admin: {
        description: "Products saved in the wishlist",
      }
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
  },
}
