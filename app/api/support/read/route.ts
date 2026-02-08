import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { broadcastToTicket } from "@/app/api/support/stream/manager";

export async function PATCH(req: Request) {
  try {
    const payload = await getPayload({ config });
    const requestHeaders = await headers();
    const { user } = await payload.auth({ headers: requestHeaders });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketId } = await req.json();

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    // Mark all messages as read (except those sent by current user)
    await payload.update({
      collection: 'support-messages',
      where: {
        and: [
          { ticket: { equals: ticketId } },
          { sender: { not_equals: user.id } },
          { deliveryStatus: { not_equals: 'read' } }
        ]
      },
      data: {
        deliveryStatus: 'read'
      },
      overrideAccess: true,
    });

    // Broadcast reading status
    broadcastToTicket(ticketId, {
      type: 'read_receipt',
      ticketId,
      readerId: user.id
    });

    return NextResponse.json({ success: true });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
