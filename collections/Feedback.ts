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
      name: 'userRole',
      type: 'select',
      required: true,
      defaultValue: 'buyer',
      options: [
        { label: 'Buyer (Customer)', value: 'buyer' },
        { label: 'Seller (Merchant)', value: 'seller' },
      ],
    },
    {
      name: 'visualAppeal',
      type: 'number',
      min: 1,
      max: 10,
      admin: {
        description: 'Visual appeal and ease of navigation (1-10)',
        condition: (data) => data?.userRole === 'buyer',
      },
    },
    {
      name: 'discoverySource',
      type: 'select',
      options: [
        { label: 'Email Newsletter', value: 'email' },
        { label: 'Direct Contact (Founders)', value: 'direct' },
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'LinkedIn', value: 'linkedin' },
        { label: 'Social Media', value: 'social' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        condition: (data) => data?.userRole === 'buyer',
      },
    },
    {
      name: 'greenFlag',
      type: 'select',
      options: [
        { label: 'Guest Checkout (No account required)', value: 'guest_checkout' },
        { label: 'Clean, distraction-free store', value: 'clean_store' },
        { label: 'Recognized payment methods (UPI/WhatsApp Pay)', value: 'secure_payments' },
        { label: 'Real About Us story or instant chat', value: 'human_connection' },
      ],
      admin: {
        description: 'What gives you confidence to order from a new brand?',
        condition: (data) => data?.userRole === 'buyer',
      },
    },
    {
      name: 'platformInterest',
      type: 'select',
      options: [
        { label: 'Very Interested', value: 'very' },
        { label: 'Somewhat Interested', value: 'somewhat' },
        { label: 'Neutral', value: 'neutral' },
        { label: 'Not Interested', value: 'none' },
      ],
      admin: {
        condition: (data) => data?.userRole === 'buyer',
      },
    },
    {
      name: 'categories',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Fashion & Apparel', value: 'fashion' },
        { label: 'Electronics & Accessories', value: 'electronics' },
        { label: 'Home & Decor', value: 'home' },
        { label: 'Beauty & Personal Care', value: 'beauty' },
        { label: 'Artisanal/Handmade Goods', value: 'artisanal' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        condition: (data) => data?.userRole === 'buyer',
      },
    },
    {
      name: 'otherCategory',
      type: 'text',
      admin: {
        description: 'Specific category if "Other" was selected',
        condition: (data) => data?.userRole === 'buyer' && data?.categories?.includes('other'),
      },
    },
    {
      name: 'problemsSolved',
      type: 'textarea',
      admin: {
        description: 'Problems we can solve that others dont (Seller Only)',
        condition: (data) => data?.userRole === 'seller',
      },
    },
    {
      name: 'sellerUiFeedback',
      type: 'textarea',
      admin: {
        description: 'Feedback on seller UI (Seller Only)',
        condition: (data) => data?.userRole === 'seller',
      },
    },
    {
      name: 'wantsToJoin',
      type: 'select',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
        { label: 'Maybe later', value: 'maybe' },
      ],
      admin: {
        description: 'Would you like to join us? (Seller Only)',
        condition: (data) => data?.userRole === 'seller',
      },
    },
    {
      name: 'improvements',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
