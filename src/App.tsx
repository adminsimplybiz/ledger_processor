import React from 'react';
import LedgerProcessor from './features/ledger-processor/LedgerProcessor';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Ledger Data Processor Pro
          </h1>
          <p className="text-gray-600">
            Transform complex financial ledgers into structured, analysis-ready data
          </p>
        </header>
        <LedgerProcessor />
      </div>
    </div>
  );
}

export default App;

