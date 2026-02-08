import { getPayload } from "payload"
import configPromise from "@payload-config"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  args: { params: Promise<{ token: string }> } // 👈 Type as a Promise
) {
  const payload = await getPayload({ config: configPromise })
  
  // ✅ 1. Await params before using them (Next.js 15 requirement)
  const { token } = await args.params 

  try {
    const success = await payload.verifyEmail({
      collection: "users",
      token: token,
    })

    if (!success) {
      return NextResponse.json(
        { message: "Invalid or expired token." },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: "Email verified successfully." })
  } catch (error) {
    console.error("Verification Error:", error)
    return NextResponse.json(
      { message: "Verification failed." },
      { status: 500 }
    )
  }
}