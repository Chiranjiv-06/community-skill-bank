import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
import { Users2 } from 'lucide-react';

export const VolunteerDirectoryPage = () => {
  return (
    <ModulePlaceholder
      title="Volunteer Directory"
      description="Central searchable roster of registered community volunteers, verified skill tiers, active status, and deployment history."
      phaseNumber="Phase 4 (Profile + Skills)"
      category="Volunteer Management"
      icon={<Users2 size={22} />}
    />
  );
};

export default VolunteerDirectoryPage;
