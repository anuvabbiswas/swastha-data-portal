// client/src/components/associate/NewSubmission.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2 } from 'lucide-react';

export default function NewSubmission() {
  const { user, token } = useAuth();
  
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // This state will hold all the dynamic answers! (e.g., { "Doctor Name": "Dr. Smith", "Age": 45 })
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Fetch the correct fields based on the user's role
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const res = await fetch(`/api/fields/${user.role}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
          setFields(data.data.fields);
          
          // Initialize formData object with empty values for each field
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

  // 2. Handle dynamic input changes
  const handleInputChange = (fieldLabel, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldLabel]: value
    }));
  };

  // 3. Handle checkbox array logic for MULTI_SELECT
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

  // 4. Submit the dynamic JSON payload to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setError('');

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          formType: user.role,
          submissionData: formData
        })
      });
      
      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('Data successfully submitted!');
        // Reset the form values
        const resetData = {};
        fields.forEach(f => resetData[f.fieldLabel] = f.inputType === 'MULTI_SELECT' ? [] : '');
        setFormData(resetData);
        
        // Hide success message after 3 seconds
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

  // 5. The Dynamic Renderer Function
  const renderInput = (field) => {
    const value = formData[field.fieldLabel];
    const commonClasses = "w-full p-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors";

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
          <select required={field.isRequired} className={commonClasses} value={value || ''} onChange={(e) => handleInputChange(field.fieldLabel, e.target.value)}>
            <option value="" disabled>Select an option...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'MULTI_SELECT':
        return (
          <div className="space-y-2 p-2">
            {field.options?.map(opt => (
              <label key={opt} className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  checked={(value || []).includes(opt)}
                  onChange={(e) => handleCheckboxChange(field.fieldLabel, opt, e.target.checked)}
                />
                <span className="text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
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
              {renderInput(field)}
            </div>
          ))}

          <div className="pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-all text-lg ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Saving Data...' : 'Submit Data'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}