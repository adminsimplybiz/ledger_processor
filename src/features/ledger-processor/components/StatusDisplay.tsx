import React from 'react';
import { ProcessedData } from '../LedgerProcessor';

interface StatusDisplayProps {
  processedData: ProcessedData | null;
  isProcessing: boolean;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({
  processedData,
  isProcessing,
}) => {
  if (isProcessing) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Processing your ledger file...</p>
      </div>
    );
  }

  if (!processedData) {
    return null;
  }

  return (
    <div
      className={`border rounded-lg p-4 ${
        processedData.success
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <p
        className={
          processedData.success ? 'text-green-800' : 'text-red-800'
        }
      >
        {processedData.message}
      </p>
    </div>
  );
};

export default StatusDisplay;

