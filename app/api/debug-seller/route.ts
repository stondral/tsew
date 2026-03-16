
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const sellerId = request.nextUrl.searchParams.get("sellerId");
  
  const payload = await getPayload({ config });

  if (request.nextUrl.searchParams.get("action") === "check_seller") {
    const sid = request.nextUrl.searchParams.get("check_id");
    if (!sid) return new NextResponse("Missing check_id", { status: 400 });
    
    try {
      const seller = await payload.findByID({
        collection: "sellers",
        id: sid,
      });
      return new NextResponse(`EXISTS: ${seller.name}`, { status: 200 });
    } catch {
      return new NextResponse("NOT_FOUND", { status: 404 });
    }
  }
  if (request.nextUrl.searchParams.get("action") === "fix_product") {
    const p_slug = request.nextUrl.searchParams.get("target_slug");
    const newSellerId = request.nextUrl.searchParams.get("new_seller_id");
    
    if (!p_slug || !newSellerId) return new NextResponse("Missing params", { status: 400 });

    await payload.update({
      collection: "products",
      where: { slug: { equals: p_slug } },
      data: { seller: newSellerId }
    });
    
    return new NextResponse(`Updated product ${p_slug} with seller ${newSellerId}`, { status: 200 });
  }

  if (sellerId) {
    const seller = await payload.findByID({
      collection: "sellers",
      id: sellerId,
    });
    return NextResponse.json({ seller });
  }

  if (request.nextUrl.searchParams.get("action") === "scan_integrity") {
    const products = await payload.find({
      collection: "products",
      limit: 50,
      depth: 0, 
    });
    
    const report = [];
    for (const p of products.docs) {
      if (!p.seller) {
        report.push(`Product ${p.slug}: No seller field`);
        continue;
      }
      const p_sellerId = typeof p.seller === 'object' ? (p.seller as any).id : p.seller; // eslint-disable-line @typescript-eslint/no-explicit-any
      
      try {
        const seller = await payload.findByID({
            collection: "sellers",
            id: p_sellerId
        });
        report.push(`Product ${p.slug}: OK (Seller: ${seller.name})`);
      } catch {
        report.push(`Product ${p.slug}: BROKEN LINK (Seller ID: ${p_sellerId})`);
      }
    }
    
    return new NextResponse(report.join('\n'), {
      status: 200, 
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  if (!slug) {
    const products = await payload.find({
      collection: "products",
      limit: 1,
      depth: 3,
    });
    if (products.docs.length > 0) {
      const p = products.docs[0];
      const keys = Object.keys(p).join(', ');
      return new NextResponse(`KEYS:${keys}\nFULL_DATA:${JSON.stringify(p, null, 2)}`, {
        status: 200, 
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    return NextResponse.json({ error: "No products found" });
  }
  
  const data = await payload.find({
    collection: "products",
    where: {
      slug: { equals: slug },
    },
    limit: 1,
    depth: 3,
    overrideAccess: true,
  });

  if (data.docs.length === 0) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const p = data.docs[0];
  const p_seller = (p as any).seller; // eslint-disable-line @typescript-eslint/no-explicit-any
  
  return NextResponse.json({
    id: p.id,
    name: p.name,
    sellerType: typeof p_seller,
    seller: p_seller,
    sellerKeys: typeof p_seller === 'object' ? Object.keys(p_seller as object) : null
  });
}
