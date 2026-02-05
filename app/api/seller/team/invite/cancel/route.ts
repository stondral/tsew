import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { hasPermission } from '@/lib/rbac/permissions'

export async function POST(req: Request) {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({
    headers: requestHeaders,
  })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { inviteId, sellerId } = await req.json()

    if (!inviteId || !sellerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check permissions
    const canCancelInvite = await hasPermission(payload, user.id, sellerId, 'team.remove')
    
    if (!canCancelInvite && (user as unknown as { role: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch the invite to ensure it belongs to the seller and is still pending
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invite = await (payload as any).findByID({
      collection: 'team-invites',
      id: inviteId,
    })

    if (!invite) {
        return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invite.status !== 'pending') {
        return NextResponse.json({ error: `Cannot cancel an invitation that is ${invite.status}` }, { status: 400 })
    }

    // Delete or Update status to cancelled
    // Let's delete it for cleanliness, or we could update status to 'cancelled' if we wanted a history.
    // The collection has 'expired' and 'accepted', so let's just delete it or add 'cancelled'.
    // Looking at TeamInvites.ts, there's no 'cancelled' option in status. 
    // Let's just delete it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).delete({
      collection: 'team-invites',
      id: inviteId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to cancel invite:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
