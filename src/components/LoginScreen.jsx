import React, { useState } from 'react';
import { 
  Lock, Mail, ShieldAlert, ArrowRight, Eye, EyeOff, UserCheck, Sparkles, AlertCircle 
} from 'lucide-react';

const VALID_USERS = [
  'alexandraramirez@migusto.com.ar',
  'mariasalazar@migusto.com.ar'
];

const FIXED_PASSWORD = 'MiGusto123';

export function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Ingresá tu correo electrónico corporativo');
      return;
    }

    if (!VALID_USERS.includes(trimmedEmail)) {
      setError('El correo no coincide con las cuentas autorizadas');
      return;
    }

    if (password !== FIXED_PASSWORD) {
      setError('Contraseña incorrecta');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        email: trimmedEmail,
        role: 'admin', // Full access
        name: trimmedEmail.startsWith('alexandra') ? 'Alexandra Ramirez' : 'María Salazar'
      });
    }, 400);
  };

  const handleGuestLogin = () => {
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        email: 'invitado@migusto.com.ar',
        role: 'guest', // Read-only / Guest mode
        name: 'Invitado (Solo Lectura)'
      });
    }, 300);
  };

  const fillQuickAccount = (userEmail) => {
    setEmail(userEmail);
    setPassword(FIXED_PASSWORD);
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background radial glows and patterns */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/15 via-amber-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Glow wrapper border */}
        <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-amber-500/40 via-slate-800 to-slate-900 shadow-2xl">
          <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 space-y-6">
            
            {/* Header / Brand */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 shadow-inner">
                <img
                  src={`${import.meta.env.BASE_URL}Logo_Mi_Gusto_2025.png`}
                  alt="Mi Gusto"
                  className="h-10 sm:h-12 w-auto object-contain brightness-110 drop-shadow-[0_2px_12px_rgba(245,158,11,0.3)]"
                />
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  KPI Central • Mi Gusto
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                  Portal de Monitoreo y Rendimiento Operativo
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Correo Electrónico</span>
                  <span className="text-[10px] text-slate-500 font-normal">Cuenta corporativa</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@migusto.com.ar"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Acccount Hints */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                <span>Cuentas con acceso completo:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickAccount('alexandraramirez@migusto.com.ar')}
                  className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/40 text-left transition-all cursor-pointer group"
                >
                  <p className="text-[11px] font-bold text-slate-300 group-hover:text-amber-400 truncate">
                    Alexandra R.
                  </p>
                  <p className="text-[9px] text-slate-500 truncate">alexandra@...</p>
                </button>

                <button
                  type="button"
                  onClick={() => fillQuickAccount('mariasalazar@migusto.com.ar')}
                  className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/40 text-left transition-all cursor-pointer group"
                >
                  <p className="text-[11px] font-bold text-slate-300 group-hover:text-amber-400 truncate">
                    María S.
                  </p>
                  <p className="text-[9px] text-slate-500 truncate">maria@...</p>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                o acceso libre
              </span>
            </div>

            {/* Guest Login Button */}
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer shadow-sm group"
            >
              <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Ingresar como Invitado (Solo Lectura)</span>
            </button>

            <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center">
              <p className="text-[11px] text-amber-300/80 leading-relaxed font-medium">
                🛡️ Modo invitado: permite explorar métricas, filtrar y ver gráficos pero no realizar modificaciones ni eliminar datos.
              </p>
            </div>

          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6 font-medium">
          &copy; Departamento de Sistemas de Mi Gusto
        </p>
      </div>
    </div>
  );
}
