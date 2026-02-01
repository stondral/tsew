import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Seller ID is required' },
      { status: 400 }
    );
  }

  try {
    const payload = await getPayload({ config });
    const seller = await payload.findByID({
      collection: 'users',
      id,
    });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ seller });
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller data' },
      { status: 500 }
    );
  }
}
