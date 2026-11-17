import React, { useState, useMemo } from 'react';
import { 
  Download, Plus, Settings2, Edit3, CheckCircle2, AlertTriangle, 
  ChevronDown, Calendar, Search, ArrowUpRight, ArrowDownRight,
  FileSpreadsheet, Filter, RefreshCw
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
  { id: 'PEYA', label: 'PedidosYa' },
  { id: 'Rappi', label: 'Rappi' },
  { id: 'Mercado Delivery', label: 'Mercado Delivery' }
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
  const [activeTab, setActiveTab] = useState('indicadores'); // 'indicadores' | 'comparar' | 'importar' | 'prioridades' | 'incidencias' | 'calendario' | 'textos'
  const [vistaType, setVistaType] = useState('semanal'); // 'semanal' | 'mensual'
  const [filterZona, setFilterZona] = useState('ALL'); // 'ALL' | 'CABA' | 'GBA'
  const [filterSucursal, setFilterSucursal] = useState('ALL');
  const [filterApp, setFilterApp] = useState('ALL'); // 'ALL' | 'PEYA' | 'Rappi' | 'Mercado Delivery'

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
        // combine
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

  // Filtered stores
  const visibleStores = useMemo(() => {
    return allStores.filter((store) => {
      const zona = getStoreZone(store);
      if (filterZona !== 'ALL' && zona !== filterZona) return false;
      if (filterSucursal !== 'ALL' && store !== filterSucursal) return false;
      return true;
    });
  }, [allStores, filterZona, filterSucursal]);

  // Check if an app card has desvío
  const isCardDesvio = (r) => {
    if (!r) return false;
    const isDesvio = (r.cancelacionesPct > 1.0) || 
                     (r.reclamosPct > 1.9) || 
                     (r.demorasPct > 8.5) || 
                     (r.canal !== 'Mercado Delivery' && r.disponibilidad < 96.0);
    return isDesvio;
  };

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
  const fmtDelta = (val, isPp = false) => {
    if (val === null || val === undefined || isNaN(val)) return '0' + (isPp ? ' pp' : '');
    const num = Math.round(val * 100) / 100;
    if (num === 0) return '0' + (isPp ? ' pp' : '');
    const sign = num > 0 ? '+' : '';
    const formatted = isPp 
      ? `${sign}${num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} pp`
      : `${sign}${fmtInt(num)}`;
    return formatted;
  };

  const fmtDisplayPct = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '0%';
    const num = Math.round(val * 100) / 100;
    return `${num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
  };

  return (
    <div className="w-full bg-slate-950/70 border border-slate-800/80 text-slate-100 rounded-3xl p-4 sm:p-6 space-y-6 shadow-2xl backdrop-blur-md">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Central operativa</span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
              Matriz Operativa
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Indicadores semanales, seguimiento de incidencias y agenda comercial.
          </p>
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
                  ? 'bg-gradient-to-r from-rose-900 to-rose-950 text-rose-100 border border-rose-500/50 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/30'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800/90 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 shadow-inner flex flex-wrap items-center gap-4">
        {/* Vista */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-400">Vista</label>
          <div className="relative">
            <select
              value={vistaType}
              onChange={(e) => setVistaType(e.target.value)}
              className="appearance-none bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer min-w-[110px]"
            >
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Semana de referencia */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-400">Semana de referencia</label>
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="appearance-none bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer min-w-[200px]"
            >
              {availablePeriods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Zona */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-400">Zona</label>
          <div className="relative">
            <select
              value={filterZona}
              onChange={(e) => setFilterZona(e.target.value)}
              className="appearance-none bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer min-w-[130px]"
            >
              <option value="ALL">Todas las zonas</option>
              <option value="CABA">CABA</option>
              <option value="GBA">GBA</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Sucursal */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-400">Sucursal</label>
          <div className="relative">
            <select
              value={filterSucursal}
              onChange={(e) => setFilterSucursal(e.target.value)}
              className="appearance-none bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer min-w-[160px]"
            >
              <option value="ALL">Todas las sucursales</option>
              {allStores.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* App */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-400">App</label>
          <div className="relative">
            <select
              value={filterApp}
              onChange={(e) => setFilterApp(e.target.value)}
              className="appearance-none bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer min-w-[130px]"
            >
              <option value="ALL">Todas las apps</option>
              <option value="PEYA">PedidosYa</option>
              <option value="Rappi">Rappi</option>
              <option value="Mercado Delivery">Mercado Delivery</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Secondary Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            onClick={onExportPDF}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Guardar como PDF</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isGuest && (
            <>
              <button
                onClick={onOpenImport}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-900 to-rose-950 hover:from-rose-800 hover:to-rose-900 text-rose-100 border border-rose-500/40 text-xs font-bold shadow-sm cursor-pointer"
              >
                + Cargar indicadores
              </button>
              <button
                onClick={() => alert('Para agregar una nueva sucursal, cargala en la configuración de tiendas o importa una planilla.')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                + Sucursal
              </button>
              <button
                onClick={() => alert('Configuración de apps por sucursal')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Configurar apps por sucursal
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono-numbers">
        {/* Card 1 */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-lg hover:border-slate-700 transition-colors">
          <div className="text-3xl font-black text-white tracking-tight">
            {kpiStats.storeCount}
          </div>
          <div className="text-xs font-sans font-medium text-slate-400 mt-1">
            Sucursales en vista
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-lg hover:border-slate-700 transition-colors">
          <div className="text-3xl font-black text-white tracking-tight">
            {fmtInt(kpiStats.totalConfirmados)}
          </div>
          <div className="text-xs font-sans font-medium text-slate-400 mt-1">
            Pedidos confirmados informados
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-lg hover:border-slate-700 transition-colors">
          <div className="text-3xl font-black text-rose-400 tracking-tight">
            {kpiStats.desviosCount}
          </div>
          <div className="text-xs font-sans font-medium text-slate-400 mt-1">
            Combinaciones con desvíos
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/80 shadow-lg hover:border-slate-700 transition-colors">
          <div className="text-3xl font-black text-emerald-400 tracking-tight">
            {kpiStats.faltantesCount}
          </div>
          <div className="text-xs font-sans font-medium text-slate-400 mt-1">
            Combinaciones con faltantes
          </div>
        </div>
      </div>

      {/* Sub-banner: Period dates & pp notice */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-slate-300">
          {selectedPeriod} - Semana anterior {previousPeriod || 'N/A'} · <span className="text-slate-400 font-normal">pp = puntos porcentuales</span>
        </p>
        <div className="bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] px-3.5 py-2 rounded-xl backdrop-blur-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Las alertas incluyen las apps con registro en el periodo o marcadas como operativas. Podés configurar excepciones por sucursal.</span>
        </div>
      </div>

      {/* Comparison Matrix Grid */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-slate-950/90 border-b border-slate-800/80 text-slate-200 py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider">
          <div className="col-span-3">Sucursal</div>
          <div className="col-span-3 text-rose-300">PedidosYa</div>
          <div className="col-span-3 text-orange-300">Rappi</div>
          <div className="col-span-3 text-amber-300">Mercado Delivery</div>
        </div>

        {/* Table Rows per Store */}
        <div className="divide-y divide-slate-800/70">
          {visibleStores.map((store) => {
            const zona = getStoreZone(store);

            return (
              <div key={store} className="grid grid-cols-12 p-4 items-stretch hover:bg-slate-850/50 transition-colors">
                
                {/* Store Column */}
                <div className="col-span-3 pr-4 flex flex-col justify-start">
                  <span className="font-bold text-sm text-white">{store}</span>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">{zona}</span>
                </div>

                {/* 3 App Columns */}
                {APPS.map((app) => {
                  const key = `${store}___${app.id}`;
                  const currentItem = currentStoreAppMap[key];
                  const prevItem = prevStoreAppMap[key];

                  if (!currentItem) {
                    return (
                      <div key={app.id} className="col-span-3 px-3 py-2 border-l border-slate-800/60 flex items-center justify-center text-xs text-slate-500 italic">
                        Sin datos
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
                    <div key={app.id} className="col-span-3 px-3 border-l border-slate-800/70 flex flex-col justify-between space-y-3 font-mono-numbers">
                      {/* Badge Status */}
                      <div className="flex items-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-sans ${
                          desvio
                            ? 'bg-rose-950/60 text-rose-300 border-rose-500/40 shadow-xs'
                            : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-xs'
                        }`}>
                          {desvio ? 'Desvío' : 'En objetivo'}
                        </span>
                      </div>

                      {/* 2x3 Metric Grid */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
                        {/* Confirmados */}
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans font-medium">Confirmados</div>
                          <div className="font-bold text-white leading-tight">
                            {fmtInt(currentItem.confirmadas || 0)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {fmtDelta(dConf, false)}
                          </div>
                        </div>

                        {/* Disponibilidad */}
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans font-medium">Disponibilidad</div>
                          <div className="font-bold text-white leading-tight">
                            {fmtDisplayPct(currentItem.disponibilidad)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {fmtDelta(dDisp, true)}
                          </div>
                        </div>

                        {/* Cancelaciones */}
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans font-medium">Cancelaciones</div>
                          <div className="font-bold text-white leading-tight">
                            {fmtDisplayPct(currentItem.cancelacionesPct)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {fmtDelta(dCanc, true)}
                          </div>
                        </div>

                        {/* Reclamos */}
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans font-medium">Reclamos</div>
                          <div className="font-bold text-white leading-tight">
                            {fmtDisplayPct(currentItem.reclamosPct)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {fmtDelta(dRecl, true)}
                          </div>
                        </div>

                        {/* Demoras */}
                        <div className="col-span-2">
                          <div className="text-[10px] text-slate-400 font-sans font-medium">Demoras</div>
                          <div className="font-bold text-white leading-tight">
                            {fmtDisplayPct(currentItem.demorasPct)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {fmtDelta(dDem, true)}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        <button
                          onClick={() => setEditingItem({ ...currentItem })}
                          className="px-3 py-1 rounded-lg border border-slate-700 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-sans font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Editar
                        </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 max-w-md w-full p-6 space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Editar Indicadores</h3>
                <p className="text-xs text-slate-400">{editingItem.tienda} · {editingItem.canal}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Confirmados</label>
                <input
                  type="number"
                  value={editingItem.confirmadas ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, confirmadas: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-semibold text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Disponibilidad %</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.disponibilidad ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, disponibilidad: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-semibold text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Cancelaciones %</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.cancelacionesPct ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, cancelacionesPct: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-semibold text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Reclamos %</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.reclamosPct ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, reclamosPct: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-semibold text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Demoras %</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.demorasPct ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, demorasPct: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-semibold text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 cursor-pointer"
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
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-900 to-rose-950 text-rose-100 border border-rose-500/40 text-xs font-bold hover:from-rose-800 hover:to-rose-900 shadow-md cursor-pointer"
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
