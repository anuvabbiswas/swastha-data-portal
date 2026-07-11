import React, { useState } from 'react';
import AssociateLayout from '../components/layout/AssociateLayout';
import NewSubmission from '../components/associate/NewSubmission';
import SubmissionHistory from '../components/associate/SubmissionHistory';

export default function AssociateDashboard() {
  const [activeTab, setActiveTab] = useState('new');

  return (
    <AssociateLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'new' && <NewSubmission />}
      {activeTab === 'history' && <SubmissionHistory />}
    </AssociateLayout>
  );
}