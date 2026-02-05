import type { CollectionConfig } from 'payload'
import crypto from 'crypto'

export const TeamInvites: CollectionConfig = {
  slug: 'team-invites',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'seller', 'role', 'status', 'expiresAt'],
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      const user = req.user as any
      if (user.role === 'admin') return true
      
      // Users can see invites for sellers they manage, or invites sent to them
      return true // To be refined
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => (req.user as any)?.role === 'admin',
  },
  fields: [
    {
      name: 'seller',
      type: 'relationship',
      relationTo: 'sellers' as any,
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'viewer',
      options: [
        { label: '👑 Owner', value: 'owner' },
        { label: '🛡️ Admin', value: 'admin' },
        { label: '📦 Operations Manager', value: 'operations_manager' },
        { label: '📊 Inventory Manager', value: 'inventory_manager' },
        { label: '🏭 Warehouse Staff', value: 'warehouse_staff' },
        { label: '💬 Customer Support', value: 'customer_support' },
        { label: '💰 Finance', value: 'finance' },
        { label: '📣 Marketing Manager', value: 'marketing_manager' },
        { label: '👁️ Viewer', value: 'viewer' },
      ],
    },
    {
      name: 'token',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      defaultValue: () => crypto.randomBytes(32).toString('hex'),
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      defaultValue: () => {
        const date = new Date()
        date.setDate(date.getDate() + 3) // 3 days expiry
        return date
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Expired', value: 'expired' },
      ],
    },
    {
        name: 'invitedBy',
        type: 'relationship',
        relationTo: 'users',
        admin: {
            readOnly: true,
        }
    }
  ],
  hooks: {
      beforeChange: [
          ({ req, data, operation }) => {
              if (operation === 'create' && req.user) {
                  data.invitedBy = req.user.id
              }
              return data
          }
      ]
  }
}
