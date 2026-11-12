import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Header } from './components/Header';
import { OperationalDashboard } from './components/OperationalDashboard';
import { ReviewsDashboard } from './components/ReviewsDashboard';
import { ImportModal } from './components/ImportModal';
import { ThresholdsModal } from './components/ThresholdsModal';
import { LoginScreen } from './components/LoginScreen';
import { ModalWrapper } from './components/ModalWrapper';
import { AlertTriangle, CloudOff, X } from 'lucide-react';
import { INITIAL_SUPERVISORS, INITIAL_STORES, INITIAL_THRESHOLDS } from './config';
import preloadedData from './preloadedData.json';
import {
  isSupabaseConfigured,
  fetchPeriodsFromCloud,
  savePeriodsToCloud,
  deletePeriodFromCloud,
  deletePeriodsFromCloud,
  updatePeriodRecordsInCloud,
  fetchSettingFromCloud,
  saveSettingToCloud
} from './supabaseClient';

const LS_DATA_KEY = 'mg_kpi_central_data_v4';
const LS_THRESHOLDS_KEY = 'mg_kpi_thresholds_v3';
const LS_AUTH_KEY = 'mg_kpi_user_auth_v1';
const LS_STORES_KEY = 'mg_kpi_stores_assignment_v2';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem(LS_AUTH_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [activeModule, setActiveModule] = useState('operational'); // 'operational' | 'reviews'
  const mainContentRef = useRef(null);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem(LS_AUTH_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(LS_AUTH_KEY);
  };

  useGSAP(
    () => {
      if (mainContentRef.current) {
        gsap.fromTo(
          mainContentRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out' }
        );
      }
    },
    { dependencies: [activeModule, currentUser] }
  );

  // Datasets loaded from preloaded JSON or LocalStorage
  const [datasets, setDatasets] = useState(() => {
    const saved = localStorage.getItem(LS_DATA_KEY);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {}
    }
    return preloadedData;
  });

  // Selected periods for operational module (supports multi-selection for comparisons)
  const availablePeriods = Object.keys(datasets);
  const [selectedPeriods, setSelectedPeriods] = useState(() => {
    return availablePeriods.length > 0 ? [availablePeriods[availablePeriods.length - 1]] : ['5 al 12 de octubre'];
  });

  // Backward compatibility: first selected period or empty
  const selectedPeriod = selectedPeriods[0] || '';

  // Semaphore thresholds
  const [thresholds, setThresholds] = useState(() => {
    const saved = localStorage.getItem(LS_THRESHOLDS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_THRESHOLDS;
  });

  // Stores assignment state with LocalStorage persistence
  const [stores, setStores] = useState(() => {
    const saved = localStorage.getItem(LS_STORES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_STORES;
  });

  const handleReassignStore = (storeName, newSupId) => {
    if (currentUser?.role === 'guest') return;
    setStores((prevStores) => {
      const lowerName = storeName.toLowerCase().trim();
      const exists = prevStores.some((s) => s.name.toLowerCase().trim() === lowerName);
      let updated;
      if (exists) {
        updated = prevStores.map((s) =>
          s.name.toLowerCase().trim() === lowerName ? { ...s, sup: newSupId } : s
        );
      } else {
        updated = [...prevStores, { id: `t_${lowerName.replace(/\s+/g, '_')}`, name: storeName, sup: newSupId }];
      }
      localStorage.setItem(LS_STORES_KEY, JSON.stringify(updated));
      if (isSupabaseConfigured) {
        saveSettingToCloud('stores', updated);
      }
      return updated;
    });
  };

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isThresholdsOpen, setIsThresholdsOpen] = useState(false);

  // Cloud sync state
  const [syncStatus, setSyncStatus] = useState(isSupabaseConfigured ? 'idle' : 'offline');
  const [syncMessage, setSyncMessage] = useState(
    isSupabaseConfigured ? 'Listo para sincronizar' : 'Modo local (Sin Supabase configurado)'
  );
  const [cloudSyncAlert, setCloudSyncAlert] = useState(null);

  // Sync function that pulls the latest data from Supabase
  const syncFromCloud = async () => {
    if (!isSupabaseConfigured) {
      setSyncStatus('offline');
      setSyncMessage('Modo local (Sin Supabase configurado)');
      return;
    }
    setSyncStatus('syncing');
    setSyncMessage('Sincronizando con base central...');

    try {
      const cloudPeriods = await fetchPeriodsFromCloud();
      if (cloudPeriods !== null) {
        setSyncStatus('synced');
        setSyncMessage('Sincronizado con la base central');

        // Merge cloud periods over datasets and cache in localStorage
        setDatasets((prev) => {
          const merged = { ...prev, ...cloudPeriods };
          try {
            localStorage.setItem(LS_DATA_KEY, JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      } else {
        setSyncStatus('error');
        setSyncMessage('Error de conexión a la nube (usando datos locales)');
      }

      // Sync settings: thresholds & stores
      const cloudThresholds = await fetchSettingFromCloud('thresholds');
      if (cloudThresholds) {
        setThresholds(cloudThresholds);
        localStorage.setItem(LS_THRESHOLDS_KEY, JSON.stringify(cloudThresholds));
      }

      const cloudStores = await fetchSettingFromCloud('stores');
      if (cloudStores && Array.isArray(cloudStores) && cloudStores.length > 0) {
        setStores(cloudStores);
        localStorage.setItem(LS_STORES_KEY, JSON.stringify(cloudStores));
      }
    } catch (err) {
      console.warn('[Sync] Sync failed:', err);
      setSyncStatus('error');
      setSyncMessage('Error al sincronizar con la nube');
    }
  };

  // Run initial sync on app mount
  useEffect(() => {
    syncFromCloud();
  }, []);

  // Update selectedPeriods if availablePeriods change or selections become invalid
  useEffect(() => {
    if (availablePeriods.length === 0) {
      if (selectedPeriods.length > 0) setSelectedPeriods([]);
      return;
    }
    const valid = selectedPeriods.filter((p) => availablePeriods.includes(p));
    if (valid.length === 0) {
      setSelectedPeriods([availablePeriods[availablePeriods.length - 1]]);
    } else if (valid.length !== selectedPeriods.length) {
      setSelectedPeriods(valid);
    }
  }, [datasets, availablePeriods]);

  const handleImportSuccess = async (newParsedData) => {
    if (currentUser?.role === 'guest') return;
    const merged = { ...datasets, ...newParsedData };
    setDatasets(merged);
    localStorage.setItem(LS_DATA_KEY, JSON.stringify(merged));
    
    // Select the first new sheet
    const newKeys = Object.keys(newParsedData);
    if (newKeys.length > 0) {
      setSelectedPeriods([newKeys[newKeys.length - 1]]);
    }

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    // Synchronize to cloud database
    if (isSupabaseConfigured) {
      setSyncStatus('syncing');
      setSyncMessage('Subiendo nuevo período a la nube...');
      const ok = await savePeriodsToCloud(newParsedData, currentUser?.email || 'alexandraramirez@migusto.com.ar');
      if (ok) {
        setSyncStatus('synced');
        setSyncMessage('Período guardado y sincronizado en la nube');
      } else {
        setSyncStatus('error');
        setSyncMessage('Guardado en este equipo (error al subir a la nube)');
        setCloudSyncAlert({
          title: 'Guardado solo en esta computadora',
          message:
            'El Excel se cargó correctamente en este navegador, pero NO se pudo conectar a la base de datos central de Supabase. Por eso los demás usuarios y computadoras no podrán ver este período hasta que la base de datos en la nube esté activa.'
        });
      }
    } else {
      setCloudSyncAlert({
        title: 'Modo Local (Sin base de datos configurada)',
        message:
          'El archivo se guardó solo en esta computadora porque no hay una base de datos central configurada en .env. Para que todos los usuarios lo vean, se debe conectar Supabase.'
      });
    }
  };

  const handleSaveThresholds = async (newThresholds) => {
    if (currentUser?.role === 'guest') return;
    setThresholds(newThresholds);
    localStorage.setItem(LS_THRESHOLDS_KEY, JSON.stringify(newThresholds));
    if (isSupabaseConfigured) {
      await saveSettingToCloud('thresholds', newThresholds);
    }
  };

  // Delete an entire period/week dataset
  const handleDeletePeriod = async (periodToDelete) => {
    if (currentUser?.role === 'guest') return;
    const next = { ...datasets };
    delete next[periodToDelete];
    setDatasets(next);
    localStorage.setItem(LS_DATA_KEY, JSON.stringify(next));

    const remaining = Object.keys(next);
    if (remaining.length > 0) {
      setSelectedPeriods((prev) => {
        const filtered = prev.filter((p) => p !== periodToDelete);
        return filtered.length > 0 ? filtered : [remaining[remaining.length - 1]];
      });
    } else {
      setSelectedPeriods([]);
    }

    if (isSupabaseConfigured) {
      await deletePeriodFromCloud(periodToDelete);
    }
  };

  // Delete multiple periods/weeks
  const handleDeletePeriods = async (periodsToDelete) => {
    if (currentUser?.role === 'guest') return;
    if (!periodsToDelete || periodsToDelete.length === 0) return;
    const next = { ...datasets };
    const toDeleteSet = new Set(periodsToDelete);
    periodsToDelete.forEach((p) => {
      delete next[p];
    });
    setDatasets(next);
    localStorage.setItem(LS_DATA_KEY, JSON.stringify(next));

    const remaining = Object.keys(next);
    if (remaining.length > 0) {
      setSelectedPeriods((prev) => {
        const filtered = prev.filter((p) => !toDeleteSet.has(p));
        return filtered.length > 0 ? filtered : [remaining[remaining.length - 1]];
      });
    } else {
      setSelectedPeriods([]);
    }

    if (isSupabaseConfigured) {
      await deletePeriodsFromCloud(periodsToDelete);
    }
  };

  // Delete a specific store record inside the active period
  const handleDeleteRecord = async (period, recordIndex) => {
    if (currentUser?.role === 'guest') return;
    if (!datasets[period] || !datasets[period].records) return;
    const currentRecords = [...datasets[period].records];
    currentRecords.splice(recordIndex, 1);

    const next = {
      ...datasets,
      [period]: {
        ...datasets[period],
        records: currentRecords
      }
    };
    setDatasets(next);
    localStorage.setItem(LS_DATA_KEY, JSON.stringify(next));

    if (isSupabaseConfigured) {
      await updatePeriodRecordsInCloud(period, currentRecords);
    }
  };

  // Delete multiple store records inside the active period
  const handleDeleteRecords = async (period, recordIndexes) => {
    if (currentUser?.role === 'guest') return;
    if (!datasets[period] || !datasets[period].records || !recordIndexes || recordIndexes.length === 0) return;
    const indexSet = new Set(recordIndexes);
    const currentRecords = datasets[period].records.filter((_, idx) => !indexSet.has(idx));

    const next = {
      ...datasets,
      [period]: {
        ...datasets[period],
        records: currentRecords
      }
    };
    setDatasets(next);
    localStorage.setItem(LS_DATA_KEY, JSON.stringify(next));

    if (isSupabaseConfigured) {
      await updatePeriodRecordsInCloud(period, currentRecords);
    }
  };

  // If user is not logged in, show elegant LoginScreen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenThresholds={() => setIsThresholdsOpen(true)}
          periodCount={availablePeriods.length}
          currentUser={currentUser}
          onLogout={handleLogout}
          syncStatus={syncStatus}
          syncMessage={syncMessage}
          onTriggerSync={syncFromCloud}
        />

        <main ref={mainContentRef} className="w-full px-4 sm:px-8 py-2">
          {activeModule === 'operational' ? (
            <OperationalDashboard
              datasets={datasets}
              periodData={datasets[selectedPeriod]}
              selectedPeriod={selectedPeriod}
              selectedPeriods={selectedPeriods}
              onPeriodsChange={setSelectedPeriods}
              onPeriodChange={(val) => {
                if (Array.isArray(val)) {
                  setSelectedPeriods(val);
                } else {
                  setSelectedPeriods(val ? [val] : []);
                }
              }}
              onDeletePeriod={handleDeletePeriod}
              onDeletePeriods={handleDeletePeriods}
              onDeleteRecord={handleDeleteRecord}
              onDeleteRecords={handleDeleteRecords}
              availablePeriods={availablePeriods}
              supervisors={INITIAL_SUPERVISORS}
              stores={stores}
              onReassignStore={handleReassignStore}
              thresholds={thresholds}
              currentUser={currentUser}
              onOpenImport={() => setIsImportOpen(true)}
            />
          ) : (
            <ReviewsDashboard
              supervisors={INITIAL_SUPERVISORS}
              stores={stores}
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {/* Subtle & clean footer */}
      <footer className="w-full mt-12 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-sm py-5 px-4 text-center">
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          &copy; Desarrollado por el Departamento de Sistemas de Mi Gusto | Todos los derechos reservados.
        </p>
      </footer>

      {/* Modals */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <ThresholdsModal
        isOpen={isThresholdsOpen}
        onClose={() => setIsThresholdsOpen(false)}
        thresholds={thresholds}
        onSaveThresholds={handleSaveThresholds}
      />

      {/* Cloud Sync Warning Modal */}
      <ModalWrapper
        isOpen={Boolean(cloudSyncAlert)}
        onClose={() => setCloudSyncAlert(null)}
        className="max-w-md w-full p-6 bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-amber-500/20 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <CloudOff className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white tracking-tight">
              {cloudSyncAlert?.title}
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {cloudSyncAlert?.message}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <span className="font-semibold text-amber-300">¿Por qué sucede?</span> El sistema guardó los datos en este navegador para que no pierdas tu trabajo, pero la base de datos central de Supabase en <code className="text-slate-300">.env</code> no está activa. Al reactivarla y re-compilar, se sincronizará automáticamente para todas las sucursales y usuarios.
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setCloudSyncAlert(null)}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all shadow-md cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </ModalWrapper>
    </div>
  );
}
