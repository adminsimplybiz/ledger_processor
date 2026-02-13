import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { COMPANIES, type CompanyId } from './companyConfigs';
import { parsePayrollExcel } from './payslipLogic';
import type { PayslipData } from './types';
import { PayslipTemplate } from './templates';
import FileUpload from '../ledger-processor/components/FileUpload';
import SheetNameInput from '../payroll-processor/components/SheetNameInput';

// Month options for payslip generation
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Get previous month as default
const getPreviousMonth = () => {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return MONTHS[prevMonth.getMonth()];
};

export default function PayslipGenerator() {
  const [companyId, setCompanyId] = useState<CompanyId>('sunstripe');
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [showSheetInput, setShowSheetInput] = useState(false);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [monthLabel, setMonthLabel] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(getPreviousMonth());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPdfBlob = async (data: PayslipData): Promise<{ blob: Blob; filename: string }> => {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    div.style.top = '0';
    div.style.width = '800px';
    div.style.background = 'white';
    document.body.appendChild(div);
    const root = createRoot(div);
    flushSync(() => {
      root.render(
        <PayslipTemplate companyId={companyId} data={data} />
      );
    });
    const imgs = div.querySelectorAll('img');
    await Promise.all(
      Array.from(imgs).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve();
            else img.onload = () => resolve();
          })
      )
    );
    await new Promise((r) => setTimeout(r, 50));
    const canvas = await html2canvas(div, { scale: 2, useCORS: true });
    document.body.removeChild(div);
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, 'PNG', 0, 0, w, h);
    const safeName = `${data.empId}_${data.employeeName.replace(/\s+/g, '_')}_${monthLabel.replace(/\s+/g, '_')}`.replace(/[^a-zA-Z0-9_-]/g, '');
    const blob = pdf.output('blob');
    return { blob, filename: `${safeName}.pdf` };
  };

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setPayslips([]);
    setError(null);
    try {
      const XLSX = await import('xlsx');
      const buf = await selectedFile.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
      const sheets = wb.SheetNames;
      setSheetNames(sheets);
      setShowSheetInput(sheets.length > 1);
      const config = COMPANIES.find((c) => c.id === companyId);
      const defaultSheet = config?.defaultSheetName && sheets.includes(config.defaultSheetName)
        ? config.defaultSheetName
        : sheets[0] || '';
      setSelectedSheet(defaultSheet);
    } catch {
      setSheetNames([]);
      setShowSheetInput(false);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      alert('Please upload a file first');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const sheet = showSheetInput ? selectedSheet : undefined;
      const result = await parsePayrollExcel(file, companyId, sheet);
      const year = new Date().getFullYear();
      const monthYearLabel = `${selectedMonth} ${year}`;
      // Override monthLabel with selected month + year (e.g. "January 2026")
      const processedData = result.data.map(emp => ({
        ...emp,
        monthLabel: monthYearLabel
      }));
      setPayslips(processedData);
      setMonthLabel(monthYearLabel);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process');
      setPayslips([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const openPreview = (data: PayslipData) => {
    const div = document.createElement('div');
    div.style.width = '800px';
    const root = createRoot(div);
    flushSync(() => {
      root.render(
        <PayslipTemplate companyId={companyId} data={data} />
      );
    });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0">${div.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadPdf = async (data: PayslipData) => {
    const { blob, filename } = await getPdfBlob(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllPdfs = async () => {
    if (payslips.length === 0) return;
    setIsDownloadingAll(true);
    try {
      for (let i = 0; i < payslips.length; i++) {
        await downloadPdf(payslips[i]);
        if (i < payslips.length - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const downloadAsZip = async () => {
    if (payslips.length === 0) return;
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      const safeMonth = monthLabel.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      for (const data of payslips) {
        const { blob, filename } = await getPdfBlob(data);
        zip.file(filename, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslips_${safeMonth}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payslip Generator</h2>
          <p className="text-gray-600">Generate individual payslips from payroll Excel files</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value as CompanyId);
                setPayslips([]);
                setFile(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {COMPANIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Payslip Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPayslips([]);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        <FileUpload
          onFileChange={handleFileChange}
          selectedFile={file}
          label={`Upload ${COMPANIES.find((c) => c.id === companyId)?.label} Payroll`}
        />

        {showSheetInput && (
          <SheetNameInput
            sheetName={selectedSheet}
            onSheetNameChange={setSelectedSheet}
            availableSheets={sheetNames}
          />
        )}

        <div className="flex justify-center">
          <button
            onClick={handleProcess}
            disabled={!file || isProcessing}
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {isProcessing ? 'Processing...' : 'Process & Load Payslips'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {payslips.length > 0 && (
          <div className="border-t pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h3 className="font-semibold text-gray-800">
                {payslips.length} employee(s) — Preview or Download PDF
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadAllPdfs}
                  disabled={isDownloadingAll || isDownloadingZip}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow"
                >
                  {isDownloadingAll ? 'Downloading...' : 'Download All PDFs'}
                </button>
                <button
                  onClick={downloadAsZip}
                  disabled={isDownloadingAll || isDownloadingZip}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow"
                >
                  {isDownloadingZip ? 'Creating ZIP...' : 'Download as ZIP'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-4 py-2 text-left">Employee</th>
                    <th className="border px-4 py-2 text-left">Emp ID</th>
                    <th className="border px-4 py-2 text-right">Net Pay</th>
                    <th className="border px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{p.employeeName}</td>
                      <td className="border px-4 py-2">{p.empId}</td>
                      <td className="border px-4 py-2 text-right">{p.netPay.toLocaleString('en-IN')}</td>
                      <td className="border px-4 py-2">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openPreview(p)}
                            className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => downloadPdf(p)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
