import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
import { AlertTriangle } from 'lucide-react';

export const ReportEmergencyPage = () => {
  return (
    <ModulePlaceholder
      title="Report Emergency"
      description="Field submission intake for reporting new hazards, localized flash floods, structural collapses, or severe casualties to Incident Command."
      phaseNumber="Phase 5 (Emergency Management)"
      category="Incident Intake"
      icon={<AlertTriangle size={22} color="var(--color-critical)" />}
    />
  );
};

export default ReportEmergencyPage;
