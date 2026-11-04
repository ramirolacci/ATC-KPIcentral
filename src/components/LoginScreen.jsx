import React, { useState, useRef } from 'react';
import { 
  Lock, Mail, ArrowRight, Eye, EyeOff, UserCheck, 
  AlertCircle, ShieldCheck
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Cuentas con privilegios de Administrador (Acceso total)
const ADMIN_ACCOUNTS = {
  'alexandraramirez@migusto.com.ar': {
    name: 'Alexandra Ramírez',
    role: 'admin'
  },
  'mariasalazar@migusto.com.ar': {
    name: 'María Salazar',
    role: 'admin'
  }
};

const FIXED_PASSWORD = 'MiGusto123';

/**
 * Convierte un email corporativo (ej: damaris.burgos@migusto.com.ar)
 * a un nombre legible ("Damaris Burgos")
 */
function formatUserNameFromEmail(email) {
  try {
    const localPart = email.split('@')[0];
    const words = localPart.split(/[._-]/).filter(Boolean);
    if (words.length === 0) return 'Usuario';
    return words
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  } catch {
    return 'Usuario';
  }
}

export function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.from('.login-card', { opacity: 0, y: 16, scale: 0.98, duration: 0.5 })
        .from('.login-brand', { opacity: 0, y: -8, duration: 0.4 }, '-=0.3')
        .from('.login-field', { opacity: 0, y: 8, stagger: 0.08, duration: 0.35 }, '-=0.2')
        .from('.login-guest', { opacity: 0, y: 6, duration: 0.35 }, '-=0.2')
        .from('.login-footer', { opacity: 0, duration: 0.4 }, '-=0.2');
    },
    { scope: containerRef }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Por favor, ingresá tu correo electrónico');
      return;
    }

    // Validación básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('El formato del correo electrónico ingresado no es válido');
      return;
    }

    if (!password) {
      setError('Por favor, ingresá tu contraseña');
      return;
    }

    if (password !== FIXED_PASSWORD) {
      setError('Contraseña incorrecta. Verificá los datos ingresados');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Si el email pertenece al grupo de Administradores, se le asigna rol 'admin'
      // Para cualquier otro usuario, se ingresa en modo 'guest' (Solo Lectura)
      const adminMatch = ADMIN_ACCOUNTS[trimmedEmail];

      if (adminMatch) {
        onLoginSuccess({
          email: trimmedEmail,
          role: 'admin',
          name: adminMatch.name
        });
      } else {
        onLoginSuccess({
          email: trimmedEmail,
          role: 'guest',
          name: formatUserNameFromEmail(trimmedEmail)
        });
      }
    }, 380);
  };

  const handleGuestLogin = () => {
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        email: 'invitado@migusto.com.ar',
        role: 'guest',
        name: 'Invitado (Solo Lectura)'
      });
    }, 300);
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden bg-slate-950"
    >
      {/* Background radial glow orbs matching project design language */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-amber-500/12 via-amber-600/8 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-12 right-12 w-80 h-80 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle modern dot-grid texture */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" 
      />

      {/* Main Login Card Centered Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 w-full">
        <div className="login-card w-full max-w-[420px]">
        
          {/* Subtle Ambient Glow Border */}
          <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-amber-500/35 via-slate-700/30 to-slate-800/40 shadow-2xl shadow-black/80">
            <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 space-y-5 border border-white/[0.04]">
              
              {/* Header / Brand */}
              <div className="login-brand text-center space-y-3">
                
                {/* Logo sin caja ni contenedor */}
                <div className="flex items-center justify-center pt-1">
                  <img
                    src={`${import.meta.env.BASE_URL}Logo_Mi_Gusto_2025.png`}
                    alt="Mi Gusto"
                    className="h-12 sm:h-14 w-auto object-contain brightness-110 drop-shadow-[0_4px_18px_rgba(245,158,11,0.22)]"
                  />
                </div>

                {/* Title & Tagline */}
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    KPI Central <span className="text-amber-400 font-normal">•</span> Mi Gusto
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Monitoreo Operativo de PedidosYa, Rappi, MDL y Reseñas
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="login-error p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 shadow-sm animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Email Field */}
                <div className="login-field space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <span>Correo Electrónico</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">Cuenta Corporativa</span>
                  </div>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-amber-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@migusto.com.ar"
                      className="w-full bg-slate-950/70 border border-slate-800 hover:border-slate-700 focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 focus:bg-slate-950/90 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="login-field space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <span>Contraseña</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">Clave de acceso</span>
                  </div>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-amber-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950/70 border border-slate-800 hover:border-slate-700 focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 focus:bg-slate-950/90 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-all outline-none font-mono-numbers"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Login Button (Tamaño acorde al contenido del texto) */}
                <div className="login-field pt-1.5 flex justify-center">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-auto inline-flex items-center justify-center gap-2 py-2.5 px-7 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 hover:shadow-amber-500/35 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer disabled:opacity-60 group"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Iniciar Sesión</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Subtle Divider */}
              <div className="login-guest relative flex items-center justify-center py-0.5">
                <div className="border-t border-slate-800/80 w-full" />
                <span className="bg-slate-900/90 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
                  o explorar libremente
                </span>
              </div>

              {/* Guest / Read-only Access Section */}
              <div className="login-guest space-y-2">
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all duration-200 active:scale-[0.99] cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-200 group-hover:text-white">
                        Ingresar como Invitado
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Visualizá métricas, gráficos y KPIs
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Solo Lectura
                  </span>
                </button>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    El <strong className="text-slate-300">Modo Invitado</strong> permite navegar todos los módulos y períodos sin permisos de edición ni carga de archivos.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Footer idéntico al resto de pantallas del sistema con divisor superior */}
      <footer className="login-footer w-full border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-sm py-5 px-4 text-center relative z-10">
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          &copy; Desarrollado por el Departamento de Sistemas de Mi Gusto | Todos los derechos reservados.
        </p>
      </footer>

    </div>
  );
}
