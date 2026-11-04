import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  BarChart3, PieChart as PieIcon, TrendingUp, AlertTriangle, 
  ShoppingBag, ShieldAlert, DollarSign, Award, CheckCircle2
} from 'lucide-react';
import { fmtCurrency, fmtInt, fmtPct, getMetricStatus } from '../utils';

// Brand & Visual Palette
const CANAL_COLORS = {
  PEYA: '#ef4444', // Red PedidosYa
  PedidosYa: '#ef4444',
  Rappi: '#f97316', // Orange Rappi
  'Mercado Delivery': '#10b981', // Emerald Mercado Delivery
  MDL: '#10b981'
};

const METRIC_COLORS = {
  cancel: '#f59e0b', // Amber
  reclamos: '#f43f5e', // Rose
  demoras: '#a855f7', // Purple
  pedidos: '#3b82f6', // Blue
  disp: '#14b8a6' // Teal
};

export function OperationalCharts({
  records = [],
  supervisors = [],
  storeMap = {},
  supervisorMap = {},
  thresholds = {},
  selectedPeriod = ''
}) {
  // 1. Data por Canal (Órdenes, Reclamos Costo, Cancelaciones Costo, % Promedios)
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
          reclamosCosto: 0,
          cancPctSum: 0,
          recPctSum: 0,
          demPctSum: 0,
          dispSum: 0,
          count: 0
        };
      }
      map[c].ordenes += (r.confirmadas || 0);
      map[c].cancelaciones += (r.canceladas || 0);
      map[c].cancCosto += (r.canceladasCosto || 0);
      map[c].reclamosCosto += (r.reclamosCosto || 0);
      map[c].cancPctSum += (r.cancelacionesPct || 0);
      map[c].recPctSum += (r.reclamosPct || 0);
      map[c].demPctSum += (r.demorasPct || 0);
      map[c].dispSum += (r.disponibilidad || 0);
      map[c].count += 1;
    });

    return Object.values(map).map((item) => ({
      ...item,
      color: CANAL_COLORS[item.name] || '#3b82f6',
      cancPctAvg: item.count > 0 ? +(item.cancPctSum / item.count).toFixed(2) : 0,
      recPctAvg: item.count > 0 ? +(item.recPctSum / item.count).toFixed(2) : 0,
      demPctAvg: item.count > 0 ? +(item.demPctSum / item.count).toFixed(2) : 0,
      dispAvg: item.count > 0 ? +(item.dispSum / item.count).toFixed(1) : 0
    }));
  }, [records]);

  // 2. Ranking Top 10 Sucursales por Mayor Volumen de Órdenes
  const topStoresVolume = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      if (!map[r.tienda]) {
        map[r.tienda] = {
          tienda: r.tienda,
          ordenes: 0,
          cancCosto: 0,
          reclamosCosto: 0
        };
      }
      map[r.tienda].ordenes += (r.confirmadas || 0);
      map[r.tienda].cancCosto += (r.canceladasCosto || 0);
      map[r.tienda].reclamosCosto += (r.reclamosCosto || 0);
    });

    return Object.values(map)
      .sort((a, b) => b.ordenes - a.ordenes)
      .slice(0, 10);
  }, [records]);

  // 3. Top Sucursales Críticas por Mayor Costo Total de Pérdidas (Cancelaciones + Reclamos)
  const topStoresCostLoss = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      if (!map[r.tienda]) {
        map[r.tienda] = {
          tienda: r.tienda,
          cancCosto: 0,
          reclamosCosto: 0,
          totalPerdida: 0
        };
      }
      const cCost = r.canceladasCosto || 0;
      const rCost = r.reclamosCosto || 0;
      map[r.tienda].cancCosto += cCost;
      map[r.tienda].reclamosCosto += rCost;
      map[r.tienda].totalPerdida += (cCost + rCost);
    });

    return Object.values(map)
      .filter((item) => item.totalPerdida > 0)
      .sort((a, b) => b.totalPerdida - a.totalPerdida)
      .slice(0, 8);
  }, [records]);

  // 4. Comparativa por Supervisora (Órdenes y Promedios)
  const supervisorData = useMemo(() => {
    const map = {};
    supervisors.forEach((sup) => {
      map[sup.id] = {
        name: sup.name,
        color: sup.color,
        ordenes: 0,
        cancCosto: 0,
        reclamosCosto: 0,
        cancPctSum: 0,
        recPctSum: 0,
        demPctSum: 0,
        count: 0
      };
    });

    records.forEach((r) => {
      const supId = storeMap[r.tienda.toLowerCase()];
      if (supId && map[supId]) {
        map[supId].ordenes += (r.confirmadas || 0);
        map[supId].cancCosto += (r.canceladasCosto || 0);
        map[supId].reclamosCosto += (r.reclamosCosto || 0);
        map[supId].cancPctSum += (r.cancelacionesPct || 0);
        map[supId].recPctSum += (r.reclamosPct || 0);
        map[supId].demPctSum += (r.demorasPct || 0);
        map[supId].count += 1;
      }
    });

    return Object.values(map).map((sup) => ({
      ...sup,
      cancPctAvg: sup.count > 0 ? +(sup.cancPctSum / sup.count).toFixed(2) : 0,
      recPctAvg: sup.count > 0 ? +(sup.recPctSum / sup.count).toFixed(2) : 0,
      demPctAvg: sup.count > 0 ? +(sup.demPctSum / sup.count).toFixed(2) : 0
    }));
  }, [records, supervisors, storeMap]);

  // Total Órdenes para porcentajes de torta
  const totalOrders = useMemo(() => {
    return channelData.reduce((acc, c) => acc + c.ordenes, 0);
  }, [channelData]);

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
      {/* Visual Header Banner */}
      <div className="glass-panel rounded-2xl p-5 border border-amber-500/20 bg-gradient-to-r from-slate-900/90 via-amber-950/20 to-slate-900/90 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Centro de Métricas Visuales</span>
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">
            Análisis Gráfico de Operaciones y Canales
          </h3>
          <p className="text-xs text-slate-400">
            Visualización gráfica en barras y participación porcentual para el período: <strong className="text-amber-400">{selectedPeriod || 'Seleccionado'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Datos en tiempo real ({records.length} registros evaluados)</span>
        </div>
      </div>

      {/* Row 1: Gráficos Principales (Distribución de Órdenes y Pérdidas por Canal) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gráfico 1: Barras de Órdenes por Canal */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Volumen de Órdenes por Canal</h4>
                <p className="text-[11px] text-slate-400">Distribución de pedidos confirmados</p>
              </div>
            </div>
            <span className="text-xs font-mono-numbers font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
              {fmtInt(totalOrders)} pedidos
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const pct = totalOrders > 0 ? ((d.ordenes / totalOrders) * 100).toFixed(1) : 0;
                      return (
                        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1">
                          <p className="font-bold text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            {d.name}
                          </p>
                          <p className="text-slate-300 font-mono-numbers">
                            Órdenes: <strong className="text-amber-400">{fmtInt(d.ordenes)}</strong> ({pct}%)
                          </p>
                          <p className="text-slate-400 font-mono-numbers">
                            Cancelaciones: {fmtInt(d.cancelaciones)} ({d.cancPctAvg}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="ordenes" radius={[8, 8, 0, 0]}>
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Canal Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
            {channelData.map((c) => (
              <div key={c.name} className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-medium block">{c.name}</span>
                <span className="text-xs sm:text-sm font-black font-mono-numbers" style={{ color: c.color }}>
                  {fmtInt(c.ordenes)}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {totalOrders > 0 ? `${((c.ordenes / totalOrders) * 100).toFixed(1)}%` : '0%'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 2: Participación de Mercado (% Donut / Pie) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Participación por Canal</h4>
              <p className="text-[11px] text-slate-400">Cuota de pedidos confirmados</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="ordenes"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`donut-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const pct = totalOrders > 0 ? ((d.ordenes / totalOrders) * 100).toFixed(1) : 0;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs">
                          <p className="font-bold text-white">{d.name}</p>
                          <p className="text-amber-400 font-mono-numbers">{fmtInt(d.ordenes)} pedidos ({pct}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</span>
              <span className="text-base font-black text-white font-mono-numbers">{fmtInt(totalOrders)}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-800/80">
            {channelData.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Rankings - Top 10 Sucursales en Órdenes & Top Sucursales en Costo Pérdidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top 10 Sucursales Volumen */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Top 10 Sucursales en Órdenes</h4>
                <p className="text-[11px] text-slate-400">Mayor volumen de despacho en el período</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Líderes de Ventas
            </span>
          </div>

          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topStoresVolume}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}`} />
                <YAxis dataKey="tienda" type="category" stroke="#cbd5e1" fontSize={11} tickLine={false} width={80} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{d.tienda}</p>
                          <p className="text-emerald-400 font-mono-numbers">
                            Confirmadas: <strong>{fmtInt(d.ordenes)} pedidos</strong>
                          </p>
                          <p className="text-slate-400 font-mono-numbers text-[11px]">
                            Costo Cancelaciones: {fmtCurrency(d.cancCosto)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="ordenes" fill="#10b981" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Pérdidas Económicas (Cancelaciones + Reclamos) */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Impacto Económico por Sucursal</h4>
                <p className="text-[11px] text-slate-400">Costo acumulado de Cancelaciones + Reclamos</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              Pérdidas Económicas
            </span>
          </div>

          <div className="h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topStoresCostLoss}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
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
                  tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} 
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{d.tienda}</p>
                          <p className="text-rose-400 font-mono-numbers font-bold">
                            Total Pérdida: {fmtCurrency(d.totalPerdida)}
                          </p>
                          <div className="text-[11px] text-slate-300 font-mono-numbers border-t border-slate-800 pt-1 mt-1 space-y-0.5">
                            <p>Cancelaciones: {fmtCurrency(d.cancCosto)}</p>
                            <p>Reclamos: {fmtCurrency(d.reclamosCosto)}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={28} 
                  formatter={(val) => <span className="text-xs text-slate-300 font-medium">{val === 'cancCosto' ? 'Costo Cancelaciones' : 'Costo Reclamos'}</span>}
                />
                <Bar dataKey="cancCosto" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="reclamosCosto" stackId="a" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 3: Comparativa por Supervisora en Barras */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Desempeño Comparativo por Supervisora</h4>
              <p className="text-[11px] text-slate-400">Tasas promedio de Cancelaciones, Reclamos y Demoras</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-400" />
              <span>% Cancelación</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-400" />
              <span>% Reclamos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-purple-400" />
              <span>% Demoras</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={supervisorData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </p>
                        <p className="text-slate-300 font-mono-numbers">Órdenes totales: {fmtInt(d.ordenes)}</p>
                        <div className="text-[11px] border-t border-slate-800 pt-1 mt-1 space-y-0.5 font-mono-numbers">
                          <p className="text-amber-400">Cancelaciones prom: {d.cancPctAvg}%</p>
                          <p className="text-rose-400">Reclamos prom: {d.recPctAvg}%</p>
                          <p className="text-purple-400">Demoras prom: {d.demPctAvg}%</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="cancPctAvg" name="% Cancelación" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recPctAvg" name="% Reclamos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="demPctAvg" name="% Demoras" fill="#c084fc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
