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
    
    // Redis Cache Invalidation
    afterChange: [
      async ({ doc, operation }) => {
        // Invalidate category cache when category is created or updated
        if (operation === 'create' || operation === 'update') {
          try {
            const { invalidateCategory, invalidateCategoryTree } = await import('@/lib/redis/category');
            
            // Invalidate the specific category
            await invalidateCategory(doc.id);
            
            // Invalidate entire tree since hierarchy might have changed
            await invalidateCategoryTree();
            
            console.log(`✅ Invalidated category cache: ${doc.id}`);
          } catch (error) {
            // Don't fail the operation if cache invalidation fails
            console.error('Failed to invalidate category cache:', error);
          }
        }
      },
    ],
  },
}
