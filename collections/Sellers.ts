import type { CollectionConfig } from 'payload'

export const Sellers: CollectionConfig = {
  slug: 'sellers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'owner', 'plan', 'subscriptionStatus'],
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: async ({ req }) => {
      const user = req.user as any
      if (!user) return false
      if (user.role === 'admin') return true

      const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
      const allowedSellers = await getSellersWithPermission(req.payload, user.id, 'seller.manage');

      return {
        or: [
          { owner: { equals: user.id } },
          { id: { in: allowedSellers } }
        ]
      } as any
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete: ({ req }) => (req.user as any)?.role === 'admin',
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create') {
          // Auto-create membership for the owner
          await req.payload.create({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            collection: 'seller-members' as any,
            data: {
              seller: doc.id,
              user: typeof doc.owner === 'string' ? doc.owner : doc.owner.id,
              role: 'owner',
            },
          })
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Used for subdomains and identification',
      },
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'logo',
      type: 'relationship',
      relationTo: 'media',
    },
    {
      name: 'plan',
      type: 'select',
      defaultValue: 'starter',
      options: [
        { label: 'Starter', value: 'starter' },
        { label: 'Pro', value: 'pro' },
        { label: 'Elite', value: 'elite' },
      ],
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: 'subscriptionStatus',
      type: 'select',
      defaultValue: 'inactive',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending', value: 'pending' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: 'theme',
      type: 'group',
      fields: [
        {
          name: 'preset',
          type: 'select',
          defaultValue: 'default',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Modern', value: 'modern' },
            { label: 'Luxury', value: 'luxury' },
          ],
        },
        {
          name: 'colors',
          type: 'json',
        },
        {
          name: 'fonts',
          type: 'json',
        },
      ],
    },
    {
      name: 'customDomain',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'domain',
          type: 'text',
          unique: true,
        },
        {
          name: 'verifiedAt',
          type: 'date',
        },
      ],
    },
  ],
}
