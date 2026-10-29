// Master list of supervisors and their assigned stores with refined, elegant brand colors
export const INITIAL_SUPERVISORS = [
  {
    id: 'sup_damaris',
    name: 'Damaris Burgos',
    title: 'Supervisora de Tiendas',
    color: '#0284c7', // Slate cyan
    badge: 'bg-sky-50 text-sky-700 border-sky-200 shadow-sm'
  },
  {
    id: 'sup_evelyn',
    name: 'Evelyn Cedrón',
    title: 'Supervisora de Tiendas',
    color: '#4f46e5', // Indigo
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm'
  },
  {
    id: 'sup_selene',
    name: 'Selene Hernández',
    title: 'Supervisora Tienda Propia',
    color: '#059669', // Emerald
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
  },
  {
    id: 'sup_sasha',
    name: 'Sasha Alfini',
    title: 'Supervisora Tienda Propia',
    color: '#7c3aed', // Purple
    badge: 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm'
  },
  {
    id: 'sup_martin',
    name: 'Martín Sastre',
    title: 'Supervisor Tienda Propia',
    color: '#2563eb', // Royal Blue
    badge: 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
  }
];

export const INITIAL_STORES = [
  // Damaris Burgos (18 Franquicias)
  { id: 't_tigre', name: 'Tigre', sup: 'sup_damaris' },
  { id: 't_ituzaingo', name: 'Ituzaingó', sup: 'sup_damaris' },
  { id: 't_mataderos', name: 'Mataderos', sup: 'sup_damaris' },
  { id: 't_moreno', name: 'Moreno', sup: 'sup_damaris' },
  { id: 't_paternal', name: 'Paternal', sup: 'sup_damaris' },
  { id: 't_don_torcuato', name: 'Don Torcuato', sup: 'sup_damaris' },
  { id: 't_ballester', name: 'Ballester', sup: 'sup_damaris' },
  { id: 't_balvanera', name: 'Balvanera', sup: 'sup_damaris' },
  { id: 't_barrancas_belgrano', name: 'Barrancas de Belgrano', sup: 'sup_damaris' },
  { id: 't_belgrano', name: 'Belgrano', sup: 'sup_damaris' },
  { id: 't_caballito', name: 'Caballito', sup: 'sup_damaris' },
  { id: 't_del_viso', name: 'Del Viso', sup: 'sup_damaris' },
  { id: 't_floresta', name: 'Floresta', sup: 'sup_damaris' },
  { id: 't_martinez', name: 'Martínez', sup: 'sup_damaris' },
  { id: 't_munro', name: 'Munro', sup: 'sup_damaris' },
  { id: 't_palermo', name: 'Palermo', sup: 'sup_damaris' },
  { id: 't_puerto_madero', name: 'Puerto Madero', sup: 'sup_damaris' },
  { id: 't_villa_adelina', name: 'Villa Adelina', sup: 'sup_damaris' },

  // Evelyn Cedrón (18 Franquicias)
  { id: 't_merlo', name: 'Merlo', sup: 'sup_evelyn' },
  { id: 't_campana', name: 'Campana', sup: 'sup_evelyn' },
  { id: 't_maschwitz', name: 'Ingeniero Maschwitz', sup: 'sup_evelyn' },
  { id: 't_general_pacheco', name: 'General Pacheco', sup: 'sup_evelyn' },
  { id: 't_los_polvorines', name: 'Los Polvorines', sup: 'sup_evelyn' },
  { id: 't_villa_urquiza', name: 'Villa Urquiza', sup: 'sup_evelyn' },
  { id: 't_bella_vista', name: 'Bella Vista', sup: 'sup_evelyn' },
  { id: 't_devoto', name: 'Devoto', sup: 'sup_evelyn' },
  { id: 't_escobar', name: 'Escobar', sup: 'sup_evelyn' },
  { id: 't_florida', name: 'Florida', sup: 'sup_evelyn' },
  { id: 't_hurlingham', name: 'Hurlingham', sup: 'sup_evelyn' },
  { id: 't_jose_c_paz', name: 'José C. Paz', sup: 'sup_evelyn' },
  { id: 't_muniz', name: 'Muñiz', sup: 'sup_evelyn' },
  { id: 't_pilar_centro', name: 'Pilar Centro', sup: 'sup_evelyn' },
  { id: 't_pilar_derqui', name: 'Pilar Derqui', sup: 'sup_evelyn' },
  { id: 't_san_fernando', name: 'San Fernando', sup: 'sup_evelyn' },
  { id: 't_san_martin', name: 'San Martín', sup: 'sup_evelyn' },
  { id: 't_san_miguel', name: 'San Miguel', sup: 'sup_evelyn' },

  // Tiendas Propias
  { id: 't_canitas', name: 'Las Cañitas', sup: 'sup_selene', isPropia: true },
  { id: 't_villa_crespo', name: 'Villa Crespo', sup: 'sup_sasha', isPropia: true },
  { id: 't_vicente_lopez', name: 'Vicente López', sup: 'sup_martin', isPropia: true }
];

export const INITIAL_THRESHOLDS = {
  cancelacionesPct: { ok: 0.5, warning: 1.5, invert: true, unit: '%' },
  reclamosPct: { ok: 1.5, warning: 2.5, invert: true, unit: '%' },
  demorasPct: { ok: 5.0, warning: 10.0, invert: true, unit: '%' },
  disponibilidad: { ok: 98.0, warning: 95.0, invert: false, unit: '%' }
};

export const CHANNELS = [
  { id: 'PEYA', label: 'PEYA', badgeBg: 'bg-rose-50 text-rose-600 border-rose-200' },
  { id: 'Rappi', label: 'Rappi', badgeBg: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'Mercado Delivery', label: 'Mercado Delivery', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
];

export const REVIEW_CHANNELS = [
  { id: 'PEYA', label: 'PEYA', color: '#e11d48' },
  { id: 'Rappi', label: 'Rappi', color: '#ea580c' },
  { id: 'Mercado Delivery', label: 'Mercado Delivery', color: '#f59e0b' },
  { id: 'TePido', label: 'TePido', color: '#9333ea' },
  { id: 'Google', label: 'Google Maps', color: '#0284c7' }
];

export const CANAL_THEMES = {
  ALL: {
    active: 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 font-bold',
    inactive: 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/40 font-medium'
  },
  PEYA: {
    active: 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-600/35 border border-red-400/40 font-bold',
    inactive: 'text-slate-400 hover:text-red-400 hover:bg-red-500/10 font-medium'
  },
  PedidosYa: {
    active: 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-600/35 border border-red-400/40 font-bold',
    inactive: 'text-slate-400 hover:text-red-400 hover:bg-red-500/10 font-medium'
  },
  Rappi: {
    active: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/35 border border-orange-400/40 font-bold',
    inactive: 'text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 font-medium'
  },
  'Mercado Delivery': {
    active: 'bg-gradient-to-r from-amber-500 via-amber-500 to-yellow-500 text-white shadow-md shadow-amber-500/30 border border-amber-400/50 font-bold',
    inactive: 'text-slate-400 hover:text-amber-300 hover:bg-amber-400/10 font-medium'
  },
  TePido: {
    active: 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-md shadow-purple-600/35 border border-purple-400/40 font-bold',
    inactive: 'text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 font-medium'
  },
  Google: {
    active: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/35 border border-sky-400/40 font-bold',
    inactive: 'text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 font-medium'
  }
};

