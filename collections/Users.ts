import type { CollectionConfig } from "payload"
import { getEmailTemplate } from "@/lib/email-templates"

const frontendURL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"

export const Users: CollectionConfig = {
  slug: "users",
  
  // ✅ 1. Enable Native Auth & Verification
  auth: {
    verify: {
      generateEmailSubject: () => "Verify your Stond Emporium account",
      generateEmailHTML: (args: any) => {
        const { token, user } = args || {};
        const url = `https://www.stondemporium.tech/auth/verify?token=${token}`
        
        return getEmailTemplate('welcome-mail', {
          username: user?.username || "there",
          verifyUrl: url
        });
      },
    },
    forgotPassword: {
      generateEmailSubject: () => "Reset your Stond Emporium password",
      generateEmailHTML: (args: any) => {
        const { token, user } = args || {};
        const url = `https://www.stondemporium.tech/auth/reset-password?token=${token}`
        
        return getEmailTemplate('forgot-password-mail', {
          username: user?.username || "there",
          resetUrl: url
        });
      },
    },
  },

  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role", "username"],
  },

  // ✅ 2. Simplified Access Control
  // ✅ 2. Simplified Access Control
  access: {
    read: ({ req: { user } }) => {
      const authUser = user as any
      // 1. If no user is logged in, only allow reading sellers (for frontend/middleware)
      if (!authUser) {
        return {
          role: {
            equals: "seller",
          },
        } as any
      }

      // 2. If Admin, allow reading everything
      if (authUser.role === "admin") {
        return true
      }

      // 3. Keep the "User sees only self" rule for regular users
      return {
        id: {
          equals: authUser.id,
        },
      } as any
    },
    create: () => true,
    update: ({ req: { user } }) => {
      const authUser = user as any
      if (!authUser) return false
      if (authUser.role === "admin") return true
      return {
        id: {
          equals: authUser.id,
        },
      } as any
    },
    delete: ({ req: { user } }) => (user as any)?.role === "admin",
  },

  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.plan === "starter") {
          data.theme = {
            ...(data.theme || {}),
            preset: "default",
          }
          data.customDomain = {
            ...(data.customDomain || {}),
            enabled: false,
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        // Detect Role Transition: user -> seller
        const isRoleUpgrade = operation === 'update' && 
                            doc.role === 'seller' && 
                            previousDoc?.role === 'user';
        
        if (isRoleUpgrade) {
          const { payload } = req;
          try {
            const emailHtml = getEmailTemplate('seller-welcome', {
              username: doc.username || 'Partner',
              dashboardUrl: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.stondemporium.tech'}/seller`
            });

            await payload.sendEmail({
              to: doc.email,
              subject: "You're officially a Stond Seller! 🎉",
              html: emailHtml,
            });
            console.log(`Seller Welcome email sent to ${doc.email}`);
          } catch (err) {
            console.error('Failed to send Seller Welcome email:', err);
          }
        }
      }
    ]
  },

  fields: [
    {
      name: "username",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "phone",
      type: "text",
      required: true,
      access: {
        read: ({ req, doc }) =>
          (req.user as any)?.role === "admin" || doc?.id === req.user?.id,
      },
    },
    {
      name: "role",
      type: "select",
      defaultValue: "user",
      required: true,
      options: [
        { label: "Admin", value: "admin" },
        { label: "Seller", value: "seller" },
        { label: "User", value: "user" },
      ],
      access: {
        update: ({ req }) => (req.user as any)?.role === "admin",
      },
    },
    {
      name: "plan",
      type: "select",
      defaultValue: "starter",
      options: [
        { label: "Starter", value: "starter" },
        { label: "Pro", value: "pro" },
        { label: "Elite", value: "elite" },
      ],
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: "billingCycle",
      type: "select",
      options: [
        { label: "Monthly", value: "monthly" },
        { label: "Yearly", value: "yearly" },
      ],
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: "subscriptionId",
      type: "text",
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: "subscriptionStatus",
      type: "select",
      defaultValue: "inactive",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Pending", value: "pending" },
        { label: "Cancelled", value: "cancelled" },
      ],
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: "nextBillingDate",
      type: "date",
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: "razorpayCustomerId",
      type: "text",
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: "theme",
      type: "group",
      fields: [
        {
          name: "preset",
          type: "select",
          defaultValue: "default",
          options: [
            { label: "Default", value: "default" },
            { label: "Modern", value: "modern" },
            { label: "Luxury", value: "luxury" },
          ],
        },
        {
          name: "colors",
          type: "json",
        },
        {
          name: "fonts",
          type: "json",
        },
        {
          name: "layoutVersion",
          type: "number",
          defaultValue: 1,
        },
      ],
    },
    {
      name: "customDomain",
      type: "group",
      fields: [
        {
          name: "enabled",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "domain",
          type: "text",
          unique: true,
        },
        {
          name: "verifiedAt",
          type: "date",
        },
      ],
    },
    // ❌ Removed: emailVerified, emailVerifyToken, emailVerifyExpires
    // Payload handles these internally now.
  ],
}