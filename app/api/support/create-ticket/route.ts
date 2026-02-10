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

    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create support ticket
    const ticket = await payload.create({
      collection: 'support-tickets',
      data: {
        customer: user.id,
        subject,
        order: orderId,
        status: 'open',
        priority: 'normal',
      },
      overrideAccess: true,
    });

    console.log(`✅ Ticket created with ID: ${ticket.id}`);

    // Create initial message
    await payload.create({
      collection: 'support-messages',
      data: {
        ticket: ticket.id,
        sender: user.id,
        senderType: 'customer',
        content: message,
        deliveryStatus: 'sent',
      },
      overrideAccess: true,
    });

    console.log(`✅ Initial message created for ticket ${ticket.id}`);

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
      },
    });
  } catch (error) {
    console.error('❌ Failed to create ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
