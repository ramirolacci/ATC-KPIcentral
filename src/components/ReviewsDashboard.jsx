import React, { useState, useMemo, useRef } from 'react';
import { 
  Star, TrendingUp, AlertTriangle, 
  MessageSquare, Plus, ArrowUpRight, ArrowDownRight,
  Search, X, Trash2
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { REVIEW_CHANNELS, CANAL_THEMES } from '../config';
import { AnimatedCounter } from './AnimatedCounter';
import { ModalWrapper } from './ModalWrapper';
import { CustomSelect } from './CustomSelect';
import { ReviewsCharts } from './ReviewsCharts';

// Initial synthetic monthly reviews structure covering 5 channels
export const INITIAL_REVIEWS_DATA = {
  'Octubre 2026': [
    { tienda: 'Las Cañitas', canal: 'PEYA', score: 4.8, prevScore: 4.7, count: 142, prevCount: 130 },
    { tienda: 'Las Cañitas', canal: 'Rappi', score: 4.7, prevScore: 4.6, count: 88, prevCount: 75 },
    { tienda: 'Las Cañitas', canal: 'Mercado Delivery', score: 4.9, prevScore: 4.8, count: 45, prevCount: 40 },
    { tienda: 'Las Cañitas', canal: 'TePido', score: 4.8, prevScore: 4.7, count: 62, prevCount: 50 },
    { tienda: 'Las Cañitas', canal: 'Google', score: 4.6, prevScore: 4.6, count: 35, prevCount: 30 },

    { tienda: 'Caballito', canal: 'PEYA', score: 4.6, prevScore: 4.8, count: 210, prevCount: 195 },
    { tienda: 'Caballito', canal: 'Rappi', score: 4.5, prevScore: 4.7, count: 120, prevCount: 115 },
    { tienda: 'Caballito', canal: 'Mercado Delivery', score: 4.7, prevScore: 4.7, count: 55, prevCount: 50 },
    { tienda: 'Caballito', canal: 'TePido', score: 4.6, prevScore: 4.6, count: 80, prevCount: 70 },
    { tienda: 'Caballito', canal: 'Google', score: 4.4, prevScore: 4.5, count: 60, prevCount: 55 },

    { tienda: 'Palermo', canal: 'PEYA', score: 4.7, prevScore: 4.6, count: 180, prevCount: 160 },
    { tienda: 'Palermo', canal: 'Rappi', score: 4.6, prevScore: 4.5, count: 95, prevCount: 90 },
    { tienda: 'Palermo', canal: 'Mercado Delivery', score: 4.8, prevScore: 4.8, count: 40, prevCount: 38 },
    { tienda: 'Palermo', canal: 'TePido', score: 4.7, prevScore: 4.6, count: 70, prevCount: 65 },
    { tienda: 'Palermo', canal: 'Google', score: 4.5, prevScore: 4.4, count: 48, prevCount: 40 },

    { tienda: 'Belgrano', canal: 'PEYA', score: 4.6, prevScore: 4.7, count: 165, prevCount: 150 },
    { tienda: 'Belgrano', canal: 'Rappi', score: 4.5, prevScore: 4.6, count: 85, prevCount: 80 },
    { tienda: 'Belgrano', canal: 'Mercado Delivery', score: 4.7, prevScore: 4.7, count: 32, prevCount: 30 },
    { tienda: 'Belgrano', canal: 'TePido', score: 4.6, prevScore: 4.5, count: 54, prevCount: 50 },
    { tienda: 'Belgrano', canal: 'Google', score: 4.3, prevScore: 4.4, count: 42, prevCount: 38 },

    { tienda: 'Martínez', canal: 'PEYA', score: 4.7, prevScore: 4.7, count: 130, prevCount: 125 },
    { tienda: 'Martínez', canal: 'Rappi', score: 4.6, prevScore: 4.6, count: 70, prevCount: 68 },
    { tienda: 'Martínez', canal: 'Mercado Delivery', score: 4.8, prevScore: 4.7, count: 28, prevCount: 25 },
    { tienda: 'Martínez', canal: 'TePido', score: 4.8, prevScore: 4.7, count: 48, prevCount: 45 },
    { tienda: 'Martínez', canal: 'Google', score: 4.5, prevScore: 4.4, count: 38, prevCount: 35 },

    { tienda: 'Ituzaingó', canal: 'PEYA', score: 4.3, prevScore: 4.6, count: 175, prevCount: 160 },
    { tienda: 'Ituzaingó', canal: 'Rappi', score: 4.2, prevScore: 4.5, count: 40, prevCount: 38 },
    { tienda: 'Ituzaingó', canal: 'Mercado Delivery', score: 4.5, prevScore: 4.6, count: 25, prevCount: 22 },
    { tienda: 'Ituzaingó', canal: 'TePido', score: 4.4, prevScore: 4.5, count: 50, prevCount: 48 },
    { tienda: 'Ituzaingó', canal: 'Google', score: 4.1, prevScore: 4.3, count: 52, prevCount: 45 },

    { tienda: 'Villa Urquiza', canal: 'PEYA', score: 4.7, prevScore: 4.6, count: 155, prevCount: 140 },
    { tienda: 'Villa Urquiza', canal: 'Rappi', score: 4.6, prevScore: 4.5, count: 80, prevCount: 75 },
    { tienda: 'Villa Urquiza', canal: 'Mercado Delivery', score: 4.8, prevScore: 4.8, count: 30, prevCount: 28 },
    { tienda: 'Villa Urquiza', canal: 'TePido', score: 4.7, prevScore: 4.6, count: 65, prevCount: 60 },
    { tienda: 'Villa Urquiza', canal: 'Google', score: 4.6, prevScore: 4.5, count: 44, prevCount: 40 },

    { tienda: 'Devoto', canal: 'PEYA', score: 4.8, prevScore: 4.7, count: 140, prevCount: 135 },
    { tienda: 'Devoto', canal: 'Rappi', score: 4.7, prevScore: 4.6, count: 75, prevCount: 70 },
    { tienda: 'Devoto', canal: 'Mercado Delivery', score: 4.9, prevScore: 4.8, count: 22, prevCount: 20 },
    { tienda: 'Devoto', canal: 'TePido', score: 4.8, prevScore: 4.7, count: 58, prevCount: 52 },
    { tienda: 'Devoto', canal: 'Google', score: 4.6, prevScore: 4.5, count: 36, prevCount: 32 }
  ],
  'Septiembre 2026': [
    { tienda: 'Las Cañitas', canal: 'PEYA', score: 4.7, prevScore: 4.6, count: 130, prevCount: 120 },
    { tienda: 'Las Cañitas', canal: 'Rappi', score: 4.6, prevScore: 4.5, count: 75, prevCount: 70 },
    { tienda: 'Las Cañitas', canal: 'Mercado Delivery', score: 4.8, prevScore: 4.7, count: 40, prevCount: 35 },
    { tienda: 'Las Cañitas', canal: 'TePido', score: 4.7, prevScore: 4.6, count: 50, prevCount: 45 },
    { tienda: 'Las Cañitas', canal: 'Google', score: 4.6, prevScore: 4.5, count: 30, prevCount: 25 },
    { tienda: 'Caballito', canal: 'PEYA', score: 4.8, prevScore: 4.7, count: 195, prevCount: 185 },
    { tienda: 'Caballito', canal: 'Rappi', score: 4.7, prevScore: 4.6, count: 115, prevCount: 110 }
  ]
};

export function ReviewsDashboard({ supervisors, stores, currentUser }) {
  const isGuest = currentUser?.role === 'guest';
  const [reviewsData, setReviewsData] = useState(() => {
    const saved = localStorage.getItem('mg_kpi_reviews_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_REVIEWS_DATA;
  });

  const [selectedMonth, setSelectedMonth] = useState('Octubre 2026');
  const [selectedCanal, setSelectedCanal] = useState('ALL');
  const [selectedSup, setSelectedSup] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  const reviewsContainerRef = useRef(null);

  // GSAP animation for initial mount
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.fromTo(
        '.rev-filter-bar',
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.4 }
      ).fromTo(
        '.rev-metric-card',
        { opacity: 0, y: 12, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.04 },
        '-=0.2'
      ).fromTo(
        '.rev-table-container',
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.35 },
        '-=0.2'
      );
    },
    { scope: reviewsContainerRef, dependencies: [] }
  );

  // Subtle transition when changing month, canal or supervisor filters
  useGSAP(
    () => {
      if (!reviewsContainerRef.current) return;
      const target = reviewsContainerRef.current.querySelector('.rev-table-container');
      if (target) {
        gsap.fromTo(
          target,
          { opacity: 0.45 },
          { opacity: 1, duration: 0.22, ease: 'power1.out' }
        );
      }
    },
    { scope: reviewsContainerRef, dependencies: [selectedMonth, selectedCanal, selectedSup] }
  );

  // New review form state
  const [newForm, setNewForm] = useState({
    tienda: stores[0]?.name || '',
    canal: 'PEYA',
    score: 4.7,
    count: 100,
    prevScore: 4.6
  });

  // Options for modal dropdowns with rich styles
  const storeOptions = useMemo(() => {
    return stores.map((s) => ({
      value: s.name,
      label: s.name
    }));
  }, [stores]);

  const formCanalOptions = useMemo(() => {
    return REVIEW_CHANNELS.map((c) => ({
      value: c.id,
      label: c.label,
      color: c.color
    }));
  }, []);

  // Store & Sup maps
  const storeMap = useMemo(() => {
    const m = {};
    stores.forEach((s) => (m[s.name.toLowerCase()] = s.sup));
    return m;
  }, [stores]);

  const supervisorMap = useMemo(() => {
    const m = {};
    supervisors.forEach((s) => (m[s.id] = s));
    return m;
  }, [supervisors]);

  // Current month items
  const monthItems = reviewsData[selectedMonth] || [];

  // Filtered items
  const filteredItems = useMemo(() => {
    return monthItems
      .map((item, originalIndex) => ({ ...item, _originalIndex: originalIndex }))
      .filter((item) => {
        if (selectedCanal !== 'ALL' && item.canal !== selectedCanal) return false;
        const supId = storeMap[item.tienda.toLowerCase()];
        if (selectedSup !== 'ALL' && supId !== selectedSup) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          if (!item.tienda.toLowerCase().includes(q) && !item.canal.toLowerCase().includes(q)) {
            return false;
          }
        }
        return true;
      });
  }, [monthItems, selectedCanal, selectedSup, searchTerm, storeMap]);

  // Global summaries
  const summary = useMemo(() => {
    if (filteredItems.length === 0) return { avgScore: 0, totalReviews: 0, dropCount: 0 };
    const totalReviews = filteredItems.reduce((acc, r) => acc + (r.count || 0), 0);
    const weightedScoreSum = filteredItems.reduce((acc, r) => acc + (r.score * (r.count || 1)), 0);
    const weightedCount = filteredItems.reduce((acc, r) => acc + (r.count || 1), 0);
    const avgScore = weightedCount > 0 ? weightedScoreSum / weightedCount : 0;
    
    // Check drops (score < prevScore by 0.15 or more)
    const dropCount = filteredItems.filter((r) => r.prevScore && (r.prevScore - r.score) >= 0.15).length;

    return {
      avgScore: avgScore.toFixed(2),
      totalReviews,
      dropCount
    };
  }, [filteredItems]);

  const handleSaveReview = (e) => {
    e.preventDefault();
    const updated = { ...reviewsData };
    if (!updated[selectedMonth]) updated[selectedMonth] = [];
    
    const existingIdx = updated[selectedMonth].findIndex(
      (r) => r.tienda.toLowerCase() === newForm.tienda.toLowerCase() && r.canal === newForm.canal
    );

    const record = {
      tienda: newForm.tienda,
      canal: newForm.canal,
      score: parseFloat(newForm.score),
      prevScore: parseFloat(newForm.prevScore),
      count: parseInt(newForm.count, 10),
      prevCount: Math.round(parseInt(newForm.count, 10) * 0.9)
    };

    if (existingIdx >= 0) {
      updated[selectedMonth][existingIdx] = record;
    } else {
      updated[selectedMonth].push(record);
    }

    setReviewsData(updated);
    localStorage.setItem('mg_kpi_reviews_v2', JSON.stringify(updated));
    setShowAddModal(false);
  };

  return (
    <div ref={reviewsContainerRef} className="space-y-6 w-full">
      {/* Filter Bar */}
      <div className="rev-filter-bar relative z-30 glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Month */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mes</span>
              <CustomSelect
                value={selectedMonth}
                onChange={setSelectedMonth}
                options={Object.keys(reviewsData).map((m) => ({ value: m, label: m }))}
                placeholder="Seleccionar mes"
                className="w-44 sm:w-52"
              />
            </div>

            {/* Canal Switcher - Modern Segmented Control */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Canal</span>
              <div className={`inline-flex rounded-xl bg-slate-950/80 p-1 border shadow-inner transition-colors duration-300 ${
                selectedCanal === 'PEYA' || selectedCanal === 'PedidosYa' ? 'border-red-500/40' :
                selectedCanal === 'Rappi' ? 'border-orange-500/40' :
                selectedCanal === 'Mercado Delivery' ? 'border-amber-400/40' :
                selectedCanal === 'TePido' ? 'border-purple-500/40' :
                selectedCanal === 'Google' ? 'border-sky-500/40' :
                'border-slate-800/80'
              }`}>
                <button
                  onClick={() => setSelectedCanal('ALL')}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 cursor-pointer ${
                    selectedCanal === 'ALL'
                      ? CANAL_THEMES.ALL.active
                      : CANAL_THEMES.ALL.inactive
                  }`}
                >
                  Todos (5)
                </button>
                {REVIEW_CHANNELS.map((c) => {
                  const theme = CANAL_THEMES[c.id] || CANAL_THEMES.ALL;
                  const isSelected = selectedCanal === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCanal(c.id)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 cursor-pointer ${
                        isSelected ? theme.active : theme.inactive
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Supervisora */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supervisora</span>
              <CustomSelect
                value={selectedSup}
                onChange={setSelectedSup}
                options={[
                  { value: 'ALL', label: 'Todas las Supervisoras' },
                  ...supervisors.map((s) => ({
                    value: s.id,
                    label: s.name,
                    color: s.color
                  }))
                ]}
                placeholder="Seleccionar supervisora"
                className="w-52 sm:w-60"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar sucursal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/15 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-500 transition-all duration-200 w-44 sm:w-52 focus:outline-none shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>

            {!isGuest && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Carga Mensual</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row - Modern Glass Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 font-mono-numbers">
        {/* Puntuación Promedio */}
        <div className="rev-metric-card glass-card rounded-2xl p-4 sm:p-5 shadow-lg hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
            <span className="font-semibold text-slate-300">Puntuación Promedio General</span>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400/20 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-2 tracking-tight">
            <AnimatedCounter value={parseFloat(summary.avgScore) || 0} decimals={2} />
            <span className="text-sm font-semibold text-slate-500">/ 5.00</span>
          </div>
          <div className="mt-2 font-sans">
            <span className="inline-flex items-center text-[11px] font-medium text-slate-400">
              Ponderado por volumen de reseñas
            </span>
          </div>
        </div>

        {/* Reseñas Nuevas */}
        <div className="rev-metric-card glass-card rounded-2xl p-4 sm:p-5 shadow-lg hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
            <span className="font-semibold text-slate-300">Total Nuevas Reseñas</span>
            <MessageSquare className="w-5 h-5 text-blue-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            <AnimatedCounter value={summary.totalReviews} decimals={0} />
          </div>
          <div className="mt-2 font-sans">
            <span className="inline-flex items-center text-[11px] font-medium text-slate-400">
              Relevadas en el mes actual
            </span>
          </div>
        </div>

        {/* Alertas de Caída */}
        <div className="rev-metric-card glass-card rounded-2xl p-4 sm:p-5 shadow-lg hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
            <span className="font-semibold text-slate-300">Alertas por Caída de Calificación</span>
            <AlertTriangle
              className={`w-5 h-5 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200 ${
                summary.dropCount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            />
          </div>
          <div className={`text-2xl sm:text-3xl font-black tracking-tight ${summary.dropCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            <AnimatedCounter value={summary.dropCount} decimals={0} />
          </div>
          <div className="mt-2 font-sans">
            <span className="inline-flex items-center text-[11px] font-medium text-slate-400">
              Sucursales con baja &ge; 0.15 pts
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics - Calificaciones por Canal y Ranking en Barras */}
      <ReviewsCharts items={filteredItems} />

      {/* Reviews Table */}
      <div className="rev-table-container glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80">
        <div className="px-4 py-3.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400/30" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white tracking-tight">
                Puntuaciones Relevadas
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/70 text-amber-300 font-mono-numbers text-xs font-bold">
                {filteredItems.length} registros
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">Canales monitoreados:</span>
            {REVIEW_CHANNELS.map((ch) => {
              const isCurrentFilter = selectedCanal === ch.id;
              const isAll = selectedCanal === 'ALL';
              return (
                <span
                  key={ch.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all duration-200 ${
                    isCurrentFilter
                      ? 'bg-slate-800 text-white border-slate-600 shadow-sm'
                      : isAll
                      ? 'bg-slate-900/80 text-slate-300 border-slate-800/80'
                      : 'bg-slate-950/40 text-slate-500 border-slate-800/40 opacity-40'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shadow-sm shrink-0"
                    style={{ backgroundColor: ch.color }}
                  />
                  {ch.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
              <tr>
                <th className="p-3.5">Canal</th>
                <th className="p-3.5">Sucursal</th>
                <th className="p-3.5">Supervisora</th>
                <th className="p-3.5 text-right">Puntuación</th>
                <th className="p-3.5 text-right">Mes Anterior</th>
                <th className="p-3.5 text-right">Variación</th>
                <th className="p-3.5 text-right">Reseñas Nuevas</th>
                <th className="p-3.5 text-center">Estado</th>
                {!isGuest && (
                  <th className="p-3.5 text-center w-12 text-slate-500">
                    <span className="sr-only">Acciones</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono-numbers">
              {filteredItems.map((item, idx) => {
                const supId = storeMap[item.tienda.toLowerCase()];
                const sup = supervisorMap[supId];
                const diff = item.prevScore ? item.score - item.prevScore : 0;
                const isDrop = diff < -0.15;
                const isGain = diff > 0.05;

                return (
                  <tr
                    key={`${item.tienda}-${item.canal}-${idx}`}
                    className="rev-row-anim hover:bg-slate-800/40 transition-colors duration-150 group/revrow"
                  >
                    <td className="p-3.5 font-sans">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs tracking-wide shadow-sm ${
                          item.canal === 'PEYA' || item.canal === 'PedidosYa'
                            ? 'bg-red-500 text-white font-bold border border-red-400/40 shadow-red-950/40'
                            : item.canal === 'Rappi'
                            ? 'bg-orange-500 text-white font-bold border border-orange-400/40 shadow-orange-950/40'
                            : item.canal === 'Mercado Delivery'
                            ? 'bg-amber-500 text-white font-bold border border-amber-400/50 shadow-amber-950/40'
                            : item.canal === 'TePido'
                            ? 'bg-purple-600 text-white font-bold border border-purple-400/40 shadow-purple-950/40'
                            : 'bg-sky-600 text-white font-bold border border-sky-400/40 shadow-sky-950/40'
                        }`}
                      >
                        {item.canal === 'PedidosYa' ? 'PEYA' : item.canal}
                      </span>
                    </td>
                    <td className="p-3.5 font-sans font-bold text-white text-sm">
                      {item.tienda}
                    </td>
                    <td className="p-3.5 font-sans">
                      {sup ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/70 text-slate-200 border border-slate-700/60 shadow-sm">
                          <span
                            className="w-2 h-2 rounded-full shadow-sm shrink-0"
                            style={{ backgroundColor: sup.color }}
                          />
                          {sup.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-black text-white text-sm">
                      <div className="inline-flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 drop-shadow-[0_1px_4px_rgba(245,158,11,0.4)]" />
                        <span>{item.score.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right text-slate-400 text-xs">
                      {item.prevScore ? item.prevScore.toFixed(1) : '-'}
                    </td>
                    <td className="p-3.5 text-right font-bold">
                      {item.prevScore ? (
                        <div
                          className={`inline-flex items-center gap-0.5 text-xs ${
                            diff < 0
                              ? 'text-rose-400'
                              : diff > 0
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {diff > 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : diff < 0 ? (
                            <ArrowDownRight className="w-3 h-3" />
                          ) : null}
                          <span>{diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-bold text-slate-200">
                      {item.count.toLocaleString('es-AR')}
                    </td>
                    <td className="p-3.5 text-center font-sans">
                      {isDrop ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-sm">
                          <AlertTriangle className="w-3 h-3" />
                          Alerta Caída
                        </span>
                      ) : isGain ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm">
                          <TrendingUp className="w-3 h-3" />
                          En alza
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60">
                          Estable
                        </span>
                      )}
                    </td>

                    {/* Delete item button */}
                    {!isGuest && (
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setReviewToDelete(item)}
                          className="opacity-0 group-hover/revrow:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-all duration-150 cursor-pointer"
                          title={`Borrar calificación de ${item.tienda} (${item.canal})`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Summary Footer */}
        <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span className="font-medium">
            Mostrando <strong className="text-white font-mono-numbers">{filteredItems.length}</strong> sucursales y canales
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300">En alza</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-slate-300">Estable</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-slate-300">Alerta Caída</span>
            </span>
          </div>
        </div>
      </div>

      {/* Modal Carga Mensual */}
      <ModalWrapper
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h3 className="font-extrabold text-base text-white">Carga Mensual de Puntuación</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400 -mt-1">
          Registra la puntuación y volumen de reseñas de la sucursal para el mes seleccionado.
        </p>

        <form onSubmit={handleSaveReview} className="space-y-3.5">
          {/* Fila 1 (2x2): Sucursal y Canal con CustomSelect estilizados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300">Sucursal:</label>
              <CustomSelect
                value={newForm.tienda}
                onChange={(val) => setNewForm({ ...newForm, tienda: val })}
                options={storeOptions}
                placeholder="Seleccionar sucursal..."
                wrapperClassName="w-full mt-1"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300">Canal:</label>
              <CustomSelect
                value={newForm.canal}
                onChange={(val) => setNewForm({ ...newForm, canal: val })}
                options={formCanalOptions}
                placeholder="Seleccionar canal..."
                wrapperClassName="w-full mt-1"
                className="w-full"
              />
            </div>
          </div>

          {/* Fila 2 (2x2): Puntuación Actual y Mes Anterior */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300">Puntuación Actual (1-5):</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={newForm.score}
                onChange={(e) => setNewForm({ ...newForm, score: e.target.value })}
                className="w-full mt-1 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono shadow-sm transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300">Mes Anterior:</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={newForm.prevScore}
                onChange={(e) => setNewForm({ ...newForm, prevScore: e.target.value })}
                className="w-full mt-1 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono shadow-sm transition-colors"
              />
            </div>
          </div>

          {/* Fila 3: Un solo campo - Nuevas Reseñas Recibidas */}
          <div>
            <label className="text-xs font-bold text-slate-300">Nuevas Reseñas Recibidas:</label>
            <input
              type="number"
              min="0"
              value={newForm.count}
              onChange={(e) => setNewForm({ ...newForm, count: e.target.value })}
              className="w-full mt-1 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono shadow-sm transition-colors"
              required
            />
          </div>

          {/* Botones de acción: Guardar Registro ANTES de Cancelar */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Guardar Registro
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </ModalWrapper>

      {/* Confirmation Modal: Delete Review Record */}
      <ModalWrapper
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Eliminar Registro de Reseña
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Confirmación de eliminación
              </p>
            </div>
          </div>

          {reviewToDelete && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <p>
                ¿Deseas eliminar la calificación de <strong className="text-white">{reviewToDelete.tienda}</strong> en el canal <strong className="text-amber-400">{reviewToDelete.canal}</strong> ({selectedMonth})?
              </p>
              <div className="text-[11px] text-slate-400 font-mono-numbers pt-1">
                Puntuación: {reviewToDelete.score.toFixed(1)} ★ | Reseñas: {reviewToDelete.count.toLocaleString('es-AR')}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setReviewToDelete(null)}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (reviewToDelete && reviewToDelete._originalIndex !== undefined) {
                  const updated = { ...reviewsData };
                  if (updated[selectedMonth]) {
                    const currentMonthList = [...updated[selectedMonth]];
                    currentMonthList.splice(reviewToDelete._originalIndex, 1);
                    updated[selectedMonth] = currentMonthList;
                    setReviewsData(updated);
                    localStorage.setItem('mg_kpi_reviews_v2', JSON.stringify(updated));
                  }
                  setReviewToDelete(null);
                }
              }}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all shadow-md shadow-rose-950/40 cursor-pointer"
            >
              Eliminar registro
            </button>
          </div>
        </div>
      </ModalWrapper>
    </div>
  );
}
