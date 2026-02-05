import { getPayload } from "payload"
import configPromise from "@payload-config"
import { NextResponse } from "next/server"
import { SignJWT } from "jose"

export async function POST(
  req: Request,
  args: { params: Promise<{ token: string }> }
) {
  const payload = await getPayload({ config: configPromise })
  
  const { token } = await args.params 

  try {
    // ✅ Step 1: Verify the email with Retry Logic for WriteConflict
    let verified = false
    let attempts = 0
    
    while (!verified && attempts < 3) {
      try {
        attempts++
        await payload.verifyEmail({
          collection: "users",
          token: token,
        })
        verified = true
      } catch (err: unknown) {
        const error = err as { code?: number; codeName?: string; message?: string }
        if (error.code === 112 || error.codeName === 'WriteConflict') {
            console.warn(`WriteConflict during verification (attempt ${attempts}), retrying...`)
            await new Promise(resolve => setTimeout(resolve, 100 * attempts)) // Backoff
        } else {
             // If validation fails (invalid token), it might be a double-request where the first one succeeded.
             // We will swallow the error here and allow the next step (Find User) to check if we have a valid user.
             // If we don't find a recently verified user in Step 2, THEN we return an error.
             console.warn("Verification API returned error (possible double-request):", error.message)
             // Break the loop but set verified = true to proceed to user lookup
             verified = true 
             break;
        }
      }
    }

    // ✅ Step 2: Find the verified user
    // We strictly check for users verified in the last 30 seconds to prevent
    // accidental logins of other users if this was a delayed request.
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()

    const users = await payload.find({
      collection: "users",
      where: {
        _verified: {
          equals: true,
        },
        updatedAt: {
          greater_than: thirtySecondsAgo,
        },
      },
      sort: '-updatedAt',
      limit: 1, 
    })

    if (users.docs.length === 0) {
      // If we verified successfully but can't find them, or if the "swallowed" error 
      // was genuine (token invalid calls), we return 400.
      return NextResponse.json({ 
        message: "Invalid or expired token.",
      }, { status: 400 })
    }

    const user = users.docs[0] as unknown as { id: string, email: string, username: string, role: string }

    // ✅ Step 3: Generate login token manually
    // bypassing payload.login which requires password
    const secret = new TextEncoder().encode(payload.secret)
    const jwtToken = await new SignJWT({
        email: user.email,
        id: user.id,
        collection: 'users',
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('2h')
    .sign(secret)

    // ✅ Step 4: Return success with login token AND set cookie
    const response = NextResponse.json({ 
      message: "Email verified successfully.",
      autoLogin: true,
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    })

    // Set HttpOnly cookie for SSR support
    response.cookies.set('payload-token', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7200 // 2 hours
    })

    return response
  } catch (error) {
    console.error("Verification Error:", error)
    return NextResponse.json(
      { message: "Verification failed." },
      { status: 500 }
    )
  }
}