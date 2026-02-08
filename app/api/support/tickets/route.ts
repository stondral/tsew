import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const payload = await getPayload({ config });
    const requestHeaders = await headers();
    const { user } = await payload.auth({ headers: requestHeaders });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    // Find active ticket for this user/order
    const { docs: tickets } = await payload.find({
      collection: 'support-tickets',
      where: {
        and: [
          { customer: { equals: user.id } },
          orderId ? { order: { equals: orderId } } : {},
        ],
      },
      sort: '-updatedAt',
      limit: 1,
      overrideAccess: true,
    });

    return NextResponse.json({ ticket: tickets[0] || null });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config });
    const requestHeaders = await headers();
    const { user } = await payload.auth({ headers: requestHeaders });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subject, orderId } = await req.json();

    // Create new ticket
    const ticket = await payload.create({
      collection: 'support-tickets',
      data: {
        customer: user.id,
        order: orderId || null,
        subject: subject || "Customer Support Request",
        status: 'open',
        priority: 'medium',
      },
      overrideAccess: true,
    });

    return NextResponse.json({ ticket });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const payload = await getPayload({ config });
    const requestHeaders = await headers();
    const { user } = await payload.auth({ headers: requestHeaders });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketId, status } = await req.json();

    if (!ticketId || !status) {
      return NextResponse.json({ error: "Ticket ID and status are required" }, { status: 400 });
    }

    const ticket = await payload.update({
      collection: 'support-tickets',
      id: ticketId,
      data: {
        status,
      },
      overrideAccess: true,
    });

    return NextResponse.json({ ticket });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
