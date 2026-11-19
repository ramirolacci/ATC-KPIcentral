import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Download, Plus, Settings2, Edit3, CheckCircle2, AlertTriangle, 
  ChevronDown, ChevronLeft, ChevronRight, Calendar, Search, ArrowUpRight, ArrowDownRight,
  FileSpreadsheet, Filter, RefreshCw, Store, Check, AlertCircle,
  HelpCircle, Eye, EyeOff, Copy, CheckCheck, Clock, MessageSquareWarning,
  Flame, CheckSquare, ListTodo, CalendarDays, Trash2, Smartphone, Sparkles
} from 'lucide-react';
import { fmtInt, fmtCurrency } from '../utils';
import { StoreComparisonPanel } from './StoreComparisonPanel';
import { RegisterIncidentModal } from './RegisterIncidentModal';
import { ScheduleActivityModal } from './ScheduleActivityModal';
import { fetchSettingFromCloud, saveSettingToCloud } from '../supabaseClient';

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

/**
 * Custom Month Picker Popover (Matches screenshots with Year navigation & 12-month grid)
 */
function MonthPickerPopover({ selectedYear, selectedMonth, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedYear);
  const containerRef = useRef(null);

  useEffect(() => {
    setViewYear(selectedYear);
  }, [selectedYear]);

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

  const monthNamesLong = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const monthShorts = [
    'ene', 'feb', 'mar', 'abr',
    'may', 'jun', 'jul', 'ago',
    'sept', 'oct', 'nov', 'dic'
  ];

  const handleSelectMonth = (mIndex) => {
    onChange(viewYear, mIndex);
    setIsOpen(false);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    onChange(now.getFullYear(), now.getMonth());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(2026, 10); // Default Noviembre 2026
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border border-slate-700/80 bg-slate-950/90 hover:bg-slate-900 text-slate-100 hover:text-white text-xs font-semibold shadow-xs transition-all cursor-pointer min-w-[190px]"
      >
        <span className="capitalize">{monthNamesLong[selectedMonth]} de {selectedYear}</span>
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 w-64 p-3.5 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Year selector */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-white font-mono">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 12 months grid */}
          <div className="grid grid-cols-4 gap-1.5 py-1">
            {monthShorts.map((short, idx) => {
              const isSelected = viewYear === selectedYear && idx === selectedMonth;
              return (
                <button
                  key={short}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`py-2 px-1 text-xs rounded-xl font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-700 text-white font-bold shadow-md shadow-rose-950/50'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {short}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800 text-[11px] font-semibold">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              Este mes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Custom Styled Filter Dropdown for "Tipo de actividad" with badges & colors
 */
function CustomTipoFilterDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
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

  const options = [
    { value: 'ALL', label: 'Todos los tipos', dotColor: 'bg-slate-400' },
    { value: 'Promoción', label: 'Promoción', dotColor: 'bg-purple-400' },
    { value: 'Cierre', label: 'Cierre', dotColor: 'bg-amber-400' },
    { value: 'Capacitación', label: 'Capacitación', dotColor: 'bg-sky-400' },
    { value: 'Evento', label: 'Evento', dotColor: 'bg-emerald-400' },
    { value: 'Reunión', label: 'Reunión', dotColor: 'bg-rose-400' },
    { value: 'Otro', label: 'Otro', dotColor: 'bg-slate-400' }
  ];

  const selectedOpt = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer h-[38px] min-w-[155px] transition-all"
      >
        <div className="flex items-center gap-2 truncate">
          <span className={`w-2 h-2 rounded-full shrink-0 ${selectedOpt.dotColor}`} />
          <span className="truncate">{selectedOpt.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-52 p-1.5 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-rose-950/70 text-rose-200 border border-rose-500/40 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColor}`} />
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Generic Custom Styled Select Dropdown (Dark glassmorphic)
 */
function CustomStyledSelect({
  label,
  value,
  onChange,
  options = [],
  icon: Icon,
  rightIcon: RightIcon,
  placeholder = 'Seleccionar...',
  searchable = false,
  minWidth = 'min-w-[130px]'
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
        String(opt.value).toLowerCase().includes(search.toLowerCase())
      )
    : normalizedOptions;

  const selectedOpt = normalizedOptions.find((o) => o.value === value) || { value, label: value || placeholder };

  return (
    <div className={`relative flex flex-col gap-1.5 ${isOpen ? 'z-50' : 'z-10'}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className={`flex items-center justify-between gap-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer h-[38px] ${minWidth} transition-all`}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          {selectedOpt.dotColor && (
            <span className={`w-2 h-2 rounded-full shrink-0 ${selectedOpt.dotColor}`} />
          )}
          <span className="truncate">{selectedOpt.label}</span>
        </div>
        {RightIcon ? (
          <RightIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 min-w-full max-h-64 overflow-hidden rounded-xl bg-slate-900 border border-slate-700/90 shadow-2xl z-50 backdrop-blur-xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {searchable && (
            <div className="p-2 border-b border-slate-800 bg-slate-950/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left whitespace-nowrap ${
                      isSelected
                        ? 'bg-rose-950/70 text-rose-200 border border-rose-500/40 font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.dotColor && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dotColor}`} />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
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

const INITIAL_CALENDAR_ACTIVITIES = [
  {
    id: 'act_seed_1',
    actividad: 'Cierre Semanal de Métricas',
    tipo: 'Cierre',
    fecha: '2026-11-02',
    hora: '11:00',
    sucursal: 'Todas las sucursales',
    app: 'Todas las apps',
    observaciones: 'Consolidación de datos semanales de PEYA, Rappi y Mercado Delivery.',
    createdAt: '2026-11-01T10:00:00Z'
  },
  {
    id: 'act_seed_2',
    actividad: 'Reunión de Supervisión',
    tipo: 'Reunión',
    fecha: '2026-11-03',
    hora: '15:00',
    sucursal: 'Todas las sucursales',
    app: 'Todas las apps',
    observaciones: 'Revisión de tiendas críticas con Damaris Burgos, Evelyn Cedrón y Tiendas Propias.',
    createdAt: '2026-11-01T10:00:00Z'
  },
  {
    id: 'act_seed_3',
    actividad: 'Capacitación Operativa',
    tipo: 'Capacitación',
    fecha: '2026-11-13',
    hora: '10:30',
    sucursal: 'Ballester',
    app: 'PedidosYa',
    observaciones: 'Auditoría presencial y protocolo de reducción de demoras.',
    createdAt: '2026-11-01T10:00:00Z'
  },
  {
    id: 'act_seed_4',
    actividad: 'Promo Black Friday 2x1',
    tipo: 'Promoción',
    fecha: '2026-11-20',
    hora: '19:00',
    sucursal: 'Todas las sucursales',
    app: 'PedidosYa',
    observaciones: 'Campaña especial 2x1 en empanadas seleccionadas durante el fin de semana.',
    createdAt: '2026-11-01T10:00:00Z'
  },
  {
    id: 'act_seed_5',
    actividad: 'Cierre de Mes y Balance General',
    tipo: 'Cierre',
    fecha: '2026-11-30',
    hora: '18:00',
    sucursal: 'Todas las sucursales',
    app: 'Todas las apps',
    observaciones: 'Descarga de informe acumulado para gerencia y liquidación de costos.',
    createdAt: '2026-11-01T10:00:00Z'
  }
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
  onExportPDF,
  onNavigateTab,
  stores = [],
  supervisors = [],
  storeMap = {},
  supervisorMap = {}
}) {
  const isGuest = currentUser?.role === 'guest';

  // Subtabs within Central Operativa
  const [activeTab, setActiveTab] = useState('indicadores'); // 'indicadores' | 'prioridades' | 'incidencias' | 'calendario' | 'textos'
  const [vistaType, setVistaType] = useState('semanal');
  const [filterZona, setFilterZona] = useState('ALL');
  const [filterSucursal, setFilterSucursal] = useState('ALL');
  const [filterApp, setFilterApp] = useState('ALL');
  const [searchStore, setSearchStore] = useState('');
  const [onlyDesvios, setOnlyDesvios] = useState(false);

  // Copy text toast notification
  const [copiedId, setCopiedId] = useState(null);

  // Modal for editing record
  const [editingItem, setEditingItem] = useState(null);

  // Modal for registering manual incident
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  // Manual registered incidents state with LocalStorage and cloud sync
  const LS_INCIDENTS_KEY = 'mg_kpi_registered_incidents_v1';
  const [manualIncidents, setManualIncidents] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_INCIDENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Pull incidents from cloud on mount
  useEffect(() => {
    let mounted = true;
    fetchSettingFromCloud('incidents').then((cloudIncidents) => {
      if (mounted && Array.isArray(cloudIncidents) && cloudIncidents.length > 0) {
        setManualIncidents(cloudIncidents);
        try {
          localStorage.setItem(LS_INCIDENTS_KEY, JSON.stringify(cloudIncidents));
        } catch (e) {}
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleSaveIncident = (newInc) => {
    if (isGuest) return;
    setManualIncidents((prev) => {
      const updated = [newInc, ...prev];
      try {
        localStorage.setItem(LS_INCIDENTS_KEY, JSON.stringify(updated));
      } catch (e) {}
      saveSettingToCloud('incidents', updated);
      return updated;
    });
  };

  const handleDeleteIncident = (id) => {
    if (isGuest) return;
    setManualIncidents((prev) => {
      const updated = prev.filter((inc) => inc.id !== id);
      try {
        localStorage.setItem(LS_INCIDENTS_KEY, JSON.stringify(updated));
      } catch (e) {}
      saveSettingToCloud('incidents', updated);
      return updated;
    });
  };

  const handleUpdateIncidentStatus = (id, newStatus) => {
    if (isGuest) return;
    setManualIncidents((prev) => {
      const updated = prev.map((inc) => inc.id === id ? { ...inc, estado: newStatus } : inc);
      try {
        localStorage.setItem(LS_INCIDENTS_KEY, JSON.stringify(updated));
      } catch (e) {}
      saveSettingToCloud('incidents', updated);
      return updated;
    });
  };

  const [incidentFilterStatus, setIncidentFilterStatus] = useState('ALL');

  const filteredManualIncidents = useMemo(() => {
    if (incidentFilterStatus === 'ALL') return manualIncidents;
    return manualIncidents.filter((inc) => inc.estado === incidentFilterStatus);
  }, [manualIncidents, incidentFilterStatus]);

  const abiertasCount = useMemo(() => manualIncidents.filter((i) => i.estado === 'Abierta').length, [manualIncidents]);
  const enProcesoCount = useMemo(() => manualIncidents.filter((i) => i.estado === 'En proceso').length, [manualIncidents]);
  const resueltasCount = useMemo(() => manualIncidents.filter((i) => i.estado === 'Resuelta').length, [manualIncidents]);

  // Calendar State & Cloud Sync
  const LS_CALENDAR_KEY = 'mg_kpi_calendar_activities_v1';
  const [selectedCalendarYear, setSelectedCalendarYear] = useState(2026);
  const [selectedCalendarMonth, setSelectedCalendarMonth] = useState(10); // 0-indexed, 10 = noviembre
  const [calendarSearch, setCalendarSearch] = useState('');
  const [calendarFilterTipo, setCalendarFilterTipo] = useState('ALL');
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarModalInitialDate, setCalendarModalInitialDate] = useState('');
  const [calendarModalInitialData, setCalendarModalInitialData] = useState(null);

  const [calendarActivities, setCalendarActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_CALENDAR_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CALENDAR_ACTIVITIES;
  });

  // Pull calendar activities from Supabase cloud setting on mount
  useEffect(() => {
    let mounted = true;
    fetchSettingFromCloud('calendar_activities').then((cloudActivities) => {
      if (mounted && Array.isArray(cloudActivities) && cloudActivities.length > 0) {
        setCalendarActivities(cloudActivities);
        try {
          localStorage.setItem(LS_CALENDAR_KEY, JSON.stringify(cloudActivities));
        } catch (e) {}
      }
    });
    return () => { mounted = false; };
  }, []);

  const handleSaveCalendarActivity = (newAct) => {
    if (isGuest) return;
    setCalendarActivities((prev) => {
      const existingIdx = prev.findIndex((a) => a.id === newAct.id);
      let updated;
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = newAct;
      } else {
        updated = [newAct, ...prev];
      }
      try {
        localStorage.setItem(LS_CALENDAR_KEY, JSON.stringify(updated));
      } catch (e) {}
      saveSettingToCloud('calendar_activities', updated);
      return updated;
    });
  };

  const handleDeleteCalendarActivity = (id) => {
    if (isGuest) return;
    setCalendarActivities((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem(LS_CALENDAR_KEY, JSON.stringify(updated));
      } catch (e) {}
      saveSettingToCloud('calendar_activities', updated);
      return updated;
    });
  };

  const handleDuplicateCalendarActivity = (act) => {
    setCalendarModalInitialDate(act.fecha || '');
    setCalendarModalInitialData({
      ...act,
      id: undefined,
      actividad: `${act.actividad} (Copia)`
    });
    setIsCalendarModalOpen(true);
  };

  // Calculate calendar days & filtered activities for the active calendar view
  const { calendarCells, currentMonthActivities } = useMemo(() => {
    const daysInMonth = new Date(selectedCalendarYear, selectedCalendarMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(selectedCalendarYear, selectedCalendarMonth, 1).getDay(); // 0 is Sun
    const startOffset = (firstDayOfWeek + 6) % 7; // Mon=0, Sun=6
    const daysInPrevMonth = new Date(selectedCalendarYear, selectedCalendarMonth, 0).getDate();

    const cells = [];

    // Leading days from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({
        dayNum: daysInPrevMonth - i,
        isCurrentMonth: false,
        dateStr: null
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const padM = String(selectedCalendarMonth + 1).padStart(2, '0');
      const padD = String(d).padStart(2, '0');
      cells.push({
        dayNum: d,
        isCurrentMonth: true,
        dateStr: `${selectedCalendarYear}-${padM}-${padD}`
      });
    }

    // Trailing days to round to complete weeks
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      cells.push({
        dayNum: n,
        isCurrentMonth: false,
        dateStr: null
      });
    }

    // Filter activities for this month & search/tipo filters
    const monthActs = calendarActivities.filter((act) => {
      if (act.fecha) {
        const [y, m] = act.fecha.split('-').map(Number);
        if (y !== selectedCalendarYear || (m - 1) !== selectedCalendarMonth) {
          return false;
        }
      }
      if (calendarFilterTipo !== 'ALL' && act.tipo !== calendarFilterTipo) {
        return false;
      }
      if (calendarSearch.trim()) {
        const q = calendarSearch.toLowerCase();
        const matchAct = act.actividad?.toLowerCase().includes(q);
        const matchStore = act.sucursal?.toLowerCase().includes(q);
        const matchTipo = act.tipo?.toLowerCase().includes(q);
        const matchObs = act.observaciones?.toLowerCase().includes(q);
        const matchApp = act.app?.toLowerCase().includes(q);
        if (!matchAct && !matchStore && !matchTipo && !matchObs && !matchApp) {
          return false;
        }
      }
      return true;
    });

    return { calendarCells: cells, currentMonthActivities: monthActs };
  }, [selectedCalendarYear, selectedCalendarMonth, calendarActivities, calendarFilterTipo, calendarSearch]);

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

  // Priorities: Stores with severe issues (demoras > 10% or reclamos > 2.5% or canc > 2%)
  const priorityStores = useMemo(() => {
    const list = [];
    allStores.forEach((store) => {
      const issues = [];
      APPS.forEach((app) => {
        const item = currentStoreAppMap[`${store}___${app.id}`];
        if (!item) return;
        if (item.demorasPct > 10) issues.push({ app: app.label, type: 'Demora crítica', value: `${item.demorasPct}%`, severity: 'high' });
        if (item.reclamosPct > 2.5) issues.push({ app: app.label, type: 'Reclamos excesivos', value: `${item.reclamosPct}%`, severity: 'high' });
        if (item.cancelacionesPct > 2.0) issues.push({ app: app.label, type: 'Cancelaciones altas', value: `${item.cancelacionesPct}%`, severity: 'mid' });
        if (app.id !== 'Mercado Delivery' && item.disponibilidad < 94) issues.push({ app: app.label, type: 'Baja disponibilidad', value: `${item.disponibilidad}%`, severity: 'mid' });
      });
      if (issues.length > 0) {
        list.push({ store, zona: getStoreZone(store), issues, score: issues.length });
      }
    });
    return list.sort((a, b) => b.score - a.score);
  }, [allStores, currentStoreAppMap]);

  // Incidencias: Detailed incidents list per store & canal
  const incidenciasList = useMemo(() => {
    const list = [];
    allStores.forEach((store) => {
      APPS.forEach((app) => {
        const item = currentStoreAppMap[`${store}___${app.id}`];
        if (!item) return;
        if (item.reclamos > 0 || item.cancelaciones > 0 || item.demoras > 10) {
          list.push({
            store,
            canal: app.label,
            confirmadas: item.confirmadas || 0,
            reclamos: item.reclamos || 0,
            reclamosPct: item.reclamosPct || 0,
            reclamosCosto: item.reclamosCosto || 0,
            cancelaciones: item.cancelaciones || 0,
            demoras: item.demoras || 0,
            demorasPct: item.demorasPct || 0
          });
        }
      });
    });
    return list.sort((a, b) => b.reclamos - a.reclamos || b.demoras - a.demoras);
  }, [allStores, currentStoreAppMap]);

  // Textos para copiar: Prepared message templates for WhatsApp / Telegram with managers
  const copyTemplates = useMemo(() => {
    const worstDemoras = [...priorityStores].filter(p => p.issues.some(i => i.type === 'Demora crítica')).slice(0, 5).map(p => p.store).join(', ');
    const worstReclamos = [...incidenciasList].filter(i => i.reclamosPct > 2.5).slice(0, 5).map(i => `${i.store} (${i.reclamosPct}%)`).join(', ');

    return [
      {
        id: 'resumen_semanal',
        title: 'Resumen Operativo Semanal para Supervisores',
        desc: 'Mensaje para enviar al grupo de operaciones con los números globales y foco de la semana.',
        text: `Hola equipo! Compartimos los resultados operativos de la semana (${selectedPeriod}):\n\n` +
              `📦 Pedidos informados: ${fmtInt(kpiStats.totalConfirmados)}\n` +
              `⚠️ Combinaciones con desvío: ${kpiStats.desviosCount} tiendas\n\n` +
              `🚨 Foco urgente de demoras: ${worstDemoras || 'Sin tiendas críticas'}\n` +
              `❗ Foco en reclamos de clientes: ${worstReclamos || 'Bajo control'}\n\n` +
              `Por favor revisar en cada sucursal los tiempos de cocina y empaquetado para mantenernos en objetivo esta semana. Gracias!`
      },
      {
        id: 'alerta_demoras',
        title: 'Alerta Directa por Demora en Cocina',
        desc: 'Mensaje para notificar a encargados o supervisores de tiendas con tiempos altos de preparación.',
        text: `Buenas tardes. Les escribimos por los indicadores de demora operativa de la semana (${selectedPeriod}).\n` +
              `Detectamos que los tiempos de entrega superaron el umbral fijado en los pedidos de apps.\n` +
              `Necesitamos reforzar el ritmo de armado y evitar acumulación en mostrador durante las horas pico de despacho.`
      },
      {
        id: 'alerta_reclamos',
        title: 'Alerta por Reclamos y Faltantes de Pedidos',
        desc: 'Mensaje de calidad para despachos con quejas de clientes por empanadas o productos equivocados.',
        text: `Atención equipo de despacho: Durante la semana (${selectedPeriod}) registramos reclamos reiterados por ítems faltantes o pedidos equivocados en las apps.\n` +
              `Recordamos que es obligatorio cotejar el ticket con el contenido de las cajas antes de cerrar la bolsa y entregar al repartidor.`
      }
    ];
  }, [selectedPeriod, kpiStats, priorityStores, incidenciasList]);

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Format helpers
  const renderDeltaBadge = (val, isPp = false, isGoodWhenPositive = false) => {
    if (val === null || val === undefined || isNaN(val)) return null;
    const num = Math.round(val * 100) / 100;
    if (num === 0) return <span className="text-[10px] text-slate-500 font-mono font-medium">0{isPp ? ' pp' : ''}</span>;
    
    const isPositive = num > 0;
    const sign = isPositive ? '+' : '';
    const formatted = `${sign}${isPp ? num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' pp' : fmtInt(num)}`;
    
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
        {((activeTab !== 'comparar' && activeTab !== 'textos') || (!isGuest && (activeTab === 'indicadores' || activeTab === 'incidencias'))) && (
          <div className="flex items-center gap-2.5">
            {activeTab !== 'comparar' && activeTab !== 'textos' && (
              <button
                onClick={onExportPDF}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-bold shadow-sm transition-all duration-150 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Guardar como PDF</span>
              </button>
            )}
            {!isGuest && (activeTab === 'indicadores' || activeTab === 'incidencias') && (
              <button
                onClick={activeTab === 'incidencias' ? () => setIsIncidentModalOpen(true) : onOpenImport}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white border border-rose-500/40 text-xs font-bold shadow-md shadow-rose-950/40 transition-all duration-150 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {activeTab === 'incidencias' ? 'Registrar incidencia' : 'Cargar indicadores'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Pills Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'indicadores', label: 'Indicadores' },
          { id: 'comparar', label: 'Comparar periodos' },
          { id: 'prioridades', label: 'Prioridades' },
          { id: 'incidencias', label: 'Incidencias' },
          { id: 'calendario', label: 'Calendario' },
          { id: 'textos', label: 'Textos para copiar' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* TAB CONTENT 1: INDICADORES (MAIN VIEW) */}
      {activeTab === 'indicadores' && (
        <div className="space-y-6">
          {/* Filter Toolbar Bar */}
          <div className="bg-slate-900/95 rounded-2xl p-4.5 border border-slate-800/90 shadow-xl flex flex-wrap items-end justify-between gap-4 relative z-30">
            <div className="flex flex-wrap items-center gap-3.5">
              {/* Vista */}
              <CustomStyledSelect
                label="Vista"
                value={vistaType}
                onChange={setVistaType}
                options={[
                  { value: 'semanal', label: 'Semanal' },
                  { value: 'mensual', label: 'Mensual' }
                ]}
                minWidth="min-w-[120px]"
              />

              {/* Semana de referencia */}
              <CustomStyledSelect
                label="Semana de referencia"
                value={selectedPeriod}
                onChange={onPeriodChange}
                options={availablePeriods.map((p) => ({ value: p, label: p }))}
                rightIcon={Calendar}
                minWidth="min-w-[210px]"
              />

              {/* Zona */}
              <CustomStyledSelect
                label="Zona"
                value={filterZona}
                onChange={setFilterZona}
                options={[
                  { value: 'ALL', label: 'Todas las zonas', dotColor: 'bg-slate-400' },
                  { value: 'CABA', label: 'CABA', dotColor: 'bg-sky-400' },
                  { value: 'GBA', label: 'GBA', dotColor: 'bg-emerald-400' }
                ]}
                minWidth="min-w-[145px]"
              />

              {/* Canal / App */}
              <CustomStyledSelect
                label="Canal / App"
                value={filterApp}
                onChange={setFilterApp}
                options={[
                  { value: 'ALL', label: 'Todas las apps', dotColor: 'bg-slate-400' },
                  { value: 'PEYA', label: 'PedidosYa', dotColor: 'bg-rose-500' },
                  { value: 'Rappi', label: 'Rappi', dotColor: 'bg-orange-500' },
                  { value: 'Mercado Delivery', label: 'Mercado Delivery', dotColor: 'bg-amber-400' }
                ]}
                minWidth="min-w-[160px]"
              />
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

          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
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

            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
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

            <div className="bg-slate-900/90 rounded-2xl p-5 border border-rose-500/30 shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition-all">
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

            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/90 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
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

          {/* Comparison Matrix Grid */}
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

                          <div className="grid grid-cols-2 gap-2.5 py-3 text-xs">
                            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                              <div className="text-[10px] text-slate-400 font-semibold">Confirmados</div>
                              <div className="font-mono font-extrabold text-sm text-white leading-tight mt-0.5">
                                {fmtInt(currentItem.confirmadas || 0)}
                              </div>
                              <div className="mt-0.5">
                                {renderDeltaBadge(dConf, false, true)}
                              </div>
                            </div>

                            <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                              <div className="text-[10px] text-slate-400 font-semibold">Disponibilidad</div>
                              <div className="font-mono font-extrabold text-sm text-white leading-tight mt-0.5">
                                {fmtDisplayPct(currentItem.disponibilidad)}
                              </div>
                              <div className="mt-0.5">
                                {renderDeltaBadge(dDisp, true, true)}
                              </div>
                            </div>

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
        </div>
      )}

      {/* TAB CONTENT: COMPARAR PERIODOS */}
      {activeTab === 'comparar' && (
        <div className="space-y-6">
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
      )}

      {/* TAB CONTENT 2: PRIORIDADES */}
      {activeTab === 'prioridades' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800/90 shadow-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Tablero de Prioridades de Atención</h3>
                <p className="text-xs text-slate-400">Sucursales con desvíos críticos o múltiples incidencias simultáneas en la semana.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priorityStores.map((p, idx) => (
              <div key={p.store} className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/90 hover:border-rose-500/40 transition-all space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="font-extrabold text-base text-white">{p.store}</span>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">{p.zona}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                    {p.issues.length} {p.issues.length === 1 ? 'Alerta' : 'Alertas'}
                  </span>
                </div>

                <div className="space-y-2">
                  {p.issues.map((iss, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">{iss.app}</span>
                        <span className="text-white font-medium">{iss.type}</span>
                      </div>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-lg ${
                        iss.severity === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {iss.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: INCIDENCIAS */}
      {activeTab === 'incidencias' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800/90 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ListTodo className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Registro de Incidencias Operativas</h3>
                <p className="text-xs text-slate-400">Seguimiento de desvíos, demoras y novedades cargadas por sucursal y canal.</p>
              </div>
            </div>

            {/* Filter Pills by Status */}
            {manualIncidents.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                {[
                  { id: 'ALL', label: 'Todas', count: manualIncidents.length, color: 'text-slate-200' },
                  { id: 'Abierta', label: 'Abiertas', count: abiertasCount, dot: 'bg-rose-500' },
                  { id: 'En proceso', label: 'En proceso', count: enProcesoCount, dot: 'bg-amber-400' },
                  { id: 'Resuelta', label: 'Resueltas', count: resueltasCount, dot: 'bg-emerald-400' }
                ].map((f) => {
                  const isSelected = incidentFilterStatus === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setIncidentFilterStatus(f.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-900/80 text-rose-100 border border-rose-500/50 shadow-md shadow-rose-950/40'
                          : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`} />}
                      <span>{f.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 font-mono">
                        {f.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* INCIDENCIAS CARDS GRID */}
          {manualIncidents.length === 0 ? (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-12 text-center space-y-3 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
                <ListTodo className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-100">
                No hay incidencias registradas aún
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Utiliza el botón superior <strong className="text-rose-400">"+ Registrar Incidencia"</strong> para asentar desvíos en cocina, demoras o incidencias operativas en formato de tarjetas.
              </p>
            </div>
          ) : filteredManualIncidents.length === 0 ? (
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-8 text-center space-y-2">
              <p className="text-sm font-bold text-slate-300">
                No hay incidencias con el estado "{incidentFilterStatus}"
              </p>
              <button
                type="button"
                onClick={() => setIncidentFilterStatus('ALL')}
                className="text-xs font-bold text-rose-400 hover:underline cursor-pointer"
              >
                Ver todas las incidencias ({manualIncidents.length})
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {filteredManualIncidents.map((inc) => {
                const formattedDate = inc.fecha && inc.fecha.includes('-')
                  ? `${inc.fecha.split('-')[2]}/${inc.fecha.split('-')[1]}/${inc.fecha.split('-')[0]}`
                  : (inc.fecha || 'Sin fecha');

                return (
                  <div
                    key={inc.id}
                    className="bg-slate-900/90 rounded-2xl border border-slate-800/90 hover:border-slate-700/90 p-5 shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4 group hover:-translate-y-0.5"
                  >
                    {/* Card Header: Store, Date & Status */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-rose-400 shrink-0" />
                          <h4 className="font-extrabold text-base text-white tracking-tight">
                            {inc.sucursal}
                          </h4>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 block mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {formattedDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isGuest ? (
                          <select
                            value={inc.estado}
                            onChange={(e) => handleUpdateIncidentStatus(inc.id, e.target.value)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border cursor-pointer outline-none transition-all shadow-xs ${
                              inc.estado === 'Abierta' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                              inc.estado === 'En proceso' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                              inc.estado === 'Resuelta' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                              'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <option value="Abierta" className="bg-slate-900 text-white">Abierta</option>
                            <option value="En proceso" className="bg-slate-900 text-white">En proceso</option>
                            <option value="Resuelta" className="bg-slate-900 text-white">Resuelta</option>
                            <option value="Cerrada" className="bg-slate-900 text-white">Cerrada</option>
                          </select>
                        ) : (
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                            inc.estado === 'Abierta' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                            inc.estado === 'En proceso' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                            inc.estado === 'Resuelta' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {inc.estado}
                          </span>
                        )}

                        {!isGuest && (
                          <button
                            onClick={() => handleDeleteIncident(inc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Eliminar incidencia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Body: App Badge & Incidencia Title */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3" />
                          Incidencia
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                          inc.app === 'PedidosYa' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                          inc.app === 'Rappi' ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' :
                          inc.app === 'Mercado Delivery' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                          inc.app === 'TePido' ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' :
                          'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {inc.app}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white leading-snug">
                        {inc.incidencia}
                      </p>
                    </div>

                    {/* Card Footer: Observaciones */}
                    {inc.observaciones ? (
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-normal">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Observaciones:
                        </span>
                        <p className="whitespace-pre-line text-slate-300 text-xs">
                          {inc.observaciones}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-slate-950/30 border border-slate-800/40 text-[11px] text-slate-500 italic">
                        Sin observaciones adicionales
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: CALENDARIO */}
      {activeTab === 'calendario' && (
        <div className="space-y-6">
          {/* Header Card matching mockup: "Calendario comercial" */}
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800/90 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <CalendarDays className="w-4 h-4" />
                  </span>
                  Calendario comercial
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Promociones, cierres, capacitaciones y eventos. Duplicá un registro para reutilizarlo en otra fecha.
                </p>
              </div>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="flex flex-wrap items-end justify-between gap-4 pt-4 border-t border-slate-800/80">
              {/* Left Side: Search & Tipo Filters */}
              <div className="flex flex-wrap items-end gap-3">
                {/* Search Bar */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Buscar</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar actividad o sucursal..."
                      value={calendarSearch}
                      onChange={(e) => setCalendarSearch(e.target.value)}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 w-52 sm:w-60 h-[38px]"
                    />
                  </div>
                </div>

                {/* Tipo Filter */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Tipo</label>
                  <CustomTipoFilterDropdown
                    value={calendarFilterTipo}
                    onChange={setCalendarFilterTipo}
                  />
                </div>
              </div>

              {/* Right Side: Mes selector & Agendar button */}
              <div className="flex flex-wrap items-end gap-3.5">
                {/* Mes selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mes</label>
                  <MonthPickerPopover
                    selectedYear={selectedCalendarYear}
                    selectedMonth={selectedCalendarMonth}
                    onChange={(y, m) => {
                      setSelectedCalendarYear(y);
                      setSelectedCalendarMonth(m);
                    }}
                  />
                </div>

                {/* Quick Agendar button right by the filter toolbar */}
                {!isGuest && (
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarModalInitialDate('');
                      setCalendarModalInitialData(null);
                      setIsCalendarModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white border border-rose-500/40 text-xs font-bold shadow-md shadow-rose-950/40 transition-all cursor-pointer h-[38px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agendar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden">
            {/* Days of Week Header: Lun, Mar, Mié, Jue, Vie, Sáb, Dom */}
            <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/80 text-center">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                <div key={d} className="py-3 text-xs font-bold uppercase tracking-wider text-slate-400 border-r border-slate-800/60 last:border-r-0">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/70 bg-slate-950/40">
              {calendarCells.map((cell, idx) => {
                const isToday = cell.isCurrentMonth && 
                  new Date().getFullYear() === selectedCalendarYear &&
                  new Date().getMonth() === selectedCalendarMonth &&
                  new Date().getDate() === cell.dayNum;

                // Activities for this specific day
                const dayActs = cell.isCurrentMonth
                  ? currentMonthActivities.filter((a) => {
                      if (!a.fecha) return false;
                      const parts = a.fecha.split('-');
                      return (
                        Number(parts[0]) === selectedCalendarYear &&
                        Number(parts[1]) === (selectedCalendarMonth + 1) &&
                        Number(parts[2]) === cell.dayNum
                      );
                    })
                  : [];

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (cell.isCurrentMonth && !isGuest) {
                        const padM = String(selectedCalendarMonth + 1).padStart(2, '0');
                        const padD = String(cell.dayNum).padStart(2, '0');
                        setCalendarModalInitialDate(`${selectedCalendarYear}-${padM}-${padD}`);
                        setCalendarModalInitialData(null);
                        setIsCalendarModalOpen(true);
                      }
                    }}
                    className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors group relative ${
                      cell.isCurrentMonth
                        ? 'bg-slate-900/60 hover:bg-slate-800/50 cursor-pointer'
                        : 'bg-slate-950/20 text-slate-700 opacity-40 cursor-default pointer-events-none'
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                          isToday
                            ? 'bg-rose-500 text-white shadow-xs shadow-rose-950/50'
                            : cell.isCurrentMonth
                            ? 'text-slate-300'
                            : 'text-slate-600'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {/* Hover Quick Add indicator */}
                      {cell.isCurrentMonth && !isGuest && (
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-rose-400 hover:text-rose-300">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    {/* Day Activities List */}
                    <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-0.5">
                      {dayActs.map((act) => {
                        const isPromo = act.tipo === 'Promoción';
                        const isCierre = act.tipo === 'Cierre';
                        const isCapacitacion = act.tipo === 'Capacitación';
                        const isEvento = act.tipo === 'Evento';
                        const isReunion = act.tipo === 'Reunión';

                        const colorClasses = isPromo
                          ? 'bg-purple-950/80 border-purple-500/40 text-purple-200 hover:border-purple-400'
                          : isCierre
                          ? 'bg-amber-950/80 border-amber-500/40 text-amber-200 hover:border-amber-400'
                          : isCapacitacion
                          ? 'bg-sky-950/80 border-sky-500/40 text-sky-200 hover:border-sky-400'
                          : isEvento
                          ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200 hover:border-emerald-400'
                          : isReunion
                          ? 'bg-rose-950/80 border-rose-500/40 text-rose-200 hover:border-rose-400'
                          : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500';

                        return (
                          <div
                            key={act.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateCalendarActivity(act);
                            }}
                            title={`Haz clic para duplicar o editar: ${act.actividad}`}
                            className={`group/act relative p-1.5 rounded-lg border text-[11px] leading-tight transition-all shadow-xs ${colorClasses}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold truncate">{act.actividad}</span>
                              {act.hora && (
                                <span className="text-[10px] font-mono opacity-80 shrink-0 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5 inline" />
                                  {act.hora}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 mt-1 text-[10px] opacity-80 truncate">
                              {act.sucursal && act.sucursal !== 'Todas las sucursales' && (
                                <span className="truncate">{act.sucursal}</span>
                              )}
                              {act.app && act.app !== 'Todas las apps' && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 font-semibold shrink-0">
                                  {act.app}
                                </span>
                              )}
                            </div>

                            {/* Floating hover actions: Duplicar & Eliminar */}
                            {!isGuest && (
                              <div className="absolute top-1 right-1 hidden group-hover/act:flex items-center gap-1 bg-slate-950/90 rounded-md p-0.5 border border-slate-700 shadow-md z-10">
                                <button
                                  type="button"
                                  title="Duplicar actividad"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateCalendarActivity(act);
                                  }}
                                  className="p-0.5 hover:text-amber-300 text-slate-400 transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  title="Eliminar actividad"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCalendarActivity(act.id);
                                  }}
                                  className="p-0.5 hover:text-rose-400 text-slate-400 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Under-Calendar Message: Exact matching mockup */}
          {currentMonthActivities.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 font-medium">
              No hay actividades en este mes para los filtros elegidos.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Actividades registradas en el mes ({currentMonthActivities.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  Haz clic en "Duplicar" para reutilizar una actividad en otra fecha
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentMonthActivities.map((act) => {
                  const isPromo = act.tipo === 'Promoción';
                  const isCierre = act.tipo === 'Cierre';
                  const isCapacitacion = act.tipo === 'Capacitación';
                  const isEvento = act.tipo === 'Evento';
                  const isReunion = act.tipo === 'Reunión';

                  const badgeColor = isPromo ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                    isCierre ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    isCapacitacion ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' :
                    isEvento ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    isReunion ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                    'bg-slate-800 text-slate-300 border-slate-700';

                  return (
                    <div
                      key={act.id}
                      className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${badgeColor}`}>
                              {act.tipo}
                            </span>
                            {act.hora && (
                              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {act.hora} hs
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-white leading-snug">
                            {act.actividad}
                          </h4>
                        </div>

                        {!isGuest && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDuplicateCalendarActivity(act)}
                              title="Duplicar actividad"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCalendarActivity(act.id)}
                              title="Eliminar actividad"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {act.fecha ? act.fecha.split('-').reverse().join('/') : '-'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 flex items-center gap-1">
                          <Store className="w-3 h-3 text-slate-500" />
                          {act.sucursal}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-slate-500" />
                          {act.app}
                        </span>
                      </div>

                      {act.observaciones && (
                        <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                          {act.observaciones}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 5: TEXTOS PARA COPIAR */}
      {activeTab === 'textos' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800/90 shadow-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Textos para Copiar y Compartir</h3>
                <p className="text-xs text-slate-400">Plantillas automáticas con los datos calculados de la semana para enviar por WhatsApp o email.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {copyTemplates.map((t) => {
              const isCopied = copiedId === t.id;
              return (
                <div key={t.id} className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800/90 flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition-colors">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-white">{t.title}</h4>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                    <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto no-scrollbar">
                      {t.text}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyText(t.id, t.text)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>¡Copiado al portapapeles!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar texto</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Modal: Registrar Incidencia */}
      <RegisterIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        onSaveIncident={handleSaveIncident}
        stores={allStores.length > 0 ? allStores : stores.map((s) => (typeof s === 'string' ? s : s.name))}
      />

      {/* Modal: Agendar Actividad */}
      <ScheduleActivityModal
        isOpen={isCalendarModalOpen}
        onClose={() => {
          setIsCalendarModalOpen(false);
          setCalendarModalInitialData(null);
        }}
        onSaveActivity={handleSaveCalendarActivity}
        initialDate={calendarModalInitialDate}
        initialData={calendarModalInitialData}
        stores={allStores.length > 0 ? allStores : stores.map((s) => (typeof s === 'string' ? s : s.name))}
      />
    </div>
  );
}
