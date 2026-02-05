import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

interface InviteData {
  id: string;
  email: string;
  expiresAt: string;
  seller: { id: string } | string;
  role: string;
}

export async function POST(req: Request) {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({
    headers: requestHeaders,
  })

  if (!user) {
    // Note: If user is not logged in, the frontend should redirect to login/register first
    return NextResponse.json({ error: 'Unauthorized. Please login first.' }, { status: 401 })
  }

  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // Find the invite
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invites = await (payload as any).find({
      collection: 'team-invites',
      where: {
        token: { equals: token },
        status: { equals: 'pending' },
      },
      limit: 1,
    }) as { docs: InviteData[] }

    const invite = invites.docs[0]

    // Check if the logged in user matches the invited email
    if (invite.email.toLowerCase() !== (user as unknown as { email: string }).email.toLowerCase()) {
        return NextResponse.json({ 
            error: 'Email mismatch. This invitation was sent to another email address.',
            invitedEmail: invite.email 
        }, { status: 403 })
    }

    // Check if invite is expired
    if (new Date(invite.expiresAt) < new Date()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (payload as any).update({
            collection: 'team-invites',
            id: invite.id,
            data: { status: 'expired' }
        })
        return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    // We will use a small retry loop for the database updates to handle potential WriteConflicts
    const executeWithRetry = async (fn: () => Promise<unknown>, maxRetries = 3) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (err: unknown) {
          if ((err as { code?: number }).code === 112 && i < maxRetries - 1) { // 112 is MongoDB WriteConflict
            console.warn(`Write conflict detected, retry ${i + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
            continue;
          }
          throw err;
        }
      }
    };

    await executeWithRetry(async () => {
      // 1. Create the membership
      const sellerId = typeof invite.seller === 'string' ? invite.seller : invite.seller.id;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).create({
          collection: 'seller-members',
          data: {
              seller: sellerId,
              user: user.id,
              role: invite.role,
          },
          overrideAccess: true,
      })

      // 2. Update invite status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).update({
          collection: 'team-invites',
          id: invite.id,
          data: { status: 'accepted' },
          overrideAccess: true,
      })

      // 3. Upgrade user role if they are a regular user
      if ((user as unknown as { role: string }).role === 'user') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (payload as any).update({
          collection: 'users',
          id: user.id,
          data: {
            role: 'sellerEmployee'
          },
          overrideAccess: true,
        })
      }
    });

    const finalSellerId = typeof invite.seller === 'string' ? invite.seller : invite.seller.id;
    return NextResponse.json({ success: true, sellerId: finalSellerId })
  } catch (error) {
    console.error('Failed to accept invite:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
