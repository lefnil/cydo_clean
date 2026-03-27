import React from 'react';
import { motion } from 'motion/react';
import { X, ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useMealForm } from '../../../hooks/useMealForm';

interface MealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const MealFormModal: React.FC<MealFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { form, updateField, setStep, errors } = useMealForm();

  if (!isOpen) return null;

  const steps = ['Basic Information (Required)', 'Details & Notes', 'Attendance & Numbers'];

  // Helper to check if field is empty
  const isEmpty = (val: any): boolean => !val || val === '' || val === null || val === undefined || val === 0;

  // Required fields validation (all required except supplemental data)
  const requiredFieldsStep1 = ['ppa_name', 'ppa_type', 'start_date', 'end_date', 'center_of_participation', 'aip_reference_code', 'sdg_goal', 'budget_allocated', 'budget_utilized', 'objective_1', 'objective_2', 'objective_3'];
  const requiredStep1 = requiredFieldsStep1.every(field => !!form[field as keyof typeof form]);
  
  const hasDetailsStep2 = form.highlights || form.outputs || form.partnerships_built || form.challenges_encountered || form.recommendations || form.reviewer_notes;
  const requiredStep2 = hasDetailsStep2; // Optional but show if any filled

  const canNext = form.step === 1 ? requiredStep1 : (form.step === 2 ? true : true);
  const isLastStep = form.step === 3;

  const handleNext = () => {
    if (canNext) {
      setStep(form.step + 1 as any);
    }
  };

  const handlePrevious = () => {
    if (form.step > 1) {
      setStep(form.step - 1 as any);
    } else {
      onClose();
    }
  };

  const handleSubmit = () => {
    // Validate all required fields before submit
    const missingRequired = requiredFieldsStep1.filter(field => !form[field as keyof typeof form]);
    if (missingRequired.length > 0) {
      alert('Please fill all required fields in Step 1: ' + missingRequired.join(', '));
      return;
    }
    onSubmit();
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-6xl max-h-[95vh] bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-jewel/20 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900 via-emerald-900 to-jewel p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent drop-shadow-lg mb-1">
                New MEAL Record
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-slate-300 text-lg font-semibold">Step {form.step} / 3</span>
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-400/50 rounded-full text-xs text-red-300 font-medium">
                    <AlertCircle size={14} />
                    {errorCount} error{errorCount > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-white/20 backdrop-blur hover:bg-white/30 border border-white/20 rounded-2xl text-white hover:text-slate-100 transition-all shadow-lg hover:shadow-xl"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-slate-200/50 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 w-full">
            {[1, 2, 3].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div className={`flex-shrink-0 p-2.5 rounded-full shadow-md transition-all w-12 h-12 flex items-center justify-center font-bold text-sm ${
                  form.step === stepNum 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/25 ring-2 ring-blue-500/30' 
                    : form.step > stepNum 
                      ? 'bg-emerald-500/90 text-white shadow-emerald-500/25 ring-2 ring-emerald-500/30' 
                      : 'bg-slate-200/70 text-slate-500 shadow-sm ring-1 ring-slate-300/50 hover:bg-slate-300'
                }`}>
                  {form.step > stepNum ? '✓' : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`h-1.5 flex-1 rounded-full transition-all shadow-sm ${
                    form.step > stepNum 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/25' 
                      : form.step === stepNum 
                        ? 'bg-gradient-to-r from-emerald-400 to-jewel-500 shadow-frostee-400/25' 
                        : 'bg-slate-200/50 shadow-sm'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-24 scrollbar-thin scrollbar-thumb-slate-300/50 scrollbar-track-slate-100/50">
          {/* STEP 1: Basic Info */}
          {form.step === 1 && (
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-3">PPA Name<span className="text-red-500">*</span></label>
                    <input 
                      className={`w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm text-lg placeholder-slate-400 ${
                        (errors.ppa_name || isEmpty(form.ppa_name)) ? 'border-red-400 bg-red-50 shadow-red-200/50' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                      placeholder="e.g. Youth Leadership Summit 2026"
                      value={form.ppa_name || ''}
                      onChange={(e) => updateField('ppa_name' as any, e.target.value)}
                    />
                    {errors.ppa_name && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {errors.ppa_name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-3">PPA Type<span className="text-red-500">*</span></label>
                    <select 
                      className={`w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm text-lg placeholder-slate-400 bg-white ${
                        (errors.ppa_type || isEmpty(form.ppa_type)) ? 'border-red-400 bg-red-50 shadow-red-200/50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                      value={form.ppa_type || ''}
                      onChange={(e) => updateField('ppa_type' as any, e.target.value)}
                    >
                      <option value="">Select PPA type</option>
                      <option value="Program">📚 Program</option>
                      <option value="Project">🚀 Project</option>
                      <option value="Activity">⚡ Activity</option>
                    </select>
                    {errors.ppa_type && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {errors.ppa_type}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-3">Start Date * <span className="text-red-500">*</span></label>
                    <input type="date" 
                      className={`w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm text-lg ${
                        (errors.start_date || isEmpty(form.start_date)) ? 'border-red-400 bg-red-50 shadow-red-200/50' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                      value={form.start_date || ''}
                      onChange={(e) => updateField('start_date' as any, e.target.value)}
                    />
                    {errors.start_date && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {errors.start_date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-3">End Date * <span className="text-red-500">*</span></label>
                    <input type="date" 
                      className={`w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm text-lg ${
                        (errors.end_date || isEmpty(form.end_date)) ? 'border-red-400 bg-red-50 shadow-red-200/50' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                      value={form.end_date || ''}
                      onChange={(e) => updateField('end_date' as any, e.target.value)}
                    />
                    {errors.end_date && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {errors.end_date}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-3">Center of Youth Participation * <span className="text-red-500">*</span></label>
                    <select 
                      className={`w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm text-lg placeholder-slate-400 bg-white ${
                        (errors.center_of_participation || isEmpty(form.center_of_participation)) ? 'border-red-400 bg-red-50 shadow-red-200/50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                      value={form.center_of_participation || ''}
                      onChange={(e) => updateField('center_of_participation' as any, e.target.value)}
                    >
                      <option value="">Select Center</option>
                      <option value="Health">❤️ Health</option>
                      <option value="Education">📚 Education</option>
                      <option value="Economic Empowerment">💼 Economic Empowerment</option>
                      <option value="Social Inclusion and Equity">🤝 Social Inclusion and Equity</option>
                      <option value="Peacebuilding and Security">🛡️ Peacebuilding and Security</option>
                      <option value="Governance">⚖️ Governance</option>
                      <option value="Active Citizenship">🗳️ Active Citizenship</option>
                      <option value="Environment">🌍 Environment</option>
                      <option value="Global Mobility">✈️ Global Mobility</option>
                      <option value="Agriculture">🌾 Agriculture</option>
                    </select>
                    {errors.center_of_participation && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {errors.center_of_participation}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-3">AIP Reference Code <span className="text-red-500">*</span></label>
                    <input 
                      className={`w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm text-lg placeholder-slate-400 uppercase ${
                        errors.aip_reference_code ? 'border-red-400 bg-red-50 shadow-red-200/50' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                      placeholder="e.g. AIP-2024-001"
                      value={form.aip_reference_code || ''}
                      onChange={(e) => updateField('aip_reference_code' as any, e.target.value.toUpperCase())}
                    />
                    {errors.aip_reference_code && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {errors.aip_reference_code}</p>}
                  </div>
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                    <label className="block text-sm font-bold text-slate-800 mb-3">SDG Goal * <span className="text-red-500">*</span></label>
                    <select 
                      className={`w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm text-lg placeholder-slate-400 bg-white ${
                        (errors.sdg_goal || isEmpty(form.sdg_goal)) ? 'border-red-400 bg-red-50 shadow-red-200/50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                      value={form.sdg_goal || ''}
                      onChange={(e) => updateField('sdg_goal' as any, e.target.value)}
                    >
                      <option value="">Select SDG Goal</option>
                      <option value="No Poverty">💰 No Poverty</option>
                      <option value="Zero Hunger">🥕 Zero Hunger</option>
                      <option value="Good Health and Well-being">❤️ Good Health and Well-being</option>
                      <option value="Quality Education">📚 Quality Education</option>
                      <option value="Gender Equality">⚖️ Gender Equality</option>
                      <option value="Clean Water and Sanitation">💧 Clean Water and Sanitation</option>
                      <option value="Affordable and Clean Energy">☀️ Affordable and Clean Energy</option>
                      <option value="Decent Work and Economic Growth">💼 Decent Work and Economic Growth</option>
                      <option value="Industry, Innovation and Infrastructure">🏭 Industry, Innovation and Infrastructure</option>
                      <option value="Reduced Inequalities">🤝 Reduced Inequalities</option>
                      <option value="Sustainable Cities and Communities">🏙️ Sustainable Cities and Communities</option>
                      <option value="Responsible Consumption and Production">♻️ Responsible Consumption and Production</option>
                      <option value="Climate Action">🌍 Climate Action</option>
                      <option value="Life Below Water">🐟 Life Below Water</option>
                      <option value="Life on Land">🌳 Life on Land</option>
                      <option value="Peace, Justice and Strong Institutions">⚖️ Peace, Justice and Strong Institutions</option>
                      <option value="Partnerships for the Goals">🌐 Partnerships for the Goals</option>
                    </select>
                    {errors.sdg_goal && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {errors.sdg_goal}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-3">Budget Allocated * <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01"
                      className={`w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm text-lg text-right placeholder-slate-400 ${
                        errors.budget_allocated ? 'border-red-400 bg-red-50 shadow-red-200/50' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                      placeholder="0.00"
                      value={form.budget_allocated || ''}
                      onChange={(e) => updateField('budget_allocated' as any, parseFloat(e.target.value) || 0)}
                    />
                    {errors.budget_allocated && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {errors.budget_allocated}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3">Budget Utilized * <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01"
                    className={`w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm text-lg text-right placeholder-slate-400 ${
                      errors.budget_utilized ? 'border-red-400 bg-red-50 shadow-red-200/50' : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                    placeholder="0.00"
                    value={form.budget_utilized || ''}
                    onChange={(e) => updateField('budget_utilized' as any, parseFloat(e.target.value) || 0)}
                  />
                  {errors.budget_utilized && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {errors.budget_utilized}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <label className="block text-sm font-bold text-slate-800 mb-3">Objectives * <span className="text-red-500">*</span></label>
                  <div className="space-y-3">
                    <textarea 
                      rows={3}
                      className={`w-full p-4 border-2 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm placeholder-slate-400 ${
                        errors.objective_1 ? 'border-red-400 bg-red-50 shadow-red-200/50' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                      placeholder="Objective 1 (Required)"
                      value={form.objective_1 || ''}
                      onChange={(e) => updateField('objective_1' as any, e.target.value)}
                    />
                    <textarea 
                      rows={3}
                      className="w-full p-4 border-2 border-slate-200 hover:border-slate-300 bg-white rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm placeholder-slate-400 resize-vertical"
                      placeholder="Objective 2 (Optional)"
                      value={form.objective_2 || ''}
                      onChange={(e) => updateField('objective_2' as any, e.target.value)}
                    />
                    <textarea 
                      rows={3}
                      className="w-full p-4 border-2 border-slate-200 hover:border-slate-300 bg-white rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm placeholder-slate-400 resize-vertical"
                      placeholder="Objective 3 (Optional)"
                      value={form.objective_3 || ''}
                      onChange={(e) => updateField('objective_3' as any, e.target.value)}
                    />
                  </div>
                  {errors.objective_1 && <p className="mt-2 text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {errors.objective_1}</p>}
                </div>
              </div>
              </div>
          )}

          {/* STEP 2 */}
          {form.step === 2 && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3">Highlights</label>
                  <textarea 
                    rows={4}
                    className="w-full p-4 border-2 border-slate-200 hover:border-slate-300 bg-white rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm resize-vertical placeholder-slate-400"
                    placeholder="Key achievements and highlights..."
                    value={form.highlights || ''}
                    onChange={(e) => updateField('highlights' as any, e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3">Outputs</label>
                  <textarea 
                    rows={4}
                    className="w-full p-4 border-2 border-slate-200 hover:border-slate-300 bg-white rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm resize-vertical placeholder-slate-400"
                    placeholder="Tangible outputs and deliverables..."
                    value={form.outputs || ''}
                    onChange={(e) => updateField('outputs' as any, e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3">Partnerships Built</label>
                  <textarea 
                    rows={3}
                    className="w-full p-4 border-2 border-slate-200 hover:border-slate-300 bg-white rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm resize-vertical placeholder-slate-400"
                    placeholder="Partners and collaborators involved..."
                    value={form.partnerships_built || ''}
                    onChange={(e) => updateField('partnerships_built' as any, e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3">Challenges Encountered</label>
                  <textarea 
                    rows={3}
                    className="w-full p-4 border-2 border-slate-200 hover:border-slate-300 bg-white rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm resize-vertical placeholder-slate-400"
                    placeholder="Challenges faced and solutions..."
                    value={form.challenges_encountered || ''}
                    onChange={(e) => updateField('challenges_encountered' as any, e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3">Recommendations</label>
                  <textarea 
                    rows={3}
                    className="w-full p-4 border-2 border-slate-200 hover:border-slate-300 bg-white rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm resize-vertical placeholder-slate-400"
                    placeholder="Recommendations for future activities..."
                    value={form.recommendations || ''}
                    onChange={(e) => updateField('recommendations' as any, e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-3">Reviewer Notes</label>
                  <textarea 
                    rows={3}
                    className="w-full p-4 border-2 border-slate-200 hover:border-slate-300 bg-white rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm resize-vertical placeholder-slate-400"
                    placeholder="Admin reviewer notes (optional)"
                    value={form.reviewer_notes || ''}
                    onChange={(e) => updateField('reviewer_notes' as any, e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {form.step === 3 && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  Attendance Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Expected</label>
                    <input type="number" 
                      className="w-full p-5 border-2 border-slate-200 hover:border-slate-300 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm text-2xl font-bold text-right bg-gradient-to-r from-emerald-50 to-frostee-50"
                      placeholder="0"
                      value={form.expected_attendees || ''}
                      onChange={(e) => updateField('expected_attendees' as any, parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Actual</label>
                    <input type="number" 
                      className="w-full p-5 border-2 border-slate-200 hover:border-slate-300 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm text-2xl font-bold text-right bg-gradient-to-r from-emerald-50 to-green-50"
                      placeholder="0"
                      value={form.actual_attendees || ''}
                      onChange={(e) => updateField('actual_attendees' as any, parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Male</label>
                    <input type="number" 
                      className="w-full p-5 border-2 border-slate-200 hover:border-slate-300 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm text-xl font-bold text-right bg-gradient-to-r from-blue-50 to-cyan-50"
                      placeholder="0"
                      value={form.male || ''}
                      onChange={(e) => updateField('male' as any, parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Female</label>
                    <input type="number" 
                      className="w-full p-5 border-2 border-slate-200 hover:border-slate-300 rounded-2xl focus:ring-4 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm text-xl font-bold text-right bg-gradient-to-r from-pink-50 to-rose-50"
                      placeholder="0"
                      value={form.female || ''}
                      onChange={(e) => updateField('female' as any, parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  Age Groups
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { field: 'age_below_14', label: '<14' },
                    { field: 'age_15_17', label: '15-17' },
                    { field: 'age_18_24', label: '18-24' },
                    { field: 'age_25_30', label: '25-30' },
                    { field: 'age_30_and_above', label: '30+' }
                  ].map(({ field, label }) => (
                    <div key={field} className="group">
                      <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">{label}</label>
                      <input type="number" 
                        className="w-full p-3 border border-slate-200 hover:border-slate-300 rounded-xl focus:ring-2 focus:ring-jewel/30 focus:border-jewel transition-all shadow-sm bg-white/70 text-sm text-right font-mono"
                        placeholder="0"
                        value={form[field as keyof typeof form] || ''}
                        onChange={(e) => updateField(field as any, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  Vulnerable Groups & Organizations
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    'lgbtqia', 'out_of_school_youth', 'indigenous_people', 'muslim',
                    'four_ps', 'persons_with_disability'
                  ].map((field) => (
                    <div key={field} className="group">
                      <label className="block text-xs font-semibold text-slate-700 mb-2 capitalize">{field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
                      <input type="number" 
                        className="w-full p-3 border border-slate-200 hover:border-slate-300 rounded-xl focus:ring-2 focus:ring-jewel/30 focus:border-jewel transition-all shadow-sm bg-white/70 text-sm text-right font-mono"
                        placeholder="0"
                        value={form[field as keyof typeof form] || ''}
                        onChange={(e) => updateField(field as any, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">Sangguniang Kabataan</label>
                  <input type="number" 
                    className="w-full p-4 border border-slate-200 hover:border-slate-300 rounded-2xl focus:ring-3 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm bg-white/70 text-lg text-right font-mono"
                    placeholder="0"
                    value={form.sangguniang_kabataan || ''}
                    onChange={(e) => updateField('sangguniang_kabataan' as any, parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-3">LYDC Members</label>
                  <input type="number" 
                    className="w-full p-4 border border-slate-200 hover:border-slate-300 rounded-2xl focus:ring-3 focus:ring-jewel/20 focus:border-jewel transition-all shadow-sm bg-white/70 text-lg text-right font-mono"
                    placeholder="0"
                    value={form.lydc || ''}
                    onChange={(e) => updateField('lydc' as any, parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                  Barangay Attendance Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {[
                    'apokon', 'bincungan', 'busaon', 'canocotan', 'cuambogan', 'la_filipina',
                    'liboganon', 'madaum', 'magdum', 'magugpo_east', 'magugpo_north', 'magugpo_poblacion',
                    'magugpo_south', 'magugpo_west', 'mankilam', 'new_balamban', 'nueva_fuerza',
                    'pagsabangan', 'pandapan', 'san_agustin', 'san_isidro', 'san_miguel',
                    'visayan_village', 'outside_tagum'
                  ].map((barangay) => (
                    <div key={barangay} className="group">
                      <label className="block text-xs font-semibold text-slate-700 mb-1 truncate capitalize leading-tight">{barangay.replace(/_/g, ' ')}</label>
                      <input type="number" 
                        className="w-full p-3 border border-slate-200 hover:border-slate-300 rounded-lg focus:ring-1 focus:ring-jewel/30 focus:border-jewel transition-all shadow-sm bg-white/70 text-sm text-right font-mono h-12"
                        placeholder="0"
                        value={form[barangay as keyof typeof form] || ''}
                        onChange={(e) => updateField(barangay as any, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Fixed Bottom Navigation */}
        <div className="p-6 border-t border-slate-200/50 bg-gradient-to-t from-white/70 backdrop-blur-sm shadow-lg flex justify-between items-center gap-4">
          <button 
            onClick={handlePrevious}
            className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 h-12 px-10"
          >
            <ArrowLeft size={20} />
            Previous Step
          </button>

          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              canNext 
                ? 'bg-emerald-100 text-emerald-800 shadow-md' 
                : 'bg-amber-100 text-amber-800 shadow-md'
            }`}>
              {canNext ? '✅ Ready' : '⚠️ Fill required fields'}
            </span>

            {isLastStep ? (
              <button 
                onClick={handleSubmit}
                className="px-12 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 h-12"
              >
                <CheckCircle size={22} />
                Submit Record
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="px-12 py-3 bg-gradient-to-r from-jewel to-emerald-500 hover:from-jewel/90 hover:to-green-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 h-12"
              >
                Next Step
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

