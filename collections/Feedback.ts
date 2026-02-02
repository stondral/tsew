import type { CollectionConfig } from 'payload'

export const Feedback: CollectionConfig = {
  slug: 'feedback',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'visualAppeal', 'createdAt'],
  },
  access: {
    create: () => true,
    read: ({ req: { user } }) => !!user && user.collection === 'users',
    update: ({ req: { user } }) => !!user && user.collection === 'users',
    delete: ({ req: { user } }) => !!user && user.collection === 'users',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
    },
    {
      name: 'visualAppeal',
      type: 'number',
      required: true,
      min: 1,
      max: 10,
      admin: {
        description: 'Visual appeal and ease of navigation (1-10)',
      },
    },
    {
      name: 'discoverySource',
      type: 'select',
      required: true,
      options: [
        { label: 'Email Newsletter', value: 'email' },
        { label: 'Direct Contact (Founders)', value: 'direct' },
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'LinkedIn', value: 'linkedin' },
        { label: 'Social Media', value: 'social' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'platformInterest',
      type: 'select',
      required: true,
      options: [
        { label: 'Very Interested', value: 'very' },
        { label: 'Somewhat Interested', value: 'somewhat' },
        { label: 'Neutral', value: 'neutral' },
        { label: 'Not Interested', value: 'none' },
      ],
    },
    {
      name: 'categories',
      type: 'select',
      hasMany: true,
      required: true,
      options: [
        { label: 'Fashion & Apparel', value: 'fashion' },
        { label: 'Electronics & Accessories', value: 'electronics' },
        { label: 'Home & Decor', value: 'home' },
        { label: 'Beauty & Personal Care', value: 'beauty' },
        { label: 'Artisanal/Handmade Goods', value: 'artisanal' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'improvements',
      type: 'textarea',
      required: true,
    },
  ],
  timestamps: true,
}
