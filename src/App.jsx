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
import { INITIAL_SUPERVISORS, INITIAL_STORES, INITIAL_THRESHOLDS } from './config';
import preloadedData from './preloadedData.json';

const LS_DATA_KEY = 'mg_kpi_central_data_v4';
const LS_THRESHOLDS_KEY = 'mg_kpi_thresholds_v3';
const LS_AUTH_KEY = 'mg_kpi_user_auth_v1';

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
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) return parsed;
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
  const LS_STORES_KEY = 'mg_kpi_stores_assignment_v2';
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
      return updated;
    });
  };

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isThresholdsOpen, setIsThresholdsOpen] = useState(false);

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

  const handleImportSuccess = (newParsedData) => {
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
  };

  const handleSaveThresholds = (newThresholds) => {
    if (currentUser?.role === 'guest') return;
    setThresholds(newThresholds);
    localStorage.setItem(LS_THRESHOLDS_KEY, JSON.stringify(newThresholds));
  };

  // Delete an entire period/week dataset
  const handleDeletePeriod = (periodToDelete) => {
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
  };

  // Delete a specific store record inside the active period
  const handleDeleteRecord = (period, recordIndex) => {
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
  };

  // Delete multiple store records inside the active period
  const handleDeleteRecords = (period, recordIndexes) => {
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
              onDeleteRecord={handleDeleteRecord}
              onDeleteRecords={handleDeleteRecords}
              availablePeriods={availablePeriods}
              supervisors={INITIAL_SUPERVISORS}
              stores={stores}
              onReassignStore={handleReassignStore}
              thresholds={thresholds}
              currentUser={currentUser}
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
    </div>
  );
}
