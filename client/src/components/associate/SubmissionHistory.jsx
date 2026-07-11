import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, FileText } from 'lucide-react';

export default function SubmissionHistory() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
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
    };
    fetchHistory();
  }, [token]);

  if (loading) return <div className="text-slate-500 text-center mt-10">Loading history...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">My Submissions</h2>
        <p className="text-slate-500 mt-1">Review the data you have collected.</p>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
          You haven't submitted any forms yet.
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center text-slate-600 text-sm font-medium">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(sub.submittedAt).toLocaleDateString()} at {new Date(sub.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">
                  {sub.formType}
                </span>
              </div>
              
              {/* Dynamically render the JSON answers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(sub.submissionData).map(([question, answer]) => (
                  <div key={question} className="space-y-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase">{question}</p>
                    <p className="text-sm font-medium text-slate-900">
                      {Array.isArray(answer) ? answer.join(', ') : (answer || '—')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}