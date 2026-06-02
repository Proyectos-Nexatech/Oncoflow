// Módulo de integración con Google Drive API
// Este módulo maneja la carga, descarga y organización de documentos en Google Drive

import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

/**
 * Crea un cliente OAuth2 para Google Drive
 */
export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Genera la URL de autorización de Google OAuth2
 */
export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

/**
 * Crea las carpetas de organización en Google Drive
 * Estructura: ONCOFLOW/
 *   ├── Pacientes/
 *   │   └── {nombre_paciente}_{documento}/
 *   │       ├── Formulas/
 *   │       ├── Autorizaciones/
 *   │       └── Evidencias/
 *   └── Facturacion/
 *       └── {año}-{mes}/
 */
export async function crearEstructuraCarpetas(
  accessToken: string,
  nombrePaciente: string,
  documento: string
): Promise<{
  pacienteFolder: string;
  formulasFolder: string;
  autorizacionesFolder: string;
  evidenciasFolder: string;
}> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

  // Función auxiliar para crear o buscar carpeta
  async function getOrCreateFolder(name: string, parentId: string): Promise<string> {
    // Buscar si existe
    const searchRes = await drive.files.list({
      q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      return searchRes.data.files[0].id!;
    }

    // Crear nueva carpeta
    const createRes = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
    });

    return createRes.data.id!;
  }

  const pacientesFolder = await getOrCreateFolder('Pacientes', rootFolderId);
  const nombreCarpeta = `${nombrePaciente}_${documento}`.replace(/\s+/g, '_');
  const pacienteFolder = await getOrCreateFolder(nombreCarpeta, pacientesFolder);
  const formulasFolder = await getOrCreateFolder('Formulas', pacienteFolder);
  const autorizacionesFolder = await getOrCreateFolder('Autorizaciones', pacienteFolder);
  const evidenciasFolder = await getOrCreateFolder('Evidencias', pacienteFolder);

  return {
    pacienteFolder,
    formulasFolder,
    autorizacionesFolder,
    evidenciasFolder,
  };
}

/**
 * Sube un archivo a Google Drive
 */
export async function subirArchivo(
  accessToken: string,
  file: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string
): Promise<{ fileId: string; webViewLink: string }> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const { Readable } = await import('stream');
  const stream = Readable.from(file);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, webViewLink, webContentLink',
  });

  return {
    fileId: response.data.id!,
    webViewLink: response.data.webViewLink!,
  };
}

/**
 * Obtiene el enlace de visualización de un archivo
 */
export async function obtenerEnlaceArchivo(
  accessToken: string,
  fileId: string
): Promise<string> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const response = await drive.files.get({
    fileId,
    fields: 'webViewLink',
  });

  return response.data.webViewLink!;
}

/**
 * Elimina un archivo de Google Drive
 */
export async function eliminarArchivo(
  accessToken: string,
  fileId: string
): Promise<void> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  await drive.files.delete({ fileId });
}
