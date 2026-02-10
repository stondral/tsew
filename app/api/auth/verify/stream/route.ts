import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 2000;
const HEARTBEAT_MS = 15000;

function sseData(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ message: "Missing sessionId" }, { status: 400 });
  }

  const payload = await getPayload({ config });

  const encoder = new TextEncoder();
  let pollTimer: NodeJS.Timeout | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let inFlight = false;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const close = () => {
        if (closed) return;
        closed = true;
        if (pollTimer) clearInterval(pollTimer);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      // Initial comment so EventSource considers connection established
      controller.enqueue(encoder.encode(":connected\n\n"));

      const checkOnce = async () => {
        if (closed || inFlight) return;
        inFlight = true;

        try {
          const sessions = await payload.find({
            collection: "verification-sessions",
            where: {
              sessionId: {
                equals: sessionId,
              },
            },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          });

          if (!sessions.docs?.length) {
            try {
              controller.enqueue(encoder.encode(sseData({ type: "not_found" })));
            } catch {
              // ignore
            }
            close();
            return;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const session = sessions.docs[0] as any;

          const expiresAt = session.expiresAt ? new Date(session.expiresAt) : null;
          if (expiresAt && expiresAt.getTime() < Date.now()) {
            try {
              controller.enqueue(encoder.encode(sseData({ type: "expired" })));
            } catch {
              // ignore
            }
            close();
            return;
          }

          if (session.status === "verified" || session.status === "consumed") {
            try {
              controller.enqueue(encoder.encode(sseData({ type: "verified" })));
            } catch {
              // ignore
            }
            close();
            return;
          }
        } catch {
          // ignore
        } finally {
          inFlight = false;
        }
      };

      // Kick off immediately, then poll
      await checkOnce();
      if (closed) return;

      pollTimer = setInterval(checkOnce, POLL_INTERVAL_MS);
      heartbeatTimer = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(":keep-alive\n\n"));
        } catch {
          // ignore
        }
      }, HEARTBEAT_MS);
    },
    cancel() {
      closed = true;
      if (pollTimer) clearInterval(pollTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
