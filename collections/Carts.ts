import type { CollectionConfig } from "payload"

export const Carts: CollectionConfig = {
  slug: "carts",

  access: {
    read: ({ req }) => {
      if (!req.user) return false

      return {
        user: {
          equals: req.user.id,
        },
      }
    },

    create: ({ req }) => Boolean(req.user),

    update: ({ req }) => {
      if (!req.user) return false

      return {
        user: {
          equals: req.user.id,
        },
      }
    },

    delete: ({ req }) => {
      if (!req.user) return false

      return {
        user: {
          equals: req.user.id,
        },
      }
    },
  },

  admin: {
    useAsTitle: "user",
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
      name: "items",
      type: "array",
      fields: [
        {
          name: "productId",
          type: "text",
          required: true,
        },
        {
          name: "variantId",
          type: "text",
        },
        {
          name: "quantity",
          type: "number",
          required: true,
          min: 1,
        },
      ],
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
