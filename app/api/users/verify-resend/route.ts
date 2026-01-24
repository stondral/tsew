import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { User } from "@/payload-types";

interface ExtendedUser extends User {
  _verified?: boolean;
  _verificationToken?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
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
    });

    if (!users.docs || users.docs.length === 0) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: "If this email is registered, a verification link will be sent." },
        { status: 200 }
      );
    }

    const user = users.docs[0] as ExtendedUser;

    // Check if already verified
    if (user._verified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate/Reuse verification token
    // If user has a token already, we can use it, otherwise generate one
    let token = user._verificationToken;
    
    if (!token) {
      token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await payload.update({
        collection: "users",
        id: user.id,
        data: {
          _verificationToken: token,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });
    }

    // Send verification email
    try {
      const userConfig = payload.collections.users.config;
      const verifyConfig = userConfig.auth && typeof userConfig.auth === 'object' ? userConfig.auth.verify : null;
      const htmlGenerator = typeof verifyConfig === 'object' && verifyConfig ? verifyConfig.generateEmailHTML : null;
      
      const html = htmlGenerator 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (htmlGenerator as any)({ token, user })
        : `<p>Please verify your email by clicking <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL}/auth/verify?token=${token}">here</a>.</p>`;

      await payload.sendEmail({
        from: process.env.SMTP_FROM_EMAIL || "noreply@stondemporium.tech",
        to: email,
        subject: "Verify your Stondemporium account",
        html: html as string,
      });

      return NextResponse.json(
        { message: "Verification email sent successfully" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error sending verification email:", error);
      return NextResponse.json(
        { message: "Failed to send verification email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in verify-resend endpoint:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
