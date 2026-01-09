import { NextResponse } from 'next/server';
import { getUserRatingsCountServer } from '@/lib/ratings';

export async function GET() {
  const count = await getUserRatingsCountServer();
  return NextResponse.json({ count });
}
