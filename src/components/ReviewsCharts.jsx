import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import { Star, BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import { REVIEW_CHANNELS } from '../config';

const CHANNEL_COLOR_MAP = {
  PEYA: '#ef4444',
  Rappi: '#f97316',
  'Mercado Delivery': '#10b981',
  TePido: '#3b82f6',
  Google: '#f59e0b'
};

export function ReviewsCharts({ items = [] }) {
  // 1. Promedio por Canal en el mes
  const channelData = useMemo(() => {
    const map = {};
    REVIEW_CHANNELS.forEach((c) => {
      map[c.id] = {
        name: c.id,
        label: c.label,
        color: CHANNEL_COLOR_MAP[c.id] || c.color || '#3b82f6',
        scoreSum: 0,
        countSum: 0,
        entries: 0
      };
    });

    items.forEach((item) => {
      if (map[item.canal]) {
        map[item.canal].scoreSum += (item.score || 0);
        map[item.canal].countSum += (item.count || 0);
        map[item.canal].entries += 1;
      }
    });

    return Object.values(map)
      .filter((c) => c.entries > 0)
      .map((c) => ({
        ...c,
        avgScore: +(c.scoreSum / c.entries).toFixed(2),
        totalReviews: c.countSum
      }));
  }, [items]);

  // 2. Top 8 Sucursales Mejor Calificadas
  const topStores = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      if (!map[item.tienda]) {
        map[item.tienda] = {
          tienda: item.tienda,
          scoreSum: 0,
          entries: 0,
          totalReviews: 0
        };
      }
      map[item.tienda].scoreSum += item.score;
      map[item.tienda].entries += 1;
      map[item.tienda].totalReviews += item.count;
    });

    return Object.values(map)
      .map((s) => ({
        ...s,
        avgScore: +(s.scoreSum / s.entries).toFixed(2)
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 8);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
      {/* Gráfico 1: Puntuación Promedio por Canal */}
      <div className="lg:col-span-6 glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400/30" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Calificación Promedio por Canal</h4>
              <p className="text-[11px] text-slate-400">Comparativa de estrellas de 1 a 5 ★</p>
            </div>
          </div>
          <span className="text-xs font-mono-numbers font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            Escala 5.0
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channelData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[3.5, 5.0]} tickCount={4} />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold text-white flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          {d.label}
                        </p>
                        <p className="text-amber-400 font-mono-numbers font-bold">
                          Promedio: {d.avgScore.toFixed(2)} ★
                        </p>
                        <p className="text-slate-400 font-mono-numbers text-[11px]">
                          Total opiniones: {d.totalReviews.toLocaleString('es-AR')}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="avgScore" radius={[8, 8, 0, 0]}>
                {channelData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Top Sucursales Calificadas */}
      <div className="lg:col-span-6 glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Top 8 Sucursales Mejor Calificadas</h4>
              <p className="text-[11px] text-slate-400">Promedio global multi-canal</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Excelencia
          </span>
        </div>

        <div className="h-64 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={topStores}
              margin={{ top: 5, right: 30, left: 45, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} domain={[4.0, 5.0]} />
              <YAxis dataKey="tienda" type="category" stroke="#cbd5e1" fontSize={11} tickLine={false} width={80} />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold text-white">{d.tienda}</p>
                        <p className="text-amber-400 font-mono-numbers font-bold">
                          {d.avgScore.toFixed(2)} ★ (Promedio)
                        </p>
                        <p className="text-slate-400 font-mono-numbers text-[11px]">
                          {d.totalReviews.toLocaleString('es-AR')} opiniones registradas
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="avgScore" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
