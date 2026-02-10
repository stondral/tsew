import type { CollectionConfig } from "payload";

export const MediaFolders: CollectionConfig = {
  slug: "media-folders",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug"],
    group: "Media",
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => (user as any)?.role === "admin",
    update: ({ req: { user } }) => (user as any)?.role === "admin",
    delete: ({ req: { user } }) => (user as any)?.role === "admin",
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
      admin: {
        description: "Used for filtering or custom logic",
      },
    },
  ],
};
