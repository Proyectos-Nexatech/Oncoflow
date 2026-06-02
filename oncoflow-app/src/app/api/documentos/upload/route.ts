import { NextRequest, NextResponse } from 'next/server';
import { crearEstructuraCarpetas, subirArchivo } from '@/lib/google-drive';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const pacienteId = formData.get('pacienteId') as string;
    const tipo = formData.get('tipo') as string;
    const entregaId = formData.get('entregaId') as string;

    if (!file || !pacienteId || !tipo) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Idealmente usar service_role key para API routes
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener info del paciente para nombrar la carpeta
    const { data: paciente, error: pacError } = await supabase
      .from('pacientes')
      .select('nombre_completo, numero_documento')
      .eq('id', pacienteId)
      .single();

    if (pacError || !paciente) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // 1. Obtener Access Token refrescando el Refresh Token
    const { google } = await import('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const { token } = await oauth2Client.getAccessToken();

    if (!token) {
      return NextResponse.json({ error: 'Error autenticando con Google Drive' }, { status: 500 });
    }

    // 2. Asegurar estructura de carpetas
    const carpetas = await crearEstructuraCarpetas(
      token,
      paciente.nombre_completo,
      paciente.numero_documento
    );

    // 3. Determinar carpeta destino según el tipo
    let folderId = carpetas.evidenciasFolder;
    if (tipo === 'formula_medica') folderId = carpetas.formulasFolder;
    if (tipo === 'autorizacion') folderId = carpetas.autorizacionesFolder;

    // 4. Subir archivo a Drive
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${tipo}_${Date.now()}_${file.name}`;
    const driveFile = await subirArchivo(token, buffer, fileName, file.type, folderId);

    // 5. Guardar registro en Supabase
    const { data: docRecord, error: docError } = await supabase
      .from('documentos')
      .insert({
        paciente_id: pacienteId,
        entrega_id: entregaId || null,
        tipo,
        nombre_archivo: file.name,
        archivo_url: driveFile.webViewLink,
        drive_file_id: driveFile.fileId,
        estado: 'pendiente'
      })
      .select()
      .single();

    if (docError) {
      console.error('Error insertando en Supabase:', docError);
      return NextResponse.json({ error: 'Error guardando registro en base de datos' }, { status: 500 });
    }

    return NextResponse.json({ success: true, documento: docRecord });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
