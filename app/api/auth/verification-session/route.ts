import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SESSION_TTL_MINUTES = 30;

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const payload = await getPayload({ config });

    const users = await payload.find({
      collection: "users",
      where: {
        email: {
          equals: email,
        },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (!users.docs?.length) {
      // Security: don't reveal whether the email exists.
      return NextResponse.json({ sessionId: null }, { status: 200 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = users.docs[0] as any;

    if (user._verified === true) {
      return NextResponse.json({ sessionId: null }, { status: 200 });
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + DEFAULT_SESSION_TTL_MINUTES * 60 * 1000);

    await payload.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      collection: "verification-sessions" as any,
      data: {
        sessionId,
        user: user.id,
        status: "pending",
        expiresAt: expiresAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      overrideAccess: true,
      depth: 0,
    });

    return NextResponse.json({ sessionId }, { status: 200 });
  } catch (err: unknown) {
    console.error("/api/auth/verification-session error:", err);
    return NextResponse.json({ sessionId: null }, { status: 200 });
  }
}
