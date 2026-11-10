import React, { useRef } from 'react';
import { 
  LayoutDashboard, Star, Upload, 
  SlidersHorizontal, LogOut, ShieldAlert,
  Cloud, CloudOff, RefreshCw
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function Header({
  activeModule,
  onModuleChange,
  onOpenImport,
  onOpenThresholds,
  currentUser,
  onLogout,
  syncStatus = 'idle',
  syncMessage = '',
  onTriggerSync
}) {
  const headerRef = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.from('.header-brand', { opacity: 0, x: -12, duration: 0.45 })
        .from('.header-nav', { opacity: 0, y: -6, duration: 0.4 }, '-=0.25')
        .from('.header-actions', { opacity: 0, x: 12, duration: 0.4 }, '-=0.3');
    },
    { scope: headerRef }
  );

  const isGuest = currentUser?.role === 'guest';

  return (
    <header ref={headerRef} className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/75 border-b border-slate-800/70 shadow-sm">
      <div className="w-full px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand with official Logo */}
        <div className="header-brand flex items-center gap-3.5">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-xl bg-amber-500/20 blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
            <img
              src={`${import.meta.env.BASE_URL}Logo_Mi_Gusto_2025.png`}
              alt="Mi Gusto"
              className="relative h-8 sm:h-9 w-auto object-contain brightness-110 drop-shadow-[0_2px_12px_rgba(245,158,11,0.25)]"
            />
          </div>
          <div className="h-6 w-px bg-slate-800/80 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                KPI Central
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm shadow-amber-950/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Apps & Calidad
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
              Monitoreo operativo de PEYA, Rappi, MDL y Reseñas
            </p>
          </div>
        </div>

        {/* Navigation Tabs - Modern Segmented Control */}
        <div className="header-nav inline-flex rounded-2xl bg-slate-900/80 p-1 border border-slate-800/80 shadow-inner">
          <button
            onClick={() => onModuleChange('operational')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeModule === 'operational'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.01]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>KPIs Operativos (Apps)</span>
          </button>
          <button
            onClick={() => onModuleChange('reviews')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeModule === 'reviews'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.01]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Reseñas & Puntuaciones (5 Canales)</span>
          </button>
        </div>

        {/* Quick Actions & User Profile */}
        <div className="header-actions flex items-center gap-2 sm:gap-2.5">
          {/* Cloud Sync Status Indicator & Manual Refresh */}
          <button
            onClick={onTriggerSync}
            disabled={syncStatus === 'syncing'}
            title={syncMessage || 'Estado de sincronización'}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
          >
            {syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span className="hidden md:inline text-blue-300">Sincronizando...</span>
              </>
            ) : syncStatus === 'synced' ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline text-emerald-300">Nube Activa</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline text-amber-300">Modo Local</span>
              </>
            )}
          </button>

          {/* Semáforos Action (Disabled or visible for admins) */}
          {!isGuest && (
            <button
              onClick={onOpenThresholds}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/90 hover:border-amber-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-sm cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Semáforos</span>
            </button>
          )}

          {/* Import Excel Action (Only for admins) */}
          {!isGuest ? (
            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/90 hover:border-emerald-500/40 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Excel</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Invitado (Solo Lectura)</span>
            </div>
          )}

          {/* User Badge & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800/80">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white truncate max-w-[120px]">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                  {isGuest ? 'Invitado' : 'Administrador'}
                </p>
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all duration-200 cursor-pointer shadow-sm group"
                title="Cerrar Sesión"
              >
                <LogOut className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
