// client/src/components/admin/SubmissionsAudit.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, ChevronDown, ChevronUp, Filter, Calendar, XCircle } from 'lucide-react';

export default function SubmissionsAudit() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null); // Tracks which row's JSON data is visible
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const fetchAllSubmissions = async () => {
      try {
        const res = await fetch('/api/submissions/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setSubmissions(data.data.submissions);
      } catch (err) {
        console.error('Failed to fetch audit data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllSubmissions();
  }, [token]);

  const toggleRow = (id) => {
    if (expandedRow === id) setExpandedRow(null);
    else setExpandedRow(id);
  };

  // Apply Filters Logic
  const filteredSubmissions = submissions.filter(sub => {
    // 1. Check Category
    const matchesCategory = filterCategory === 'ALL' || sub.formType === filterCategory;

    // 2. Check Date
    let matchesDate = true;
    if (filterDate) {
      // Convert the database UTC timestamp to a local YYYY-MM-DD string to match the HTML date input
      const dateObj = new Date(sub.submittedAt);
      const localYear = dateObj.getFullYear();
      const localMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
      const localDay = String(dateObj.getDate()).padStart(2, '0');
      const formattedLocalDate = `${localYear}-${localMonth}-${localDay}`;
      
      matchesDate = formattedLocalDate === filterDate;
    }

    return matchesCategory && matchesDate;
  });

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Submissions History</h2>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
            <Filter className="w-3 h-3 mr-1" /> Category Filter
          </label>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="ALL">All Submissions</option>
            <option value="MARKETING">Marketing Only</option>
            <option value="COMMUNITY">Community Only</option>
          </select>
        </div>

        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
            <Calendar className="w-3 h-3 mr-1" /> Date Filter
          </label>
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Clear Filters Button */}
        {(filterCategory !== 'ALL' || filterDate !== '') && (
          <button 
            onClick={() => { setFilterCategory('ALL'); setFilterDate(''); }}
            className="flex items-center px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors w-full sm:w-auto justify-center"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading audit logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-4 font-medium">Date & Time</th>
                  <th className="p-4 font-medium">Associate Name (ID)</th>
                  <th className="p-4 font-medium">Form Category</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {/* Notice we map over filteredSubmissions instead of submissions */}
                {filteredSubmissions.map((sub) => (
                  <React.Fragment key={sub.id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-700 whitespace-nowrap">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </td>
                      <td className="p-4 font-medium text-slate-900">
                        {sub.associate.name} <span className="text-slate-500 font-normal">({sub.associate.employeeId})</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${sub.formType === 'MARKETING' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {sub.formType}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => toggleRow(sub.id)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors text-xs font-semibold"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Data</span>
                          {expandedRow === sub.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                    
                    {expandedRow === sub.id && (
                      <tr className="bg-slate-50">
                        <td colSpan="4" className="p-6 border-b border-slate-200">
                          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-inner">
                            <h4 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Submitted Field Data</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {Object.entries(sub.submissionData).map(([question, answer]) => (
                                <div key={question}>
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{question}</p>
                                  <p className="text-sm text-slate-900 font-medium">
                                    {Array.isArray(answer) ? answer.join(', ') : (answer || 'N/A')}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filteredSubmissions.length === 0 && (
                  <tr><td colSpan="4" className="p-8 text-center text-slate-500">No matching submissions found based on your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
