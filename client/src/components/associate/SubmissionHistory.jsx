import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Edit3, AlertCircle } from 'lucide-react';
import EditSubmissionModal from './EditSubmissionModal';

export default function SubmissionHistory() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the Edit Modal
  const [editingSubmission, setEditingSubmission] = useState(null);

  // Use useCallback so we can trigger a re-fetch after a successful edit
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/submissions/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSubmissions(data.data.submissions);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Submissions</h2>
          <p className="text-slate-500 mt-1">Review and modify the data you have collected.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-center mt-10">Loading history...</div>
      ) : submissions.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">You haven't submitted any forms yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative group">
              
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center text-slate-600 text-sm font-medium">
                    <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                    {new Date(sub.submittedAt).toLocaleDateString()} at {new Date(sub.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    
                    {/* The Edited Badge requirement */}
                    {sub.isEdited && (
                      <span className="ml-3 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold tracking-widest uppercase">
                        Edited
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">
                    {sub.formType}
                  </span>
                  
                  {/* The Edit Button */}
                  <button 
                    onClick={() => setEditingSubmission(sub)}
                    className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md"
                  >
                    <Edit3 className="w-4 h-4 mr-1.5" />
                    Edit
                  </button>
                </div>
              </div>
              
              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {Object.entries(sub.submissionData).map(([question, answer]) => (
                  <div key={question} className="space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{question}</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {Array.isArray(answer) ? (answer.length > 0 ? answer.join(', ') : '—') : (answer || '—')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Render the Modal if a submission is selected */}
      {editingSubmission && (
        <EditSubmissionModal 
          submission={editingSubmission} 
          onClose={() => setEditingSubmission(null)}
          onRefresh={fetchHistory}
        />
      )}
    </div>
  );
}