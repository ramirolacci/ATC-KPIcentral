import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Calendar, ChevronDown, Check, Search, 
  AlertCircle, ShieldAlert, ChevronLeft, ChevronRight
} from 'lucide-react';
import { ModalWrapper } from './ModalWrapper';

/**
 * Custom Styled Date Picker Popup (100% styled in project theme, no browser native calendar)
 */
function CustomDatePicker({ label, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const parseDate = (str) => {
    if (!str) return new Date();
    const parts = str.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date();
  };

  const selectedDate = parseDate(value);
  const [viewDate, setViewDate] = useState(selectedDate);

  useEffect(() => {
    setViewDate(parseDate(value));
  }, [value]);

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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const prevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handleSelectDay = (dayNum) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const formatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    onChange(formatted);
    setViewDate(today);
    setIsOpen(false);
  };

  // Format DD/MM/YYYY for display
  const displayValue = value
    ? `${value.split('-')[2]}/${value.split('-')[1]}/${value.split('-')[0]}`
    : 'Seleccionar fecha...';

  const isToday = (dayNum) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === dayNum
    );
  };

  const isSelected = (dayNum) => {
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === dayNum
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
        {label}
      </label>

      {/* Styled Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950/90 text-slate-100 text-sm font-medium shadow-xs hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500/60 focus:border-rose-500 transition-all cursor-pointer"
      >
        <span className="font-mono text-sm tracking-wide">{displayValue}</span>
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {/* Fully Styled Calendar Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-72 rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl p-4 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-sm font-bold text-white capitalize">
              {monthNames[month]} {year}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 pt-3 pb-1 text-center">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((d) => (
              <span key={d} className="text-[10px] font-bold text-slate-400 uppercase">
                {d}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 text-center py-1">
            {/* Previous month trailing days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => {
              const prevDay = daysInPrevMonth - firstDayIndex + i + 1;
              return (
                <span
                  key={`prev-${i}`}
                  className="h-8 flex items-center justify-center text-xs text-slate-600 select-none opacity-40"
                >
                  {prevDay}
                </span>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const selected = isSelected(dayNum);
              const today = isToday(dayNum);

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selected
                      ? 'bg-gradient-to-r from-rose-700 to-rose-900 text-white font-bold shadow-md shadow-rose-950/50 scale-105'
                      : today
                      ? 'border border-rose-500/50 text-rose-300 font-bold hover:bg-slate-800'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Action: Hoy */}
          <div className="pt-3 mt-1 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono">
              Hoy: {new Date().toLocaleDateString('es-AR')}
            </span>
            <button
              type="button"
              onClick={handleSelectToday}
              className="px-2.5 py-1 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              Seleccionar hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Custom Styled Dropdown to guarantee 100% themed options across all browsers/OS
 */
function CustomDropdown({
  label,
  value,
  onChange,
  options = [],
  searchable = false,
  renderOptionBadge
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredOptions = searchable && search.trim()
    ? options.filter((opt) => {
        const text = typeof opt === 'string' ? opt : opt.label || opt.value;
        return text.toLowerCase().includes(search.toLowerCase());
      })
    : options;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950/90 text-slate-100 text-sm font-medium shadow-xs hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500/60 focus:border-rose-500 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate">
          {renderOptionBadge ? renderOptionBadge(value) : (
            <span className="truncate">{value || 'Seleccionar...'}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Styled Options Popup Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-hidden rounded-xl bg-slate-900 border border-slate-700/90 shadow-2xl z-50 backdrop-blur-xl flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {searchable && (
            <div className="p-2 border-b border-slate-800 bg-slate-950/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar sucursal..."
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto no-scrollbar p-1.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const optVal = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                const isSelected = optVal === value;

                return (
                  <button
                    key={optVal}
                    type="button"
                    onClick={() => {
                      onChange(optVal);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {renderOptionBadge ? renderOptionBadge(optVal) : <span>{optLabel}</span>}
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

export function RegisterIncidentModal({
  isOpen,
  onClose,
  onSaveIncident,
  stores = []
}) {
  const [incidencia, setIncidencia] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [sucursal, setSucursal] = useState('Ballester');
  const [app, setApp] = useState('PedidosYa');
  const [estado, setEstado] = useState('Abierta');
  const [observaciones, setObservaciones] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const textareaRef = useRef(null);

  // Fallback stores if empty
  const defaultStores = [
    'Ballester', 'Balvanera', 'Barrancas de Belgrano', 'Belgrano',
    'Caballito', 'Del Viso', 'Don Torcuato', 'Floresta', 'Ituzaingó',
    'Martínez', 'Mataderos', 'Moreno', 'Munro', 'Palermo', 'Paternal',
    'Puerto Madero', 'Tigre', 'Villa Adelina', 'Villa Crespo', 'Villa del Parque', 'Villa Urquiza'
  ];

  const availableStores = stores && stores.length > 0 ? stores : defaultStores;

  // Auto-resize textarea as user types newlines
  const adjustTextareaHeight = (element) => {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.max(84, element.scrollHeight)}px`;
  };

  const handleObservacionesChange = (e) => {
    setObservaciones(e.target.value);
    adjustTextareaHeight(e.target);
  };

  useEffect(() => {
    if (isOpen) {
      const now = new Date().toISOString().split('T')[0];
      setIncidencia('');
      setFecha(now);
      setSucursal(availableStores.includes('Ballester') ? 'Ballester' : availableStores[0] || 'Ballester');
      setApp('PedidosYa');
      setEstado('Abierta');
      setObservaciones('');
      setErrorMsg('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '84px';
      }
    }
  }, [isOpen, availableStores]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!incidencia.trim()) {
      setErrorMsg('Por favor describe la incidencia.');
      return;
    }

    onSaveIncident({
      id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      incidencia: incidencia.trim(),
      fecha: fecha || new Date().toISOString().split('T')[0],
      sucursal,
      app,
      estado,
      observaciones: observaciones.trim(),
      createdAt: new Date().toISOString()
    });

    onClose();
  };

  // Badge renderers for styled options
  const renderAppBadge = (appName) => {
    const isPEYA = appName === 'PedidosYa';
    const isRappi = appName === 'Rappi';
    const isMDL = appName === 'Mercado Delivery';
    const isTePido = appName === 'TePido';

    return (
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            isPEYA ? 'bg-rose-500' :
            isRappi ? 'bg-orange-500' :
            isMDL ? 'bg-amber-400' :
            isTePido ? 'bg-cyan-400' : 'bg-slate-400'
          }`}
        />
        <span>{appName}</span>
      </div>
    );
  };

  const renderEstadoBadge = (estadoName) => {
    const isAbierta = estadoName === 'Abierta';
    const isEnProceso = estadoName === 'En proceso';
    const isResuelta = estadoName === 'Resuelta';

    return (
      <div className="flex items-center gap-2">
        <span
          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
            isAbierta ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
            isEnProceso ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
            isResuelta ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
            'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {estadoName}
        </span>
      </div>
    );
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xl w-full p-6 sm:p-7 bg-slate-900/95 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl text-white backdrop-blur-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Registrar incidencia
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Carga de desvío operativo para seguimiento y auditoría
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Row 1: Incidencia & Fecha (Custom Styled Calendar) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Incidencia
            </label>
            <input
              type="text"
              value={incidencia}
              onChange={(e) => {
                setIncidencia(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Ej: Demora en cocina, falta de packaging..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950/90 text-slate-100 placeholder-slate-500 shadow-xs focus:outline-none focus:ring-1 focus:ring-rose-500/60 focus:border-rose-500 text-sm font-medium transition-all"
            />
            {errorMsg && (
              <p className="text-xs text-rose-400 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          <div>
            <CustomDatePicker
              label="Fecha"
              value={fecha}
              onChange={setFecha}
            />
          </div>
        </div>

        {/* Row 2: Sucursal & App (Custom Themed Dropdowns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomDropdown
            label="Sucursal"
            value={sucursal}
            onChange={setSucursal}
            options={availableStores}
            searchable={true}
          />

          <CustomDropdown
            label="App"
            value={app}
            onChange={setApp}
            options={['PedidosYa', 'Rappi', 'Mercado Delivery', 'TePido', 'General']}
            renderOptionBadge={renderAppBadge}
          />
        </div>

        {/* Row 3: Estado (Custom Themed Dropdown) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomDropdown
            label="Estado"
            value={estado}
            onChange={setEstado}
            options={['Abierta', 'En proceso', 'Resuelta', 'Cerrada']}
            renderOptionBadge={renderEstadoBadge}
          />
        </div>

        {/* Row 4: Observaciones (Auto-growing textarea) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Observaciones
          </label>
          <textarea
            ref={textareaRef}
            rows={3}
            value={observaciones}
            onChange={handleObservacionesChange}
            placeholder="Escribe observaciones adicionales o motivo del desvío (se agranda automáticamente al escribir)..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700/80 bg-slate-950/90 text-slate-100 placeholder-slate-500 shadow-xs focus:outline-none focus:ring-1 focus:ring-rose-500/60 focus:border-rose-500 text-sm font-medium transition-all resize-none overflow-hidden min-h-[84px] leading-relaxed"
          />
        </div>

        {/* Row 5: Action buttons on the RIGHT */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white border border-rose-500/40 text-xs font-bold shadow-md shadow-rose-950/40 transition-all cursor-pointer active:scale-95"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
