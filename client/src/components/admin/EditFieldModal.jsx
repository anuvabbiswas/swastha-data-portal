import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function EditFieldModal({ field, onClose, onRefresh }) {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fieldLabel: field.fieldLabel || '',
    description: field.description || '',
    inputType: field.inputType || 'TEXT',
    isRequired: field.isRequired || false,
    allowOther: field.allowOther || false,
    optionsString: Array.isArray(field.options) ? field.options.join(', ') : ''
  });

  const handleUpdateField = async (e) => {
    e.preventDefault();
    setError('');

    let parsedOptions = null;
    if (['DROPDOWN', 'MULTI_SELECT'].includes(formData.inputType)) {
      if (!formData.optionsString.trim()) {
        return setError('Dropdowns require at least one option.');
      }
      parsedOptions = formData.optionsString.split(',').map(opt => opt.trim()).filter(Boolean);
    }

    setIsSubmitting(true);

    const payload = {
      fieldLabel: formData.fieldLabel,
      description: formData.description,
      inputType: formData.inputType,
      isRequired: formData.isRequired,
      allowOther: formData.allowOther,
      options: parsedOptions
    };

    try {
      const res = await fetch(`/api/fields/${field.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update field.');
      }
    } catch (err) {
      setError('Network error while updating field.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Edit Question</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpdateField} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Field Label</label>
            <input
              required
              type="text"
              value={formData.fieldLabel}
              onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data Type</label>
            <select
              required
              value={formData.inputType}
              onChange={(e) => setFormData({ ...formData, inputType: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand text-sm"
            >
              <option value="TEXT">Text (Short)</option>
              <option value="NUMBER">Number</option>
              <option value="DATE">Date</option>
              <option value="YES_NO">Yes / No</option>
              <option value="DROPDOWN">Single Choice (Dropdown)</option>
              <option value="MULTI_SELECT">Multiple Choice (Checkboxes)</option>
              <option value="UPLOAD_MEDIA">Upload Media (PDF/JPG/PNG)</option>
            </select>
          </div>

          {['DROPDOWN', 'MULTI_SELECT'].includes(formData.inputType) && (
            <div className="p-3 bg-brand/10 border border-brand/20 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-brand-hover mb-1">Choices (Comma Separated)</label>
                <input
                  type="text"
                  required
                  value={formData.optionsString}
                  onChange={(e) => setFormData({ ...formData, optionsString: e.target.value })}
                  className="w-full p-2 border border-brand/30 rounded-lg focus:ring-2 focus:ring-brand text-sm"
                  placeholder="e.g. Option 1, Option 2"
                />
              </div>

              <div className="flex items-center space-x-2 border-t border-brand/30 pt-2">
                <input
                  type="checkbox"
                  id="edit-allowOther"
                  checked={formData.allowOther}
                  onChange={(e) => setFormData({ ...formData, allowOther: e.target.checked })}
                  className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand"
                />
                <label htmlFor="edit-allowOther" className="text-sm font-medium text-brand-hover">
                  Include an "Other" option with text input
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="edit-required"
              checked={formData.isRequired}
              onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
              className="w-4 h-4 text-brand bg-slate-100 border-slate-300 rounded focus:ring-brand"
            />
            <label htmlFor="edit-required" className="ml-2 text-sm font-medium text-slate-700">
              Make this field required
            </label>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdateField}
            disabled={isSubmitting}
            className={`px-5 py-2.5 text-sm font-bold text-white bg-brand rounded-lg hover:bg-brand-hover transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}