import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2 } from 'lucide-react';

export default function NewSubmission() {
  const { user, token } = useAuth();
  
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({});
  const [otherTextData, setOtherTextData] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isUploading = Object.values(uploadingFiles).some(Boolean);
  const [successMessage, setSuccessMessage] = useState('');
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await fetch(`/api/fields/${user.role}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
          setFields(data.data.fields);
          
          const initialData = {};
          data.data.fields.forEach(field => {
            initialData[field.fieldLabel] = field.inputType === 'MULTI_SELECT' ? [] : '';
          });
          setFormData(initialData);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to load the form.');
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [user.role, token]);

  const handleInputChange = (fieldLabel, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldLabel]: value
    }));
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

  const handleFileUpload = async (fieldLabel, file) => {
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('Validation Error: File size exceeds the 10MB limit.');
      return;
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Validation Error: Invalid file type. Only PDF, JPG, and PNG are allowed.');
      return;
    }

    setUploadingFiles(prev => ({ ...prev, [fieldLabel]: true }));
    const uploadData = new FormData();
    uploadData.append('media', file);

    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData
      });
      const data = await res.json();
      
      if (res.ok) {
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

  const handleRemoveFile = async (fieldLabel, filename) => {
    try {
      await fetch(`/api/uploads/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to delete physical file', err);
    } finally {
      const updatedFormData = { ...formData };
      delete updatedFormData[fieldLabel];
      setFormData(updatedFormData);
      
      setFileInputKey(Date.now());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploading)
    {
      return;
    }
    setIsSubmitting(true);
    setSuccessMessage('');
    setError('');

    const formattedData = { ...formData };

    fields.forEach(field => {
      const value = formattedData[field.fieldLabel];
      const customText = otherTextData[field.fieldLabel];

      if (
        field.inputType === 'DROPDOWN' &&
        value === 'Other' &&
        customText
      ) {
        formattedData[field.fieldLabel] = `Other: ${customText}`;
      } 
      else if (
        field.inputType === 'MULTI_SELECT' &&
        Array.isArray(value) &&
        value.includes('Other') &&
        customText
      ) {
        formattedData[field.fieldLabel] = value.map(item =>
          item === 'Other' ? `Other: ${customText}` : item
        );
      }
    });

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          submissionData: formattedData
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('Data successfully submitted!');
        const resetData = {};
        fields.forEach(field => {
          resetData[field.fieldLabel] =
            field.inputType === 'MULTI_SELECT' ? [] : '';
        });

        setFormData(resetData);
        setOtherTextData({});
        setFileInputKey(Date.now());

        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('A network error occurred while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (field) => {
    const value = formData[field.fieldLabel];
    const commonClasses = "w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand transition-colors";

    switch (field.inputType) {
      case 'TEXT':
        return <input type="text" required={field.isRequired} className={commonClasses} value={value || ''} onChange={(e) => handleInputChange(field.fieldLabel, e.target.value)} />;
      
      case 'NUMBER':
        return <input type="number" required={field.isRequired} className={commonClasses} value={value || ''} onChange={(e) => handleInputChange(field.fieldLabel, e.target.value)} />;
      
      case 'DATE':
        return <input type="date" required={field.isRequired} className={commonClasses} value={value || ''} onChange={(e) => handleInputChange(field.fieldLabel, e.target.value)} />;
      
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
                className="w-full p-2.5 bg-brand/10 border border-brand/30 rounded-lg focus:ring-2 focus:ring-brand text-sm mt-2" 
              />
            )}
          </div>
        );

      case 'MULTI_SELECT':
        return (
          <div className="space-y-2 p-2">
            {field.options?.map(opt => (
              <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 text-brand rounded border-slate-300 focus:ring-brand" checked={(value || []).includes(opt)} onChange={(e) => handleCheckboxChange(field.fieldLabel, opt, e.target.checked)} />
                <span className="text-slate-700">{opt}</span>
              </label>
            ))}
            {field.allowOther && (
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 text-brand rounded border-slate-300 focus:ring-brand" checked={(value || []).includes('Other')} onChange={(e) => handleCheckboxChange(field.fieldLabel, 'Other', e.target.checked)} />
                  <span className="text-slate-700 italic">Other</span>
                </label>
                
                {(value || []).includes('Other') && (
                  <input 
                    type="text" 
                    required 
                    placeholder="Please specify..."
                    value={otherTextData[field.fieldLabel] || ''} 
                    onChange={(e) => setOtherTextData(prev => ({...prev, [field.fieldLabel]: e.target.value}))}
                    className="w-full p-2.5 bg-brand/10 border border-brand/30 rounded-lg focus:ring-2 focus:ring-brand text-sm ml-8" 
                    style={{ width: 'calc(100% - 2rem)' }}
                  />
                )}
              </div>
            )}
          </div>
        );
      
      case 'UPLOAD_MEDIA':
        return (
          <div className="space-y-2">
            {!value ? (
              <input 
                key={fileInputKey}
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png"
                required={field.isRequired} 
                onChange={(e) => handleFileUpload(field.fieldLabel, e.target.files[0])}
                className={`w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand-hover hover:file:bg-brand/20 ${uploadingFiles[field.fieldLabel] ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={uploadingFiles[field.fieldLabel]}
              />
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm text-green-800 font-medium truncate pr-4">
                  ✓ {value}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(field.fieldLabel, value)}
                  className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-md"
                >
                  Remove
                </button>
              </div>
            )}
            {uploadingFiles[field.fieldLabel] && <p className="text-xs text-brand font-semibold animate-pulse">Uploading securely...</p>}
          </div>
        );
      default: return null;
    }
  };

  if (loading) return <div className="text-slate-500 text-center mt-10">Loading form...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">New Data Collection</h2>
        <p className="text-slate-500 mt-1">Please fill out all required fields.</p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>}
      
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center shadow-sm">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          {successMessage}
        </div>
      )}

      {fields.length === 0 && !error ? (
        <div className="p-8 bg-white rounded-xl shadow-sm border border-slate-200 text-center text-slate-500">
          No form fields have been configured by the admin yet.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
          {fields.map(field => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-semibold text-slate-800">
                {field.fieldLabel} {field.isRequired && <span className="text-red-500">*</span>}
              </label>

              {field.description && (
                <p className="text-xs text-slate-500 -mt-1">
                  {field.description}
                </p>
              )}

              {renderInput(field)}
            </div>
          ))}

          <div className="pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={isSubmitting || isUploading}
              className={`w-full py-3 bg-brand hover:bg-brand-hover text-white font-bold rounded-lg shadow-sm transition-all text-lg ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isUploading ? 'Uploading File...' : isSubmitting ? 'Saving Data...' : 'Submit Data'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}