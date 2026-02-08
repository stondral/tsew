import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@/payload.config";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const waybill = searchParams.get("waybill");

  if (!waybill) {
    return new Response("Waybill required", { status: 400 });
  }

  // Security check: Ensure the requester is a seller or admin
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user } = await payload.auth({ headers: requestHeaders });

  if (!user || (user.role !== "seller" && user.role !== "admin")) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const delhiveryRes = await fetch(
      `https://track.delhivery.com/api/p/waybill/label/?wbns=${waybill}&format=pdf`,
      {
        headers: {
          Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
        },
      }
    );

    if (!delhiveryRes.ok) {
      console.error(`Delhivery Label API Error: ${delhiveryRes.status} ${delhiveryRes.statusText}`);
      const errorText = await delhiveryRes.text();
      console.error(`Error details: ${errorText}`);
      return new Response("Failed to fetch label from Delhivery", { status: 500 });
    }

    const pdfBuffer = await delhiveryRes.arrayBuffer();

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=label-${waybill}.pdf`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Delhivery label proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
