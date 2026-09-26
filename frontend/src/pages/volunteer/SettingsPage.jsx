import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
import { Settings } from 'lucide-react';

export const SettingsPage = () => {
  return (
    <ModulePlaceholder
      title="Volunteer Settings"
      description="Notification alert preferences, field dispatch availability radius, offline cache sync settings, and security controls."
      phaseNumber="Phase 4+"
      category="Preferences"
      icon={<Settings size={22} />}
    />
  );
};

export default SettingsPage;
