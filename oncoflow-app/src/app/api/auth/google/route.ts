import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-drive';

export async function GET() {
  try {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Error generando URL de Google OAuth:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
