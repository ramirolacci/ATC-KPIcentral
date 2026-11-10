import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

/**
 * Fetch all periods stored in Supabase
 * Returns an object keyed by period name, e.g. { "cierre octubre": { isCierre: true, records: [...] } }
 */
export async function fetchPeriodsFromCloud() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('kpi_periods')
      .select('id, records, is_cierre, updated_at, created_by')
      .order('updated_at', { ascending: true });

    if (error) {
      console.warn('[Supabase] Error fetching periods:', error.message);
      return null;
    }

    if (!data || data.length === 0) {
      return {};
    }

    const result = {};
    data.forEach((row) => {
      result[row.id] = {
        isCierre: Boolean(row.is_cierre),
        records: Array.isArray(row.records) ? row.records : []
      };
    });
    return result;
  } catch (err) {
    console.warn('[Supabase] Connection failed during fetchPeriodsFromCloud:', err);
    return null;
  }
}

/**
 * Save / Upsert one or more periods to Supabase
 * @param {Record<string, { isCierre?: boolean, records: any[] }>} periodsMap
 * @param {string} [userEmail]
 */
export async function savePeriodsToCloud(periodsMap, userEmail = 'alexandraramirez@migusto.com.ar') {
  if (!supabase) return false;
  try {
    const entries = Object.entries(periodsMap);
    if (entries.length === 0) return true;

    const rows = entries.map(([id, p]) => ({
      id,
      records: p.records || [],
      is_cierre: Boolean(p.isCierre),
      created_by: userEmail,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('kpi_periods')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase] Error upserting periods:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to save periods to cloud:', err);
    return false;
  }
}

/**
 * Delete a single period from Supabase
 */
export async function deletePeriodFromCloud(periodId) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('kpi_periods')
      .delete()
      .eq('id', periodId);

    if (error) {
      console.error('[Supabase] Error deleting period:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to delete period from cloud:', err);
    return false;
  }
}

/**
 * Delete multiple periods from Supabase
 */
export async function deletePeriodsFromCloud(periodIds) {
  if (!supabase || !periodIds || periodIds.length === 0) return false;
  try {
    const { error } = await supabase
      .from('kpi_periods')
      .delete()
      .in('id', periodIds);

    if (error) {
      console.error('[Supabase] Error deleting multiple periods:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to delete periods from cloud:', err);
    return false;
  }
}

/**
 * Update the records of a single period in Supabase
 */
export async function updatePeriodRecordsInCloud(periodId, newRecords) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('kpi_periods')
      .update({
        records: newRecords,
        updated_at: new Date().toISOString()
      })
      .eq('id', periodId);

    if (error) {
      console.error('[Supabase] Error updating period records:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to update period records:', err);
    return false;
  }
}

/**
 * Fetch generic app setting (e.g. thresholds, store_assignments)
 */
export async function fetchSettingFromCloud(key) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('kpi_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) return null;
    return data.value;
  } catch {
    return null;
  }
}

/**
 * Save generic app setting to cloud
 */
export async function saveSettingToCloud(key, value) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('kpi_settings')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    return !error;
  } catch {
    return false;
  }
}

