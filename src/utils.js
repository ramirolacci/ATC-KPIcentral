import * as XLSX from 'xlsx';

// Store name normalization dictionary
export function normalizeStoreName(name) {
  if (!name) return '';
  let n = String(name).trim();
  n = n.replace(/^(Mi Gusto|Mi gusto)\s*[-–—]?\s*/i, '').trim();
  n = n.replace(/\s+/g, ' ');

  const aliases = {
    'Cañitas': 'Las Cañitas',
    'Las Canitas': 'Las Cañitas',
    'Canitas': 'Las Cañitas',
    'Vicente Lopez': 'Vicente López',
    'Pacheco': 'General Pacheco',
    'Polvorines': 'Los Polvorines',
    'Maschwitz': 'Ingeniero Maschwitz',
    'Ing Maschwitz': 'Ingeniero Maschwitz',
    'San Martin': 'San Martín',
    'San Miguel': 'San Miguel',
    'Muniz': 'Muñiz',
    'Martinez': 'Martínez',
    'Jose C Paz': 'José C. Paz',
    'Jose C. Paz': 'José C. Paz',
    'Barrancas De Belgrano': 'Barrancas de Belgrano',
  };

  return aliases[n] || n;
}

export function cleanNum(v, defaultVal = 0) {
  if (v === null || v === undefined || v === '-' || v === '') return defaultVal;
  if (typeof v === 'number') return isNaN(v) ? defaultVal : v;

  let s = String(v).replace(/[$€£\s%]/g, '').trim();
  if (!s || s === '-') return defaultVal;

  if (s.includes(',') && s.includes('.')) {
    // Both separators present: the last one is the decimal separator
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    const parts = s.split(',');
    if (parts.length > 2) {
      // Multiple commas: thousands separators (e.g. 1,239,000)
      s = parts.join('');
    } else if (parts.length === 2 && parts[1].length === 3) {
      // Exactly 3 digits after comma without decimal: Argentine/European thousands separator (e.g. 239,000)
      s = parts[0] + parts[1];
    } else {
      // Otherwise comma is decimal separator (e.g. 239,50 or 2,5)
      s = s.replace(',', '.');
    }
  } else if (s.includes('.')) {
    const parts = s.split('.');
    if (parts.length > 2) {
      // Multiple dots: thousands separators (e.g. 1.239.000)
      s = parts.join('');
    } else if (parts.length === 2 && parts[1].length === 3) {
      // Exactly 3 digits after dot without further decimals: thousands separator (e.g. 239.000)
      s = parts[0] + parts[1];
    }
    // Otherwise dot is standard decimal (e.g. 239.5)
  }

  const parsed = parseFloat(s);
  return isNaN(parsed) ? defaultVal : parsed;
}

export function cleanPct(v, defaultVal = 0) {
  if (v === null || v === undefined || v === '-' || v === '') return defaultVal;
  if (typeof v === 'number') {
    if (isNaN(v)) return defaultVal;
    return v <= 1.0 ? v * 100 : v;
  }
  let s = String(v).replace(/[$€£\s%]/g, '').trim();
  if (s.includes(',')) s = s.replace(',', '.');
  const parsed = parseFloat(s);
  if (isNaN(parsed)) return defaultVal;
  return parsed <= 1.0 ? parsed * 100 : parsed;
}

// Format numbers for display
export function fmtInt(val) {
  return new Intl.NumberFormat('es-AR').format(Math.round(val || 0));
}

export function fmtCurrency(val) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    currencyDisplay: 'symbol',
    maximumFractionDigits: 0
  }).format(val || 0);
}

export function fmtPct(val) {
  return `${(val || 0).toFixed(2)}%`;
}

// Compute Semaphore Status for a metric value
export function getMetricStatus(metricKey, value, thresholds) {
  const conf = thresholds[metricKey];
  if (!conf) return 'ok';
  const val = Number(value) || 0;

  if (conf.invert) {
    // Lower is better (e.g. cancellations, complaints, delays)
    if (val <= conf.ok) return 'ok';
    if (val <= conf.warning) return 'warning';
    return 'danger';
  } else {
    // Higher is better (e.g. availability)
    if (val >= conf.ok) return 'ok';
    if (val >= conf.warning) return 'warning';
    return 'danger';
  }
}

function parseHeaders(headersRow) {
  const norm = (headersRow || []).map(h => String(h || '').toLowerCase().trim());
  const findCol = (predicate) => norm.findIndex(predicate);

  const colCanal = findCol(h => h.includes('canal'));
  const colTienda = findCol(h => h.includes('tienda') || h.includes('sucursal'));
  const colConfirmadas = findCol(h => h.includes('confirmad'));

  let colCancCant = findCol(h => (h.includes('cancel') && !h.includes('%') && (h.includes('órdenes') || h.includes('ordenes') || h.includes('cant'))));
  let colCancPct = findCol(h => h.includes('cancel') && h.includes('%'));
  if (colCancCant === -1) {
    colCancCant = findCol(h => h.includes('cancel') && !h.includes('%'));
  }
  if (colCancPct === -1) {
    colCancPct = findCol(h => h.includes('cancel') && h.includes('%'));
  }

  const colCancCosto = findCol(h => h.includes('cargo') || (h.includes('rechazo') && h.includes('$')));

  let colRecCant = findCol(h => (h.includes('reclam') && !h.includes('%') && !h.includes('$') && (h.includes('cant') || h === 'reclamos' || h.includes('órdenes'))));
  let colRecPct = findCol(h => h.includes('reclam') && h.includes('%'));
  let colRecCosto = findCol(h => (h.includes('reclam') && h.includes('$')) || h.includes('$ de reclamos') || h.includes('costo'));

  let colDemCant = findCol(h => (h.includes('demor') && !h.includes('%')));
  let colDemPct = findCol(h => (h.includes('demor') && h.includes('%')) || h.includes('awt'));

  let colDisp = findCol(h => h.includes('disponib'));

  return {
    colCanal: colCanal !== -1 ? colCanal : 0,
    colTienda: colTienda !== -1 ? colTienda : 1,
    colConfirmadas: colConfirmadas !== -1 ? colConfirmadas : 2,
    colCancCant,
    colCancPct,
    colCancCosto,
    colRecCant,
    colRecPct,
    colRecCosto,
    colDemCant,
    colDemPct,
    colDisp
  };
}

// Parse Excel file in the browser
export async function parseUploadedExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const results = {};

        wb.SheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
          if (!rawRows || rawRows.length === 0) return;

          // Find header index
          let headerIdx = -1;
          for (let i = 0; i < Math.min(10, rawRows.length); i++) {
            const rowStr = (rawRows[i] || []).join(' ').toLowerCase();
            if (rowStr.includes('canal') || rowStr.includes('tienda') || rowStr.includes('ordenes')) {
              headerIdx = i;
              break;
            }
          }

          if (headerIdx === -1) return;

          const mapping = parseHeaders(rawRows[headerIdx]);
          const records = [];

          for (let i = headerIdx + 1; i < rawRows.length; i++) {
            const r = rawRows[i];
            if (!r || !r.some((c) => c !== null)) continue;

            const c0 = String(r[mapping.colCanal] || '').trim().toLowerCase();
            const c1 = String(r[mapping.colTienda] || '').trim();
            if (!c1 || c1.toLowerCase().startsWith('total') || c1.toLowerCase().startsWith('promedio') || c0.startsWith('total')) {
              continue;
            }

            let canal = 'PEYA';
            if (c0.includes('peya') || c0.includes('pedidos')) canal = 'PEYA';
            else if (c0.includes('rappi')) canal = 'Rappi';
            else if (c0.includes('mdl') || c0.includes('mercado')) canal = 'Mercado Delivery';

            const store = normalizeStoreName(c1);
            const confirmadas = cleanNum(r[mapping.colConfirmadas]);

            let canc_cant = mapping.colCancCant !== -1 ? cleanNum(r[mapping.colCancCant]) : 0;
            let canc_pct = mapping.colCancPct !== -1 ? cleanPct(r[mapping.colCancPct]) : 0;
            let canc_costo = mapping.colCancCosto !== -1 ? cleanNum(r[mapping.colCancCosto]) : 0;

            let rec_cant = mapping.colRecCant !== -1 ? cleanNum(r[mapping.colRecCant]) : 0;
            let rec_pct = mapping.colRecPct !== -1 ? cleanPct(r[mapping.colRecPct]) : 0;
            let rec_costo = mapping.colRecCosto !== -1 ? cleanNum(r[mapping.colRecCosto]) : 0;

            let dem_cant = mapping.colDemCant !== -1 ? cleanNum(r[mapping.colDemCant]) : 0;
            let dem_pct = mapping.colDemPct !== -1 ? cleanPct(r[mapping.colDemPct]) : 0;
            let disp = mapping.colDisp !== -1 ? cleanPct(r[mapping.colDisp], 100) : 100;

            records.push({
              canal,
              tienda: store,
              confirmadas: Math.round(confirmadas),
              cancelaciones: Math.round(canc_cant),
              cancelacionesPct: Number(canc_pct.toFixed(2)),
              cancelacionesCosto: Number(canc_costo.toFixed(2)),
              reclamos: Math.round(rec_cant),
              reclamosPct: Number(rec_pct.toFixed(2)),
              reclamosCosto: Number(rec_costo.toFixed(2)),
              demoras: Math.round(dem_cant),
              demorasPct: Number(dem_pct.toFixed(2)),
              disponibilidad: Number(disp.toFixed(2))
            });
          }

          if (records.length > 0) {
            const cleanSheetName = sheetName.trim().replace(/\s+/g, ' ');
            const isCierre = cleanSheetName.toLowerCase().includes('cierre') || cleanSheetName.toLowerCase() === 'septiembre';
            results[cleanSheetName] = {
              isCierre,
              records
            };
          }
        });

        resolve(results);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extracts first name and last name initials (e.g. "Damaris Burgos" -> "DB")
 */
export function getInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

