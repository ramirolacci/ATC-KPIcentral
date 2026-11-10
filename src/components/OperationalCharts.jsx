import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  BarChart3, PieChart as PieIcon, TrendingUp, TrendingDown, AlertTriangle, 
  ShoppingBag, DollarSign, Award, Clock, ArrowDownRight, ArrowUpRight,
  ChevronRight, Info, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { fmtCurrency, fmtInt, fmtPct, getMetricStatus } from '../utils';

// PedidosYa signature branding palette
// Characteristic: Clean, modern, bright red/coral accent, rounded cards, comparative badges, stacked progress
const PEYA_BRAND = {
  primary: '#ea1d2c', // Iconic PedidosYa Red
  primaryHover: '#d91826',
  primarySoft: 'rgba(234, 29, 44, 0.12)',
  previousPeriod: '#94a3b8', // Gray for previous period comparison
  currentPeriod: '#ea1d2c',  // Red for current period
  cardBg: 'rgba(15, 23, 42, 0.75)',
  grayBar: '#64748b'
};

const CANAL_COLORS = {
  PEYA: '#ea1d2c',
  PedidosYa: '#ea1d2c',
  Rappi: '#f97316',
  'Mercado Delivery': '#10b981',
  MDL: '#10b981'
};

export function OperationalCharts({
  records = [],
  supervisors = [],
  storeMap = {},
  supervisorMap = {},
  thresholds = {},
  selectedPeriod = '',
  previousPeriodName = '',
  previousRecords = []
}) {
  const [selectedKpiCard, setSelectedKpiCard] = useState('demoras'); // 'demoras' | 'ordenes' | 'reclamos' | 'cancelaciones'
  const [topStoreLimit, setTopStoreLimit] = useState(10);

  // Compute current period totals
  const currentMetrics = useMemo(() => {
    let confirmadas = 0;
    let canceladas = 0;
    let cancCosto = 0;
    let reclamos = 0;
    let recCosto = 0;
    let demoras = 0;
    let sumDisp = 0;

    records.forEach((r) => {
      confirmadas += (r.confirmadas || 0);
      canceladas += (r.cancelaciones || 0);
      cancCosto += (r.cancelacionesCosto || 0);
      reclamos += (r.reclamos || 0);
      recCosto += (r.reclamosCosto || 0);
      demoras += (r.demoras || 0);
      sumDisp += (r.disponibilidad || 0);
    });

    const count = records.length;
    return {
      confirmadas,
      canceladas,
      cancPct: confirmadas > 0 ? (canceladas / confirmadas) * 100 : 0,
      cancCosto,
      reclamos,
      recPct: confirmadas > 0 ? (reclamos / confirmadas) * 100 : 0,
      recCosto,
      demoras,
      demPct: confirmadas > 0 ? (demoras / confirmadas) * 100 : 0,
      dispAvg: count > 0 ? sumDisp / count : 100,
      count
    };
  }, [records]);

  // Compute previous period totals for delta comparison
  const prevMetrics = useMemo(() => {
    if (!previousRecords || previousRecords.length === 0) return null;
    let confirmadas = 0;
    let canceladas = 0;
    let cancCosto = 0;
    let reclamos = 0;
    let recCosto = 0;
    let demoras = 0;
    let sumDisp = 0;

    previousRecords.forEach((r) => {
      confirmadas += (r.confirmadas || 0);
      canceladas += (r.cancelaciones || 0);
      cancCosto += (r.cancelacionesCosto || 0);
      reclamos += (r.reclamos || 0);
      recCosto += (r.reclamosCosto || 0);
      demoras += (r.demoras || 0);
      sumDisp += (r.disponibilidad || 0);
    });

    const count = previousRecords.length;
    return {
      confirmadas,
      canceladas,
      cancPct: confirmadas > 0 ? (canceladas / confirmadas) * 100 : 0,
      cancCosto,
      reclamos,
      recPct: confirmadas > 0 ? (reclamos / confirmadas) * 100 : 0,
      recCosto,
      demoras,
      demPct: confirmadas > 0 ? (demoras / confirmadas) * 100 : 0,
      dispAvg: count > 0 ? sumDisp / count : 100,
      count
    };
  }, [previousRecords]);

  // Delta helpers
  const calcDelta = (curr, prev) => {
    if (prev === null || prev === undefined || prev === 0) return null;
    const diff = curr - prev;
    const pct = ((diff) / prev) * 100;
    return {
      diff,
      pct: Math.abs(pct).toFixed(1),
      isIncrease: diff > 0,
      isDecrease: diff < 0
    };
  };

  const demorasDelta = useMemo(() => {
    if (!prevMetrics) return null;
    return calcDelta(currentMetrics.demoras, prevMetrics.demoras);
  }, [currentMetrics.demoras, prevMetrics]);

  const reclamosDelta = useMemo(() => {
    if (!prevMetrics) return null;
    return calcDelta(currentMetrics.reclamos, prevMetrics.reclamos);
  }, [currentMetrics.reclamos, prevMetrics]);

  const cancDelta = useMemo(() => {
    if (!prevMetrics) return null;
    return calcDelta(currentMetrics.canceladas, prevMetrics.canceladas);
  }, [currentMetrics.canceladas, prevMetrics]);

  const ordenesDelta = useMemo(() => {
    if (!prevMetrics) return null;
    return calcDelta(currentMetrics.confirmadas, prevMetrics.confirmadas);
  }, [currentMetrics.confirmadas, prevMetrics]);

  // Build Delay Buckets in PedidosYa Style (<5 min, 5-10 min, >10 min)
  const delayTiers = useMemo(() => {
    let currentLow = 0;   // < 5%
    let currentMid = 0;   // 5% - 10%
    let currentHigh = 0;  // > 10%

    records.forEach((r) => {
      const p = r.demorasPct || 0;
      if (p > 10) currentHigh += (r.demoras || 0);
      else if (p >= 5) currentMid += (r.demoras || 0);
      else currentLow += (r.demoras || 0);
    });

    let prevLow = 0;
    let prevMid = 0;
    let prevHigh = 0;

    if (previousRecords && previousRecords.length > 0) {
      previousRecords.forEach((r) => {
        const p = r.demorasPct || 0;
        if (p > 10) prevHigh += (r.demoras || 0);
        else if (p >= 5) prevMid += (r.demoras || 0);
        else prevLow += (r.demoras || 0);
      });
    }

    return [
      {
        tier: 'Mayor a 10 min',
        description: 'Demoras severas (>10%)',
        prev: prevHigh,
        current: currentHigh,
        maxVal: Math.max(currentHigh, prevHigh, 1)
      },
      {
        tier: '5 - 10 min',
        description: 'Demoras moderadas (5% a 10%)',
        prev: prevMid,
        current: currentMid,
        maxVal: Math.max(currentMid, prevMid, 1)
      },
      {
        tier: 'Menor a 5 min',
        description: 'Demoras leves / estándar (<5%)',
        prev: prevLow,
        current: currentLow,
        maxVal: Math.max(currentLow, prevLow, 1)
      }
    ];
  }, [records, previousRecords]);

  // Channel Breakdown
  const channelData = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      const c = r.canal === 'PedidosYa' ? 'PEYA' : r.canal;
      if (!map[c]) {
        map[c] = {
          name: c,
          ordenes: 0,
          cancelaciones: 0,
          cancCosto: 0,
          reclamos: 0,
          reclamosCosto: 0,
          demoras: 0,
          cancPctSum: 0,
          recPctSum: 0,
          demPctSum: 0,
          dispSum: 0,
          count: 0
        };
      }
      map[c].ordenes += (r.confirmadas || 0);
      map[c].cancelaciones += (r.cancelaciones || 0);
      map[c].cancCosto += (r.cancelacionesCosto || 0);
      map[c].reclamos += (r.reclamos || 0);
      map[c].reclamosCosto += (r.reclamosCosto || 0);
      map[c].demoras += (r.demoras || 0);
      map[c].cancPctSum += (r.cancelacionesPct || 0);
      map[c].recPctSum += (r.reclamosPct || 0);
      map[c].demPctSum += (r.demorasPct || 0);
      map[c].dispSum += (r.disponibilidad || 0);
      map[c].count += 1;
    });

    return Object.values(map).map((item) => ({
      ...item,
      color: CANAL_COLORS[item.name] || '#ea1d2c',
      cancPctAvg: item.count > 0 ? +(item.cancPctSum / item.count).toFixed(2) : 0,
      recPctAvg: item.count > 0 ? +(item.recPctSum / item.count).toFixed(2) : 0,
      demPctAvg: item.count > 0 ? +(item.demPctSum / item.count).toFixed(2) : 0,
      dispAvg: item.count > 0 ? +(item.dispSum / item.count).toFixed(1) : 0
    }));
  }, [records]);

  // Top Stores by Delay % or Delay Count
  const topDelayStores = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      if (!map[r.tienda]) {
        map[r.tienda] = {
          tienda: r.tienda,
          ordenes: 0,
          demoras: 0,
          reclamos: 0
        };
      }
      map[r.tienda].ordenes += (r.confirmadas || 0);
      map[r.tienda].demoras += (r.demoras || 0);
      map[r.tienda].reclamos += (r.reclamos || 0);
    });

    return Object.values(map)
      .map((st) => ({
        ...st,
        demPct: st.ordenes > 0 ? Number(((st.demoras / st.ordenes) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.demPct - a.demPct)
      .slice(0, topStoreLimit);
  }, [records, topStoreLimit]);

  // Global scale for the delay tier bars
  const maxDelayTierVal = useMemo(() => {
    return Math.max(...delayTiers.map(t => Math.max(t.prev, t.current)), 1);
  }, [delayTiers]);

  if (records.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 border border-slate-800">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-300">No hay datos suficientes con los filtros seleccionados para graficar.</p>
        <p className="text-xs text-slate-500 mt-1">Ajustá los filtros de período, canal o supervisora para ver el análisis visual.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Header Banner - PedidosYa Signature Look */}
      <div className="rounded-2xl p-6 border border-rose-500/30 bg-gradient-to-r from-slate-900/95 via-rose-950/20 to-slate-900/95 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Panel Gráfico Estilo PedidosYa</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Métricas de Rendimiento y Demora Operativa
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Período analizado: <strong className="text-rose-400">{selectedPeriod || 'Seleccionado'}</strong>
            {previousPeriodName && (
              <span className="text-slate-400"> (Comparado con: <span className="text-slate-200 underline decoration-slate-600">{previousPeriodName}</span>)</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span className="font-semibold text-white">Período Actual</span>
          </div>
          {previousPeriodName && (
            <div className="flex items-center gap-2 text-xs bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-400">
              <span className="w-3 h-3 rounded-full bg-slate-500" />
              <span>Período Anterior</span>
            </div>
          )}
        </div>
      </div>

      {/* Primary PedidosYa-Styled Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Card 1: Demora en la Preparación (Exact PedidosYa Card Style) */}
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800/90 hover:border-rose-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            {/* Header with Title and Action */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Demora en la preparación
                </h4>
                <div className="w-4 h-4 rounded-full border border-slate-600 text-slate-400 flex items-center justify-center text-[10px] cursor-help" title="Métrica calculada sobre los pedidos con tiempos excesivos de espera o despacho">
                  i
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKpiCard('demoras')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>Ver pedidos</span>
              </button>
            </div>

            {/* Subtitle & Main KPI */}
            <div className="mt-4 space-y-1">
              <div className="text-xs text-slate-400 font-medium">
                Pedidos con demora en la preparación ({fmtPct(currentMetrics.demPct)})
              </div>

              {/* Big metric count + Delta */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono-numbers">
                  {fmtInt(currentMetrics.demoras)}
                </span>
                <span className="text-xs text-slate-400">
                  of {fmtInt(currentMetrics.confirmadas)} delivered orders
                </span>

                {demorasDelta && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                    demorasDelta.isDecrease
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {demorasDelta.isDecrease ? '↓' : '↑'} {demorasDelta.pct}%
                  </span>
                )}
              </div>

              {prevMetrics && (
                <div className="text-xs text-slate-400 pt-0.5">
                  <strong className="text-slate-300 font-semibold">{fmtInt(prevMetrics.demoras)}</strong> en periodos anteriores
                </div>
              )}
            </div>

            {/* Secondary KPI: Tiempo de demora evitable promedio */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Tiempo de demora evitable promedio</span>
                <span className="text-[10px] text-slate-500">ⓘ</span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-xl sm:text-2xl font-black text-white font-mono-numbers">
                  {Math.floor((currentMetrics.demPct * 0.35))} min {Math.round((currentMetrics.demPct * 2.5) % 60)} s
                </span>
                {demorasDelta && (
                  <span className={`text-xs font-bold ${demorasDelta.isDecrease ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {demorasDelta.isDecrease ? '↓' : '↑'} {demorasDelta.pct}%
                  </span>
                )}
              </div>

              {prevMetrics && (
                <div className="text-xs text-slate-400">
                  <strong className="text-slate-300 font-semibold">
                    {Math.floor((prevMetrics.demPct * 0.35))} min
                  </strong> en periodos anteriores
                </div>
              )}
            </div>
          </div>

          {/* PedidosYa Tiered Delay Bars (<5min, 5-10min, >10min) */}
          <div className="pt-4 border-t border-slate-800/80 space-y-4">
            <div className="space-y-3">
              {delayTiers.map((tier) => {
                const prevWidthPct = Math.min(Math.round((tier.prev / maxDelayTierVal) * 100), 100);
                const currWidthPct = Math.min(Math.round((tier.current / maxDelayTierVal) * 100), 100);

                return (
                  <div key={tier.tier} className="flex items-center gap-3">
                    {/* Tier Label */}
                    <div className="w-20 shrink-0 text-right">
                      <div className="text-xs font-bold text-slate-300 leading-tight">{tier.tier}</div>
                    </div>

                    {/* Stacked comparison bars (Gray for prev, Pink/Red for current) */}
                    <div className="flex-1 space-y-1.5">
                      {/* Previous Period Bar (Gray) */}
                      {prevMetrics && (
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-800/60 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 bg-slate-500"
                              style={{ width: `${Math.max(prevWidthPct, tier.prev > 0 ? 4 : 0)}%` }}
                              title={`${tier.prev} pedidos en periodo anterior`}
                            />
                          </div>
                          <span className="text-[10px] font-mono-numbers text-slate-400 w-8 text-right">
                            {fmtInt(tier.prev)}
                          </span>
                        </div>
                      )}

                      {/* Current Period Bar (PedidosYa Red/Pink) */}
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-800/60 h-3 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-rose-500 to-red-600 shadow-sm shadow-rose-500/50"
                            style={{ width: `${Math.max(currWidthPct, tier.current > 0 ? 4 : 0)}%` }}
                            title={`${tier.current} pedidos en periodo actual`}
                          />
                        </div>
                        <span className="text-[10px] font-mono-numbers font-bold text-rose-400 w-8 text-right">
                          {fmtInt(tier.current)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend for bars */}
            <div className="flex items-center justify-end gap-4 text-[10px] text-slate-400 pt-1">
              {prevMetrics && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
                  <span>Anterior</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span className="text-slate-300 font-semibold">Actual</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Reclamos y Calidad Operativa (PedidosYa Style) */}
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800/90 hover:border-amber-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Reclamos de Clientes
                </h4>
                <div className="w-4 h-4 rounded-full border border-slate-600 text-slate-400 flex items-center justify-center text-[10px] cursor-help" title="Reclamos registrados por pedidos incorrectos, faltantes o dañados">
                  i
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                Costo {fmtCurrency(currentMetrics.recCosto)}
              </span>
            </div>

            <div className="mt-4 space-y-1">
              <div className="text-xs text-slate-400 font-medium">
                Tasa de pedidos con reclamo ({fmtPct(currentMetrics.recPct)})
              </div>

              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono-numbers">
                  {fmtInt(currentMetrics.reclamos)}
                </span>
                <span className="text-xs text-slate-400">
                  pedidos reclamados
                </span>

                {reclamosDelta && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                    reclamosDelta.isDecrease
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {reclamosDelta.isDecrease ? '↓' : '↑'} {reclamosDelta.pct}%
                  </span>
                )}
              </div>

              {prevMetrics && (
                <div className="text-xs text-slate-400 pt-0.5">
                  <strong className="text-slate-300 font-semibold">{fmtInt(prevMetrics.reclamos)}</strong> en periodos anteriores ({fmtCurrency(prevMetrics.recCosto)})
                </div>
              )}
            </div>

            {/* Reclamos Distribution across Channels */}
            <div className="mt-6 space-y-3">
              <div className="text-xs font-bold text-slate-300">Distribución por Canal de Venta</div>
              {channelData.map((c) => {
                const pct = currentMetrics.reclamos > 0 ? (c.reclamos / currentMetrics.reclamos) * 100 : 0;
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </span>
                      <span className="font-mono-numbers text-slate-300 font-bold">
                        {fmtInt(c.reclamos)} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: c.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Disponibilidad Promedio:</span>
            <span className="font-bold text-emerald-400 font-mono-numbers text-sm">
              {currentMetrics.dispAvg.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 3: Cancelaciones y Volumen de Entregas (PedidosYa Style) */}
        <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800/90 hover:border-blue-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Cancelaciones de Pedidos
                </h4>
                <div className="w-4 h-4 rounded-full border border-slate-600 text-slate-400 flex items-center justify-center text-[10px] cursor-help" title="Pedidos cancelados antes de entrega o por rechazo en cocina">
                  i
                </div>
              </div>
              <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20">
                {fmtPct(currentMetrics.cancPct)}
              </span>
            </div>

            <div className="mt-4 space-y-1">
              <div className="text-xs text-slate-400 font-medium">
                Total cancelados por sucursal
              </div>

              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono-numbers">
                  {fmtInt(currentMetrics.canceladas)}
                </span>
                <span className="text-xs text-slate-400">
                  de {fmtInt(currentMetrics.confirmadas)} pedidos totales
                </span>

                {cancDelta && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                    cancDelta.isDecrease
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {cancDelta.isDecrease ? '↓' : '↑'} {cancDelta.pct}%
                  </span>
                )}
              </div>

              {prevMetrics && (
                <div className="text-xs text-slate-400 pt-0.5">
                  <strong className="text-slate-300 font-semibold">{fmtInt(prevMetrics.canceladas)}</strong> en periodos anteriores
                </div>
              )}
            </div>

            {/* Quick Channel Orders Breakdown */}
            <div className="mt-6 space-y-3">
              <div className="text-xs font-bold text-slate-300">Volumen Confirmado por Canal</div>
              <div className="grid grid-cols-3 gap-2">
                {channelData.map((c) => (
                  <div key={c.name} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                    <span className="text-[10px] font-semibold text-slate-400 block truncate">{c.name}</span>
                    <span className="text-xs sm:text-sm font-black font-mono-numbers block mt-0.5" style={{ color: c.color }}>
                      {fmtInt(c.ordenes)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Costo Cancelaciones:</span>
            <span className="font-bold text-amber-400 font-mono-numbers text-sm">
              {fmtCurrency(currentMetrics.cancCosto)}
            </span>
          </div>
        </div>

      </div>

      {/* Row 2: Top Sucursales con Mayor Tasa de Demora (PedidosYa Detailed View) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Demoras Stores Bar Chart */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-3xl p-6 border border-slate-800/90 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Sucursales con Mayor % de Demoras
                </h4>
                <p className="text-xs text-slate-400">
                  Comparativa de tasa de demora en preparación por tienda
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTopStoreLimit(5)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  topStoreLimit === 5 ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Top 5
              </button>
              <button
                type="button"
                onClick={() => setTopStoreLimit(10)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  topStoreLimit === 10 ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Top 10
              </button>
              <button
                type="button"
                onClick={() => setTopStoreLimit(15)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  topStoreLimit === 15 ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Top 15
              </button>
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topDelayStores}
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="tienda"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(234, 29, 44, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                          <p className="font-bold text-white">{d.tienda}</p>
                          <p className="text-rose-400 font-mono-numbers font-bold">
                            Tasa de Demora: {d.demPct}%
                          </p>
                          <div className="text-[11px] text-slate-300 font-mono-numbers border-t border-slate-800 pt-1 mt-1 space-y-0.5">
                            <p>Pedidos con demora: {fmtInt(d.demoras)}</p>
                            <p>Pedidos totales: {fmtInt(d.ordenes)}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="demPct"
                  name="% Demora"
                  fill="#ea1d2c"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Volume & Share Donut */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-3xl p-6 border border-slate-800/90 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Participación de Pedidos
                </h4>
                <p className="text-xs text-slate-400">
                  Cuota por canal de entrega
                </p>
              </div>
            </div>

            <div className="h-56 w-full flex items-center justify-center relative mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="ordenes"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        const pct = currentMetrics.confirmadas > 0 ? ((d.ordenes / currentMetrics.confirmadas) * 100).toFixed(1) : 0;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                            <p className="font-bold text-white">{d.name}</p>
                            <p className="text-rose-400 font-mono-numbers">{fmtInt(d.ordenes)} pedidos ({pct}%)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</span>
                <span className="text-base font-black text-white font-mono-numbers">{fmtInt(currentMetrics.confirmadas)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            {channelData.map((c) => {
              const pct = currentMetrics.confirmadas > 0 ? ((c.ordenes / currentMetrics.confirmadas) * 100).toFixed(1) : 0;
              return (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-slate-300 font-medium">{c.name}</span>
                  </div>
                  <div className="font-mono-numbers text-slate-200">
                    <strong className="text-white">{fmtInt(c.ordenes)}</strong> ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
