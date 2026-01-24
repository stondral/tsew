import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const requestHeaders = await headers();

    // Authenticate the user
    const { user } = await payload.auth({
      headers: requestHeaders,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Payload's media collection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const media = await (payload as any).create({
      collection: "media",
      data: {
        alt: file.name,
      },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
    });

    console.log("Uploaded media:", media);

    // Construct the media URL
    const mediaUrl = media.url || (media.filename ? `/media/${media.filename}` : null);

    return NextResponse.json({
      success: true,
      media: {
        id: media.id,
        url: mediaUrl,
        filename: media.filename,
      },
    });
  } catch (_error: unknown) {
    console.error("Upload error:", _error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ error: (_error as any).message || "Upload failed" }, { status: 500 });
  }
}
