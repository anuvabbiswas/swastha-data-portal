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
    
    <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-6 py-6">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">My Submissions</h2>
          <p className="text-sm sm:text-base text-slate-500 mt-1">Review and modify the data you have collected.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-center mt-10">Loading history...</div>
      ) : submissions.length === 0 ? (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 text-center flex flex-col items-center mx-auto">
          <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">You haven't submitted any forms yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            
            <div key={sub.id} className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 relative group">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex flex-wrap items-center text-slate-600 text-sm font-medium gap-y-1 gap-x-2">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-brand shrink-0" />
                      {new Date(sub.submittedAt).toLocaleDateString()} at {new Date(sub.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    
                    {sub.isEdited && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold tracking-widest uppercase">
                        Edited
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-3 mt-1 sm:mt-0">
                  <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider truncate max-w-[120px] sm:max-w-none">
                    {sub.formType}
                  </span>
                  
                  <button 
                    onClick={() => setEditingSubmission(sub)}
                    className="flex items-center shrink-0 text-sm font-medium text-brand hover:text-brand-hover transition-colors bg-brand/10 hover:bg-brand/20 px-3 py-1.5 rounded-md"
                  >
                    <Edit3 className="w-4 h-4 mr-1.5" />
                    Edit
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 sm:gap-y-3">
                {Object.entries(sub.submissionData).map(([question, answer]) => (
                  <div key={question} className="space-y-0.5 break-words">
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