import React, { useState } from 'react';
import LedgerProcessor from './features/ledger-processor/LedgerProcessor';
import PayrollProcessor from './features/payroll-processor/PayrollProcessor';

function App() {
  const [activeFeature, setActiveFeature] = useState<'ledger' | 'payroll'>('ledger');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Ledger Data Processor Pro
          </h1>
          <p className="text-gray-600">
            Transform complex financial data into structured, analysis-ready formats
          </p>
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
        </div>

        {/* Active Feature Component */}
        {activeFeature === 'ledger' ? <LedgerProcessor /> : <PayrollProcessor />}
      </div>
    </div>
  );
}

export default App;

