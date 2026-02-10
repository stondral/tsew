import type { CollectionConfig } from "payload";

export const VerificationSessions: CollectionConfig = {
  slug: "verification-sessions",
  admin: {
    hidden: true,
  },
  access: {
    // These should only be accessed server-side (via overrideAccess in route handlers)
    read: () => false,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: "sessionId",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Verified", value: "verified" },
        { label: "Consumed", value: "consumed" },
        { label: "Expired", value: "expired" },
      ],
    },
    {
      name: "expiresAt",
      type: "date",
      required: true,
    },
    {
      name: "verifiedAt",
      type: "date",
    },
    {
      name: "consumedAt",
      type: "date",
    },
  ],
};
