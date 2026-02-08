import type { CollectionConfig } from 'payload'

export const SupportMessages: CollectionConfig = {
  slug: 'support-messages',
  admin: {
    useAsTitle: 'content',
    defaultColumns: ['ticket', 'sender', 'senderType', 'content', 'createdAt'],
  },
  access: {
    read: async ({ req }) => {
      if (!req.user) return false
      
      // ✅ Admins can read all messages
      if ((req.user as any).role === 'admin') return true
      
      // Users can only read messages belonging to their tickets
      return {
        'ticket.customer': { equals: req.user.id }
      } as any
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => (req.user as any)?.role === 'admin',
    delete: ({ req }) => (req.user as any)?.role === 'admin',
  },
  fields: [
    {
      name: 'ticket',
      type: 'relationship',
      relationTo: 'support-tickets' as any,
      required: true,
      index: true,
    },
    {
      name: 'sender',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'senderType',
      type: 'select',
      required: true,
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Admin', value: 'admin' },
        { label: 'Seller', value: 'seller' },
        { label: 'System', value: 'system' },
      ],
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'deliveryStatus',
      type: 'select',
      defaultValue: 'sent',
      options: [
        { label: 'Sent', value: 'sent' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Read', value: 'read' },
      ],
    },
  ],
  timestamps: true,
}
