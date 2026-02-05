import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: Request) {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({
    headers: requestHeaders,
  }) as { user: { id: string, role: string, username?: string, email?: string } | null }

  if (!user || user.role !== 'seller') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if user already has an organization
    const existing = await payload.find({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      collection: 'sellers' as any,
      where: {
        owner: { equals: user.id },
      },
    })

    if (existing.docs.length > 0) {
      return NextResponse.json({ error: 'Organization already exists' }, { status: 400 })
    }

    // Create a default seller organization
    const seller = await payload.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      collection: 'sellers' as any,
      data: {
        name: `${user.username || 'My'}'s Store`,
        slug: `${user.username || 'store'}-${Date.now()}`,
        owner: user.id,
        plan: 'starter',
        subscriptionStatus: 'active',
      },
    })

    // Create membership (if the hook didn't catch it or for extra safety)
    const membership = await payload.find({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      collection: 'seller-members' as any,
      where: {
        and: [
          { user: { equals: user.id } },
          { seller: { equals: seller.id } },
        ],
      },
    })

    if (membership.docs.length === 0) {
      await payload.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collection: 'seller-members' as any,
        data: {
          seller: seller.id,
          user: user.id,
          role: 'owner',
        },
      })
    }

    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
    // Redirect back to team page
    return NextResponse.redirect(`${frontendUrl}/seller/team`, 303)
  } catch (error) {
    console.error('Failed to create organization:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
