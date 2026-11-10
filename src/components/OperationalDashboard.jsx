import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ArrowUpDown, Download, Search, AlertTriangle, Trash2, CheckSquare, Square,
  ShoppingBag, XCircle, MessageSquareWarning, DollarSign, Clock, CheckCircle2,
  TrendingUp, TrendingDown, Layers, BarChart3, ArrowRight, GripVertical, ChevronRight, Upload
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { fmtInt, fmtCurrency, fmtPct, getMetricStatus, getInitials } from '../utils';
import { CHANNELS, CANAL_THEMES } from '../config';
import { AnimatedCounter } from './AnimatedCounter';
import { CustomSelect } from './CustomSelect';
import { ModalWrapper } from './ModalWrapper';
import { exportOperationalKPItoPDF, exportOperationalComparisonPDF } from '../utils/pdfExport';
import { OperationalCharts } from './OperationalCharts';
import { StoreComparisonPanel } from './StoreComparisonPanel';

export function OperationalDashboard({
  datasets = {},
  periodData,
  selectedPeriod,
  selectedPeriods = [],
  onPeriodsChange,
  onPeriodChange,
  onDeletePeriod,
  onDeletePeriods,
  onDeleteRecord,
  onDeleteRecords,
  availablePeriods = [],
  supervisors,
  stores,
  onReassignStore,
  thresholds,
  currentUser,
  onOpenImport
}) {
  const isGuest = currentUser?.role === 'guest';
  // Drag and Drop State for store reassignment across supervisors
  const [draggedStore, setDraggedStore] = useState(null);
  const [dragOverSupId, setDragOverSupId] = useState(null);
  // Normalize active periods array
  const activePeriods = useMemo(() => {
    if (Array.isArray(selectedPeriods) && selectedPeriods.length > 0) {
      return selectedPeriods;
    }
    return selectedPeriod ? [selectedPeriod] : [];
  }, [selectedPeriods, selectedPeriod]);

  const isMultiPeriod = activePeriods.length > 1;

  const [selectedCanal, setSelectedCanal] = useState('ALL');
  const [selectedSup, setSelectedSup] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('confirmadas');
  const [sortAsc, setSortAsc] = useState(false);
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'grouped' | 'comparison'
  const [filterOnlyCritical, setFilterOnlyCritical] = useState(false);

  // Multi-selection state
  const [selectedIndexes, setSelectedIndexes] = useState(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeletePeriodsModalOpen, setIsBulkDeletePeriodsModalOpen] = useState(false);

  // Auto-switch to comparison tab when multiple periods are picked, or return to table if single
  useEffect(() => {
    if (activePeriods.length > 1) {
      if (activeTab !== 'charts' && activeTab !== 'storeComparison') {
        setActiveTab('comparison');
      }
    } else if (activeTab === 'comparison') {
      setActiveTab('table');
    }
  }, [activePeriods.length]);

  // Clear selections when period or active filters change
  useEffect(() => {
    setSelectedIndexes(new Set());
  }, [activePeriods, selectedCanal, selectedSup, searchTerm, filterOnlyCritical]);

  // Deletion modals state
  const [periodToDelete, setPeriodToDelete] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const containerRef = useRef(null);

  // Initial entrance animation for filter bar and KPI cards (runs once on mount)
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.fromTo(
        '.op-filter-bar',
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.4 }
      ).fromTo(
        '.kpi-card',
        { opacity: 0, y: 12, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.035 },
        '-=0.2'
      );
    },
    { scope: containerRef, dependencies: [] }
  );

  // Smooth, subtle transition when switching between subtabs
  useGSAP(
    () => {
      if (!containerRef.current) return;
      const viewContent = containerRef.current.querySelector('.op-view-content');
      if (viewContent) {
        gsap.fromTo(
          viewContent,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', clearProps: 'transform' }
        );
      }
      if (activeTab === 'grouped') {
        const groupCards = containerRef.current.querySelectorAll('.sup-group-card');
        if (groupCards.length > 0) {
          gsap.fromTo(
            groupCards,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: 'power2.out', clearProps: 'transform' }
          );
        }
      }
    },
    { scope: containerRef, dependencies: [activeTab] }
  );

  // Subtle transition when filtering channels, supervisors, period or critical records
  useGSAP(
    () => {
      if (!containerRef.current) return;
      const viewContent = containerRef.current.querySelector('.op-view-content');
      if (viewContent) {
        gsap.fromTo(
          viewContent,
          { opacity: 0.45 },
          { opacity: 1, duration: 0.22, ease: 'power1.out' }
        );
      }
    },
    { scope: containerRef, dependencies: [selectedCanal, selectedSup, selectedPeriod, filterOnlyCritical] }
  );

  // Map stores to supervisor
  const storeMap = useMemo(() => {
    const map = {};
    stores.forEach((s) => {
      map[s.name.toLowerCase()] = s.sup;
    });
    return map;
  }, [stores]);

  const supervisorMap = useMemo(() => {
    const map = {};
    supervisors.forEach((sup) => {
      map[sup.id] = sup;
    });
    return map;
  }, [supervisors]);

  // Filter records
  const filteredRecords = useMemo(() => {
    if (!periodData || !periodData.records) return [];

    return periodData.records
      .map((rec, originalIndex) => ({ ...rec, _originalIndex: originalIndex }))
      .filter((rec) => {
        if (selectedCanal !== 'ALL') {
          const isMatch = rec.canal === selectedCanal ||
            ((selectedCanal === 'PEYA' || selectedCanal === 'PedidosYa') && (rec.canal === 'PEYA' || rec.canal === 'PedidosYa'));
          if (!isMatch) return false;
        }

        const supId = storeMap[rec.tienda.toLowerCase()];
        if (selectedSup !== 'ALL' && supId !== selectedSup) return false;

        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          if (!rec.tienda.toLowerCase().includes(q) && !rec.canal.toLowerCase().includes(q)) {
            return false;
          }
        }

        return true;
      });
  }, [periodData, selectedCanal, selectedSup, searchTerm, storeMap]);

  // Helper to determine if a record has any critical metric
  const isCriticalRecord = (r) => {
    return (
      getMetricStatus('cancelacionesPct', r.cancelacionesPct, thresholds) === 'danger' ||
      getMetricStatus('reclamosPct', r.reclamosPct, thresholds) === 'danger' ||
      getMetricStatus('demorasPct', r.demorasPct, thresholds) === 'danger' ||
      getMetricStatus('disponibilidad', r.disponibilidad, thresholds) === 'danger'
    );
  };

  // Sorted records (optionally filtered to only critical rows)
  const sortedRecords = useMemo(() => {
    const list = filterOnlyCritical
      ? filteredRecords.filter(isCriticalRecord)
      : filteredRecords;

    return [...list].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });
  }, [filteredRecords, filterOnlyCritical, sortField, sortAsc, thresholds]);

  // Multi-selection helpers
  const visibleOriginalIndexes = useMemo(() => {
    return sortedRecords
      .map(r => r._originalIndex)
      .filter(idx => idx !== undefined);
  }, [sortedRecords]);

  const isAllSelected = useMemo(() => {
    if (visibleOriginalIndexes.length === 0) return false;
    return visibleOriginalIndexes.every(idx => selectedIndexes.has(idx));
  }, [visibleOriginalIndexes, selectedIndexes]);

  const isSomeSelected = useMemo(() => {
    return selectedIndexes.size > 0 && !isAllSelected;
  }, [selectedIndexes, isAllSelected]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIndexes(new Set());
    } else {
      setSelectedIndexes(new Set(visibleOriginalIndexes));
    }
  };

  const handleToggleSelectOne = (originalIndex) => {
    setSelectedIndexes(prev => {
      const next = new Set(prev);
      if (next.has(originalIndex)) {
        next.delete(originalIndex);
      } else {
        next.add(originalIndex);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIndexes(new Set());
  };

  // Aggregate global KPIs for filtered selection
  const kpiSummary = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        totalOrders: 0,
        cancPct: 0,
        recPct: 0,
        recCosto: 0,
        demPct: 0,
        dispAvg: 0,
        criticCount: 0
      };
    }

    const totalOrders = filteredRecords.reduce((acc, r) => acc + (r.confirmadas || 0), 0);
    const totalCanc = filteredRecords.reduce((acc, r) => acc + (r.cancelaciones || 0), 0);
    const totalCancCosto = filteredRecords.reduce((acc, r) => acc + (r.cancelacionesCosto || 0), 0);
    const totalRec = filteredRecords.reduce((acc, r) => acc + (r.reclamos || 0), 0);
    const totalRecCosto = filteredRecords.reduce((acc, r) => acc + (r.reclamosCosto || 0), 0);
    const totalDem = filteredRecords.reduce((acc, r) => acc + (r.demoras || 0), 0);
    const avgDisp = filteredRecords.reduce((acc, r) => acc + (r.disponibilidad || 0), 0) / filteredRecords.length;

    // Estimated costs if not explicitly specified in excel
    // If complaints cost is known, we can also estimate average ticket per claim
    const avgTicketReclamo = totalRec > 0 ? (totalRecCosto / totalRec) : 0;
    // Effective cancellation cost: sum of cancelacionesCosto or fallback to estimated claim ticket
    const effectiveCancCosto = totalCancCosto > 0 ? totalCancCosto : (totalCanc * avgTicketReclamo);
    // Effective delays economic impact: if demoras have explicit cost or estimated based on claim ticket impact (e.g. 15% claim conversion or avgTicket)
    const effectiveDemCosto = totalDem * (avgTicketReclamo > 0 ? avgTicketReclamo : 0);

    let criticCount = 0;
    filteredRecords.forEach((r) => {
      if (
        getMetricStatus('cancelacionesPct', r.cancelacionesPct, thresholds) === 'danger' ||
        getMetricStatus('reclamosPct', r.reclamosPct, thresholds) === 'danger' ||
        getMetricStatus('demorasPct', r.demorasPct, thresholds) === 'danger' ||
        getMetricStatus('disponibilidad', r.disponibilidad, thresholds) === 'danger'
      ) {
        criticCount++;
      }
    });

    return {
      totalOrders,
      totalCanc,
      cancPct: totalOrders > 0 ? (totalCanc / totalOrders) * 100 : 0,
      cancCosto: effectiveCancCosto,
      totalRec,
      recPct: totalOrders > 0 ? (totalRec / totalOrders) * 100 : 0,
      recCosto: totalRecCosto,
      totalDem,
      demPct: totalOrders > 0 ? (totalDem / totalOrders) * 100 : 0,
      demCosto: effectiveDemCosto,
      dispAvg: avgDisp,
      criticCount
    };
  }, [filteredRecords, thresholds]);

  // Grouped by Supervisor
  const supervisorGroups = useMemo(() => {
    const groups = {};
    supervisors.forEach((sup) => {
      groups[sup.id] = {
        supervisor: sup,
        records: [],
        totalOrders: 0,
        totalCanc: 0,
        totalRec: 0,
        totalRecCosto: 0,
        totalDem: 0,
        disponibilidadAvg: 0
      };
    });

    groups['unassigned'] = {
      supervisor: { id: 'unassigned', name: 'Sin Asignar', color: '#64748b' },
      records: [],
      totalOrders: 0,
      totalCanc: 0,
      totalRec: 0,
      totalRecCosto: 0,
      totalDem: 0,
      disponibilidadAvg: 0
    };

    const targetRecords = filterOnlyCritical
      ? filteredRecords.filter(isCriticalRecord)
      : filteredRecords;

    targetRecords.forEach((r) => {
      const supId = storeMap[r.tienda.toLowerCase()] || 'unassigned';
      if (!groups[supId]) {
        groups[supId] = {
          supervisor: { id: supId, name: supId, color: '#64748b' },
          records: [],
          totalOrders: 0,
          totalCanc: 0,
          totalRec: 0,
          totalRecCosto: 0,
          totalDem: 0,
          disponibilidadAvg: 0
        };
      }
      groups[supId].records.push(r);
      groups[supId].totalOrders += r.confirmadas || 0;
      groups[supId].totalCanc += r.cancelaciones || 0;
      groups[supId].totalRec += r.reclamos || 0;
      groups[supId].totalRecCosto += r.reclamosCosto || 0;
      groups[supId].totalDem += r.demoras || 0;
    });

    return Object.values(groups)
      .filter((g) => g.records.length > 0)
      .map((g) => {
        const orders = g.totalOrders;
        const dispAvg = g.records.reduce((acc, r) => acc + (r.disponibilidad || 0), 0) / g.records.length;
        return {
          ...g,
          cancPct: orders > 0 ? (g.totalCanc / orders) * 100 : 0,
          recPct: orders > 0 ? (g.totalRec / orders) * 100 : 0,
          demPct: orders > 0 ? (g.totalDem / orders) * 100 : 0,
          disponibilidadAvg: dispAvg
        };
      })
      .sort((a, b) => b.totalOrders - a.totalOrders);
  }, [filteredRecords, filterOnlyCritical, supervisors, storeMap, thresholds]);

  // Helper to compute KPI summary for any arbitrary list of records
  const calculateKpiForRecords = (records) => {
    if (!records || records.length === 0) {
      return {
        totalOrders: 0,
        cancPct: 0,
        recPct: 0,
        recCosto: 0,
        demPct: 0,
        dispAvg: 0,
        criticCount: 0,
        storeCount: 0
      };
    }
    const totalOrders = records.reduce((acc, r) => acc + (r.confirmadas || 0), 0);
    const totalCanc = records.reduce((acc, r) => acc + (r.cancelaciones || 0), 0);
    const totalCancCosto = records.reduce((acc, r) => acc + (r.cancelacionesCosto || 0), 0);
    const totalRec = records.reduce((acc, r) => acc + (r.reclamos || 0), 0);
    const totalRecCosto = records.reduce((acc, r) => acc + (r.reclamosCosto || 0), 0);
    const totalDem = records.reduce((acc, r) => acc + (r.demoras || 0), 0);
    const avgDisp = records.reduce((acc, r) => acc + (r.disponibilidad || 0), 0) / records.length;

    const avgTicketReclamo = totalRec > 0 ? (totalRecCosto / totalRec) : 0;
    const effectiveCancCosto = totalCancCosto > 0 ? totalCancCosto : (totalCanc * avgTicketReclamo);
    const effectiveDemCosto = totalDem * (avgTicketReclamo > 0 ? avgTicketReclamo : 0);

    let criticCount = 0;
    records.forEach((r) => {
      if (
        getMetricStatus('cancelacionesPct', r.cancelacionesPct, thresholds) === 'danger' ||
        getMetricStatus('reclamosPct', r.reclamosPct, thresholds) === 'danger' ||
        getMetricStatus('demorasPct', r.demorasPct, thresholds) === 'danger' ||
        getMetricStatus('disponibilidad', r.disponibilidad, thresholds) === 'danger'
      ) {
        criticCount++;
      }
    });

    return {
      totalOrders,
      totalCanc,
      cancPct: totalOrders > 0 ? (totalCanc / totalOrders) * 100 : 0,
      cancCosto: effectiveCancCosto,
      totalRec,
      recPct: totalOrders > 0 ? (totalRec / totalOrders) * 100 : 0,
      recCosto: totalRecCosto,
      totalDem,
      demPct: totalOrders > 0 ? (totalDem / totalOrders) * 100 : 0,
      demCosto: effectiveDemCosto,
      dispAvg: avgDisp,
      criticCount,
      storeCount: records.length
    };
  };

  // Multi-period comparisons
  const comparisonSummaries = useMemo(() => {
    return activePeriods.map((periodName) => {
      const pData = datasets[periodName];
      const records = (pData?.records || []).filter((rec) => {
        if (selectedCanal !== 'ALL') {
          const isMatch = rec.canal === selectedCanal ||
            ((selectedCanal === 'PEYA' || selectedCanal === 'PedidosYa') && (rec.canal === 'PEYA' || rec.canal === 'PedidosYa'));
          if (!isMatch) return false;
        }

        const supId = storeMap[rec.tienda.toLowerCase()];
        if (selectedSup !== 'ALL' && supId !== selectedSup) return false;

        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          if (!rec.tienda.toLowerCase().includes(q) && !rec.canal.toLowerCase().includes(q)) {
            return false;
          }
        }

        return true;
      });

      const kpis = calculateKpiForRecords(records);
      return {
        period: periodName,
        ...kpis
      };
    });
  }, [activePeriods, datasets, selectedCanal, selectedSup, searchTerm, storeMap, thresholds]);

  // Store-level comparison across selected periods
  const storeComparisons = useMemo(() => {
    if (activePeriods.length === 0) return [];

    const map = new Map();

    activePeriods.forEach((periodName) => {
      const pData = datasets[periodName];
      const records = (pData?.records || []).filter((rec) => {
        if (selectedCanal !== 'ALL') {
          const isMatch = rec.canal === selectedCanal ||
            ((selectedCanal === 'PEYA' || selectedCanal === 'PedidosYa') && (rec.canal === 'PEYA' || rec.canal === 'PedidosYa'));
          if (!isMatch) return false;
        }

        const supId = storeMap[rec.tienda.toLowerCase()];
        if (selectedSup !== 'ALL' && supId !== selectedSup) return false;

        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          if (!rec.tienda.toLowerCase().includes(q) && !rec.canal.toLowerCase().includes(q)) {
            return false;
          }
        }

        return true;
      });

      records.forEach((r) => {
        const key = `${r.canal}__${r.tienda.toLowerCase()}`;
        if (!map.has(key)) {
          const supId = storeMap[r.tienda.toLowerCase()];
          const supName = supervisorMap[supId]?.name || 'Sin Asignar';
          map.set(key, {
            canal: r.canal,
            tienda: r.tienda,
            supName,
            periods: {}
          });
        }
        map.get(key).periods[periodName] = {
          orders: r.confirmadas || 0,
          cancPct: r.cancelacionesPct || 0,
          recPct: r.reclamosPct || 0,
          recCosto: r.reclamosCosto || 0,
          demPct: r.demorasPct || 0,
          dispAvg: r.disponibilidad || 0
        };
      });
    });

    return Array.from(map.values()).sort((a, b) => a.tienda.localeCompare(b.tienda));
  }, [activePeriods, datasets, selectedCanal, selectedSup, searchTerm, storeMap, supervisorMap]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      if (isMultiPeriod) {
        // Multi-period comparison executive PDF
        await exportOperationalComparisonPDF({
          periodSummaries: comparisonSummaries,
          storeComparisons,
          selectedPeriods: activePeriods,
          selectedCanal,
          selectedSup,
          supervisorMap,
          thresholds
        });
      } else {
        // Single period standard PDF
        if (sortedRecords.length === 0) {
          alert('No hay registros para exportar con los filtros seleccionados.');
          return;
        }
        await exportOperationalKPItoPDF({
          records: sortedRecords,
          period: activePeriods[0] || selectedPeriod,
          selectedCanal,
          selectedSup,
          supervisorMap,
          storeMap,
          kpiSummary,
          thresholds
        });
      }
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (availablePeriods.length === 0) {
    return (
      <div ref={containerRef} className="space-y-6 w-full">
        <div className="glass-panel rounded-3xl p-8 sm:p-14 text-center border border-slate-800 space-y-4 my-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <Upload className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            No hay períodos operativos cargados
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Se han eliminado todos los períodos del sistema. Podés importar una nueva planilla de Excel para comenzar a analizar los datos y métricas operativas.
          </p>
          {!isGuest && onOpenImport && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenImport}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Importar Archivo Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6 w-full">
      {/* Modern Filter Toolbar */}
      <div className="op-filter-bar relative z-30 glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Period Selector (Supports multi-selection for comparisons) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Período
              </span>
              <div className="flex items-center gap-1.5">
                <CustomSelect
                  multiple={true}
                  value={activePeriods}
                  onChange={(val) => {
                    const newArr = Array.isArray(val) ? val : (val ? [val] : []);
                    if (onPeriodsChange) {
                      onPeriodsChange(newArr);
                    } else if (onPeriodChange) {
                      onPeriodChange(newArr);
                    }
                  }}
                  options={availablePeriods.map((p) => ({ value: p, label: p }))}
                  placeholder="Seleccionar períodos..."
                  className="w-52 sm:w-64"
                />
                {!isGuest && availablePeriods.length > 0 && (
                  isMultiPeriod ? (
                    <button
                      type="button"
                      onClick={() => setIsBulkDeletePeriodsModalOpen(true)}
                      className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all duration-200 cursor-pointer shadow-sm group flex items-center gap-1.5"
                      title={`Borrar las ${activePeriods.length} fechas seleccionadas`}
                    >
                      <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform text-rose-400" />
                      <span className="text-[10px] font-bold text-rose-400 hidden sm:inline">({activePeriods.length})</span>
                    </button>
                  ) : onDeletePeriod ? (
                    <button
                      type="button"
                      onClick={() => setPeriodToDelete(activePeriods[0] || selectedPeriod)}
                      className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all duration-200 cursor-pointer shadow-sm group"
                      title={`Borrar período "${activePeriods[0] || selectedPeriod}"`}
                    >
                      <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                  ) : null
                )}
              </div>
            </div>

            {/* Canal Switcher - Modern Segmented Control */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Canal
              </span>
              <div className={`inline-flex rounded-xl bg-slate-950/80 p-1 border shadow-inner transition-colors duration-300 ${
                selectedCanal === 'PEYA' || selectedCanal === 'PedidosYa' ? 'border-red-500/40' :
                selectedCanal === 'Rappi' ? 'border-orange-500/40' :
                selectedCanal === 'Mercado Delivery' ? 'border-amber-400/40' :
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
                  Todos
                </button>
                {CHANNELS.map((ch) => {
                  const theme = CANAL_THEMES[ch.id] || CANAL_THEMES.ALL;
                  const isSelected = selectedCanal === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedCanal(ch.id)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 cursor-pointer ${
                        isSelected ? theme.active : theme.inactive
                      }`}
                    >
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Supervisora Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Supervisora
              </span>
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

          {/* Search & Export Actions */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar sucursal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/15 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-500 transition-all duration-200 w-48 sm:w-56 focus:outline-none shadow-inner"
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
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                isMultiPeriod
                  ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-600/20 border-amber-500/50 text-amber-200 hover:text-white hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/70 hover:border-slate-600 text-slate-200 hover:text-white'
              }`}
              title={isMultiPeriod ? "Exportar informe comparativo ejecutivo en PDF" : "Exportar reporte de grilla en formato PDF"}
            >
              {isExportingPDF ? (
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isExportingPDF ? 'Generando PDF...' : isMultiPeriod ? 'Exportar Comparativa PDF' : 'Exportar PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 font-mono-numbers">
        {/* Órdenes */}
        <div className="kpi-card glass-card rounded-2xl p-4 sm:p-4.5 hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default shadow-lg group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
            <span className="font-semibold text-slate-300">Órdenes Confirmadas</span>
            <ShoppingBag className="w-5 h-5 text-blue-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            <AnimatedCounter value={kpiSummary.totalOrders} decimals={0} />
          </div>
          <div className="mt-2 font-sans">
            <span className="inline-flex items-center text-[11px] font-medium text-slate-400">
              Total en selección
            </span>
          </div>
        </div>

        {/* Cancelaciones */}
        {(() => {
          const status = getMetricStatus('cancelacionesPct', kpiSummary.cancPct, thresholds);
          return (
            <div className="kpi-card glass-card rounded-2xl p-4 sm:p-4.5 hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default shadow-lg group">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
                <span className="font-semibold text-slate-300">% Cancelaciones</span>
                <XCircle className="w-5 h-5 text-amber-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight shrink-0">
                  <AnimatedCounter value={kpiSummary.cancPct} decimals={1} suffix="%" />
                </div>
                <div className="text-right">
                  <div className="text-sm sm:text-base font-black text-amber-300 font-mono-numbers leading-tight">
                    {fmtInt(kpiSummary.totalCanc || 0)} <span className="text-xs font-semibold text-slate-400">ped.</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-amber-400 font-mono-numbers mt-0.5">
                    {fmtCurrency(kpiSummary.cancCosto || 0)}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 font-sans">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    status === 'ok'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : status === 'warning'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'ok' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                  Meta: &le; {thresholds.cancelacionesPct?.ok || 0.5}%
                </span>
              </div>
            </div>
          );
        })()}

        {/* Reclamos */}
        {(() => {
          const status = getMetricStatus('reclamosPct', kpiSummary.recPct, thresholds);
          return (
            <div className="kpi-card glass-card rounded-2xl p-4 sm:p-4.5 hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default shadow-lg group">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
                <span className="font-semibold text-slate-300">% Reclamos</span>
                <MessageSquareWarning className="w-5 h-5 text-indigo-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight shrink-0">
                  <AnimatedCounter value={kpiSummary.recPct} decimals={1} suffix="%" />
                </div>
                <div className="text-right">
                  <div className="text-sm sm:text-base font-black text-indigo-300 font-mono-numbers leading-tight">
                    {fmtInt(kpiSummary.totalRec || 0)} <span className="text-xs font-semibold text-slate-400">recl.</span>
                  </div>
                </div>
              </div>
              <div className="mt-2.5 font-sans">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    status === 'ok'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : status === 'warning'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'ok' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                  Meta: &le; {thresholds.reclamosPct?.ok || 1.5}%
                </span>
              </div>
            </div>
          );
        })()}

        {/* Costo Reclamos */}
        <div className="kpi-card glass-card rounded-2xl p-4 sm:p-4.5 hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default shadow-lg group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
            <span className="font-semibold text-slate-300">Costo Reclamos</span>
            <DollarSign className="w-5 h-5 text-emerald-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
            <AnimatedCounter value={kpiSummary.recCosto} decimals={0} prefix="$ " />
          </div>
          <div className="mt-2 font-sans flex items-center justify-between text-xs">
            <span className="font-medium text-slate-400">Impacto económico</span>
          </div>
        </div>

        {/* Demoras */}
        {(() => {
          const status = getMetricStatus('demorasPct', kpiSummary.demPct, thresholds);
          return (
            <div className="kpi-card glass-card rounded-2xl p-4 sm:p-4.5 hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default shadow-lg group">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
                <span className="font-semibold text-slate-300">% Demoras</span>
                <Clock className="w-5 h-5 text-orange-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight shrink-0">
                  <AnimatedCounter value={kpiSummary.demPct} decimals={1} suffix="%" />
                </div>
                <div className="text-right">
                  <div className="text-sm sm:text-base font-black text-orange-300 font-mono-numbers leading-tight">
                    {fmtInt(kpiSummary.totalDem || 0)} <span className="text-xs font-semibold text-slate-400">dem.</span>
                  </div>
                </div>
              </div>
              <div className="mt-2.5 font-sans">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    status === 'ok'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : status === 'warning'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'ok' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                  Meta: &le; {thresholds.demorasPct?.ok || 5.0}%
                </span>
              </div>
            </div>
          );
        })()}

        {/* Disponibilidad */}
        {(() => {
          const status = getMetricStatus('disponibilidad', kpiSummary.dispAvg, thresholds);
          return (
            <div className="kpi-card glass-card rounded-2xl p-4 sm:p-4.5 hover:-translate-y-1 hover:border-slate-700 transition-all duration-200 cursor-default shadow-lg group">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-sans">
                <span className="font-semibold text-slate-300">Disponibilidad</span>
                <CheckCircle2 className="w-5 h-5 text-teal-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                <AnimatedCounter value={kpiSummary.dispAvg} decimals={1} suffix="%" />
              </div>
              <div className="mt-2 font-sans">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    status === 'ok'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : status === 'warning'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status === 'ok' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                  Meta: &ge; {thresholds.disponibilidad?.ok || 98.0}%
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Subtabs Switcher & Critical Alert Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="inline-flex rounded-xl bg-slate-900/80 p-1 border border-slate-800/80 shadow-inner">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'table'
                ? 'bg-slate-800 text-amber-300 border border-slate-700/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
            }`}
          >
            Detalle por Sucursal ({sortedRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('grouped')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'grouped'
                ? 'bg-slate-800 text-amber-300 border border-slate-700/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
            }`}
          >
            Consolidado por Supervisora ({supervisorGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'charts'
                ? 'bg-gradient-to-r from-rose-500/20 to-red-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-rose-400" />
            <span>Métricas PedidosYa</span>
          </button>
          <button
            onClick={() => setActiveTab('storeComparison')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'storeComparison'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-850/40'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Panel Comparativo de Sucursales</span>
          </button>
          {isMultiPeriod && (
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'comparison'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-slate-850/40'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Comparativa ({activePeriods.length} Períodos)</span>
            </button>
          )}
        </div>

        {kpiSummary.criticCount > 0 && (
          <button
            type="button"
            onClick={() => setFilterOnlyCritical((prev) => !prev)}
            className={`inline-flex items-center gap-2.5 text-xs px-3.5 py-1.5 rounded-full transition-all duration-300 cursor-pointer select-none border backdrop-blur-md ${
              filterOnlyCritical
                ? 'bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-red-950/90 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)] ring-2 ring-rose-500/30'
                : 'bg-gradient-to-r from-rose-950/60 via-slate-900/80 to-rose-950/40 text-rose-200 border-rose-500/35 hover:border-rose-400/60 hover:bg-rose-950/80 shadow-[0_0_15px_rgba(244,63,94,0.18)] hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]'
            }`}
            title={filterOnlyCritical ? "Click para ver todos los registros" : "Click para filtrar sólo registros críticos"}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 ring-2 ring-rose-400/30" />
            </span>

            <div className="w-5 h-5 rounded-md bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-3 h-3 stroke-[2.3]" />
            </div>

            <span className="px-1.5 py-0.5 rounded-md bg-rose-500/25 border border-rose-500/35 text-rose-100 font-mono-numbers font-bold text-[11px] leading-none shadow-inner">
              {kpiSummary.criticCount}
            </span>

            <span className="font-semibold tracking-tight text-slate-200">
              registros requieren atención o están críticos
            </span>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
              filterOnlyCritical
                ? 'bg-rose-500 text-white border-rose-300 flex items-center gap-1 shadow-sm'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/25 hover:bg-rose-500/25'
            }`}>
              {filterOnlyCritical ? (
                <>
                  <span>Filtrando</span>
                  <span className="text-xs leading-none font-bold">&times;</span>
                </>
              ) : (
                'Filtrar'
              )}
            </span>
          </button>
        )}
      </div>

      {/* View Content */}
      {activeTab === 'table' ? (
        <div className="space-y-3">
          {/* Multi-selection Action Bar */}
          {!isGuest && selectedIndexes.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 shadow-lg shadow-amber-950/20 backdrop-blur-md animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs font-mono-numbers border border-amber-500/30">
                  {selectedIndexes.size}
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {selectedIndexes.size === 1 ? 'registro seleccionado' : 'registros seleccionados'}
                </span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs text-slate-400 hover:text-slate-200 underline decoration-slate-600 underline-offset-2 transition-colors cursor-pointer ml-1"
                >
                  Deseleccionar
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-all cursor-pointer"
                >
                  {isAllSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all shadow-md shadow-rose-950/40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar seleccionados ({selectedIndexes.size})</span>
                </button>
              </div>
            </div>
          )}

          <div className="op-view-content glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
                  <tr>
                    {/* Checkbox Select All */}
                    {!isGuest && (
                      <th className="p-3.5 w-10 text-center">
                        <button
                          type="button"
                          onClick={handleToggleSelectAll}
                          className="inline-flex items-center justify-center text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                          title={isAllSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                        >
                          {isAllSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : isSomeSelected ? (
                            <div className="w-4 h-4 rounded border border-amber-400 bg-amber-400/20 flex items-center justify-center">
                              <span className="w-2 h-0.5 bg-amber-400 rounded-sm" />
                            </div>
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                          )}
                        </button>
                      </th>
                    )}
                    <th onClick={() => handleSort('canal')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors">
                      <div className="flex items-center gap-1.5">
                        Canal
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'canal' ? 'text-amber-400' : 'text-slate-600'}`} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('tienda')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors">
                      <div className="flex items-center gap-1.5">
                        Sucursal
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'tienda' ? 'text-amber-400' : 'text-slate-600'}`} />
                      </div>
                    </th>
                    <th className="p-3.5">Supervisora</th>
                    <th onClick={() => handleSort('confirmadas')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        Órdenes
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'confirmadas' ? 'text-amber-400' : 'text-slate-600'}`} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('cancelacionesPct')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        Canc. %
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'cancelacionesPct' ? 'text-amber-400' : 'text-slate-600'}`} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('reclamosPct')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        Recl. %
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'reclamosPct' ? 'text-amber-400' : 'text-slate-600'}`} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('reclamosCosto')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        Recl. $
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'reclamosCosto' ? 'text-amber-400' : 'text-slate-600'}`} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('demorasPct')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        Demoras %
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'demorasPct' ? 'text-amber-400' : 'text-slate-600'}`} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('disponibilidad')} className="p-3.5 cursor-pointer hover:text-amber-400 transition-colors text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        Disp. %
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'disponibilidad' ? 'text-amber-400' : 'text-slate-600'}`} />
                      </div>
                    </th>
                    {!isGuest && onDeleteRecord && (
                      <th className="p-3.5 text-center w-12 text-slate-500">
                        <span className="sr-only">Acciones</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono-numbers">
                {sortedRecords.map((r, idx) => {
                  const supId = storeMap[r.tienda.toLowerCase()];
                  const sup = supervisorMap[supId];
                  const cancStatus = getMetricStatus('cancelacionesPct', r.cancelacionesPct, thresholds);
                  const recStatus = getMetricStatus('reclamosPct', r.reclamosPct, thresholds);
                  const demStatus = getMetricStatus('demorasPct', r.demorasPct, thresholds);
                  const dispStatus = getMetricStatus('disponibilidad', r.disponibilidad, thresholds);

                  const isRowSelected = r._originalIndex !== undefined && selectedIndexes.has(r._originalIndex);

                  return (
                    <tr
                      key={`${r.canal}-${r.tienda}-${idx}`}
                      className={`table-row-anim transition-colors duration-150 group/row ${
                        isRowSelected 
                          ? 'bg-amber-500/10 hover:bg-amber-500/15' 
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                    {/* Row Checkbox */}
                    {!isGuest && (
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => r._originalIndex !== undefined && handleToggleSelectOne(r._originalIndex)}
                          className="inline-flex items-center justify-center text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                          title={isRowSelected ? 'Deseleccionar fila' : 'Seleccionar fila'}
                        >
                          {isRowSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 group-hover/row:text-slate-400" />
                          )}
                        </button>
                      </td>
                    )}

                      {/* Canal Badge - Solid Pastel Themed */}
                      <td className="p-3.5 font-sans">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs tracking-wide shadow-sm ${
                            r.canal === 'PEYA' || r.canal === 'PedidosYa'
                              ? 'bg-red-500 text-white font-bold border border-red-400/40 shadow-red-950/40'
                              : r.canal === 'Rappi'
                              ? 'bg-orange-500 text-white font-bold border border-orange-400/40 shadow-orange-950/40'
                              : 'bg-amber-500 text-white font-bold border border-amber-400/50 shadow-amber-950/40'
                          }`}
                        >
                          {r.canal === 'PedidosYa' ? 'PEYA' : r.canal}
                        </span>
                      </td>

                      {/* Sucursal Name */}
                      <td className="p-3.5 font-sans font-bold text-white text-sm">
                        {r.tienda}
                      </td>

                      {/* Supervisora Tag */}
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

                      {/* Órdenes */}
                      <td className="p-3.5 text-right font-black text-white text-sm">
                        {fmtInt(r.confirmadas)}
                      </td>

                      {/* Cancelaciones */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            cancStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : cancStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}
                        >
                          {fmtPct(r.cancelacionesPct)}
                        </span>
                      </td>

                      {/* Reclamos */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            recStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : recStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}
                        >
                          {fmtPct(r.reclamosPct)}
                        </span>
                      </td>

                      {/* Reclamos $ */}
                      <td className="p-3.5 text-right text-slate-200 font-semibold">
                        {fmtCurrency(r.reclamosCosto)}
                      </td>

                      {/* Demoras */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            demStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : demStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}
                        >
                          {fmtPct(r.demorasPct)}
                        </span>
                      </td>

                      {/* Disponibilidad */}
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            dispStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : dispStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}
                        >
                          {fmtPct(r.disponibilidad)}
                        </span>
                      </td>

                      {/* Row Delete Action */}
                      {!isGuest && onDeleteRecord && (
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setRecordToDelete(r)}
                            className="opacity-0 group-hover/row:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 transition-all duration-150 cursor-pointer"
                            title={`Borrar registro de ${r.tienda} (${r.canal})`}
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
              Mostrando <strong className="text-white font-mono-numbers">{sortedRecords.length}</strong> sucursales y canales
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-300">En Meta</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-300">Advertencia</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-slate-300">Crítico</span>
              </span>
            </div>
          </div>
        </div>
        </div>
      ) : activeTab === 'grouped' ? (
        /* Consolidated Grouped View by Supervisor with Drag & Drop Store Reassignment */
        <div className="op-view-content space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="p-1 rounded bg-amber-400/10 text-amber-400">
                <GripVertical className="w-4 h-4" />
              </span>
              <span>
                <strong className="text-white font-semibold">Organizador Dinámico:</strong> Arrastra y suelta cualquier sucursal desde una tarjeta hacia otra supervisora para reasignarla. Los cambios se guardan automáticamente.
              </span>
            </div>
            {draggedStore && (
              <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-full animate-pulse">
                Moviendo "{draggedStore.storeName}"... suéltala sobre otra supervisora
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {supervisorGroups.map((g) => {
              const isOver = dragOverSupId === g.supervisor.id;
              const isSource = draggedStore && draggedStore.fromSupId === g.supervisor.id;

              // Extract unique stores for this supervisor and aggregate their confirmed orders
              const uniqueStoresMap = {};
              g.records.forEach((r) => {
                const name = r.tienda;
                if (!uniqueStoresMap[name]) {
                  uniqueStoresMap[name] = { name, orders: 0, channels: 0 };
                }
                uniqueStoresMap[name].orders += r.confirmadas || 0;
                uniqueStoresMap[name].channels += 1;
              });
              const storeList = Object.values(uniqueStoresMap).sort((a, b) => b.orders - a.orders);

              return (
                <div
                  key={g.supervisor.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedStore && draggedStore.fromSupId !== g.supervisor.id) {
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverSupId !== g.supervisor.id) {
                        setDragOverSupId(g.supervisor.id);
                      }
                    }
                  }}
                  onDragLeave={(e) => {
                    // Only clear if leaving the card container itself
                    if (e.currentTarget.contains(e.relatedTarget)) return;
                    if (dragOverSupId === g.supervisor.id) {
                      setDragOverSupId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedStore && draggedStore.fromSupId !== g.supervisor.id) {
                      if (onReassignStore) {
                        onReassignStore(draggedStore.storeName, g.supervisor.id);
                      }
                    }
                    setDraggedStore(null);
                    setDragOverSupId(null);
                  }}
                  className={`sup-group-card glass-card rounded-2xl p-5 space-y-4 shadow-xl transition-all duration-200 relative ${
                    isOver
                      ? 'ring-2 ring-amber-400 border-amber-400/80 bg-amber-500/10 scale-[1.01]'
                      : isSource
                      ? 'border-slate-700/60 opacity-90'
                      : 'hover:-translate-y-1 hover:border-slate-700'
                  }`}
                >
                  {isOver && (
                    <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-[1px] rounded-2xl pointer-events-none flex items-center justify-center border-2 border-dashed border-amber-400 z-20">
                      <div className="bg-slate-900/95 text-amber-300 font-bold text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-amber-400/40 flex items-center gap-1.5 animate-bounce">
                        <ChevronRight className="w-3.5 h-3.5" />
                        Soltar aquí para asignar a {g.supervisor.name}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-md ring-1 ring-white/10"
                        style={{ backgroundColor: `${g.supervisor.color}25`, color: g.supervisor.color }}
                      >
                        {getInitials(g.supervisor.name)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-white">{g.supervisor.name}</h3>
                        <div className="text-xs text-slate-400">
                          {storeList.length} sucursales ({g.records.length} canales)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono-numbers">
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 font-sans text-[11px]">Total Órdenes</div>
                      <div className="text-base font-black text-white mt-0.5">
                        {fmtInt(g.totalOrders)}
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 font-sans text-[11px]">Costo Reclamos</div>
                      <div className="text-base font-black text-emerald-400 mt-0.5">
                        {fmtCurrency(g.totalRecCosto)}
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 font-sans text-[11px]">Cancelaciones</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">
                        {fmtPct(g.cancPct)}
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 font-sans text-[11px]">Reclamos</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">
                        {fmtPct(g.recPct)}
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 font-sans text-[11px]">Demoras</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">
                        {fmtPct(g.demPct)}
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 font-sans text-[11px]">Disponibilidad</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">
                        {fmtPct(g.disponibilidadAvg)}
                      </div>
                    </div>
                  </div>

                  {/* Sucursales Asignadas con Drag and Drop */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                      <span>Sucursales ({storeList.length})</span>
                      {!isGuest && <span className="text-[10px] lowercase text-slate-500 font-normal">arrastra para mover</span>}
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                      {storeList.map((item, i) => {
                        const isDraggingThis = draggedStore?.storeName === item.name;
                        return (
                          <div
                            key={item.name}
                            draggable={!isGuest}
                            onDragStart={(e) => {
                              if (isGuest) return;
                              e.dataTransfer.setData('text/plain', item.name);
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggedStore({
                                storeName: item.name,
                                fromSupId: g.supervisor.id,
                                fromSupName: g.supervisor.name
                              });
                            }}
                            onDragEnd={() => {
                              setDraggedStore(null);
                              setDragOverSupId(null);
                            }}
                            className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border transition-all select-none ${
                              isGuest
                                ? 'bg-slate-950/80 border-slate-800/70 cursor-default'
                                : isDraggingThis
                                ? 'opacity-40 border-dashed border-amber-400 bg-amber-500/10 cursor-grab active:cursor-grabbing'
                                : 'bg-slate-950/80 border-slate-800/70 hover:border-amber-400/50 hover:bg-slate-900/90 cursor-grab active:cursor-grabbing'
                            }`}
                            title={isGuest ? undefined : "Arrastra para mover a otra supervisora"}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {!isGuest && <GripVertical className="w-3.5 h-3.5 text-slate-500 shrink-0 hover:text-amber-400" />}
                              <span className="text-[10px] text-slate-500 font-mono">#{i + 1}</span>
                              <span className="text-white font-medium truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-slate-500">
                                {item.channels} {item.channels === 1 ? 'canal' : 'canales'}
                              </span>
                              <span className="font-bold font-mono-numbers text-slate-300">
                                {fmtInt(item.orders)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {storeList.length === 0 && (
                        <div className="text-center py-4 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                          Sin sucursales asignadas
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'charts' ? (
        <div className="op-view-content">
          <OperationalCharts
            records={filteredRecords}
            supervisors={supervisors}
            storeMap={storeMap}
            supervisorMap={supervisorMap}
            thresholds={thresholds}
            selectedPeriod={activePeriods[0] || selectedPeriod}
            previousPeriodName={activePeriods.length > 1 ? activePeriods[1] : availablePeriods[availablePeriods.indexOf(activePeriods[0] || selectedPeriod) - 1] || ''}
            previousRecords={
              (activePeriods.length > 1
                ? datasets[activePeriods[1]]?.records
                : datasets[availablePeriods[availablePeriods.indexOf(activePeriods[0] || selectedPeriod) - 1]]?.records) || []
            }
          />
        </div>
      ) : activeTab === 'storeComparison' ? (
        <div className="op-view-content">
          <StoreComparisonPanel
            datasets={datasets}
            availablePeriods={availablePeriods}
            stores={stores}
            supervisors={supervisors}
            storeMap={storeMap}
            supervisorMap={supervisorMap}
            thresholds={thresholds}
          />
        </div>
      ) : (
        /* Multi-Period Comparative View */
        <div className="op-view-content space-y-6">
          {/* Executive Presentation Header Banner */}
          <div className="glass-panel rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-r from-slate-900/95 via-amber-950/20 to-slate-900/95 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
            <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                  <BarChart3 className="w-3 h-3" />
                  Módulo de Comparación Ejecutiva
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Comparativa de Rendimiento entre Períodos
                </h3>
                <p className="text-xs text-slate-400">
                  Analizando el comportamiento operativo de <strong className="text-amber-400">{activePeriods.length} períodos seleccionados</strong>: {activePeriods.join(' • ')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExportingPDF ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Exportar Comparativa para Presentar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Macro KPI Evolution Table (Side-by-Side Summary) */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Resumen Macro por Período
              </h4>
              <span className="text-xs text-slate-400">
                Comparativa directa de indicadores clave
              </span>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/90 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="p-4 text-slate-300">Período</th>
                    <th className="p-4 text-center">Sucursales</th>
                    <th className="p-4 text-right">Órdenes</th>
                    <th className="p-4 text-right">Canc. %</th>
                    <th className="p-4 text-right">Reclamos %</th>
                    <th className="p-4 text-right">Costo Reclamos</th>
                    <th className="p-4 text-right">Demoras %</th>
                    <th className="p-4 text-right">Disponibilidad</th>
                    <th className="p-4 text-center">Críticos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono-numbers">
                  {comparisonSummaries.map((summary, idx) => {
                    const prev = idx > 0 ? comparisonSummaries[idx - 1] : null;
                    const ordersDiff = prev ? summary.totalOrders - prev.totalOrders : 0;

                    const cancStatus = getMetricStatus('cancelacionesPct', summary.cancPct, thresholds);
                    const recStatus = getMetricStatus('reclamosPct', summary.recPct, thresholds);
                    const demStatus = getMetricStatus('demorasPct', summary.demPct, thresholds);
                    const dispStatus = getMetricStatus('disponibilidad', summary.dispAvg, thresholds);

                    return (
                      <tr key={summary.period} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-sans font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                          <span>{summary.period}</span>
                        </td>
                        <td className="p-4 text-center text-slate-300">
                          {summary.storeCount}
                        </td>
                        <td className="p-4 text-right font-black text-amber-300 text-sm">
                          <div className="flex items-center justify-end gap-1.5">
                            <span>{fmtInt(summary.totalOrders)}</span>
                            {prev && ordersDiff !== 0 && (
                              <span className={`text-[10px] font-bold inline-flex items-center ${
                                ordersDiff > 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {ordersDiff > 0 ? '+' : ''}{fmtInt(ordersDiff)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            cancStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : cancStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}>
                            {fmtPct(summary.cancPct)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            recStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : recStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}>
                            {fmtPct(summary.recPct)}
                          </span>
                        </td>
                        <td className="p-4 text-right font-semibold text-emerald-400">
                          {fmtCurrency(summary.recCosto)}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            demStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : demStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}>
                            {fmtPct(summary.demPct)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            dispStatus === 'ok'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : dispStatus === 'warning'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          }`}>
                            {fmtPct(summary.dispAvg)}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {summary.criticCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              {summary.criticCount}
                            </span>
                          ) : (
                            <span className="text-emerald-400 text-xs font-bold">0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Store-by-Store Progression Table */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Evolución Detallada por Sucursal y Canal ({storeComparisons.length})
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualización lado a lado de Órdenes, Reclamos y Disponibilidad para cada período
                </p>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/90 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="p-3.5">Canal</th>
                    <th className="p-3.5">Sucursal</th>
                    <th className="p-3.5">Supervisora</th>
                    {activePeriods.map((p) => (
                      <th key={p} colSpan={3} className="p-3.5 text-center border-l border-slate-800 text-amber-300">
                        {p}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-800/80 bg-slate-950/70 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    <th colSpan={3}></th>
                    {activePeriods.map((p) => (
                      <React.Fragment key={`${p}-sub`}>
                        <th className="p-2 text-right border-l border-slate-800">Órdenes</th>
                        <th className="p-2 text-right">Recl. %</th>
                        <th className="p-2 text-right">Disp. %</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono-numbers">
                  {storeComparisons.map((sc, i) => {
                    return (
                      <tr key={i} className="hover:bg-slate-800/30 transition-colors">
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
                        <td className="p-3.5 font-sans font-bold text-white">
                          {sc.tienda}
                        </td>
                        <td className="p-3.5 font-sans text-slate-300">
                          {sc.supName}
                        </td>
                        {activePeriods.map((p) => {
                          const pData = sc.periods[p];
                          if (!pData) {
                            return (
                              <React.Fragment key={`${p}-${i}`}>
                                <td className="p-3.5 text-right border-l border-slate-800 text-slate-600">-</td>
                                <td className="p-3.5 text-right text-slate-600">-</td>
                                <td className="p-3.5 text-right text-slate-600">-</td>
                              </React.Fragment>
                            );
                          }
                          const recStatus = getMetricStatus('reclamosPct', pData.recPct, thresholds);
                          const dispStatus = getMetricStatus('disponibilidad', pData.dispAvg, thresholds);

                          return (
                            <React.Fragment key={`${p}-${i}`}>
                              <td className="p-3.5 text-right border-l border-slate-800 font-bold text-slate-200">
                                {fmtInt(pData.orders)}
                              </td>
                              <td className="p-3.5 text-right">
                                <span className={
                                  recStatus === 'danger'
                                    ? 'text-rose-400 font-bold'
                                    : recStatus === 'warning'
                                    ? 'text-amber-300'
                                    : 'text-emerald-400'
                                }>
                                  {fmtPct(pData.recPct)}
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <span className={
                                  dispStatus === 'danger'
                                    ? 'text-rose-400 font-bold'
                                    : dispStatus === 'warning'
                                    ? 'text-amber-300'
                                    : 'text-teal-400'
                                }>
                                  {fmtPct(pData.dispAvg)}
                                </span>
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Period */}
      <ModalWrapper
        isOpen={Boolean(periodToDelete)}
        onClose={() => setPeriodToDelete(null)}
        className="max-w-md w-full p-6 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-white/10"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Eliminar Período Completo
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            ¿Estás seguro de que deseas eliminar la semana <strong className="text-amber-400">"{periodToDelete}"</strong> y todos sus registros asociados?
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                if (periodToDelete) {
                  onDeletePeriod?.(periodToDelete);
                  setPeriodToDelete(null);
                }
              }}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all shadow-md shadow-rose-950/40 cursor-pointer"
            >
              Sí, eliminar período
            </button>
            <button
              type="button"
              onClick={() => setPeriodToDelete(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* Confirmation Modal: Bulk Delete Multiple Periods */}
      <ModalWrapper
        isOpen={isBulkDeletePeriodsModalOpen}
        onClose={() => setIsBulkDeletePeriodsModalOpen(false)}
        className="max-w-md w-full p-6 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-white/10"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Eliminar Múltiples Períodos ({activePeriods.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
            <p>
              ¿Estás seguro de que deseas eliminar los <strong className="text-rose-400 font-bold">{activePeriods.length} períodos seleccionados</strong> y todos sus registros asociados?
            </p>
            <div className="max-h-32 overflow-y-auto no-scrollbar space-y-1 p-2 bg-slate-900 rounded-lg border border-slate-800">
              {activePeriods.map((p) => (
                <div key={p} className="text-[11px] text-amber-300 font-mono-numbers">
                  • {p}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                if (onDeletePeriods) {
                  onDeletePeriods(activePeriods);
                } else if (onDeletePeriod) {
                  activePeriods.forEach((p) => onDeletePeriod(p));
                }
                setIsBulkDeletePeriodsModalOpen(false);
              }}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all shadow-md shadow-rose-950/40 cursor-pointer"
            >
              Sí, eliminar {activePeriods.length} períodos
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeletePeriodsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* Confirmation Modal: Delete Single Record */}
      <ModalWrapper
        isOpen={Boolean(recordToDelete)}
        onClose={() => setRecordToDelete(null)}
        className="max-w-md w-full p-6 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-white/10"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Eliminar Registro
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Confirmación de eliminación
              </p>
            </div>
          </div>

          {recordToDelete && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <p>
                ¿Deseas eliminar el registro de <strong className="text-white">{recordToDelete.tienda}</strong> en el canal <strong className="text-amber-400">{recordToDelete.canal}</strong> del período <strong className="text-slate-200">"{selectedPeriod}"</strong>?
              </p>
              <div className="text-[11px] text-slate-400 font-mono-numbers pt-1">
                Órdenes: {fmtInt(recordToDelete.confirmadas)} | Reclamos: {recordToDelete.reclamosPct}%
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                if (recordToDelete && recordToDelete._originalIndex !== undefined) {
                  onDeleteRecord?.(selectedPeriod, recordToDelete._originalIndex);
                  setRecordToDelete(null);
                }
              }}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all shadow-md shadow-rose-950/40 cursor-pointer"
            >
              Eliminar registro
            </button>
            <button
              type="button"
              onClick={() => setRecordToDelete(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* Confirmation Modal: Bulk Delete Records */}
      <ModalWrapper
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        className="max-w-md w-full p-6 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-white/10"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Eliminar Registros Seleccionados
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Confirmación de eliminación masiva
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
            <p>
              ¿Estás seguro de que deseas eliminar <strong className="text-rose-400 font-bold">{selectedIndexes.size}</strong> {selectedIndexes.size === 1 ? 'registro seleccionado' : 'registros seleccionados'} del período <strong className="text-slate-200">"{selectedPeriod}"</strong>?
            </p>
            <p className="text-[11px] text-slate-400">
              Esta acción no se puede deshacer. Se actualizarán automáticamente los cálculos y consolidaciones.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                const indexes = Array.from(selectedIndexes);
                if (onDeleteRecords) {
                  onDeleteRecords(selectedPeriod, indexes);
                } else if (onDeleteRecord) {
                  // Fallback: delete highest index first to avoid index shifting
                  indexes.sort((a, b) => b - a).forEach(idx => onDeleteRecord(selectedPeriod, idx));
                }
                setSelectedIndexes(new Set());
                setIsBulkDeleteModalOpen(false);
              }}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all shadow-md shadow-rose-950/40 cursor-pointer"
            >
              Sí, eliminar {selectedIndexes.size} {selectedIndexes.size === 1 ? 'registro' : 'registros'}
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </ModalWrapper>
    </div>
  );
}
