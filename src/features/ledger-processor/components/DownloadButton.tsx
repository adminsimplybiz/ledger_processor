import React from 'react';

interface DownloadButtonProps {
  onDownload: () => void;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ onDownload }) => {
  return (
    <div className="flex justify-center">
      <button
        onClick={onDownload}
        className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
      >
        Download Structured Ledger
      </button>
    </div>
  );
};

export default DownloadButton;

