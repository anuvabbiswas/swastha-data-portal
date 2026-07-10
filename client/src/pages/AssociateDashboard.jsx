import React, { useState } from 'react';
import AssociateLayout from '../components/layout/AssociateLayout';
import NewSubmission from '../components/associate/NewSubmission';

export default function AssociateDashboard() {
  const [activeTab, setActiveTab] = useState('new');

  return (
    <AssociateLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'new' && <NewSubmission />}
      
      {activeTab === 'history' && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">My Submissions</h2>
          <p className="text-slate-500 bg-white p-8 rounded-xl border border-slate-200 text-center">
            Submission History View coming in the next step!
          </p>
        </div>
      )}
    </AssociateLayout>
  );
}