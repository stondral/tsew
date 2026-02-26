import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getCachedMessages, cacheMessages } from "@/lib/redis/chat";

export async function GET(req: Request) {
  try {
    const payload = await getPayload({ config });
    const requestHeaders = await headers();
    const { user } = await payload.auth({ headers: requestHeaders });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID required" }, { status: 400 });
    }

    // Check if user has access to this ticket
    const ticket = await payload.findByID({
      collection: 'support-tickets',
      id: ticketId,
      depth: 1,
      overrideAccess: true, // Manual check below
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerId = typeof ticket.customer === 'object' ? (ticket.customer as any).id : ticket.customer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isAdmin = (user as any).role === 'admin';

    if (customerId !== user.id && !isAdmin) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.warn(`403 Forbidden: User ${user.email} (role: ${(user as any).role}) attempted to access ticket ${ticketId} owned by ${customerId}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const cachedMessages = await getCachedMessages(ticketId);
    if (cachedMessages) {
      console.log(`🚀 Redis Cache HIT for ticket messages: ${ticketId}`);
      return NextResponse.json({ docs: cachedMessages });
    }

    console.log(`🐌 Cache MISS for ticket messages: ${ticketId}. Fetching from DB...`);
    const { docs: messages } = await payload.find({
      collection: 'support-messages',
      where: {
        ticket: { equals: ticketId },
      },
      sort: 'createdAt',
      limit: 100,
      overrideAccess: true, // We already verified access above
    });

    // Populate the cache in the background (fire-and-forget or await)
    await cacheMessages(ticketId, messages);

    return NextResponse.json({ docs: messages });
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
