import React from 'react';
import type { CompanyId } from '../companyConfigs';
import type { PayslipData } from '../types';
import { SunstripePayslip } from './SunstripePayslip';
import { ValueStreamPayslip } from './ValueStreamPayslip';
import { ViraPayslip } from './ViraPayslip';

interface Props {
  companyId: CompanyId;
  data: PayslipData;
}

export const PayslipTemplate: React.FC<Props> = ({ companyId, data }) => {
  switch (companyId) {
    case 'sunstripe':
      return <SunstripePayslip data={data} />;
    case 'valuestream':
      return <ValueStreamPayslip data={data} />;
    case 'vira':
      return <ViraPayslip data={data} />;
    default:
      return null;
  }
};
