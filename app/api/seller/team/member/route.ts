import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { hasPermission } from '@/lib/rbac/permissions'

export async function PATCH(req: Request) {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({
    headers: requestHeaders,
  })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { membershipId, role, sellerId } = await req.json()

    if (!membershipId || !role || !sellerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'operations_manager', 'inventory_manager', 'warehouse_staff', 'customer_support', 'finance', 'marketing_manager', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: `Invalid role. Valid options: ${validRoles.join(', ')}` 
      }, { status: 400 })
    }

    // Check permissions
    const canManageTeam = await hasPermission(payload, user.id, sellerId, 'team.assign_role')
    if (!canManageTeam && (user as unknown as { role: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch the membership to ensure we're not changing the owner
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const membership = await (payload as any).findByID({
      collection: 'seller-members',
      id: membershipId,
    })

    if (!membership) {
        return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    if (membership.role === 'owner') {
        return NextResponse.json({ error: 'Cannot change the role of the owner' }, { status: 403 })
    }

    // Update the membership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (payload as any).update({
      collection: 'seller-members',
      id: membershipId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { role } as any,
    })

    return NextResponse.json({ success: true, membership: updated })
  } catch (error) {
    console.error('Failed to update member:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({
    headers: requestHeaders,
  })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { membershipId, sellerId } = await req.json()

    if (!membershipId || !sellerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check permissions
    const canManageTeamRemoval = await hasPermission(payload, user.id, sellerId, 'team.remove')
    if (!canManageTeamRemoval && (user as unknown as { role: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch the membership to ensure we're not kicking the owner or themselves
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const membership = await (payload as any).findByID({
      collection: 'seller-members',
      id: membershipId,
    })

    if (!membership) {
        return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    if (membership.role === 'owner') {
        return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 403 })
    }

    const memberUserId = typeof membership.user === 'string' ? membership.user : membership.user?.id
    if (memberUserId === user.id) {
        return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 403 })
    }

    // Delete the membership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).delete({
      collection: 'seller-members',
      id: membershipId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove member:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
