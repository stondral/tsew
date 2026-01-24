import type { CollectionConfig, CollectionSlug } from "payload"

export const Categories: CollectionConfig = {
  slug: "categories",

  access: {
    read: () => true,
    create: ({ req }) => (req.user as any)?.role === "admin",
    update: ({ req }) => (req.user as any)?.role === "admin",
    delete: ({ req }) => (req.user as any)?.role === "admin",
  },

  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "parent"],
  },

  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },

    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "Auto-generated from name",
      },
    },

    {
      name: "color",
      type: "text",
    },

    {
      name: "parent",
      type: "relationship",
      relationTo: "categories" as CollectionSlug,
    },

    {
      name: "subcategories",
      type: "join",
      collection: "categories" as CollectionSlug,
      on: "parent",
      hasMany: true,
    },
  ],

  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === "create" || operation === "update") {
          if (data.name && !data.slug) {
            data.slug = data.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "")
          }
        }
        return data
      },
    ],
  },
}
