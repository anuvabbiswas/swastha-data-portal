import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function EditSubmissionModal({ submission, onClose, onRefresh }) {
  const { token } = useAuth();
  
  // 1. Initialize State
  const [formData, setFormData] = useState({});
  const [otherTextData, setOtherTextData] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isUploading = Object.values(uploadingFiles).some(Boolean);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  let snapshotFields = [];
  try {
    snapshotFields = typeof submission.schemaSnapshot === 'string' 
      ? JSON.parse(submission.schemaSnapshot) 
      : submission.schemaSnapshot;
  } catch (e) {
    console.error("Failed to parse schema snapshot", e);
  }

  useEffect(() => {
    const initialFormData = {};
    const initialOtherData = {};

    snapshotFields.forEach(field => {
      const dbValue = submission.submissionData[field.fieldLabel];

      if (!dbValue) {
        initialFormData[field.fieldLabel] = field.inputType === 'MULTI_SELECT' ? [] : '';
        return;
      }

      // Handle Dropdown reverse parsing
      if (field.inputType === 'DROPDOWN' && typeof dbValue === 'string' && dbValue.startsWith('Other: ')) {
        initialFormData[field.fieldLabel] = 'Other';
        initialOtherData[field.fieldLabel] = dbValue.replace('Other: ', '');
      } 
      // Handle Multi-Select reverse parsing
      else if (field.inputType === 'MULTI_SELECT' && Array.isArray(dbValue)) {
        const parsedArray = dbValue.map(item => {
          if (typeof item === 'string' && item.startsWith('Other: ')) {
            initialOtherData[field.fieldLabel] = item.replace('Other: ', '');
            return 'Other';
          }
          return item;
        });
        initialFormData[field.fieldLabel] = parsedArray;
      } 
      // Handle normal data
      else {
        initialFormData[field.fieldLabel] = dbValue;
      }
    });

    setFormData(initialFormData);
    setOtherTextData(initialOtherData);
  }, [submission, snapshotFields]);

  // 2. Handle Input Changes
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

  // --- NEW: Secure File Upload Handler ---
  const handleFileUpload = async (fieldLabel, file) => {
    if (!file) return;
    
    // 1. Strict Validation
    if (file.size > 10 * 1024 * 1024) {
      alert('Validation Error: File size exceeds the 10MB limit.');
      return;
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Validation Error: Invalid file type. Only PDF, JPG, and PNG are allowed.');
      return;
    }

    // 2. Prepare FormData
    setUploadingFiles(prev => ({ ...prev, [fieldLabel]: true }));
    const uploadData = new FormData();
    uploadData.append('media', file);

    try {
      // 3. Send securely to backend (Note: Do NOT set Content-Type header for FormData)
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData
      });
      const data = await res.json();
      
      if (res.ok) {
        // Save the returned filename string into the form JSON
        handleInputChange(fieldLabel, data.data.filename);
      } else {
        alert(data.message || 'File upload failed.');
      }
    } catch (err) {
      alert('Network error during file upload.');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fieldLabel]: false }));
    }
  };

  // 3. Submit the PATCH request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Format the data exactly like NewSubmission.jsx does
    const formattedData = { ...formData };
    
    snapshotFields.forEach(field => {
      const value = formattedData[field.fieldLabel];
      const customText = otherTextData[field.fieldLabel];

      if (field.inputType === 'DROPDOWN' && value === 'Other' && customText) {
        formattedData[field.fieldLabel] = `Other: ${customText}`;
      } 
      else if (field.inputType === 'MULTI_SELECT' && Array.isArray(value) && value.includes('Other') && customText) {
        const mappedArray = value.map(item => item === 'Other' ? `Other: ${customText}` : item);
        formattedData[field.fieldLabel] = mappedArray;
      }
    });

    try {
      const res = await fetch(`/api/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ submissionData: formattedData })
      });

      if (res.ok) {
        setSuccess(true);
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

  // 4. The Dynamic Renderer
  const renderInput = (field) => {
    const value = formData[field.fieldLabel];
    const commonClasses = "w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm";

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
          <div className="space-y-2">
            <select required={field.isRequired} className={commonClasses} value={value || ''} onChange={(e) => handleInputChange(field.fieldLabel, e.target.value)}>
              <option value="" disabled>Select an option...</option>
              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              {field.allowOther && <option value="Other">Other</option>}
            </select>
            {field.allowOther && value === 'Other' && (
              <input 
                type="text" 
                required 
                placeholder="Please specify..."
                value={otherTextData[field.fieldLabel] || ''} 
                onChange={(e) => setOtherTextData(prev => ({...prev, [field.fieldLabel]: e.target.value}))}
                className="w-full p-2.5 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm mt-2" 
              />
            )}
          </div>
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
            
            {field.allowOther && (
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer text-sm">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300" checked={(value || []).includes('Other')} onChange={(e) => handleCheckboxChange(field.fieldLabel, 'Other', e.target.checked)} />
                  <span className="text-slate-700 italic">Other</span>
                </label>
                {(value || []).includes('Other') && (
                  <input 
                    type="text" 
                    required 
                    placeholder="Please specify..."
                    value={otherTextData[field.fieldLabel] || ''} 
                    onChange={(e) => setOtherTextData(prev => ({...prev, [field.fieldLabel]: e.target.value}))}
                    className="w-full p-2.5 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ml-7" 
                    style={{ width: 'calc(100% - 1.75rem)' }}
                  />
                )}
              </div>
            )}
          </div>
        );
      
      case 'UPLOAD_MEDIA':
        return (
          <div className="space-y-2">
            <input 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              required={field.isRequired && !value} 
              onChange={(e) => handleFileUpload(field.fieldLabel, e.target.files[0])}
              className={`w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${uploadingFiles[field.fieldLabel] ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={uploadingFiles[field.fieldLabel]}
            />
            {uploadingFiles[field.fieldLabel] && <p className="text-xs text-blue-600 font-semibold animate-pulse">Uploading securely...</p>}
            {value && !uploadingFiles[field.fieldLabel] && (
              <p className="text-xs text-green-600 font-semibold">✓ File attached successfully.</p>
            )}
          </div>
        ); 
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Submission</h2>
            <p className="text-xs text-slate-500 mt-1">Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
          {success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" /> Updates saved successfully!
            </div>
          )}

          <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
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

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button 
            type="submit" 
            form="edit-form" 
            disabled={isSubmitting || success || isUploading}
            className={`px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isUploading ? 'Uploading File...' : isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}