import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
import { Settings } from 'lucide-react';

export const AdminSettingsPage = () => {
  return (
    <ModulePlaceholder
      title="Incident Command Settings"
      description="Regional emergency broadcast channels, automated dispatch thresholds, SLA escalation triggers, and API integration settings."
      phaseNumber="Phase 5+"
      category="Configuration"
      icon={<Settings size={22} />}
    />
  );
};

export default AdminSettingsPage;
