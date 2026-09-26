import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
import { Zap } from 'lucide-react';

export const AdminSkillsPage = () => {
  return (
    <ModulePlaceholder
      title="Emergency Skills Taxonomy"
      description="Manage the master ontology of disaster skills, emergency qualifications, required certifications, and verification criteria."
      phaseNumber="Phase 4 (Profile + Skills)"
      category="Taxonomy Administration"
      icon={<Zap size={22} />}
    />
  );
};

export default AdminSkillsPage;
