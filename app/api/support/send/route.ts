import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { broadcastToTicket } from '@/app/api/support/stream/manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, content, senderType } = body;

    if (!ticketId || !content || !senderType) {
      return NextResponse.json(
        { error: 'Missing required fields: ticketId, content, senderType' },
        { status: 400 }
      );
    }

    console.log(`📨 Message send requested for ticket ${ticketId} by ${senderType}`);

    // Get auth token from cookie or header
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

      // Save message to database
      const payloadInstance = await getPayload({ config });

      console.log(`💾 Saving message to database for ticket ${ticketId}`);

      const message = await payloadInstance.create({
        collection: 'support-messages',
        data: {
          ticket: ticketId,
          sender: userId,
          senderType,
          content,
          deliveryStatus: 'sent',
        },
      });

      console.log(`✅ Message saved with ID: ${message.id}`);

      // Broadcast to all clients connected to this ticket
      const broadcastData = {
        id: message.id,
        ticketId,
        sender: userId,
        senderType,
        content,
        deliveryStatus: 'sent',
        createdAt: message.createdAt || new Date().toISOString(),
        _status: 'received',
      };

      broadcastToTicket(ticketId, broadcastData);

      // Also broadcast notification to admin stream (if admin supports it)
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
    } catch (err) {
      console.error('❌ JWT decode error:', err);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('❌ Message send error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
