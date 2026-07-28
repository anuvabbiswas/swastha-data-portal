import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function EditSubmissionModal({ submission, onClose, onRefresh }) {
  const { token } = useAuth();
  
  // 1. Initialize formData with the PREVIOUSLY submitted answers
  const [formData, setFormData] = useState(submission.submissionData);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 2. Handle Input Changes (Identical to NewSubmission.jsx)
  const handleInputChange = (fieldLabel, value) => {
    setFormData(prev => ({ ...prev, [fieldLabel]: value }));
  };

  const handleCheckboxChange = (fieldLabel, option, isChecked) => {
    setFormData(prev => {
      const currentSelections = prev[fieldLabel] || [];
      if (isChecked) {
        return { ...prev, [fieldLabel]: [...currentSelections, option] };
      } else {
        return { ...prev, [fieldLabel]: currentSelections.filter(item => item !== option) };
      }
    });
  };

  // 3. Submit the PATCH request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ submissionData: formData })
      });

      if (res.ok) {
        setSuccess(true);
        // Wait a second so they can see the success message, then close and refresh
        setTimeout(() => {
          onRefresh();
          onClose();
        }, 1200);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update submission.');
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. The Dynamic Renderer (Renders from the schemaSnapshot!)
  const renderInput = (field) => {
    const value = formData[field.fieldLabel];
    const commonClasses = "w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm";

    switch (field.inputType) {
      case 'TEXT': return <input type="text" required={field.isRequired} className={commonClasses} value={value || ''} onChange={(e) => handleInputChange(field.fieldLabel, e.target.value)} />;
      case 'NUMBER': return <input type="number" required={field.isRequired} className={commonClasses} value={value || ''} onChange={(e) => handleInputChange(field.fieldLabel, e.target.value)} />;
      case 'DATE': return <input type="date" required={field.isRequired} className={commonClasses} value={value || ''} onChange={(e) => handleInputChange(field.fieldLabel, e.target.value)} />;
      case 'YES_NO':
        return (
          <select required={field.isRequired} className={commonClasses} value={value || ''} onChange={(e) => handleInputChange(field.fieldLabel, e.target.value)}>
            <option value="" disabled>Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        );
      case 'DROPDOWN':
        return (
          <select required={field.isRequired} className={commonClasses} value={value || ''} onChange={(e) => handleInputChange(field.fieldLabel, e.target.value)}>
            <option value="" disabled>Select an option...</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'MULTI_SELECT':
        return (
          <div className="space-y-2 p-2">
            {field.options?.map(opt => (
              <label key={opt} className="flex items-center space-x-3 cursor-pointer text-sm">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300" checked={(value || []).includes(opt)} onChange={(e) => handleCheckboxChange(field.fieldLabel, opt, e.target.checked)} />
                <span className="text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        );
      default: return null;
    }
  };

  // Ensure schemaSnapshot is an array. Prisma stores JSON, so we might need to parse it if it comes as a string.
  let snapshotFields = [];
  try {
    snapshotFields = typeof submission.schemaSnapshot === 'string' 
      ? JSON.parse(submission.schemaSnapshot) 
      : submission.schemaSnapshot;
  } catch (e) {
    console.error("Failed to parse schema snapshot", e);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Submission</h2>
            <p className="text-xs text-slate-500 mt-1">Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Updates saved successfully!
            </div>
          )}

          <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
            {/* 5. Render fields based on the SNAPSHOT, not the active fields */}
            {snapshotFields && snapshotFields.length > 0 ? (
              snapshotFields.map(field => (
                <div key={field.id} className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-800">
                    {field.fieldLabel} {field.isRequired && <span className="text-red-500">*</span>}
                  </label>
                  {renderInput(field)}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No schema data found for this submission.</p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button 
            type="submit" 
            form="edit-form" 
            disabled={isSubmitting || success}
            className={`px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}