import { NextResponse } from 'next/server';

export function jsonError(message: string, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}
