import React, { useState } from 'react';
import LedgerProcessor from './features/ledger-processor/LedgerProcessor';
import PayrollProcessor from './features/payroll-processor/PayrollProcessor';
import PayslipGenerator from './features/payslip-generator/PayslipGenerator';

function App() {
  const [activeFeature, setActiveFeature] = useState<'ledger' | 'payroll' | 'payslip'>('ledger');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <img
              src="/finance-workbench-logo.png"
              alt="Finance Workbench - A product of SimplyBiz"
              className="max-w-full h-auto block"
              style={{ maxHeight: 100 }}
            />
            <p className="text-gray-600 text-sm">
              Your books, payroll & slips — one spot. No cap.
            </p>
          </div>
        </header>

        {/* Feature Selection Tabs */}
        <div className="mb-6 flex justify-center space-x-4">
          <button
            onClick={() => setActiveFeature('ledger')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              activeFeature === 'ledger'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Ledger Processor
          </button>
          <button
            onClick={() => setActiveFeature('payroll')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              activeFeature === 'payroll'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Payroll Processor
          </button>
          <button
            onClick={() => setActiveFeature('payslip')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              activeFeature === 'payslip'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Payslip Generator
          </button>
        </div>

        {/* Active Feature Component */}
        {activeFeature === 'ledger' && <LedgerProcessor />}
        {activeFeature === 'payroll' && <PayrollProcessor />}
        {activeFeature === 'payslip' && <PayslipGenerator />}
      </div>
    </div>
  );
}

export default App;

