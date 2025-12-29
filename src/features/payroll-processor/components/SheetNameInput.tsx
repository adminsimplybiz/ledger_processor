import React from 'react';

interface SheetNameInputProps {
  sheetName: string;
  onSheetNameChange: (sheetName: string) => void;
  availableSheets?: string[];
}

const SheetNameInput: React.FC<SheetNameInputProps> = ({
  sheetName,
  onSheetNameChange,
  availableSheets = [],
}) => {
  return (
    <div className="space-y-2 border-t pt-4">
      <label className="block text-sm font-medium text-gray-700">
        Select Sheet Name
      </label>
      {availableSheets.length > 0 ? (
        <select
          value={sheetName}
          onChange={(e) => onSheetNameChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {availableSheets.map((sheet) => (
            <option key={sheet} value={sheet}>
              {sheet}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={sheetName}
          onChange={(e) => onSheetNameChange(e.target.value)}
          placeholder="First"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      )}
      <p className="text-xs text-gray-500">
        {availableSheets.length > 0
          ? `Select the sheet containing payroll data (${availableSheets.length} sheets found)`
          : "Name of the sheet containing payroll data"}
      </p>
    </div>
  );
};

export default SheetNameInput;

