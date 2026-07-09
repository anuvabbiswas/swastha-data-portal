import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trash2, AlertCircle } from 'lucide-react';

export default function FieldManagement() {
  const { token } = useAuth();
  
  // State for which form the admin is currently editing
  const [activeFormType, setActiveFormType] = useState('MARKETING');
  
  // Data state
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New Field Form State
  const [formData, setFormData] = useState({
    fieldLabel: '',
    inputType: 'TEXT',
    isRequired: false,
    optionsString: '' // We will parse this into a JSON array before sending
  });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // Refetch fields whenever the Admin switches tabs
  useEffect(() => {
    fetchFields();
  }, [activeFormType]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fields/${activeFormType}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFields(data.data.fields);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateField = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    // If dropdown/multi-select, parse the comma-separated string into an array
    let parsedOptions = null;
    if (['DROPDOWN', 'MULTI_SELECT'].includes(formData.inputType)) {
      if (!formData.optionsString.trim()) {
        return setFormMessage({ type: 'error', text: 'Dropdowns require at least one option.' });
      }
      parsedOptions = formData.optionsString.split(',').map(opt => opt.trim()).filter(Boolean);
    }

    try {
      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          formType: activeFormType,
          fieldLabel: formData.fieldLabel,
          inputType: formData.inputType,
          isRequired: formData.isRequired,
          options: parsedOptions
        })
      });
      
      const data = await res.json();

      if (res.ok) {
        setFormMessage({ type: 'success', text: 'Field added successfully!' });
        setFormData({ fieldLabel: '', inputType: 'TEXT', isRequired: false, optionsString: '' });
        fetchFields(); // Refresh the list
      } else {
        setFormMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setFormMessage({ type: 'error', text: 'Server error occurred.' });
    }
  };

  const handleDeactivate = async (fieldId, fieldLabel) => {
    if (!window.confirm(`Are you sure you want to remove the "${fieldLabel}" field? Historical data will be preserved, but associates will no longer see this question.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/fields/${fieldId}/deactivate`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchFields(); // Refresh to remove the deactivated field from the UI
      } else {
        alert('Failed to remove field.');
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dynamic Form Engine</h2>
          <p className="text-slate-500 mt-1">Configure the data collection rules for the field associates.</p>
        </div>
        
        {/* Form Type Tabs */}
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button 
            onClick={() => setActiveFormType('MARKETING')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeFormType === 'MARKETING' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Marketing Form
          </button>
          <button 
            onClick={() => setActiveFormType('COMMUNITY')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeFormType === 'COMMUNITY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Community Form
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Create Field Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Add Question to {activeFormType.toLowerCase()}</h3>
          
          {formMessage.text && (
            <div className={`mb-4 p-3 rounded text-sm font-medium ${formMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {formMessage.text}
            </div>
          )}

          <form onSubmit={handleCreateField} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Question / Field Label</label>
              <input type="text" required value={formData.fieldLabel} onChange={(e) => setFormData({...formData, fieldLabel: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. Doctor's Specialization" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Answer Type</label>
              <select value={formData.inputType} onChange={(e) => setFormData({...formData, inputType: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="TEXT">Short Text</option>
                <option value="NUMBER">Number</option>
                <option value="DATE">Date</option>
                <option value="YES_NO">Yes / No</option>
                <option value="DROPDOWN">Single Choice (Dropdown)</option>
                <option value="MULTI_SELECT">Multiple Choice (Checkboxes)</option>
              </select>
            </div>

            {/* Conditionally render options input if Dropdown or Multi-select is chosen */}
            {['DROPDOWN', 'MULTI_SELECT'].includes(formData.inputType) && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <label className="block text-sm font-medium text-blue-900 mb-1">Choices (Comma Separated)</label>
                <input type="text" required value={formData.optionsString} onChange={(e) => setFormData({...formData, optionsString: e.target.value})} className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. Cardiologist, Neurologist, General" />
                <p className="text-xs text-blue-700 mt-1">Separate each option with a comma.</p>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <input type="checkbox" id="isRequired" checked={formData.isRequired} onChange={(e) => setFormData({...formData, isRequired: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <label htmlFor="isRequired" className="text-sm font-medium text-slate-700">Make this question required</label>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 mt-2">
              Add Field to Form
            </button>
          </form>
        </div>

        {/* Right Side: Current Fields List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800">Current Form Layout</h3>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-medium">{fields.length} Active Fields</span>
          </div>
          
          <div className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading form schema...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : fields.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="text-lg font-medium text-slate-700">No fields configured yet.</h4>
                <p className="text-slate-500 mt-1 text-sm">Add questions using the panel on the left to build the {activeFormType.toLowerCase()} form.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {fields.map((field, index) => (
                  <li key={field.id} className="p-4 hover:bg-slate-50 flex items-center justify-between group transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 flex items-center">
                          {field.fieldLabel}
                          {field.isRequired && <span className="ml-2 text-red-500 text-xs font-bold" title="Required">*</span>}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold tracking-wider uppercase">
                            {field.inputType.replace('_', ' ')}
                          </span>
                          {field.options && Array.isArray(field.options) && (
                            <span className="text-xs text-slate-500 truncate max-w-xs">
                              Options: {field.options.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDeactivate(field.id, field.fieldLabel)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Remove Field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}