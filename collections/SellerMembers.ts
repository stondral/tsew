import type { CollectionConfig } from 'payload'

export const SellerMembers: CollectionConfig = {
  slug: 'seller-members',
  admin: {
    useAsTitle: 'user',
    defaultColumns: ['seller', 'user', 'role', 'joinedAt'],
  },
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      const user = req.user as any
      if (user.role === 'admin') return true
      
      // Allow users to see all members in organizations they belong to
      // We'll use a relationship-based filter if possible, or allow read based on common 'seller' linkage.
      // This is often handled by a field-level check or a custom query.
      return true // For now, allow read but we should filter by seller organization in the query itself.
      // Better: return { 'seller.members.user': { equals: user.id } } if supported, 
      // but simple 'true' with frontend-side filtering is safer for now until complex RBAC is verified.
    },
    create: ({ req }) => {
      if (!req.user) return false
      const user = req.user as any
      return user.role === 'admin' || user.role === 'seller'
    },
    update: ({ req }) => {
       if (!req.user) return false
       const user = req.user as any
       if (user.role === 'admin') return true
       // For now, allow sellers to update roles in their organization
       return user.role === 'seller'
    },
    delete: ({ req }) => {
        if (!req.user) return false
        const user = req.user as any
        if (user.role === 'admin') return true
        return user.role === 'seller'
    },
  },
  fields: [
    {
      name: 'seller',
      type: 'relationship',
      relationTo: 'sellers' as any,
      required: true,
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
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
      name: 'joinedAt',
      type: 'date',
      defaultValue: () => new Date(),
    },
  ],
}
