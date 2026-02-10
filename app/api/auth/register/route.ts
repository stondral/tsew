import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SESSION_TTL_MINUTES = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, phone, password } = body || {};

    if (!username || !email || !phone || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const payload = await getPayload({ config });

    // Create user (forces role to user)
    const user = await payload.create({
      collection: "users",
      data: {
        username,
        email,
        phone,
        password,
        role: "user",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      overrideAccess: true,
      depth: 0,
    });

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

    return NextResponse.json({ sessionId });
  } catch (_err: unknown) {
    const message = _err instanceof Error ? _err.message : "Registration failed";
    console.error("/api/auth/register error:", _err);
    return NextResponse.json({ message }, { status: 500 });
  }
}
