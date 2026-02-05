import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { hasPermission, RoleMetadata } from '@/lib/rbac/permissions'
import { getEmailTemplate } from '@/lib/email-templates'

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
    const { email, role, sellerId } = await req.json()

    if (!email || !role || !sellerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if the current user has permission to invite to this team
    const canInvite = await hasPermission(payload, user.id, sellerId, 'team.invite')
    
    if (!canInvite && (user as unknown as { role: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch seller and inviter details for the email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seller = await (payload as any).findByID({
      collection: 'sellers',
      id: sellerId,
    })

    // Create the invite
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invite = await (payload as any).create({
      collection: 'team-invites',
      data: {
        email,
        role,
        seller: sellerId,
        invitedBy: user.id,
      },
    })

    // Send the email
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
    const inviteUrl = `${frontendUrl}/seller/invite/accept?token=${invite.token}`
    
    // Map role to label from centralized metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleLabel = (RoleMetadata as any)[role]?.label || 'Member'

    const emailHtml = getEmailTemplate('team-invite', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sellerName: (seller as any).name || 'their organization',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      invitedByName: (user as any).username || 'A team member',
      roleLabel: roleLabel,
      inviteUrl,
    })
    
    await payload.sendEmail({
      to: email,
      subject: `Invitation to join ${seller.name || 'team'} on Stond Emporium`,
      html: emailHtml,
    })

    return NextResponse.json({ success: true, invite })
  } catch (error) {
    console.error('Failed to send invite:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
