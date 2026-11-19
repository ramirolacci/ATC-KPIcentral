import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, ArrowRight, Store, Calendar,
  CheckCircle2, AlertTriangle, AlertCircle, ChevronDown, Award, Search, Filter, Download
} from 'lucide-react';
import { fmtInt, fmtCurrency, fmtPct, getMetricStatus } from '../utils';
import { exportStoreComparisonPanelPDF } from '../utils/pdfExport';

/**
 * Custom Styled Filter Dropdown for Store Comparison Panel (Dark glassmorphic)
 */
function ComparisonCustomDropdown({
  label,
  labelColor = 'text-slate-400',
  icon: Icon,
  value,
  onChange,
  options = [],
  searchable = false,
  placeholder = 'Seleccionar...',
  accentColor = 'slate'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const filteredOptions = searchable && search.trim()
    ? normalizedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        opt.value.toLowerCase().includes(search.toLowerCase())
      )
    : normalizedOptions;

  const selectedOpt = normalizedOptions.find((o) => o.value === value) || { value, label: value || placeholder };

  const borderClass = accentColor === 'amber'
    ? 'border-amber-500/40 hover:border-amber-500 focus:border-amber-500'
    : 'border-slate-800 hover:border-slate-700 focus:border-amber-500';

  return (
    <div className={`relative space-y-1.5 ${isOpen ? 'z-50' : 'z-10'}`} ref={containerRef}>
      {label && (
        <label className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${labelColor}`}>
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className={`w-full flex items-center justify-between gap-2.5 bg-slate-950/90 text-white text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 transition-all cursor-pointer border shadow-xs ${borderClass}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOpt.dotColor && (
            <span className={`w-2 h-2 rounded-full shrink-0 ${selectedOpt.dotColor}`} />
          )}
          <span className="truncate">{selectedOpt.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-hidden rounded-xl bg-slate-900 border border-slate-700/90 shadow-2xl z-50 backdrop-blur-xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {searchable && (
            <div className="p-2 border-b border-slate-800 bg-slate-950/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar sucursal..."
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto no-scrollbar p-1.5 space-y-0.5 max-h-56">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.dotColor && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColor}`} />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function StoreComparisonPanel({
  datasets = {},
  availablePeriods = [],
  stores = [],
  supervisors = [],
  storeMap = {},
  supervisorMap = {},
  thresholds = {}
}) {
  // Periods available for selection (default to two latest or month closures)
  const defaultPeriodA = availablePeriods.length > 1 ? availablePeriods[availablePeriods.length - 2] : availablePeriods[0] || '';
  const defaultPeriodB = availablePeriods.length > 0 ? availablePeriods[availablePeriods.length - 1] : '';

  const [periodA, setPeriodA] = useState(defaultPeriodA);
  const [periodB, setPeriodB] = useState(defaultPeriodB);
  const [selectedStore, setSelectedStore] = useState('ALL'); // 'ALL' or store name
  const [selectedCanal, setSelectedCanal] = useState('ALL'); // 'ALL', 'PEYA', 'Rappi', 'Mercado Delivery'
  const [selectedSup, setSelectedSup] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvolution, setFilterEvolution] = useState('ALL'); // 'ALL' | 'IMPROVED' | 'WORSENED'

  // Extract unique store names from available records
  const allStoreNames = useMemo(() => {
    const set = new Set();
    stores.forEach((s) => set.add(s.name));
    Object.values(datasets).forEach((ds) => {
      (ds?.records || []).forEach((r) => set.add(r.tienda));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [stores, datasets]);

  // Comparison data calculation per store
  const storeComparisons = useMemo(() => {
    if (!periodA || !periodB || !datasets[periodA] || !datasets[periodB]) {
      return [];
    }

    const recordsA = datasets[periodA]?.records || [];
    const recordsB = datasets[periodB]?.records || [];

    // Map store + canal
    // If selectedStore !== 'ALL', filter specifically
    const storeMapA = new Map();
    const storeMapB = new Map();

    recordsA.forEach((r) => {
      const key = `${r.tienda.toLowerCase()}__${r.canal}`;
      storeMapA.set(key, r);
    });

    recordsB.forEach((r) => {
      const key = `${r.tienda.toLowerCase()}__${r.canal}`;
      storeMapB.set(key, r);
    });

    // Collect all keys
    const allKeys = new Set([...storeMapA.keys(), ...storeMapB.keys()]);
    const results = [];

    allKeys.forEach((key) => {
      const rA = storeMapA.get(key) || {
        confirmadas: 0,
        cancelaciones: 0,
        cancelacionesPct: 0,
        cancelacionesCosto: 0,
        reclamos: 0,
        reclamosPct: 0,
        reclamosCosto: 0,
        demoras: 0,
        demorasPct: 0,
        disponibilidad: 0
      };

      const rB = storeMapB.get(key) || {
        confirmadas: 0,
        cancelaciones: 0,
        cancelacionesPct: 0,
        cancelacionesCosto: 0,
        reclamos: 0,
        reclamosPct: 0,
        reclamosCosto: 0,
        demoras: 0,
        demorasPct: 0,
        disponibilidad: 0
      };

      const [storeLower, canal] = key.split('__');
      const storeName = storeMapB.get(key)?.tienda || storeMapA.get(key)?.tienda || storeLower;

      // Filter by Canal
      if (selectedCanal !== 'ALL') {
        const isMatch = canal === selectedCanal ||
          ((selectedCanal === 'PEYA' || selectedCanal === 'PedidosYa') && (canal === 'PEYA' || canal === 'PedidosYa'));
        if (!isMatch) return;
      }

      // Filter by Store
      if (selectedStore !== 'ALL' && storeName.toLowerCase() !== selectedStore.toLowerCase()) {
        return;
      }

      // Filter by Supervisor
      const supId = storeMap[storeLower];
      if (selectedSup !== 'ALL' && supId !== selectedSup) {
        return;
      }

      // Filter by Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!storeName.toLowerCase().includes(q) && !canal.toLowerCase().includes(q)) {
          return;
        }
      }

      // Deltas calculation (Period B vs Period A)
      const ordersDiff = rB.confirmadas - rA.confirmadas;
      const ordersPct = rA.confirmadas > 0 ? ((ordersDiff / rA.confirmadas) * 100).toFixed(1) : (rB.confirmadas > 0 ? '+100' : '0');

      const demDiff = Number((rB.demorasPct - rA.demorasPct).toFixed(2));
      const recDiff = Number((rB.reclamosPct - rA.reclamosPct).toFixed(2));
      const recCostoDiff = rB.reclamosCosto - rA.reclamosCosto;
      const dispDiff = Number((rB.disponibilidad - rA.disponibilidad).toFixed(2));

      // Global status score (improved if demoras and reclamos went down, orders up)
      const isImproved = (ordersDiff >= 0 && recDiff <= 0 && demDiff <= 0);
      const isWorsened = (ordersDiff < 0 || recDiff > 0.5 || demDiff > 2.0);

      if (filterEvolution === 'IMPROVED' && !isImproved) return;
      if (filterEvolution === 'WORSENED' && !isWorsened) return;

      const supName = supervisorMap[supId]?.name || 'Sin Asignar';

      results.push({
        key,
        tienda: storeName,
        canal,
        supName,
        rA,
        rB,
        ordersDiff,
        ordersPct,
        demDiff,
        recDiff,
        recCostoDiff,
        dispDiff,
        isImproved,
        isWorsened
      });
    });

    return results.sort((a, b) => b.rB.confirmadas - a.rB.confirmadas);
  }, [periodA, periodB, datasets, selectedCanal, selectedStore, selectedSup, searchQuery, filterEvolution, storeMap, supervisorMap]);

  // Overall comparison aggregates
  const comparisonSummary = useMemo(() => {
    let totOrdersA = 0, totOrdersB = 0;
    let totRecA = 0, totRecB = 0;
    let totRecCostoA = 0, totRecCostoB = 0;
    let totDemA = 0, totDemB = 0;

    storeComparisons.forEach((item) => {
      totOrdersA += item.rA.confirmadas;
      totOrdersB += item.rB.confirmadas;
      totRecA += item.rA.reclamos;
      totRecB += item.rB.reclamos;
      totRecCostoA += item.rA.reclamosCosto;
      totRecCostoB += item.rB.reclamosCosto;
      totDemA += item.rA.demoras;
      totDemB += item.rB.demoras;
    });

    const ordersDelta = totOrdersB - totOrdersA;
    const ordersDeltaPct = totOrdersA > 0 ? ((ordersDelta / totOrdersA) * 100).toFixed(1) : 0;

    const demPctA = totOrdersA > 0 ? ((totDemA / totOrdersA) * 100).toFixed(2) : 0;
    const demPctB = totOrdersB > 0 ? ((totDemB / totOrdersB) * 100).toFixed(2) : 0;

    const recPctA = totOrdersA > 0 ? ((totRecA / totOrdersA) * 100).toFixed(2) : 0;
    const recPctB = totOrdersB > 0 ? ((totRecB / totOrdersB) * 100).toFixed(2) : 0;

    return {
      totOrdersA,
      totOrdersB,
      ordersDelta,
      ordersDeltaPct,
      demPctA,
      demPctB,
      recPctA,
      recPctB,
      totRecCostoA,
      totRecCostoB,
      costoDiff: totRecCostoB - totRecCostoA
    };
  }, [storeComparisons]);

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportStoreComparisonPanelPDF({
        periodA,
        periodB,
        comparisonSummary,
        storeComparisons,
        selectedCanal,
        selectedStore,
        supervisorMap
      });
    } catch (e) {
      console.error('Error al exportar comparativa de tiendas a PDF:', e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Period Selectors */}
      <div className="relative z-30 glass-panel rounded-2xl p-6 border border-amber-500/30 bg-gradient-to-r from-slate-900/95 via-amber-950/20 to-slate-900/95 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
              <Calendar className="w-3 h-3" />
              Panel Comparativo de Actividad
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Comparativa de Sucursales Entre Meses / Períodos
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Seleccioná dos fechas, semanas o cierres de mes para contrastar el progreso de cada sucursal
            </p>
          </div>

          <div>
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF || storeComparisons.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingPDF ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isExportingPDF ? 'Generando PDF...' : 'Descargar Comparativa PDF'}</span>
            </button>
          </div>
        </div>

        {/* Period Selectors Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80 relative z-20">
          {/* Period A */}
          <ComparisonCustomDropdown
            label="Período Base (Mes Anterior)"
            icon={() => <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />}
            value={periodA}
            onChange={setPeriodA}
            options={availablePeriods.map((p) => ({ value: p, label: p }))}
            accentColor="slate"
          />

          {/* Period B */}
          <ComparisonCustomDropdown
            label="Período a Comparar (Mes Actual)"
            labelColor="text-amber-400"
            icon={() => <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />}
            value={periodB}
            onChange={setPeriodB}
            options={availablePeriods.map((p) => ({ value: p, label: p }))}
            accentColor="amber"
          />

          {/* Filter by Specific Store */}
          <ComparisonCustomDropdown
            label="Filtrar Sucursal"
            icon={Store}
            value={selectedStore}
            onChange={setSelectedStore}
            options={[
              { value: 'ALL', label: `Todas las sucursales (${allStoreNames.length})` },
              ...allStoreNames.map((st) => ({ value: st, label: st }))
            ]}
            searchable={true}
            accentColor="slate"
          />

          {/* Filter by Canal */}
          <ComparisonCustomDropdown
            label="Canal"
            value={selectedCanal}
            onChange={setSelectedCanal}
            options={[
              { value: 'ALL', label: 'Todos los canales', dotColor: 'bg-slate-400' },
              { value: 'PEYA', label: 'PedidosYa (PEYA)', dotColor: 'bg-rose-500' },
              { value: 'Rappi', label: 'Rappi', dotColor: 'bg-orange-500' },
              { value: 'Mercado Delivery', label: 'Mercado Delivery', dotColor: 'bg-emerald-400' }
            ]}
            accentColor="slate"
          />
        </div>
      </div>

      {/* Aggregate Comparison Cards (PedidosYa Inspired Look) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* Metric 1: Total Orders */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800/90 bg-slate-900/80 shadow-lg space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-400">Volumen de Pedidos</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono-numbers">
              {fmtInt(comparisonSummary.totOrdersB)}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              comparisonSummary.ordersDelta >= 0
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}>
              {comparisonSummary.ordersDelta >= 0 ? '↑ +' : '↓ '}{comparisonSummary.ordersDeltaPct}%
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono-numbers">
            Base ({periodA}): <strong>{fmtInt(comparisonSummary.totOrdersA)}</strong> pedidos
          </p>
        </div>

        {/* Metric 2: Demoras % */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800/90 bg-slate-900/80 shadow-lg space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-400">Tasa de Demoras Promedio</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono-numbers">
              {comparisonSummary.demPctB}%
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              comparisonSummary.demPctB <= comparisonSummary.demPctA
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}>
              {comparisonSummary.demPctB <= comparisonSummary.demPctA ? '↓ Mejoró' : '↑ Subió'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono-numbers">
            Base ({periodA}): <strong>{comparisonSummary.demPctA}%</strong>
          </p>
        </div>

        {/* Metric 3: Reclamos % */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800/90 bg-slate-900/80 shadow-lg space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-400">Tasa de Reclamos</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono-numbers">
              {comparisonSummary.recPctB}%
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              comparisonSummary.recPctB <= comparisonSummary.recPctA
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}>
              {comparisonSummary.recPctB <= comparisonSummary.recPctA ? '↓ Redujo' : '↑ Aumentó'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono-numbers">
            Base ({periodA}): <strong>{comparisonSummary.recPctA}%</strong>
          </p>
        </div>

        {/* Metric 4: Costo Reclamos */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800/90 bg-slate-900/80 shadow-lg space-y-2">
          <span className="text-[11px] font-bold uppercase text-slate-400">Costo Pérdidas por Reclamos</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-400 font-mono-numbers">
              {fmtCurrency(comparisonSummary.totRecCostoB)}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              comparisonSummary.costoDiff <= 0
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}>
              {comparisonSummary.costoDiff <= 0 ? '↓ Ahorro' : '↑ Mayor costo'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono-numbers">
            Base ({periodA}): {fmtCurrency(comparisonSummary.totRecCostoA)}
          </p>
        </div>
      </div>

      {/* Store Comparison Detailed Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/90 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/90 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Comparativa Detallada Sucursal por Sucursal ({storeComparisons.length})
            </h4>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar tienda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 w-40 sm:w-48 placeholder:text-slate-500"
            />
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFilterEvolution('ALL')}
                className={`px-2 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                  filterEvolution === 'ALL' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFilterEvolution('IMPROVED')}
                className={`px-2 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                  filterEvolution === 'IMPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mejoraron
              </button>
              <button
                type="button"
                onClick={() => setFilterEvolution('WORSENED')}
                className={`px-2 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                  filterEvolution === 'WORSENED' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Empeoraron
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800/90 bg-slate-900/90 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                <th className="p-3.5 whitespace-nowrap">Sucursal</th>
                <th className="p-3.5 whitespace-nowrap">Canal</th>
                <th className="p-3.5 whitespace-nowrap">Supervisora</th>
                
                {/* Period A Header */}
                <th className="p-3.5 text-right border-l border-slate-800 text-slate-400 whitespace-nowrap">
                  {periodA} (Órdenes)
                </th>
                <th className="p-3.5 text-right text-slate-400 whitespace-nowrap">
                  {periodA} (Dem %)
                </th>

                {/* Period B Header */}
                <th className="p-3.5 text-right border-l border-slate-800 text-amber-300 whitespace-nowrap">
                  {periodB} (Órdenes)
                </th>
                <th className="p-3.5 text-right text-amber-300 whitespace-nowrap">
                  {periodB} (Dem %)
                </th>

                {/* Deltas */}
                <th className="p-3.5 text-right border-l border-slate-800 whitespace-nowrap">Evolución Pedidos</th>
                <th className="p-3.5 text-right whitespace-nowrap">Variación Demora</th>
                <th className="p-3.5 text-right whitespace-nowrap">Variación Reclamos</th>
                <th className="p-3.5 text-center whitespace-nowrap">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono-numbers">
              {storeComparisons.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    No se encontraron registros para los filtros seleccionados o faltan datos en los períodos elegidos.
                  </td>
                </tr>
              ) : (
                storeComparisons.map((sc) => {
                  return (
                    <tr key={sc.key} className="hover:bg-slate-800/30 transition-colors whitespace-nowrap">
                      <td className="p-3.5 font-sans font-bold text-white whitespace-nowrap">
                        {sc.tienda}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 ${
                          sc.canal === 'PEYA' || sc.canal === 'PedidosYa'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : sc.canal === 'Rappi'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {sc.canal}
                        </span>
                      </td>
                      <td className="p-3.5 font-sans text-slate-400 whitespace-nowrap">
                        {sc.supName}
                      </td>

                      {/* Period A Values */}
                      <td className="p-3.5 text-right border-l border-slate-800 text-slate-400 whitespace-nowrap">
                        {fmtInt(sc.rA.confirmadas)}
                      </td>
                      <td className="p-3.5 text-right text-slate-400 whitespace-nowrap">
                        {fmtPct(sc.rA.demorasPct)}
                      </td>

                      {/* Period B Values */}
                      <td className="p-3.5 text-right border-l border-slate-800 font-bold text-white whitespace-nowrap">
                        {fmtInt(sc.rB.confirmadas)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-white whitespace-nowrap">
                        {fmtPct(sc.rB.demorasPct)}
                      </td>

                      {/* Delta Orders */}
                      <td className="p-3.5 text-right border-l border-slate-800 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 font-bold">
                          <span className={sc.ordersDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {sc.ordersDiff > 0 ? `+${fmtInt(sc.ordersDiff)}` : fmtInt(sc.ordersDiff)}
                          </span>
                          <span className={`text-[10px] px-1 rounded ${
                            sc.ordersDiff >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            ({sc.ordersPct}%)
                          </span>
                        </div>
                      </td>

                      {/* Delta Demoras */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <span className={`font-semibold ${
                          sc.demDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {sc.demDiff > 0 ? `+${sc.demDiff}%` : `${sc.demDiff}%`}
                        </span>
                      </td>

                      {/* Delta Reclamos */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <span className={`font-semibold ${
                          sc.recDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {sc.recDiff > 0 ? `+${sc.recDiff}%` : `${sc.recDiff}%`}
                        </span>
                      </td>

                      {/* Status Tag */}
                      <td className="p-3.5 text-center font-sans whitespace-nowrap">
                        {sc.isImproved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            <TrendingUp className="w-3 h-3" />
                            Mejora
                          </span>
                        ) : sc.isWorsened ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                            <TrendingDown className="w-3 h-3" />
                            Atención
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                            Estable
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

