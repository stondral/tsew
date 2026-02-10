import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { User } from "@/payload-types";
import crypto from "crypto";

interface ExtendedUser extends User {
  _verified?: boolean;
  _verificationToken?: string;
}

// Minimal in-memory rate limit (best-effort; for multi-instance use Redis/Upstash)
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function checkRateLimit(key: string) {
  const now = Date.now();
  const entry = rateLimit.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimit.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count += 1;
  return true;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const key = `${ip}:${String(email).toLowerCase()}`;
    if (!checkRateLimit(key)) {
      return NextResponse.json(
        { message: "Too many requests. Please try again in a minute." },
        { status: 429 },
      );
    }

    const payload = await getPayload({ config });

    // Find the user by email
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

    if (!users.docs || users.docs.length === 0) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: "If this email is registered, a verification link will be sent." },
        { status: 200 },
      );
    }

    const user = users.docs[0] as ExtendedUser;

    // If already verified, respond generically.
    if (user._verified) {
      return NextResponse.json(
        { message: "If this email is registered, a verification link will be sent." },
        { status: 200 },
      );
    }

    // Reuse existing token if present, to keep already-sent links valid.
    let token = user._verificationToken;

    if (!token) {
      token = crypto.randomBytes(32).toString("hex");

      await payload.update({
        collection: "users",
        id: user.id,
        data: {
          _verificationToken: token,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        overrideAccess: true,
      });
    }

    // Send verification email
    try {
      const userConfig = payload.collections.users.config;
      const verifyConfig =
        userConfig.auth && typeof userConfig.auth === "object"
          ? userConfig.auth.verify
          : null;
      const htmlGenerator =
        typeof verifyConfig === "object" && verifyConfig
          ? verifyConfig.generateEmailHTML
          : null;

      const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
      const html = htmlGenerator
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (htmlGenerator as any)({ token, user })
        : `<p>Please verify your email by clicking <a href=\"${frontendUrl}/auth/verify?token=${token}\">here</a>.</p>`;

      await payload.sendEmail({
        from: process.env.SMTP_FROM_EMAIL || "noreply@localhost",
        to: email,
        subject: "Verify your Stondemporium account",
        html: html as string,
      });

      return NextResponse.json(
        { message: "If this email is registered, a verification link will be sent." },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error sending verification email:", error);
      return NextResponse.json(
        { message: "Failed to send verification email" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in verify-resend endpoint:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
