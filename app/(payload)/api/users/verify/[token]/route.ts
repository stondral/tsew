import { getFieldsToSign, getPayload, jwtSign } from "payload";
import configPromise from "@payload-config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveSameSite(
  sameSite: unknown,
): "lax" | "strict" | "none" | undefined {
  if (typeof sameSite === "string") {
    const v = sameSite.toLowerCase();
    if (v === "lax" || v === "strict" || v === "none") return v;
  }
  if (sameSite === true) return "strict";
  return undefined;
}

export async function POST(
  req: Request,
  args: { params: Promise<{ token: string }> },
) {
  const payload = await getPayload({ config: configPromise });

  // ✅ Await params before using them (Next.js 15 requirement)
  const { token } = await args.params;

  try {
    // Find user before verifying (verifyEmail clears the token)
    const found = await payload.find({
      collection: "users",
      where: {
        _verificationToken: {
          equals: token,
        },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });

    if (!found.docs?.length) {
      return NextResponse.json(
        { message: "Invalid or expired token." },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = found.docs[0] as any;

    const success = await payload.verifyEmail({
      collection: "users",
      token,
    });

    if (!success) {
      return NextResponse.json(
        { message: "Invalid or expired token." },
        { status: 400 },
      );
    }

    // Mark any active verification sessions for this user as verified
    await payload.update({
      collection: "verification-sessions",
      where: {
        and: [
          { user: { equals: user.id } },
          { status: { equals: "pending" } },
        ],
      },
      data: {
        status: "verified",
        verifiedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    });

    // Auto-login on this device by issuing a Payload-compatible auth cookie
    const usersCollection = payload.collections["users"].config;
    const email = typeof user.email === "string" ? user.email.toLowerCase().trim() : "";

    const fieldsToSign = getFieldsToSign({
      collectionConfig: usersCollection,
      email,
      user,
    });

    const { token: authToken, exp } = await jwtSign({
      fieldsToSign,
      secret: payload.secret,
      tokenExpiration: usersCollection.auth.tokenExpiration,
    });

    const res = NextResponse.json({
      verified: true,
      loggedIn: true,
      exp,
    });

    const cookieName = `${payload.config.cookiePrefix}-token`;
    const expires = new Date(Date.now() + usersCollection.auth.tokenExpiration * 1000);

    res.cookies.set(cookieName, authToken, {
      httpOnly: true,
      secure: Boolean(usersCollection.auth.cookies?.secure),
      sameSite: resolveSameSite(usersCollection.auth.cookies?.sameSite),
      path: "/",
      domain: usersCollection.auth.cookies?.domain || undefined,
      expires,
    });

    return res;
  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.json({ message: "Verification failed." }, { status: 500 });
  }
}
