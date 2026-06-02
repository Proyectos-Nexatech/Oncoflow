# 🏥 ONCOFLOW
### Sistema Web de Gestión y Control de Entrega de Medicamentos Oncológicos

![ONCOFLOW Dashboard](../oncoflow_dashboard_design_1780328102122.png)

---

## 📋 Descripción

**ONCOFLOW** es un sistema web responsive multiusuario para gestionar y controlar la programación diaria y semanal de entrega de medicamentos oncológicos a pacientes, incluyendo el control documental, administrativo y de facturación mensual.

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Estilos | Tailwind CSS |
| Base de Datos | PostgreSQL (Supabase) |
| Autenticación | Supabase Auth + JWT |
| Storage Documentos | Google Drive API |
| Gráficas | Recharts |
| Calendario | FullCalendar |
| Formularios | React Hook Form + Zod |
| Estado | Zustand + React Query |

## 🏗️ Estructura del Proyecto

```
oncoflow-app/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/          # Página de login
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/      # Dashboard principal
│   │   │   ├── pacientes/      # Gestión de pacientes
│   │   │   ├── programacion/   # Scheduler de entregas
│   │   │   ├── medicamentos/   # Catálogo e inventario
│   │   │   ├── entregas/       # Registro de entregas
│   │   │   ├── documentos/     # Gestión documental
│   │   │   ├── facturacion/    # Consolidado mensual
│   │   │   ├── reportes/       # Reportes exportables
│   │   │   └── admin/          # Administración
│   │   └── api/                # API Routes
│   ├── components/
│   │   ├── ui/                 # Componentes base
│   │   └── layout/             # Sidebar, Header, Layout
│   ├── lib/
│   │   ├── supabase/           # Cliente Supabase
│   │   ├── google-drive.ts     # Integración Google Drive
│   │   └── utils.ts            # Utilidades
│   ├── hooks/                  # Custom React Hooks
│   └── types/                  # Tipos TypeScript
├── supabase/
│   ├── schema.sql              # Esquema de base de datos
│   └── seed.sql                # Datos de prueba
└── .env.local.example          # Variables de entorno
```

## 🚀 Instalación y Configuración

### 1. Variables de Entorno

Copia `.env.local.example` a `.env.local` y configura:

```bash
cp .env.local.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ...

# Google Drive (para almacenamiento de documentos)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_DRIVE_FOLDER_ID=1ABC...  # ID de la carpeta raíz en Drive
```

### 2. Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar `supabase/schema.sql`
3. Ejecutar `supabase/seed.sql` para datos de prueba
4. En **Authentication > Providers**, habilitar Email/Password
5. En **Authentication > URL Configuration**, agregar `http://localhost:3000`

### 3. Configurar Google Drive API

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear proyecto o usar existente
3. Habilitar **Google Drive API**
4. Crear credenciales OAuth 2.0 (tipo: Web Application)
5. Agregar `http://localhost:3000/api/auth/google/callback` como URI autorizado
6. Copiar Client ID y Client Secret al `.env.local`
7. Crear una carpeta en Google Drive y copiar su ID

### 4. Ejecutar el Proyecto

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Abrir http://localhost:3000
```

## 👥 Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| **Administrador** | Acceso total al sistema |
| **Coordinador** | Gestión operativa y seguimiento |
| **Farmacia** | Medicamentos, inventario y entregas |
| **Facturación** | Consolidados y documentación |
| **Médico** | Pacientes y programaciones (lectura) |
| **Auxiliar** | Registro de entregas y documentos |
| **Auditor** | Lectura total + reportes |

## 📦 Módulos del Sistema

1. **Dashboard** — KPIs, gráficas, alertas, calendario del día
2. **Pacientes** — CRUD completo + gestión documental
3. **Programación** — Scheduler semanal con estados y reprogramación
4. **Medicamentos** — Catálogo + control de inventario y lotes
5. **Entregas** — Registro con validaciones y carga de evidencias
6. **Documentos** — Control centralizado con alertas de vencimiento
7. **Facturación** — Consolidado mensual por EPS con exportación
8. **Reportes** — PDF y Excel operativos y administrativos
9. **Administración** — Usuarios, roles y auditoría

## 🔄 Flujo del Sistema

```
Paciente → Documentación → Programación → Validación → Entrega → Facturación → Reportes
```

## 📊 Estructura de Base de Datos

Ver `supabase/schema.sql` para el esquema completo.

Tablas principales:
- `usuarios` — Usuarios del sistema con roles
- `pacientes` — Registro de pacientes oncológicos
- `medicamentos` — Catálogo con control de stock
- `programaciones` — Agenda de entregas
- `entregas` — Registro de entregas realizadas
- `documentos` — Documentación por paciente
- `facturacion` — Consolidados de facturación
- `auditoria` — Log de auditoría del sistema

## 🔐 Seguridad

- Autenticación con Supabase Auth (JWT)
- Row Level Security (RLS) en todas las tablas
- Control de acceso basado en roles (RBAC)
- HTTPS obligatorio en producción
- Log de auditoría completo
- Contraseñas hasheadas (bcrypt via Supabase)

## 📱 Responsive Design

Compatible con:
- 🖥️ Desktop (1920px+)
- 💻 Laptop (1024px-1920px)
- 📱 Tablet (768px-1024px)
- 📱 Mobile (320px-768px)

## 🚢 Despliegue (Producción)

```bash
# Build de producción
npm run build

# Iniciar servidor
npm start
```

Plataformas recomendadas: **Vercel** (frontend) + **Supabase** (backend/DB)

---

Desarrollado para gestión oncológica clínica — ONCOFLOW 2026
