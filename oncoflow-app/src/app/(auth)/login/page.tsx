'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, Activity, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const DEMO_EMAIL = 'admin@oncoflow.co';
const DEMO_PASSWORD = 'Admin123!';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const isSupabaseConfigured = supabaseUrl && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('your_supabase');

      if (isSupabaseConfigured) {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
        
        if (error) {
          setServerError(error.message === 'Invalid login credentials' ? 'Credenciales inválidas. Verifica tu email y contraseña.' : error.message);
          return;
        }
        
        setSuccess(true);
        await new Promise((r) => setTimeout(r, 800));
        router.push('/dashboard');
        return;
      }

      // Demo login fallback if Supabase NOT configured
      if (data.email === DEMO_EMAIL && data.password === DEMO_PASSWORD) {
        setSuccess(true);
        await new Promise((r) => setTimeout(r, 800));
        router.push('/dashboard');
        return;
      }

      setServerError('Credenciales incorrectas. En modo demo usa admin@oncoflow.co / Admin123!');
    } catch {
      setServerError('Error de conexión. Inténtalo de nuevo.');
    }
  };

  const fillDemo = () => {
    setValue('email', DEMO_EMAIL);
    setValue('password', DEMO_PASSWORD);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden bg-gradient-to-br from-[#0D1B2A] via-[#0F5FA6] to-[#1A9E6B]">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        {/* Molecular/cell circles decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/10"
              style={{
                width: `${(i + 2) * 80}px`,
                height: `${(i + 2) * 80}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: `spin ${8 + i * 3}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center text-white max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Activity size={28} className="text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-3 tracking-tight">
            ONCO<span className="text-emerald-300">FLOW</span>
          </h1>
          <p className="text-xl font-light text-white/80 mb-6">
            Sistema de Gestión Oncológica
          </p>
          <div className="w-16 h-0.5 bg-white/30 mx-auto mb-6" />
          <p className="text-white/60 text-sm leading-relaxed">
            Plataforma integral para la gestión y control de entregas de medicamentos oncológicos, programación de tratamientos y facturación médica.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: '500+', label: 'Pacientes' },
              { value: '98%', label: 'Entregas OK' },
              { value: '24/7', label: 'Monitoreo' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/15">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/60 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[hsl(var(--background))]">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] flex items-center justify-center">
              <Activity size={18} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-[hsl(var(--foreground))]">
              ONCO<span className="text-[hsl(var(--secondary))]">FLOW</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Bienvenido de vuelta</h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-1 text-sm">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 rounded-[var(--radius)] flex items-start gap-3">
            <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-700">Modo Demo</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Email: <code className="font-mono bg-blue-100 px-1 rounded">admin@oncoflow.co</code><br />
                Contraseña: <code className="font-mono bg-blue-100 px-1 rounded">Admin123!</code>
              </p>
              <button onClick={fillDemo} className="text-xs text-blue-700 font-medium hover:underline mt-1">
                Rellenar automáticamente →
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-[hsl(var(--foreground))]">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input
                  id="email"
                  type="email"
                  placeholder="usuario@oncoflow.co"
                  {...register('email')}
                  className={`form-input w-full !pl-10 pr-3.5 py-2.5 text-sm rounded-[var(--radius)] border bg-[hsl(var(--card))] text-[hsl(var(--foreground))] outline-none transition-all duration-150 placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:shadow-[0_0_0_3px_hsla(211,87%,36%,0.15)] ${errors.email ? 'border-[hsl(var(--danger))]' : 'border-[hsl(var(--border))]'}`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-[hsl(var(--danger))] flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-[hsl(var(--foreground))]">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`form-input w-full !pl-10 pr-10 py-2.5 text-sm rounded-[var(--radius)] border bg-[hsl(var(--card))] text-[hsl(var(--foreground))] outline-none transition-all duration-150 placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:shadow-[0_0_0_3px_hsla(211,87%,36%,0.15)] ${errors.password ? 'border-[hsl(var(--danger))]' : 'border-[hsl(var(--border))]'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-[hsl(var(--danger))] flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-[var(--radius)] flex items-center gap-2">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700">{serverError}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[var(--radius)] flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                <p className="text-xs text-emerald-700">¡Acceso autorizado! Redirigiendo...</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="btn btn-primary w-full py-2.5 text-sm font-medium rounded-[var(--radius)] flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:pointer-events-none bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary-light))] transition-all"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Verificando...</>
              ) : success ? (
                <><CheckCircle2 size={16} /> Acceso concedido</>
              ) : (
                'Ingresar al Sistema'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
            ¿Problemas para acceder?{' '}
            <a href="mailto:soporte@oncoflow.co" className="text-[hsl(var(--primary))] hover:underline font-medium">
              Contacta soporte
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
