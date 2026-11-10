import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, ArrowRight, Store, Calendar,
  CheckCircle2, AlertTriangle, AlertCircle, ChevronDown, Award, Search, Filter
} from 'lucide-react';
import { fmtInt, fmtCurrency, fmtPct, getMetricStatus } from '../utils';

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

  return (
    <div className="space-y-6">
      {/* Header and Period Selectors */}
      <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 bg-gradient-to-r from-slate-900/95 via-amber-950/20 to-slate-900/95 shadow-2xl space-y-5">
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
        </div>

        {/* Period Selectors Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80">
          {/* Period A */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              Período Base (Mes Anterior)
            </label>
            <select
              value={periodA}
              onChange={(e) => setPeriodA(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              {availablePeriods.map((p) => (
                <option key={`a-${p}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Period B */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Período a Comparar (Mes Actual)
            </label>
            <select
              value={periodB}
              onChange={(e) => setPeriodB(e.target.value)}
              className="w-full bg-slate-950/90 border border-amber-500/40 hover:border-amber-500 text-white text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-colors cursor-pointer"
            >
              {availablePeriods.map((p) => (
                <option key={`b-${p}`} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Specific Store */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              Filtrar Sucursal
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="ALL">Todas las sucursales ({allStoreNames.length})</option>
              {allStoreNames.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Canal */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Canal
            </label>
            <select
              value={selectedCanal}
              onChange={(e) => setSelectedCanal(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-800 hover:border-slate-700 text-white text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
            >
              <option value="ALL">Todos los canales</option>
              <option value="PEYA">PedidosYa (PEYA)</option>
              <option value="Rappi">Rappi</option>
              <option value="Mercado Delivery">Mercado Delivery</option>
            </select>
          </div>
        </div>
      </div>

      {/* Aggregate Comparison Cards (PedidosYa Inspired Look) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <tr className="border-b border-slate-800/90 bg-slate-900/90 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="p-3.5">Sucursal</th>
                <th className="p-3.5">Canal</th>
                <th className="p-3.5">Supervisora</th>
                
                {/* Period A Header */}
                <th className="p-3.5 text-right border-l border-slate-800 text-slate-400">
                  {periodA} (Órdenes)
                </th>
                <th className="p-3.5 text-right text-slate-400">
                  {periodA} (Dem %)
                </th>

                {/* Period B Header */}
                <th className="p-3.5 text-right border-l border-slate-800 text-amber-300">
                  {periodB} (Órdenes)
                </th>
                <th className="p-3.5 text-right text-amber-300">
                  {periodB} (Dem %)
                </th>

                {/* Deltas */}
                <th className="p-3.5 text-right border-l border-slate-800">Evolución Pedidos</th>
                <th className="p-3.5 text-right">Variación Demora</th>
                <th className="p-3.5 text-right">Variación Reclamos</th>
                <th className="p-3.5 text-center">Estado</th>
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
                    <tr key={sc.key} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-sans font-bold text-white">
                        {sc.tienda}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sc.canal === 'PEYA' || sc.canal === 'PedidosYa'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : sc.canal === 'Rappi'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {sc.canal}
                        </span>
                      </td>
                      <td className="p-3.5 font-sans text-slate-400">
                        {sc.supName}
                      </td>

                      {/* Period A Values */}
                      <td className="p-3.5 text-right border-l border-slate-800 text-slate-400">
                        {fmtInt(sc.rA.confirmadas)}
                      </td>
                      <td className="p-3.5 text-right text-slate-400">
                        {fmtPct(sc.rA.demorasPct)}
                      </td>

                      {/* Period B Values */}
                      <td className="p-3.5 text-right border-l border-slate-800 font-bold text-white">
                        {fmtInt(sc.rB.confirmadas)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-white">
                        {fmtPct(sc.rB.demorasPct)}
                      </td>

                      {/* Delta Orders */}
                      <td className="p-3.5 text-right border-l border-slate-800">
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
                      <td className="p-3.5 text-right">
                        <span className={`font-semibold ${
                          sc.demDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {sc.demDiff > 0 ? `+${sc.demDiff}%` : `${sc.demDiff}%`}
                        </span>
                      </td>

                      {/* Delta Reclamos */}
                      <td className="p-3.5 text-right">
                        <span className={`font-semibold ${
                          sc.recDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {sc.recDiff > 0 ? `+${sc.recDiff}%` : `${sc.recDiff}%`}
                        </span>
                      </td>

                      {/* Status Tag */}
                      <td className="p-3.5 text-center font-sans">
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

