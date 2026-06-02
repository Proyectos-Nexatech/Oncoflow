import { NextResponse, type NextRequest } from 'next/server';
import { getOAuth2Client } from '@/lib/google-drive';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    // Aquí deberíamos guardar el refresh_token en la base de datos o variables de entorno
    // Para propósitos del demo, lo mostramos en la respuesta HTML
    
    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h2 style="color: #1A9E6B;">¡Autorización con Google Drive Exitosa!</h2>
          <p>Por favor copia este Refresh Token y añádelo a tu archivo .env.local como GOOGLE_REFRESH_TOKEN:</p>
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; font-family: monospace; word-break: break-all; max-width: 600px; margin: 0 auto;">
            ${tokens.refresh_token || 'No refresh token received. Make sure you forced the consent prompt.'}
          </div>
          <br>
          <a href="/dashboard" style="color: #0F5FA6; text-decoration: none; font-weight: bold;">← Volver al Dashboard</a>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Error in Google OAuth Callback:', error);
    return NextResponse.json({ error: 'Error exchanging code for tokens' }, { status: 500 });
  }
}
