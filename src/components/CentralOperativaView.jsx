import React, { useState, useMemo } from 'react';
import { 
  Download, Plus, Settings2, Edit3, CheckCircle2, AlertTriangle, 
  ChevronDown, Calendar, Search, ArrowUpRight, ArrowDownRight,
  FileSpreadsheet, Filter, RefreshCw, Store, Check, AlertCircle,
  HelpCircle, Eye, EyeOff
} from 'lucide-react';
import { fmtInt } from '../utils';

// Helper to normalize store names across variants
export function normalizeStoreName(rawName) {
  if (!rawName) return '';
  const trimmed = rawName.trim().replace(/\.$/, '');
  if (/^barrancas(\s+de\s+belgrano)?$/i.test(trimmed)) return 'Barrancas';
  if (/^(villa\s+)?devoto$/i.test(trimmed)) return 'Devoto';
  if (/^(la\s+)?paternal$/i.test(trimmed)) return 'Paternal';
  if (/^bella\s+vista$/i.test(trimmed)) return 'Bella Vista';
  return trimmed;
}

// CABA vs GBA classification
const CABA_STORES = new Set([
  'balvanera', 'barrancas', 'belgrano', 'caballito', 'floresta', 
  'paternal', 'las cañitas', 'mataderos', 'palermo', 'puerto madero', 
  'villa crespo', 'devoto', 'villa urquiza'
]);

export function getStoreZone(storeName) {
  const norm = normalizeStoreName(storeName).toLowerCase();
  return CABA_STORES.has(norm) ? 'CABA' : 'GBA';
}

const APPS = [
  { id: 'PEYA', label: 'PedidosYa', brandColor: '#f43f5e', accentBg: 'from-rose-500/10 to-transparent', border: 'border-rose-500/30', text: 'text-rose-400' },
  { id: 'Rappi', label: 'Rappi', brandColor: '#f97316', accentBg: 'from-orange-500/10 to-transparent', border: 'border-orange-500/30', text: 'text-orange-400' },
  { id: 'Mercado Delivery', label: 'Mercado Delivery', brandColor: '#f59e0b', accentBg: 'from-amber-500/10 to-transparent', border: 'border-amber-500/30', text: 'text-amber-400' }
];

export function CentralOperativaView({
  datasets = {},
  selectedPeriod,
  onPeriodChange,
  availablePeriods = [],
  thresholds,
  onOpenImport,
  onEditRecord,
  currentUser,
  onExportPDF
}) {
  const isGuest = currentUser?.role === 'guest';

  // Subtabs within Central Operativa
  const [activeTab, setActiveTab] = useState('indicadores');
  const [vistaType, setVistaType] = useState('semanal');
  const [filterZona, setFilterZona] = useState('ALL');
  const [filterSucursal, setFilterSucursal] = useState('ALL');
  const [filterApp, setFilterApp] = useState('ALL');
  const [searchStore, setSearchStore] = useState('');
  const [onlyDesvios, setOnlyDesvios] = useState(false);

  // Modal for editing record
  const [editingItem, setEditingItem] = useState(null);

  // Compute previous period index/name automatically
  const periodIndex = availablePeriods.indexOf(selectedPeriod);
  const previousPeriod = periodIndex > 0 ? availablePeriods[periodIndex - 1] : (availablePeriods.length > 1 ? availablePeriods[1] : null);

  const currentRecords = datasets[selectedPeriod]?.records || [];
  const previousRecords = previousPeriod ? (datasets[previousPeriod]?.records || []) : [];

  // Group current records by normalized store and app
  const currentStoreAppMap = useMemo(() => {
    const map = {};
    currentRecords.forEach((r) => {
      const store = normalizeStoreName(r.tienda);
      const app = (r.canal === 'PedidosYa') ? 'PEYA' : r.canal;
      const key = `${store}___${app}`;
      if (!map[key]) {
        map[key] = { ...r, tienda: store, canal: app };
      } else {
        map[key].confirmadas = (map[key].confirmadas || 0) + (r.confirmadas || 0);
        map[key].demoras = (map[key].demoras || 0) + (r.demoras || 0);
        map[key].reclamos = (map[key].reclamos || 0) + (r.reclamos || 0);
        map[key].cancelaciones = (map[key].cancelaciones || 0) + (r.cancelaciones || 0);
      }
    });
    return map;
  }, [currentRecords]);

  // Group previous records
  const prevStoreAppMap = useMemo(() => {
    const map = {};
    previousRecords.forEach((r) => {
      const store = normalizeStoreName(r.tienda);
      const app = (r.canal === 'PedidosYa') ? 'PEYA' : r.canal;
      const key = `${store}___${app}`;
      if (!map[key]) {
        map[key] = { ...r, tienda: store, canal: app };
      } else {
        map[key].confirmadas = (map[key].confirmadas || 0) + (r.confirmadas || 0);
        map[key].demoras = (map[key].demoras || 0) + (r.demoras || 0);
        map[key].reclamos = (map[key].reclamos || 0) + (r.reclamos || 0);
        map[key].cancelaciones = (map[key].cancelaciones || 0) + (r.cancelaciones || 0);
      }
    });
    return map;
  }, [previousRecords]);

  // All unique normalized stores in current dataset
  const allStores = useMemo(() => {
    const set = new Set();
    currentRecords.forEach((r) => set.add(normalizeStoreName(r.tienda)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [currentRecords]);

  // Check if an app card has desvío
  const isCardDesvio = (r) => {
    if (!r) return false;
    const isDesvio = (r.cancelacionesPct > 1.0) || 
                     (r.reclamosPct > 1.9) || 
                     (r.demorasPct > 8.5) || 
                     (r.canal !== 'Mercado Delivery' && r.disponibilidad < 96.0);
    return isDesvio;
  };

  // Filtered stores
  const visibleStores = useMemo(() => {
    return allStores.filter((store) => {
      const zona = getStoreZone(store);
      if (filterZona !== 'ALL' && zona !== filterZona) return false;
      if (filterSucursal !== 'ALL' && store !== filterSucursal) return false;
      if (searchStore && !store.toLowerCase().includes(searchStore.toLowerCase())) return false;
      if (onlyDesvios) {
        const hasDesvio = APPS.some((app) => isCardDesvio(currentStoreAppMap[`${store}___${app.id}`]));
        if (!hasDesvio) return false;
      }
      return true;
    });
  }, [allStores, filterZona, filterSucursal, searchStore, onlyDesvios, currentStoreAppMap]);

  // Header KPI stats
  const kpiStats = useMemo(() => {
    const storeCount = visibleStores.length;
    let totalConfirmados = 0;
    let desviosCount = 0;
    let faltantesCount = 0;

    visibleStores.forEach((store) => {
      APPS.forEach((app) => {
        if (filterApp !== 'ALL' && filterApp !== app.id) return;
        const key = `${store}___${app.id}`;
        const item = currentStoreAppMap[key];
        if (item) {
          totalConfirmados += (item.confirmadas || 0);
          if (isCardDesvio(item)) desviosCount++;
        }
      });
    });

    return {
      storeCount,
      totalConfirmados,
      desviosCount,
      faltantesCount
    };
  }, [visibleStores, filterApp, currentStoreAppMap]);

  // Format helpers
  const renderDeltaBadge = (val, isPp = false, isGoodWhenPositive = false) => {
    if (val === null || val === undefined || isNaN(val)) return null;
    const num = Math.round(val * 100) / 100;
    if (num === 0) return <span className="text-[10px] text-slate-500 font-mono font-medium">0{isPp ? ' pp' : ''}</span>;
    
    const isPositive = num > 0;
    const sign = isPositive ? '+' : '';
    const formatted = `${sign}${isPp ? num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' pp' : fmtInt(num)}`;
    
    // For confirmados and disponibilidad: positive is green.
    // For cancelaciones, reclamos, demoras: positive is bad (red), negative is green.
    const isGood = isGoodWhenPositive ? isPositive : !isPositive;

    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold ${
        isGood ? 'text-emerald-400' : 'text-rose-400'
      }`}>
        {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
        {formatted}
      </span>
    );
  };

  const fmtDisplayPct = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '0%';
    const num = Math.round(val * 100) / 100;
    return `${num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
  };

  return (
    <div className="w-full bg-[#0b0f19] border border-slate-800/90 text-slate-100 rounded-3xl p-4 sm:p-7 space-y-7 shadow-2xl backdrop-blur-xl">
      
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Central operativa
            </h1>
            <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-xs shadow-rose-950/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Matriz Comparativa Multi-Canal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5">
            Indicadores semanales, desvíos automáticos por app y comparativa directa con la semana previa.
          </p>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onExportPDF}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold shadow-sm transition-all duration-150 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Guardar como PDF</span>
          </button>
          {!isGuest && (
            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white border border-rose-500/40 text-xs font-bold shadow-md shadow-rose-950/40 transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cargar indicadores</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Pills Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'indicadores', label: 'Indicadores' },
          { id: 'comparar', label: 'Comparar periodos' },
          { id: 'importar', label: 'Importar Excel', action: onOpenImport },
          { id: 'prioridades', label: 'Prioridades' },
          { id: 'incidencias', label: 'Incidencias' },
          { id: 'calendario', label: 'Calendario' },
          { id: 'textos', label: 'Textos para copiar' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.action) {
                  tab.action();
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-rose-900/90 text-rose-100 border border-rose-500/60 shadow-md shadow-rose-950/50 ring-2 ring-rose-500/20 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/90'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar Bar - Clean & Grouped */}
      <div className="bg-slate-900/95 rounded-2xl p-4.5 border border-slate-800/90 shadow-xl flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3.5">
          {/* Vista */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Vista</label>
            <div className="relative">
              <select
                value={vistaType}
                onChange={(e) => setVistaType(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 pr-8 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer min-w-[110px]"
              >
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Semana de referencia */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Semana de referencia</label>
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => onPeriodChange(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 pr-9 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer min-w-[220px]"
              >
                {availablePeriods.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Zona */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Zona</label>
            <div className="relative">
              <select
                value={filterZona}
                onChange={(e) => setFilterZona(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 pr-8 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer min-w-[130px]"
              >
                <option value="ALL">Todas las zonas</option>
                <option value="CABA">CABA</option>
                <option value="GBA">GBA</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* App filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Canal / App</label>
            <div className="relative">
              <select
                value={filterApp}
                onChange={(e) => setFilterApp(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 pr-8 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer min-w-[140px]"
              >
                <option value="ALL">Todas las apps</option>
                <option value="PEYA">PedidosYa</option>
                <option value="Rappi">Rappi</option>
                <option value="Mercado Delivery">Mercado Delivery</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick Search & Only Deviations Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar sucursal..."
              value={searchStore}
              onChange={(e) => setSearchStore(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <button
            onClick={() => setOnlyDesvios(!onlyDesvios)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
              onlyDesvios
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Sólo desvíos</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards - High Visual Impact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sucursales</span>
            <Store className="w-4 h-4 text-blue-400 opacity-80" />
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {kpiStats.storeCount}
          </div>
          <div className="text-[11px] font-medium text-slate-400 mt-1">
            Sucursales en vista
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volumen</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400 opacity-80" />
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {fmtInt(kpiStats.totalConfirmados)}
          </div>
          <div className="text-[11px] font-medium text-slate-400 mt-1">
            Pedidos confirmados informados
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-rose-500/30 shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">Alertas</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono tracking-tight">
            {kpiStats.desviosCount}
          </div>
          <div className="text-[11px] font-medium text-rose-300/80 mt-1">
            Combinaciones con desvíos
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completitud</span>
            <Check className="w-4 h-4 text-emerald-400 opacity-80" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
            {kpiStats.faltantesCount}
          </div>
          <div className="text-[11px] font-medium text-slate-400 mt-1">
            Combinaciones con faltantes
          </div>
        </div>
      </div>

      {/* Sub-banner: Period dates & pp notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <p className="text-xs font-semibold text-slate-300">
          <strong className="text-white">{selectedPeriod}</strong> · Semana anterior: <span className="text-amber-400 font-medium">{previousPeriod || 'N/A'}</span> · <span className="text-slate-400 font-normal">pp = puntos porcentuales</span>
        </p>
        <span className="text-[11px] text-slate-500 font-medium">
          Mostrando {visibleStores.length} de {allStores.length} sucursales
        </span>
      </div>

      {/* Comparison Matrix Grid - Clean Structured Cards Layout */}
      <div className="bg-slate-900/95 rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-slate-950/95 border-b border-slate-800/90 text-slate-300 py-4 px-5 text-xs font-extrabold uppercase tracking-wider">
          <div className="col-span-3">Sucursal / Zona</div>
          <div className="col-span-3 flex items-center gap-2 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>PedidosYa</span>
          </div>
          <div className="col-span-3 flex items-center gap-2 text-orange-400">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>Rappi</span>
          </div>
          <div className="col-span-3 flex items-center gap-2 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Mercado Delivery</span>
          </div>
        </div>

        {/* Table Rows per Store */}
        <div className="divide-y divide-slate-800/80">
          {visibleStores.map((store) => {
            const zona = getStoreZone(store);

            return (
              <div key={store} className="grid grid-cols-12 p-4 sm:p-5 items-stretch hover:bg-slate-850/40 transition-colors gap-y-4">
                
                {/* Store Info Column */}
                <div className="col-span-3 pr-4 flex flex-col justify-start border-r border-slate-800/60">
                  <span className="font-extrabold text-base text-white tracking-tight">{store}</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border tracking-wider ${
                      zona === 'CABA' 
                        ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' 
                        : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    }`}>
                      {zona}
                    </span>
                  </div>
                </div>

                {/* 3 App Columns */}
                {APPS.map((app) => {
                  const key = `${store}___${app.id}`;
                  const currentItem = currentStoreAppMap[key];
                  const prevItem = prevStoreAppMap[key];

                  if (!currentItem) {
                    return (
                      <div key={app.id} className="col-span-3 px-3 py-3 border-r border-slate-800/60 last:border-r-0 flex flex-col items-center justify-center text-xs text-slate-500 italic bg-slate-950/20 rounded-xl mx-1">
                        <span className="text-[11px] text-slate-600">Sin registro</span>
                      </div>
                    );
                  }

                  const desvio = isCardDesvio(currentItem);

                  // Calculate deltas
                  const dConf = prevItem ? (currentItem.confirmadas || 0) - (prevItem.confirmadas || 0) : null;
                  const dDisp = prevItem ? (currentItem.disponibilidad || 0) - (prevItem.disponibilidad || 0) : null;
                  const dCanc = prevItem ? (currentItem.cancelacionesPct || 0) - (prevItem.cancelacionesPct || 0) : null;
                  const dRecl = prevItem ? (currentItem.reclamosPct || 0) - (prevItem.reclamosPct || 0) : null;
                  const dDem = prevItem ? (currentItem.demorasPct || 0) - (prevItem.demorasPct || 0) : null;

                  return (
                    <div 
                      key={app.id} 
                      className={`col-span-3 px-3.5 py-3 border-r border-slate-800/60 last:border-r-0 flex flex-col justify-between rounded-xl mx-1 transition-all ${
                        desvio 
                          ? 'bg-rose-950/15 border border-rose-500/20' 
                          : 'bg-slate-950/40 border border-slate-800/50'
                      }`}
                    >
                      {/* Badge Status & Channel Tag */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shadow-xs flex items-center gap-1 ${
                          desvio
                            ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${desvio ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                          {desvio ? 'Desvío' : 'En objetivo'}
                        </span>

                        <button
                          onClick={() => setEditingItem({ ...currentItem })}
                          className="px-2.5 py-1 rounded-lg border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                          title="Editar valores de esta tienda y app"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>Editar</span>
                        </button>
                      </div>

                      {/* Clean 2-column Metric Card Grid */}
                      <div className="grid grid-cols-2 gap-2.5 py-3 text-xs">
                        {/* Confirmados */}
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                          <div className="text-[10px] text-slate-400 font-semibold">Confirmados</div>
                          <div className="font-mono font-extrabold text-sm text-white leading-tight mt-0.5">
                            {fmtInt(currentItem.confirmadas || 0)}
                          </div>
                          <div className="mt-0.5">
                            {renderDeltaBadge(dConf, false, true)}
                          </div>
                        </div>

                        {/* Disponibilidad */}
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                          <div className="text-[10px] text-slate-400 font-semibold">Disponibilidad</div>
                          <div className="font-mono font-extrabold text-sm text-white leading-tight mt-0.5">
                            {fmtDisplayPct(currentItem.disponibilidad)}
                          </div>
                          <div className="mt-0.5">
                            {renderDeltaBadge(dDisp, true, true)}
                          </div>
                        </div>

                        {/* Cancelaciones */}
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                          <div className="text-[10px] text-slate-400 font-semibold">Cancelaciones</div>
                          <div className={`font-mono font-extrabold text-sm leading-tight mt-0.5 ${
                            currentItem.cancelacionesPct > 1.0 ? 'text-rose-400' : 'text-slate-200'
                          }`}>
                            {fmtDisplayPct(currentItem.cancelacionesPct)}
                          </div>
                          <div className="mt-0.5">
                            {renderDeltaBadge(dCanc, true, false)}
                          </div>
                        </div>

                        {/* Reclamos */}
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                          <div className="text-[10px] text-slate-400 font-semibold">Reclamos</div>
                          <div className={`font-mono font-extrabold text-sm leading-tight mt-0.5 ${
                            currentItem.reclamosPct > 1.9 ? 'text-rose-400' : 'text-slate-200'
                          }`}>
                            {fmtDisplayPct(currentItem.reclamosPct)}
                          </div>
                          <div className="mt-0.5">
                            {renderDeltaBadge(dRecl, true, false)}
                          </div>
                        </div>

                        {/* Demoras - Full Width */}
                        <div className="col-span-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/50 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-slate-400 font-semibold">Demoras</div>
                            <div className={`font-mono font-extrabold text-sm leading-tight mt-0.5 ${
                              currentItem.demorasPct > 8.5 ? 'text-rose-400' : 'text-slate-200'
                            }`}>
                              {fmtDisplayPct(currentItem.demorasPct)}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">vs anterior</span>
                            {renderDeltaBadge(dDem, true, false)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-700 max-w-md w-full p-6 space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div>
                <h3 className="text-lg font-black text-white">Editar Indicadores</h3>
                <p className="text-xs text-slate-400 mt-0.5">{editingItem.tienda} · <strong className="text-rose-400">{editingItem.canal}</strong></p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Confirmados</label>
                <input
                  type="number"
                  value={editingItem.confirmadas ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, confirmadas: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Disponibilidad %</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.disponibilidad ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, disponibilidad: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Cancelaciones %</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.cancelacionesPct ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, cancelacionesPct: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Reclamos %</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.reclamosPct ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, reclamosPct: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="col-span-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Demoras %</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.demorasPct ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, demorasPct: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onEditRecord) {
                    onEditRecord(editingItem);
                  }
                  setEditingItem(null);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 text-white border border-rose-500/50 text-xs font-bold shadow-lg shadow-rose-950/50 hover:from-rose-600 hover:to-rose-800 cursor-pointer"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
