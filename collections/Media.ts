import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "filename",
  },
  access: {
    read: () => true, // public media
  },
  upload: {
    // 🔑 IMPORTANT: let S3/R2 handle everything
    disableLocalStorage: true,

    mimeTypes: [
      "image/*",
      "video/*",
      "application/pdf",
      "application/octet-stream",
    ],

    imageSizes: [
      {
        name: "thumbnail",
        width: 300,
        height: 300,
        position: "centre",
      },
      {
        name: "card",
        width: 600,
        height: 600,
        position: "centre",
      },
      {
        name: "hero",
        width: 1200,
        height: 1200,
        position: "centre",
      },
    ],
  },

  fields: [
    {
      name: "alt",
      type: "text",
      required: false,
    },
    {
      name: "folder",
      type: "relationship",
      relationTo: "media-folders" as never,
      required: false,
      admin: {
        position: "sidebar",
      },
    },
  ],
};
