import React from 'react';
import ModulePlaceholder from '../../components/common/ModulePlaceholder';
import { HeartHandshake } from 'lucide-react';

export const ContributionsPage = () => {
  return (
    <ModulePlaceholder
      title="My Contributions"
      description="Summary of your lifetime response hours, deployed missions, community defense drills attended, and impact milestones."
      phaseNumber="Phase 9 (Community Activities)"
      category="Volunteer Record"
      icon={<HeartHandshake size={22} />}
    />
  );
};

export default ContributionsPage;
