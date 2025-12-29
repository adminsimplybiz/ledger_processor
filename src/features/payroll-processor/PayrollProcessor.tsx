import React, { useState } from 'react';
import { processPayrollFile, ProcessedPayrollData } from './payrollLogic';
import FileUpload from '../ledger-processor/components/FileUpload';
import SheetNameInput from './components/SheetNameInput';
import StatusDisplay from '../ledger-processor/components/StatusDisplay';

const PayrollProcessor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [showSheetInput, setShowSheetInput] = useState<boolean>(false);
  const [processedData, setProcessedData] = useState<ProcessedPayrollData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setProcessedData(null);
    
    // Check how many sheets the file has
    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheets = workbook.SheetNames;
          
          setSheetNames(sheets);
          
          if (sheets.length > 1) {
            // Multiple sheets - show input and default to first sheet
            setShowSheetInput(true);
            setSelectedSheetName(sheets[0]);
          } else {
            // Single sheet - hide input and use it automatically
            setShowSheetInput(false);
            setSelectedSheetName(sheets[0] || '');
          }
        } catch (error) {
          console.error('Error reading file:', error);
          setShowSheetInput(false);
          setSelectedSheetName('');
        }
      };
      
      reader.onerror = () => {
        setShowSheetInput(false);
        setSelectedSheetName('');
      };
      
      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      console.error('Error loading xlsx library:', error);
      setShowSheetInput(false);
      setSelectedSheetName('');
    }
  };

  const handleSheetNameChange = (newSheetName: string) => {
    setSelectedSheetName(newSheetName);
    setProcessedData(null);
  };

  const handleProcess = async () => {
    if (!file) {
      alert('Please upload a file first');
      return;
    }

    setIsProcessing(true);
    try {
      // Use selected sheet name if multiple sheets, otherwise undefined (will use first sheet)
      const sheetName = showSheetInput ? selectedSheetName : undefined;
      const result = await processPayrollFile(file, sheetName);
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

    // Lazy load ExcelJS library for styling support
    const ExcelJS = await import('exceljs');
    
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    if (processedData.data.length === 0) {
      alert('No data to download');
      return;
    }

    // Get column headers from first row
    const headers = Object.keys(processedData.data[0]);
    
    // Add header row with bold formatting
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
    });

    // Add data rows
    processedData.data.forEach((row, rowIndex) => {
      const values = headers.map(header => row[header]);
      const dataRow = worksheet.addRow(values);
      
      // Check if this is the Grand Total row
      const isGrandTotal = row['Row Labels'] === 'Grand Total';
      
      if (isGrandTotal) {
        // Make Grand Total row bold
        dataRow.font = { bold: true };
        dataRow.eachCell((cell) => {
          cell.font = { bold: true };
        });
      } else {
        // Make Row Labels column bold for all data rows
        const rowLabelsIndex = headers.indexOf('Row Labels');
        if (rowLabelsIndex >= 0) {
          const rowLabelCell = dataRow.getCell(rowLabelsIndex + 1); // ExcelJS uses 1-based indexing
          rowLabelCell.font = { bold: true };
        }
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      if (column.header) {
        column.width = Math.max(column.width || 0, 15);
      }
    });

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payroll_summary_output.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <FileUpload onFileChange={handleFileChange} selectedFile={file} label="Upload Payroll File" />
        
        {showSheetInput && (
          <SheetNameInput
            sheetName={selectedSheetName}
            onSheetNameChange={handleSheetNameChange}
            availableSheets={sheetNames}
          />
        )}

        <div className="flex justify-center">
          <button
            onClick={handleProcess}
            disabled={!file || isProcessing}
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {isProcessing ? 'Processing...' : 'Process Payroll'}
          </button>
        </div>

        <StatusDisplay 
          processedData={processedData ? {
            data: processedData.data,
            success: processedData.success,
            message: processedData.message
          } : null} 
          isProcessing={isProcessing} 
        />

        {processedData?.success && (
          <div className="flex justify-center">
            <button
              onClick={handleDownload}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
            >
              Download Payroll Summary
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📊 Processing Details</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Groups data by Cost Centre</li>
          <li>Calculates sums for all financial columns</li>
          <li>Outputs exactly 28 columns in standardized format</li>
          <li>Handles missing columns (defaults to 0)</li>
          <li>Cleans numeric values (removes commas, handles strings)</li>
        </ul>
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">🔒 Data Privacy Guarantee</h3>
        <p className="text-sm text-blue-800">
          Your data is 100% secure. All processing happens entirely in your browser. 
          No data is transmitted, stored, or logged on any server.
        </p>
      </div>
    </div>
  );
};

export default PayrollProcessor;

