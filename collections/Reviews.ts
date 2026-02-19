import type { CollectionConfig } from 'payload'
import { updateProductStatsAfterChange, updateProductStatsAfterDelete } from './hooks/reviewHooks'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'rating',
    defaultColumns: ['user', 'product', 'rating', 'createdAt'],
  },
  hooks: {
    afterChange: [updateProductStatsAfterChange],
    afterDelete: [updateProductStatsAfterDelete],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      const authUser = user as any
      if (authUser.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      const authUser = user as any
      return authUser.role === 'admin'
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      index: true,
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      index: true,
      min: 1,
      max: 5,
    },
    {
      name: 'comment',
      type: 'textarea',
      required: true,
    },
    {
      name: 'images',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'isVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Set to true if the user has purchased the product',
      },
    },
  ],
  timestamps: true,
}
