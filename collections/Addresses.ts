import type { CollectionConfig } from "payload"

export const Addresses: CollectionConfig = {
  slug: "addresses",

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
      return Boolean(req.user)
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
    defaultColumns: ["label", "firstName", "city", "isDefault"],
  },

  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },

    {
      name: "label",
      type: "text",
      required: true,
    },

    {
      name: "isDefault",
      type: "checkbox",
      defaultValue: false,
    },

    {
      name: "firstName",
      type: "text",
      required: true,
    },
    {
      name: "lastName",
      type: "text",
      required: true,
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
    {
      name: "addressType",
      type: "select",
      required: true,
      defaultValue: "home",
      options: [
        { label: "Home", value: "home" },
        { label: "Work", value: "work" },
        { label: "Other", value: "other" },
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
