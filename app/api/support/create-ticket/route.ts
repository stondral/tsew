import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, message, orderId, orderNumber } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, message' },
        { status: 400 }
      );
    }

    console.log(`📨 Creating support ticket for order ${orderNumber}`);

    // Get auth token
    const token = request.cookies.get('payload-token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode JWT to get user ID
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );

      const userId = payload.id;
      if (!userId) {
        return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
      }

      // Get Payload instance
      const payloadInstance = await getPayload({ config });

      // Create support ticket
      const ticket = await (payloadInstance as any).create({
        collection: 'support-tickets',
        data: {
          customer: userId,
          subject,
          order: orderId,
          status: 'open',
          priority: 'normal',
        },
      });

      console.log(`✅ Ticket created with ID: ${ticket.id}`);

      // Create initial message
      await (payloadInstance as any).create({
        collection: 'support-messages',
        data: {
          ticket: ticket.id,
          sender: userId,
          senderType: 'customer',
          content: message,
          deliveryStatus: 'sent',
        },
      });

      console.log(`✅ Initial message created for ticket ${ticket.id}`);

      return NextResponse.json({
        success: true,
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
        },
      });
    } catch (err) {
      console.error('❌ JWT decode error:', err);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('❌ Failed to create ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
