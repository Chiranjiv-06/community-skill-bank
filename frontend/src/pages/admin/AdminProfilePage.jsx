import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
import { UserCheck } from 'lucide-react';

export const AdminProfilePage = () => {
  return (
    <ModulePlaceholder
      title="Admin Commander Profile"
      description="Administrative clearance level, emergency jurisdiction assignment, command logs, and emergency contact delegations."
      phaseNumber="Phase 4+"
      category="Personnel"
      icon={<UserCheck size={22} />}
    />
  );
};

export default AdminProfilePage;
