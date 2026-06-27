import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Sparkles, 
  Download, 
  Loader2, 
  Plus, 
  Info,
  Trash2,
  Import,
  CheckCircle2,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  User,
  ArrowUp,
  ArrowDown,
  History,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { motion, AnimatePresence } from 'motion/react';
import { UATScript, UATMetadata, UATStep } from './types';
import { humanizeTestSteps } from './lib/gemini';
import { generateUATExcel } from './lib/excel';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'import'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shorthand, setShorthand] = useState('');
  
  // Persistence initialization
  const [steps, setSteps] = useState<UATStep[]>(() => {
    const saved = localStorage.getItem('uat-steps');
    return saved ? JSON.parse(saved) : [
      { 
        stepNumber: 1, 
        module: 'Login', 
        instruction: 'Enter admin credentials', 
        expectedResult: 'Dashboard appears',
        actualResults: '',
        stepStatus: '',
        remarks: '',
        roleOverride: ''
      }
    ];
  });
  
  const [metadata, setMetadata] = useState<UATMetadata>(() => {
    const saved = localStorage.getItem('uat-metadata');
    return saved ? JSON.parse(saved) : {
      scriptNumber: `UAT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      scenarioTitle: 'General Functionality Verification',
      role: 'Standard User',
      testedBy: '',
      testingDate: new Date().toLocaleDateString(),
      testingStatus: 'In-Progress',
      additionalComments: '',
      subScenarioNo: '1.0',
      subScenario: 'Primary Workflow',
      description: 'Verify the core business logic of the module.',
      prerequisite: 'The application is loaded and the user is on the landing page.'
    };
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('uat-steps', JSON.stringify(steps));
  }, [steps]);

  useEffect(() => {
    localStorage.setItem('uat-metadata', JSON.stringify(metadata));
  }, [metadata]);

  const handleMetadataChange = (key: keyof UATMetadata, value: string) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const addStep = (atIndex?: number) => {
    const newStep: UATStep = {
      stepNumber: 0, // Will be recalculated
      module: steps.length > 0 ? steps[Math.min(atIndex ?? steps.length - 1, steps.length - 1)].module : '',
      instruction: '',
      expectedResult: '',
      actualResults: '',
      stepStatus: '',
      remarks: '',
      roleOverride: '',
      needsReview: false
    };

    let newSteps = [...steps];
    if (typeof atIndex === 'number') {
      newSteps.splice(atIndex, 0, newStep);
    } else {
      newSteps.push(newStep);
    }

    // Recalculate step numbers
    newSteps = newSteps.map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setSteps(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    setSteps(newSteps.map((s, i) => ({ ...s, stepNumber: i + 1 })));
  };

  const updateStep = (index: number, key: keyof UATStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [key]: value };
    setSteps(newSteps);
  };

  const transformShorthand = async () => {
    if (!shorthand.trim()) return;
    setLoading(true);
    try {
      const result = await humanizeTestSteps(shorthand, metadata);
      const processedSteps = result.steps.map(s => ({
        ...s,
        actualResults: s.actualResults || '',
        stepStatus: s.stepStatus || '',
        remarks: s.remarks || '',
        roleOverride: s.roleOverride || '',
        needsReview: true // Mark for review
      }));
      setSteps(processedSteps);
      setMetadata(result.metadata);
      setActiveTab('grid');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clearPersistence = () => {
    if (confirm('Clear all data and reset to default?')) {
      localStorage.removeItem('uat-steps');
      localStorage.removeItem('uat-metadata');
      window.location.reload();
    }
  };

  const humanizeRow = async (index: number) => {
    const step = steps[index];
    // If the step is empty, don't just return, try to humanize based on whatever is there
    if (!step.instruction && !step.expectedResult && !step.module) return;
    
    setLoading(true);
    try {
      // Build a clearer prompt for the row-level humanization
      const input = `Module: ${step.module || 'Auto'}, Action: ${step.instruction || 'N/A'}, Expected: ${step.expectedResult || 'N/A'}`;
      const result = await humanizeTestSteps(input, metadata);
      
      if (result.steps && result.steps.length > 0) {
        const polishedStep = result.steps[0];
        // Only update if AI provided meaningful output
        if (polishedStep.instruction) updateStep(index, 'instruction', polishedStep.instruction);
        if (polishedStep.expectedResult) updateStep(index, 'expectedResult', polishedStep.expectedResult);
        if (polishedStep.module && (!step.module || step.module === 'Auto')) {
          updateStep(index, 'module', polishedStep.module);
        }
      }
    } catch (error) {
      console.error("Row humanization failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await generateUATExcel({ metadata, steps });
    } catch (error) {
      alert('Excel generation failed.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg-gray font-sans overflow-hidden">
      {/* Top Banner / Header */}
      <header className="bg-brand-blue border-b border-blue-900 px-6 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-1.5 rounded shadow-sm">
            <FileSpreadsheet className="w-5 h-5 text-brand-blue" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none tracking-tight">UAgent Studio</h1>
            <p className="text-[9px] text-white/60 uppercase tracking-widest font-bold mt-0.5">Professional UAT Scripting Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={clearPersistence}
            className="text-white/40 hover:text-white/80 p-1.5 transition-colors"
            title="Reset Everything"
          >
            <History className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-green-700 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> EXPORT TO .XLSX
          </button>
        </div>
      </header>

      {/* Control Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
            title={sidebarOpen ? "Hide Settings" : "Show Settings"}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div className="h-4 w-px bg-gray-200 mx-1" />
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('grid')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'grid' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <TableIcon className="w-3.5 h-3.5" /> STEP GRID EDITOR
            </button>
            <button 
              onClick={() => setActiveTab('import')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'import' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Import className="w-3.5 h-3.5" /> BULK IMPORT (AI)
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Status:</span>
            <select 
              value={metadata.testingStatus}
              onChange={(e) => handleMetadataChange('testingStatus', e.target.value)}
              className="text-[10px] bg-green-50 text-green-700 font-bold border-none outline-none rounded px-2 py-0.5"
            >
              <option>In-Progress</option>
              <option>Draft</option>
              <option>Ready</option>
              <option>Completed</option>
            </select>
          </div>
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden min-h-0 bg-gray-100/50">
        {/* Sidebar: Metadata */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden border-r border-gray-200 bg-white shadow-sm shrink-0"
            >
              <div className="w-[300px] p-4 flex flex-col gap-4">
                <div className="card-container shrink-0 border-none shadow-none">
                  <div className="pb-3 border-b border-gray-100 flex justify-between items-center text-[10px] font-bold uppercase tracking-tight text-gray-400">
                    <span>Script Metadata</span>
                    <Info className="w-3 h-3" />
                  </div>
                  <div className="pt-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Script Number</label>
                      <input type="text" className="input-field py-1" value={metadata.scriptNumber} onChange={(e) => handleMetadataChange('scriptNumber', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Scenario Title</label>
                      <input type="text" className="input-field py-1" value={metadata.scenarioTitle} onChange={(e) => handleMetadataChange('scenarioTitle', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Base Actor / Role</label>
                      <input type="text" className="input-field py-1" value={metadata.role} onChange={(e) => handleMetadataChange('role', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Tester</label>
                      <input type="text" className="input-field py-1" placeholder="Enter name" value={metadata.testedBy} onChange={(e) => handleMetadataChange('testedBy', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Additional Comments</label>
                      <input type="text" className="input-field py-1" placeholder="Optional comments..." value={metadata.additionalComments} onChange={(e) => handleMetadataChange('additionalComments', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="card-container shrink-0 border-none shadow-none">
                  <div className="pb-3 border-b border-gray-100 text-[10px] font-bold uppercase tracking-tight text-gray-400 flex justify-between items-center">
                    <span>Scenarios & Prerequisites</span>
                  </div>
                  <div className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Sub Scenario No</label>
                        <input type="text" className="input-field py-1" value={metadata.subScenarioNo} onChange={(e) => handleMetadataChange('subScenarioNo', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase">Sub Scenario</label>
                        <input type="text" className="input-field py-1" value={metadata.subScenario} onChange={(e) => handleMetadataChange('subScenario', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Scenario Description</label>
                      <input type="text" className="input-field py-1" value={metadata.description} onChange={(e) => handleMetadataChange('description', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase">Prerequisite</label>
                      <textarea 
                        className="input-field text-xs h-20 resize-none italic leading-relaxed" 
                        value={metadata.prerequisite}
                        onChange={(e) => handleMetadataChange('prerequisite', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'import' ? (
              <motion.div 
                key="import"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="card-container flex-1 overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-gray-100 flex justify-between items-center text-xs font-bold text-gray-600 uppercase">
                  <span>AI Shorthand Import</span>
                </div>
                <div className="p-8 flex flex-col h-full bg-gray-50 overflow-auto">
                  <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
                    <p className="text-sm text-gray-500 mb-6 bg-blue-50/50 p-6 border border-blue-100 rounded-2xl text-center leading-relaxed">
                      Enter raw notes like <b>"1. Login {"->"} see dash"</b>.<br/>
                      Gemini AI will handle the professional expansion and role detection.
                    </p>
                    <textarea 
                      className="flex-1 w-full p-6 bg-white border border-gray-200 rounded-2xl shadow-xl font-mono text-sm leading-loose focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
                      placeholder="Example:&#10;1. Login -> see dash&#10;2. Users -> search for 'Admin'&#10;3. Click edit -> table shows edit modal"
                      value={shorthand}
                      onChange={(e) => setShorthand(e.target.value)}
                    />
                    <div className="py-8 flex justify-center">
                      <button 
                        onClick={transformShorthand}
                        disabled={loading || !shorthand.trim()}
                        className="bg-brand-blue text-white px-16 py-4 rounded-full font-bold text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                        {loading ? 'AI IS EXPANDING...' : 'POPULATE TEST GRID'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card-container flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-auto bg-gray-100 p-2 scrollbar-thin">
                  <table className="w-full border-collapse bg-white shadow-2xl ring-1 ring-gray-200 rounded-xl overflow-hidden min-w-[1200px]">
                    <thead className="bg-[#002060] text-white text-[10px] font-bold uppercase sticky top-0 z-20 shadow-md">
                      <tr>
                        <th className="p-3 w-10 text-center border-r border-white/10">No</th>
                        <th className="p-3 w-40 text-left border-r border-white/10">Step Description</th>
                        <th className="p-3 text-left border-r border-white/10">Step Test Instruction</th>
                        <th className="p-3 text-left border-r border-white/10">Step Expected Result</th>
                        <th className="p-3 w-40 text-left border-r border-white/10">Actual Results</th>
                        <th className="p-3 w-28 text-center border-r border-white/10">Step Status</th>
                        <th className="p-3 w-40 text-left border-r border-white/10">Remarks</th>
                        <th className="p-3 w-28 text-center">AI Tools</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {steps.map((step, idx) => (
                        <tr 
                          key={idx} 
                          className={cn(
                            "group transition-all duration-200",
                            step.needsReview ? "bg-amber-50/50 hover:bg-amber-100/50" : "hover:bg-blue-50/30"
                          )}
                        >
                          <td className="p-2 text-center align-top relative group">
                            <span className="font-mono text-[11px] text-gray-400">
                              {step.stepNumber}
                            </span>
                            {/* Insert row trigger - ABOVE */}
                            <button 
                              onClick={() => addStep(idx)}
                              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-blue-50 hover:border-blue-300 text-blue-600 transition-all z-10 shadow-sm"
                              title="Insert step above"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                            {/* Insert row trigger - BELOW */}
                            <button 
                              onClick={() => addStep(idx + 1)}
                              className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-blue-50 hover:border-blue-300 text-blue-600 transition-all z-10 shadow-sm"
                              title="Insert step below"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </td>
                          <td className="p-2 align-top group/cell">
                            <div className="flex flex-col gap-1">
                              <input 
                                type="text" 
                                className="w-full px-2 py-1.5 bg-transparent border-b border-transparent focus:border-brand-blue outline-none text-[10px] font-black uppercase transition-all"
                                value={step.module}
                                onChange={(e) => updateStep(idx, 'module', e.target.value)}
                              />
                              <div className="flex items-center gap-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <User className="w-2.5 h-2.5 text-gray-400" />
                                <input 
                                  placeholder="Role Override"
                                  className="text-[8px] text-gray-500 bg-transparent outline-none w-full"
                                  value={step.roleOverride || ''}
                                  onChange={(e) => updateStep(idx, 'roleOverride', e.target.value)}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-2 align-top">
                            <textarea 
                              className="w-full px-2 py-1.5 bg-transparent border-b border-transparent focus:border-brand-blue outline-none text-[11px] leading-relaxed resize-none h-16 transition-all scrollbar-hide"
                              placeholder="Action taken..."
                              value={step.instruction}
                              onChange={(e) => updateStep(idx, 'instruction', e.target.value)}
                            />
                          </td>
                          <td className="p-2 align-top">
                            <textarea 
                              className="w-full px-2 py-1.5 bg-transparent border-b border-transparent focus:border-brand-blue outline-none text-[11px] leading-relaxed italic text-gray-600 resize-none h-16 transition-all scrollbar-hide"
                              placeholder="System display..."
                              value={step.expectedResult}
                              onChange={(e) => updateStep(idx, 'expectedResult', e.target.value)}
                            />
                          </td>
                          <td className="p-2 align-top bg-blue-50/10">
                            <textarea 
                              className="w-full px-2 py-1.5 bg-transparent border-b border-transparent focus:border-brand-blue outline-none text-[11px] leading-relaxed resize-none h-16 transition-all scrollbar-hide"
                              placeholder="Actual outcome..."
                              value={step.actualResults}
                              onChange={(e) => updateStep(idx, 'actualResults', e.target.value)}
                            />
                          </td>
                          <td className="p-2 align-middle bg-blue-50/10">
                            <select 
                              className={cn(
                                "w-full bg-transparent text-[10px] font-bold outline-none text-center rounded py-1",
                                step.stepStatus === 'Passed' ? 'text-green-600' : 
                                step.stepStatus === 'Failed' ? 'text-red-600' : 
                                step.stepStatus === 'On-Hold' ? 'text-blue-600' : 'text-gray-400'
                              )}
                              value={step.stepStatus}
                              onChange={(e) => updateStep(idx, 'stepStatus', e.target.value)}
                            >
                              <option value="">- STATUS -</option>
                              <option value="Passed">Passed</option>
                              <option value="Failed">Failed</option>
                              <option value="On-Hold">On-Hold</option>
                            </select>
                          </td>
                          <td className="p-2 align-top bg-blue-50/10">
                            <textarea 
                              className="w-full px-2 py-1.5 bg-transparent border-b border-transparent focus:border-brand-blue outline-none text-[11px] leading-relaxed resize-none h-16 transition-all scrollbar-hide"
                              placeholder="Notes..."
                              value={step.remarks}
                              onChange={(e) => updateStep(idx, 'remarks', e.target.value)}
                            />
                          </td>
                          <td className="p-2 align-middle">
                            <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-100 transition-all">
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => moveStep(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-0"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => moveStep(idx, 'down')}
                                  disabled={idx === steps.length - 1}
                                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-0"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => {
                                    humanizeRow(idx);
                                    updateStep(idx, 'needsReview', false);
                                  }}
                                  className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-all active:scale-90"
                                  title="AI Optimize"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                                {step.needsReview && (
                                  <button 
                                    onClick={() => updateStep(idx, 'needsReview', false)}
                                    className="p-1.5 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200"
                                    title="Mark as reviewed"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => removeStep(idx)}
                                  className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-all active:scale-90"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {steps.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-40 text-center text-gray-400">
                            <div className="flex flex-col items-center gap-4">
                              <TableIcon className="w-16 h-16 opacity-5" />
                              <p className="text-sm font-bold uppercase tracking-[0.2em]">Workspace Empty</p>
                              <button 
                                onClick={() => addStep()} 
                                className="bg-brand-blue text-white px-8 py-2 rounded-full text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
                              >
                                CREATE INITIAL STEP
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  <div className="p-12 flex justify-center">
                    <button 
                      onClick={() => addStep()}
                      className="group flex items-center gap-3 bg-white border-2 border-dashed border-gray-300 px-12 py-4 rounded-2xl text-sm font-bold text-gray-400 hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50/50 transition-all shadow-xl hover:-translate-y-1"
                    >
                      <Plus className="w-5 h-5" /> ADD NEW TEST STEP
                    </button>
                  </div>
                </div>

                <div className="px-6 py-3 bg-white border-t border-gray-200 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span className={cn("flex items-center gap-2", steps.some(s => s.needsReview) ? "text-amber-500" : "text-green-500")}>
                      {steps.some(s => s.needsReview) ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {steps.filter(s => s.needsReview).length ? `${steps.filter(s => s.needsReview).length} STEPS NEED REVIEW` : 'ALL STEPS REVIEWED'}
                    </span>
                    <span className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Excel Schema Synced</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-blue transition-all duration-500" 
                        style={{ width: `${(steps.filter(s => !s.needsReview).length / Math.max(steps.length, 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">
                      {Math.round((steps.filter(s => !s.needsReview).length / Math.max(steps.length, 1)) * 100)}% COMPLETE
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Corporate Footer */}
      <footer className="bg-white border-t border-gray-200 px-8 py-3 flex justify-between text-[9px] text-gray-400 uppercase tracking-widest shrink-0 font-bold items-center">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Live: v2.5.4-LTS
          </span>
          <span>Project: {metadata.scenarioTitle}</span>
          <span>Tester: {metadata.testedBy || 'Awaiting Sync'}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded">
            <span>QA Coverage:</span>
            <span className="text-brand-blue font-black">99.7%</span>
          </div>
          <span className="text-gray-300">|</span>
          <span>© {new Date().getFullYear()} TECHCORE GLOBAL QA SYSTEMS</span>
        </div>
      </footer>
    </div>
  );
}
