import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trash2, AlertCircle, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sub-component for individual Draggable Items ---
function SortableFieldItem({ field, index, onDeactivate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className={`p-4 bg-white border-b border-slate-100 flex items-center justify-between group transition-colors ${isDragging ? 'shadow-lg ring-2 ring-blue-500 rounded-lg relative' : 'hover:bg-slate-50'}`}>
      <div className="flex items-center space-x-4">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab hover:bg-slate-100 p-1 rounded active:cursor-grabbing text-slate-400">
          <GripVertical className="w-5 h-5" />
        </div>
        
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
        onClick={() => onDeactivate(field.id, field.fieldLabel)}
        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        title="Remove Field"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}

// --- Main Component ---
export default function FieldManagement() {
  const { token } = useAuth();

  // State for which form the admin is currently editing
  const [activeFormType, setActiveFormType] = useState('MARKETING');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New Field Form State
  const [formData, setFormData] = useState({ fieldLabel: '', inputType: 'TEXT', isRequired: false, optionsString: '' });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // Setup DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchFields(); }, [activeFormType]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fields/${activeFormType}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setFields(data.data.fields);
      else setError(data.message);
    } catch (err) {
      setError('Failed to fetch fields.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateField = async (e) => {
    e.preventDefault();
    setFormMessage({ type: '', text: '' });

    let parsedOptions = null;
    if (['DROPDOWN', 'MULTI_SELECT'].includes(formData.inputType)) {
      if (!formData.optionsString.trim()) return setFormMessage({ type: 'error', text: 'Dropdowns require at least one option.' });
      parsedOptions = formData.optionsString.split(',').map(opt => opt.trim()).filter(Boolean);
    }

    try {
      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, formType: activeFormType, options: parsedOptions })
      });
      if (res.ok) {
        setFormMessage({ type: 'success', text: 'Field added successfully!' });
        setFormData({ fieldLabel: '', inputType: 'TEXT', isRequired: false, optionsString: '' });
        fetchFields(); 
      } else {
        const data = await res.json();
        setFormMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setFormMessage({ type: 'error', text: 'Server error occurred.' });
    }
  };

  const handleDeactivate = async (fieldId, fieldLabel) => {
    if (!window.confirm(`Are you sure you want to remove "${fieldLabel}"?`)) return;
    try {
      const res = await fetch(`/api/fields/${fieldId}/deactivate`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) fetchFields();
    } catch (err) { alert('Network error occurred.'); }
  };

  // --- NEW: Handle Drag End ---
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    // If dropped in the same place, do nothing
    if (!over || active.id === over.id) return;

    // 1. Calculate new array order locally (instant UI update for good UX)
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    const newFieldsArray = arrayMove(fields, oldIndex, newIndex);
    
    setFields(newFieldsArray);

    // 2. Prepare payload mapping the new index to displayOrder
    const payload = newFieldsArray.map((field, index) => ({
      id: field.id,
      displayOrder: index
    }));

    // 3. Send to backend
    try {
      await fetch('/api/fields/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ fields: payload })
      });
    } catch (error) {
      console.error("Failed to save reorder", error);
      fetchFields(); // Revert on failure
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Field Management</h2>
          <p className="text-slate-500 mt-1">Configure and set form fields.</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button onClick={() => setActiveFormType('MARKETING')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeFormType === 'MARKETING' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Marketing Form</button>
          <button onClick={() => setActiveFormType('COMMUNITY')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeFormType === 'COMMUNITY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>Community Form</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Create Field Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
           <h3 className="text-lg font-semibold text-slate-800 mb-4">Add question to {activeFormType.toUpperCase()}</h3>
           {formMessage.text && <div className={`mb-4 p-3 rounded text-sm font-medium ${formMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{formMessage.text}</div>}
           <form onSubmit={handleCreateField} className="space-y-4">
             <div><label className="block text-sm font-medium text-slate-700 mb-1">Question / Field Label</label><input type="text" required value={formData.fieldLabel} onChange={(e) => setFormData({...formData, fieldLabel: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="e.g. Full Name" /></div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Response Type</label>
               <select value={formData.inputType} onChange={(e) => setFormData({...formData, inputType: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                 <option value="TEXT">Short Text</option><option value="NUMBER">Number</option><option value="DATE">Date</option><option value="YES_NO">Yes / No</option><option value="DROPDOWN">Single Choice (Dropdown)</option><option value="MULTI_SELECT">Multiple Choice (Checkboxes)</option>
               </select>
             </div>
             {['DROPDOWN', 'MULTI_SELECT'].includes(formData.inputType) && (
               <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                 <label className="block text-sm font-medium text-blue-900 mb-1">Choices (Comma Separated)</label>
                 <input type="text" required value={formData.optionsString} onChange={(e) => setFormData({...formData, optionsString: e.target.value})} className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
               </div>
             )}
             <div className="flex items-center space-x-2 pt-2">
               <input type="checkbox" id="isRequired" checked={formData.isRequired} onChange={(e) => setFormData({...formData, isRequired: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
               <label htmlFor="isRequired" className="text-sm font-medium text-slate-700">Make this question required</label>
             </div>
             <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 mt-2">Add Field to Form</button>
           </form>
        </div>

        {/* Right Side: Current Fields List (With DnD) */}
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
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  <ul className="divide-y divide-slate-100">
                    {fields.map((field, index) => (
                      <SortableFieldItem key={field.id} field={field} index={index} onDeactivate={handleDeactivate} />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}