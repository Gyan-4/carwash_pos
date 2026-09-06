import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();

  try {
    await connectToDatabase();

    return NextResponse.json({
      success: true,
      status: 'ok',
      database: 'connected',
      environment: process.env.NODE_ENV,
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('GET /api/health failed:', error);

    return NextResponse.json(
      {
        success: false,
        status: 'degraded',
        database: 'unavailable',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
