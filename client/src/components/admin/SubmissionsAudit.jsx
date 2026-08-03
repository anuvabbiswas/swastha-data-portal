import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, ChevronDown, ChevronUp, Filter, Calendar, XCircle, Download, Trash2, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function SubmissionsAudit() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // --- NEW: Undo Deletion State ---
  const [pendingDeletion, setPendingDeletion] = useState(null);

  useEffect(() => {
    const fetchAllSubmissions = async () => {
      try {
        const res = await fetch('/api/submissions/all', { headers: { 'Authorization': `Bearer ${token}` } });
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

  // --- NEW: Optimistic Delete Logic ---
  const executeDeletion = async (idToDel) => {
    try {
      await fetch(`/api/submissions/${idToDel}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error("Failed to delete", e);
    }
    setPendingDeletion(null);
  };

  const handleDeleteClick = (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this submission?")) return;

    // If another deletion was waiting, execute it immediately
    if (pendingDeletion) {
      clearTimeout(pendingDeletion.timer);
      executeDeletion(pendingDeletion.id);
    }

    // 1. Save original data in case of Undo
    const originalSub = submissions.find(s => s.id === id);
    
    // 2. Optimistically remove from UI
    setSubmissions(prev => prev.filter(s => s.id !== id));
    if (expandedRow === id) setExpandedRow(null);

    // 3. Start 3-second timer
    const timer = setTimeout(() => {
      executeDeletion(id);
    }, 3000);

    setPendingDeletion({ id, timer, originalSub });
  };

  const handleUndo = () => {
    if (pendingDeletion) {
      clearTimeout(pendingDeletion.timer); // Cancel the API call
      
      // Put the row back into the UI and re-sort by date
      setSubmissions(prev => {
        const restored = [...prev, pendingDeletion.originalSub];
        return restored.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      });
      
      setPendingDeletion(null);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesCategory = filterCategory === 'ALL' || sub.formType === filterCategory;
    let matchesDate = true;
    if (filterDate) {
      const dateObj = new Date(sub.submittedAt);
      const localYear = dateObj.getFullYear();
      const localMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
      const localDay = String(dateObj.getDate()).padStart(2, '0');
      matchesDate = `${localYear}-${localMonth}-${localDay}` === filterDate;
    }
    return matchesCategory && matchesDate;
  });

  const generateExportData = () => {
    const uniqueFields = new Set();
    filteredSubmissions.forEach(sub => Object.keys(sub.submissionData).forEach(key => uniqueFields.add(key)));
    const dynamicHeaders = Array.from(uniqueFields);

    return filteredSubmissions.map(sub => {
      const row = {
        'Submission ID': sub.id,
        'Date & Time': new Date(sub.submittedAt).toLocaleString(),
        'Associate Name': sub.associate.name,
        'Associate ID': sub.associate.employeeId,
        'Form Category': sub.formType,
        'Was Edited?': sub.isEdited ? 'Yes' : 'No',
        'Last Updated': new Date(sub.updatedAt).toLocaleString()
      };
      dynamicHeaders.forEach(header => {
        const answer = sub.submissionData[header];
        row[header] = Array.isArray(answer) ? answer.join(', ') : (answer || 'N/A');
      });
      return row;
    });
  };

  const handleExport = (format) => {
    setShowExportMenu(false);
    if (filteredSubmissions.length === 0) return alert("No data to export.");
    const flatData = generateExportData();
    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
    const fileName = `Swastha_Export_${filterCategory}_${new Date().toISOString().split('T')[0]}`;
    if (format === 'excel') {
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([excelBuffer]), `${fileName}.xlsx`);
    } else if (format === 'csv') {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      saveAs(new Blob([csvOutput]), `${fileName}.csv`);
    }
  };

  return (
    <div className="p-8 relative">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Master Submissions Audit</h2>
          <p className="text-slate-500 mt-1">Review, filter, export, and manage field data.</p>
        </div>
        
        <div className="relative">
          <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors text-sm">
            <Download className="w-4 h-4 mr-2" /> Export Data
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50">
              <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg">Excel (.xlsx)</button>
              <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 rounded-b-lg border-t border-slate-100">CSV (.csv)</button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center"><Filter className="w-3 h-3 mr-1" /> Category</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"><option value="ALL">All Submissions</option><option value="MARKETING">Marketing Only</option><option value="COMMUNITY">Community Only</option></select>
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1" /> Date</label>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm" />
        </div>
        {(filterCategory !== 'ALL' || filterDate !== '') && (
          <button onClick={() => { setFilterCategory('ALL'); setFilterDate(''); }} className="flex items-center px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg w-full sm:w-auto justify-center"><XCircle className="w-4 h-4 mr-2" /> Clear Filters</button>
        )}
      </div>

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
                {filteredSubmissions.map((sub) => (
                  <React.Fragment key={sub.id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-700 whitespace-nowrap">
                        {new Date(sub.submittedAt).toLocaleString()}
                        {sub.isEdited && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Edited</span>}
                      </td>
                      <td className="p-4 font-medium text-slate-900">
                        {sub.associate.name} <span className="text-slate-500 font-normal">({sub.associate.employeeId})</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${sub.formType === 'MARKETING' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {sub.formType}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => toggleRow(sub.id)} className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-xs font-semibold">
                          <Eye className="w-4 h-4" />
                          <span>Data</span>
                        </button>
                        
                        {/* --- NEW: Delete Button --- */}
                        <button onClick={() => handleDeleteClick(sub.id)} className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-red-600 hover:bg-red-50 text-xs font-semibold" title="Delete Submission">
                          <Trash2 className="w-4 h-4" />
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
                  <tr><td colSpan="4" className="p-8 text-center text-slate-500">No matching submissions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- NEW: Optimistic Undo Toast Notification --- */}
      {pendingDeletion && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-4 z-50 animate-in fade-in slide-in-from-bottom-5">
          <span className="text-sm font-medium">Submission queued for deletion.</span>
          <button 
            onClick={handleUndo}
            className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-blue-400 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Undo
          </button>
        </div>
      )}
    </div>
  );
}