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
    <div className="w-full bg-[#f8f9fa] text-slate-800 rounded-3xl p-4 sm:p-6 space-y-6 shadow-sm border border-slate-200">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e1b18] tracking-tight">
            Central operativa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
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
                  ? 'bg-[#831843] text-white shadow-sm ring-1 ring-[#831843]'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center gap-4">
        {/* Vista */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-600">Vista</label>
          <div className="relative">
            <select
              value={vistaType}
              onChange={(e) => setVistaType(e.target.value)}
              className="appearance-none bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#831843]/20 cursor-pointer min-w-[110px]"
            >
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Semana de referencia */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-600">Semana de referencia</label>
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="appearance-none bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#831843]/20 cursor-pointer min-w-[200px]"
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
          <label className="text-[11px] font-bold text-slate-600">Zona</label>
          <div className="relative">
            <select
              value={filterZona}
              onChange={(e) => setFilterZona(e.target.value)}
              className="appearance-none bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#831843]/20 cursor-pointer min-w-[130px]"
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
          <label className="text-[11px] font-bold text-slate-600">Sucursal</label>
          <div className="relative">
            <select
              value={filterSucursal}
              onChange={(e) => setFilterSucursal(e.target.value)}
              className="appearance-none bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#831843]/20 cursor-pointer min-w-[160px]"
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
          <label className="text-[11px] font-bold text-slate-600">App</label>
          <div className="relative">
            <select
              value={filterApp}
              onChange={(e) => setFilterApp(e.target.value)}
              className="appearance-none bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#831843]/20 cursor-pointer min-w-[130px]"
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
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs cursor-pointer"
          >
            Guardar como PDF
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isGuest && (
            <>
              <button
                onClick={onOpenImport}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#831843] hover:bg-[#701a39] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                + Cargar indicadores
              </button>
              <button
                onClick={() => alert('Para agregar una nueva sucursal, cargala en la configuración de tiendas o importa una planilla.')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs cursor-pointer"
              >
                + Sucursal
              </button>
              <button
                onClick={() => alert('Configuración de apps por sucursal')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs cursor-pointer"
              >
                Configurar apps por sucursal
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {kpiStats.storeCount}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            Sucursales en vista
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {fmtInt(kpiStats.totalConfirmados)}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            Pedidos confirmados informados
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {kpiStats.desviosCount}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            Combinaciones con desvíos
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {kpiStats.faltantesCount}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-1">
            Combinaciones con faltantes
          </div>
        </div>
      </div>

      {/* Sub-banner: Period dates & pp notice */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-600">
          {selectedPeriod} - Semana anterior {previousPeriod || 'N/A'} · pp = puntos porcentuales
        </p>
        <div className="bg-[#fffbeb] border border-[#fef3c7] text-[#92400e] text-[11px] px-3.5 py-2 rounded-xl">
          Las alertas incluyen las apps con registro en el periodo o marcadas como operativas. Podés configurar excepciones por sucursal.
        </div>
      </div>

      {/* Comparison Matrix Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-[#1f1a1d] text-white py-3 px-4 text-xs font-bold uppercase tracking-wider">
          <div className="col-span-3">Sucursal</div>
          <div className="col-span-3">PedidosYa</div>
          <div className="col-span-3">Rappi</div>
          <div className="col-span-3">Mercado Delivery</div>
        </div>

        {/* Table Rows per Store */}
        <div className="divide-y divide-slate-200">
          {visibleStores.map((store) => {
            const zona = getStoreZone(store);

            return (
              <div key={store} className="grid grid-cols-12 p-4 items-stretch hover:bg-slate-50/60 transition-colors">
                
                {/* Store Column */}
                <div className="col-span-3 pr-4 flex flex-col justify-start">
                  <span className="font-bold text-sm text-slate-900">{store}</span>
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">{zona}</span>
                </div>

                {/* 3 App Columns */}
                {APPS.map((app) => {
                  const key = `${store}___${app.id}`;
                  const currentItem = currentStoreAppMap[key];
                  const prevItem = prevStoreAppMap[key];

                  if (!currentItem) {
                    return (
                      <div key={app.id} className="col-span-3 px-3 py-2 border-l border-slate-100 flex items-center justify-center text-xs text-slate-400 italic">
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
                    <div key={app.id} className="col-span-3 px-3 border-l border-slate-200 flex flex-col justify-between space-y-3">
                      {/* Badge Status */}
                      <div className="flex items-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          desvio
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {desvio ? 'Desvío' : 'En objetivo'}
                        </span>
                      </div>

                      {/* 2x3 Metric Grid */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
                        {/* Confirmados */}
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Confirmados</div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {fmtInt(currentItem.confirmadas || 0)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {fmtDelta(dConf, false)}
                          </div>
                        </div>

                        {/* Disponibilidad */}
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Disponibilidad</div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {fmtDisplayPct(currentItem.disponibilidad)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {fmtDelta(dDisp, true)}
                          </div>
                        </div>

                        {/* Cancelaciones */}
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Cancelaciones</div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {fmtDisplayPct(currentItem.cancelacionesPct)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {fmtDelta(dCanc, true)}
                          </div>
                        </div>

                        {/* Reclamos */}
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Reclamos</div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {fmtDisplayPct(currentItem.reclamosPct)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {fmtDelta(dRecl, true)}
                          </div>
                        </div>

                        {/* Demoras */}
                        <div className="col-span-2">
                          <div className="text-[10px] text-slate-400 font-medium">Demoras</div>
                          <div className="font-bold text-slate-900 leading-tight">
                            {fmtDisplayPct(currentItem.demorasPct)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {fmtDelta(dDem, true)}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        <button
                          onClick={() => setEditingItem({ ...currentItem })}
                          className="px-3 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Editar Indicadores</h3>
                <p className="text-xs text-slate-500">{editingItem.tienda} · {editingItem.canal}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Confirmados</label>
                <input
                  type="number"
                  value={editingItem.confirmadas ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, confirmadas: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#831843]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Disponibilidad %</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.disponibilidad ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, disponibilidad: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#831843]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Cancelaciones %</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.cancelacionesPct ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, cancelacionesPct: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#831843]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Reclamos %</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.reclamosPct ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, reclamosPct: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#831843]"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Demoras %</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.demorasPct ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, demorasPct: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#831843]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
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
                className="px-4 py-1.5 rounded-xl bg-[#831843] text-white text-xs font-bold hover:bg-[#701a39] shadow-sm cursor-pointer"
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
