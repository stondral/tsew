import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { broadcastToTicket } from '@/app/api/support/stream/manager';
import { appendCachedMessage } from '@/lib/redis/chat';

function resolveSenderType(user: unknown): 'admin' | 'customer' | 'seller' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (user as any)?.role;
  if (role === 'admin') return 'admin';
  if (role === 'seller' || role === 'sellerEmployee') return 'seller';
  return 'customer';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, content } = body;

    if (!ticketId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: ticketId, content' },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const senderType = resolveSenderType(user);

    // Authorize access to ticket
    const ticket = await payload.findByID({
      collection: 'support-tickets',
      id: ticketId,
      depth: 0,
      overrideAccess: true,
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerId = typeof (ticket as any).customer === 'object' ? (ticket as any).customer?.id : (ticket as any).customer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isAdmin = (user as any).role === 'admin';

    if (!isAdmin && customerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log(`📨 Message send requested for ticket ${ticketId} by ${senderType}`);

    console.log(`💾 Saving message to database for ticket ${ticketId}`);
    const message = await payload.create({
      collection: 'support-messages',
      data: {
        ticket: ticketId,
        sender: user.id,
        senderType,
        content,
        deliveryStatus: 'sent',
      },
      overrideAccess: true,
    });

    console.log(`✅ Message saved with ID: ${message.id}`);

    // Broadcast to all clients connected to this ticket
    const broadcastData = {
      id: message.id,
      ticketId,
      sender: user.id,
      senderType,
      content,
      deliveryStatus: 'sent',
      createdAt: message.createdAt || new Date().toISOString(),
      _status: 'received',
    };

    broadcastToTicket(ticketId, broadcastData);

    // Append to Redis cache to avoid slow DB reads for active sessions
    await appendCachedMessage(ticketId, broadcastData);

    // Also broadcast notification to admin stream
    broadcastToTicket('admin-notifications', {
      type: 'new_message',
      ticketId,
      senderType,
      content: content.substring(0, 50),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: broadcastData,
    });
  } catch (error) {
    console.error('❌ Message send error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
