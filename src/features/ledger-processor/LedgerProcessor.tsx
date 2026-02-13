import React, { useState } from 'react';
import { processLedgerFile } from './ledgerLogic';
import FileUpload from './components/FileUpload';
import ConfigurationPanel from './components/ConfigurationPanel';
import StatusDisplay from './components/StatusDisplay';
import DownloadButton from './components/DownloadButton';

export interface LedgerConfig {
  headerGroupNameIndex: number;
  costCentreIndex: number;
}

export interface ProcessedData {
  data: any[];
  success: boolean;
  message: string;
}

const LedgerProcessor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<LedgerConfig>({
    headerGroupNameIndex: 1,
    costCentreIndex: 1,
  });
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setProcessedData(null);
  };

  const handleConfigChange = (newConfig: LedgerConfig) => {
    setConfig(newConfig);
    setProcessedData(null);
  };

  const handleProcess = async () => {
    if (!file) {
      alert('Please upload a file first');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processLedgerFile(file, config);
      setProcessedData(result);
    } catch (error) {
      setProcessedData({
        data: [],
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred during processing',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!processedData || !processedData.success) {
      alert('No processed data available to download');
      return;
    }

    const ExcelJS = await import('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Structured Ledger');
    const rows = processedData.data as Record<string, unknown>[];
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      ws.addRow(headers);
      rows.forEach((row) => ws.addRow(headers.map((h) => row[h] ?? '')));
    }
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'structured_ledger_output.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <FileUpload onFileChange={handleFileChange} selectedFile={file} />
        
        <ConfigurationPanel
          config={config}
          onConfigChange={handleConfigChange}
        />

        <div className="flex justify-center">
          <button
            onClick={handleProcess}
            disabled={!file || isProcessing}
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {isProcessing ? 'Processing...' : 'Run Transformation'}
          </button>
        </div>

        <StatusDisplay processedData={processedData} isProcessing={isProcessing} />

        {processedData?.success && (
          <DownloadButton onDownload={handleDownload} />
        )}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">🔒 Data Privacy Guarantee</h3>
        <p className="text-sm text-blue-800">
          Your data is 100% secure. All processing happens entirely in your browser. 
          No data is transmitted, stored, or logged on any server.
        </p>
      </div>
    </div>
  );
};

export default LedgerProcessor;

