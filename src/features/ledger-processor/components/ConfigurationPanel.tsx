import React from 'react';
import { LedgerConfig } from '../LedgerProcessor';

interface ConfigurationPanelProps {
  config: LedgerConfig;
  onConfigChange: (config: LedgerConfig) => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config,
  onConfigChange,
}) => {
  const handleHeaderGroupChange = (value: number) => {
    onConfigChange({ ...config, headerGroupNameIndex: value });
  };

  const handleCostCentreChange = (value: number) => {
    onConfigChange({ ...config, costCentreIndex: value });
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold text-gray-800">Configuration</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Header Group Name Column Index
          </label>
          <input
            type="number"
            min="0"
            value={config.headerGroupNameIndex}
            onChange={(e) => handleHeaderGroupChange(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Zero-based index (A=0, B=1, C=2...)
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cost Centre Column Index
          </label>
          <input
            type="number"
            min="0"
            value={config.costCentreIndex}
            onChange={(e) => handleCostCentreChange(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Zero-based index (A=0, B=1, C=2...)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPanel;

