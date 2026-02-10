import type { CollectionConfig } from 'payload'

export const SellerMembers: CollectionConfig = {
  slug: 'seller-members',
  admin: {
    useAsTitle: 'user',
    defaultColumns: ['seller', 'user', 'role', 'joinedAt'],
  },
  access: {
    read: async ({ req }) => {
      if (!req.user) return false
      const user = req.user as any
      if (user.role === 'admin') return true
      
      const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
      const allowedSellers = await getSellersWithPermission(req.payload, user.id, 'seller.manage'); // Or lower permission if just viewing team
      
      return {
        seller: { in: allowedSellers },
      } as any
    },
    create: async ({ req }) => {
      if (!req.user) return false
      const user = req.user as any
      if (user.role === 'admin') return true
      
      return user.role === 'seller'
    },
    update: async ({ req }) => {
       if (!req.user) return false
       const user = req.user as any
       if (user.role === 'admin') return true

       const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
       const allowedSellers = await getSellersWithPermission(req.payload, user.id, 'seller.manage');
       
       return {
         seller: { in: allowedSellers },
       } as any
    },
    delete: async ({ req }) => {
        if (!req.user) return false
        const user = req.user as any
        if (user.role === 'admin') return true

        const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
        const allowedSellers = await getSellersWithPermission(req.payload, user.id, 'seller.manage');
        
        return {
          seller: { in: allowedSellers },
        } as any
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user && (req.user as any).role !== 'admin') {
           const { hasPermission } = await import('@/lib/rbac/permissions');
           const canManage = await hasPermission(req.payload, req.user.id, data.seller, 'seller.manage');
           if (!canManage) {
              throw new Error("You do not have permission to add members to this organization");
           }
        }
        return data;
      }
    ],
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
