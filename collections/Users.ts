import type { CollectionConfig } from "payload"

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
        return `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(to bottom, #ffffff, #fff5f0);">
            <div style="background: white; border-radius: 24px; padding: 48px 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
              <div style="text-align: center; margin-bottom: 40px;">
                <img src="https://res.cloudinary.com/ddyp4krsd/image/upload/v1769238624/logoston_rsgzgk.jpg" alt="Stondemporium" style="width: 120px; height: auto; margin-bottom: 24px;" />
                <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.3;">Welcome to the Family! 🎉</h1>
              </div>
              
              <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-left: 4px solid #f97316; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
                <p style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">Hey ${user?.username || "there"}! 👋</p>
                <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0;">We&apos;re absolutely thrilled to have you join Stondemporium, India&apos;s premier destination for innovative products from cutting-edge startups!</p>
              </div>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 24px;">You&apos;re just <strong>one click away</strong> from unlocking an exclusive world of premium, sustainable, and beautifully crafted products. Let&apos;s get you verified and ready to explore! ✨</p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${url}" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 18px 48px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3); transition: all 0.3s;">✓ Verify My Email</a>
              </div>
              
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-top: 32px;">
                <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">🔗 Button not working? No worries! Copy and paste this link:</p>
                <p style="color: #f97316; font-size: 12px; line-height: 1.5; word-break: break-all; margin: 0; font-family: monospace;">${url}</p>
              </div>
              
              <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0; text-align: center;">Questions? We&apos;re here to help! Reach out to us anytime at <a href="mailto:stondemporiums@gmail.com" style="color: #f97316; text-decoration: none;">stondemporiums@gmail.com</a></p>
                <p style="color: #cbd5e1; font-size: 11px; text-align: center; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin: 0;">🌟 Stondemporium • Empowering India&apos;s Innovation 🇮🇳</p>
              </div>
            </div>
          </div>
        `
      },
    },
    forgotPassword: {
      generateEmailSubject: () => "Reset your Stond Emporium password",
      generateEmailHTML: (args: any) => {
        const { token, user } = args || {};
        const url = `https://www.stondemporium.tech/auth/reset-password?token=${token}`
        return `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(to bottom, #ffffff, #fff5f0);">
            <div style="background: white; border-radius: 24px; padding: 48px 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
              <div style="text-align: center; margin-bottom: 40px;">
                <img src="https://res.cloudinary.com/ddyp4krsd/image/upload/v1769238624/logoston_rsgzgk.jpg" alt="Stondemporium" style="width: 120px; height: auto; margin-bottom: 24px;" />
                <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.3;">Password Reset Request 🔐</h1>
              </div>
              
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #eab308; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
                <p style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">Hey ${user?.username || "there"}! 👋</p>
                <p style="color: #475569; font-size: 15px; line-height: 1.7; margin: 0;">We received a request to reset your password. No worries—it happens to the best of us!</p>
              </div>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 24px;">Click the button below to create a new password and regain access to your account. If you didn&apos;t request this change, you can safely ignore this email—your account remains secure. 🔒</p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${url}" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 18px 48px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 8px 20px rgba(249, 115, 22, 0.3); transition: all 0.3s;">🔑 Reset My Password</a>
              </div>
              
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 12px; padding: 20px; margin-top: 32px;">
                <p style="color: #7f1d1d; font-size: 13px; font-weight: 600; margin: 0 0 8px 0;">⚡ Security Notice</p>
                <p style="color: #991b1b; font-size: 13px; line-height: 1.5; margin: 0;">This link will expire in 1 hour for security reasons. If you didn&apos;t request a password reset, please contact us immediately.</p>
              </div>
              
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-top: 24px;">
                <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">🔗 Button not working? Copy and paste this link:</p>
                <p style="color: #f97316; font-size: 12px; line-height: 1.5; word-break: break-all; margin: 0; font-family: monospace;">${url}</p>
              </div>
              
              <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0; text-align: center;">Need help? Contact us at <a href="mailto:stondemporiums@gmail.com" style="color: #f97316; text-decoration: none;">stondemporiums@gmail.com</a></p>
                <p style="color: #cbd5e1; font-size: 11px; text-align: center; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin: 0;">🌟 Stondemporium • Empowering India&apos;s Innovation 🇮🇳</p>
              </div>
            </div>
          </div>
        `
      },
    },
  },

  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role", "username"],
  },

  // ✅ 2. Simplified Access Control
  access: {
    read: ({ req }) => {
      // Public can only see Sellers
      if (!req.user) return { role: { equals: "seller" } }
      // Admins see all, Users see themselves
      const user = req.user as any;
      if (user.role === "admin") return true
      return { id: { equals: user.id } } as any
    },
    create: () => true,
    update: ({ req }) => (req.user as any)?.role === "admin" || { id: { equals: req.user?.id } },
    delete: ({ req }) => (req.user as any)?.role === "admin",
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