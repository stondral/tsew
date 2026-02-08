import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const requestHeaders = await headers();
    const { user } = await payload.auth({ headers: requestHeaders });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { id } = await props.params;

  const ticket = await payload.findByID({
      collection: 'support-tickets',
      id,
      depth: 1,
      overrideAccess: true,
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check access
    const customerId = typeof ticket.customer === 'object' ? (ticket.customer as { id: string }).id : ticket.customer;
    const isAdmin = (user as unknown as { role?: string }).role === 'admin';

    if (customerId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
