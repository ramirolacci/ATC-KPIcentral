import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { parseUploadedExcel } from '../utils';
import { ModalWrapper } from './ModalWrapper';

export function ImportModal({ isOpen, onClose, onImportSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      const parsedData = await parseUploadedExcel(file);
      const sheetCount = Object.keys(parsedData).length;

      if (sheetCount === 0) {
        throw new Error('No se detectaron tablas de datos válidas en el archivo seleccionado.');
      }

      let totalRecords = 0;
      Object.values(parsedData).forEach((s) => {
        totalRecords += s.records.length;
      });

      setSuccessInfo({
        fileName: file.name,
        sheets: sheetCount,
        records: totalRecords,
        data: parsedData
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error al procesar el archivo Excel.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (successInfo?.data) {
      onImportSuccess(successInfo.data);
      onClose();
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-lg w-full p-6 space-y-5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-base text-slate-100">Importar Cuadro Madre (Excel)</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm">
          &times;
        </button>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Carga un nuevo archivo Excel periódicamente (.xlsx o .xls). El sistema detectará automáticamente
        las pestañas semanales o mensuales, unificará los nombres de sucursales y actualizará los indicadores de PEYA, Rappi y Mercado Delivery.
      </p>

      {/* Upload box */}
      <div className="relative border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-8 text-center transition-all bg-slate-950/40">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-slate-400" />
          )}
          <div className="text-sm font-semibold text-slate-200">
            {isProcessing ? 'Procesando archivo...' : 'Arrastra o haz clic para subir archivo'}
          </div>
          <div className="text-xs text-slate-500">Formato compatible: .xlsx, .xls</div>
        </div>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Preview */}
      {successInfo && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Archivo analizado con éxito</span>
          </div>
          <div className="text-slate-300 pl-6">
            Archivo: <span className="font-semibold text-slate-100">{successInfo.fileName}</span>
          </div>
          <div className="text-slate-300 pl-6">
            Pestañas detectadas: <span className="font-semibold text-slate-100">{successInfo.sheets}</span> | Registros: <span className="font-semibold text-slate-100">{successInfo.records}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!successInfo || isProcessing}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 ${
            successInfo && !isProcessing
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-emerald-950/40 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          Confirmar e Incorporar al Historial
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </ModalWrapper>
  );
}
