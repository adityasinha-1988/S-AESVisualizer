import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateTrace } from './services/saes';
import { explainStepWithAI } from './services/gemini';
import { SAESTraceStep, SAESStep, SAESMode } from './types';
import { Controls } from './components/Controls';
import { StateMatrix } from './components/StateMatrix';
import { KeyExpansionVisualizer } from './components/KeyExpansionVisualizer';
import { SubNibblesVisualizer } from './components/SubNibblesVisualizer';
import { ShiftRowVisualizer } from './components/ShiftRowVisualizer';
import { MixColumnsVisualizer } from './components/MixColumnsVisualizer';
import { InputVisualizer } from './components/InputVisualizer';
import { AddRoundKeyVisualizer } from './components/AddRoundKeyVisualizer';
import { BrainCircuit, Info, Sparkles, ChevronRight, Lock, Unlock, Key, ArrowRightLeft } from 'lucide-react';

// Default values
const DEFAULT_INPUT = 0xD728; // Binary: 1101 0111 0010 1000
const DEFAULT_KEY = 0x4AF5;      // Binary: 0100 1010 1111 0101

const App: React.FC = () => {
  // State
  const [mode, setMode] = useState<SAESMode>(SAESMode.ENCRYPTION);
  const [inputVal, setInputVal] = useState<string>(DEFAULT_INPUT.toString(16).toUpperCase());
  const [keyInput, setKeyInput] = useState<string>(DEFAULT_KEY.toString(16).toUpperCase());
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Derived State
  const inputNum = parseInt(inputVal, 16) || 0;
  const key = parseInt(keyInput, 16) || 0;
  
  const trace = useMemo(() => generateTrace(inputNum, key, mode), [inputNum, key, mode]);
  const currentStep = trace[currentStepIndex];
  const previousStep = currentStepIndex > 0 ? trace[currentStepIndex - 1] : undefined;

  // Refs for auto-play interval
  const timerRef = useRef<number | null>(null);

  // Effects
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev < trace.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, playbackSpeed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, trace.length]);

  // Handlers
  const handleNext = () => {
    if (currentStepIndex < trace.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setAiExplanation(null);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setAiExplanation(null);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    setAiExplanation(null);
  };

  const handleAskAI = async () => {
    setIsAiLoading(true);
    const explanation = await explainStepWithAI(currentStep, previousStep);
    setAiExplanation(explanation);
    setIsAiLoading(false);
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 4); // Limit to 4 hex chars
    if (/^[0-9A-Fa-f]*$/.test(val)) {
      setter(val.toUpperCase());
      handleReset(); // Reset visualizer on input change
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === SAESMode.ENCRYPTION ? SAESMode.DECRYPTION : SAESMode.ENCRYPTION);
    handleReset();
  };

  // Helper to visualize the transformation flow
  const renderFlow = () => {
    // 1. Initial Inputs
    if (currentStep.id === SAESStep.INPUTS) {
      return (
        <InputVisualizer 
          input={currentStep.state.raw} 
          label={mode === SAESMode.ENCRYPTION ? "Plaintext" : "Ciphertext"} 
        />
      );
    }

    // 2. Key Expansion
    if (currentStep.id === SAESStep.KEY_EXPANSION) {
       return currentStep.expandedWords ? (
         <KeyExpansionVisualizer words={currentStep.expandedWords} />
       ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-600 rounded-xl">
             <Key className="w-12 h-12 text-amber-500 mb-4" />
             <h3 className="text-xl font-bold text-amber-500">Key Schedule Generated</h3>
             <pre className="mt-4 text-left bg-slate-900 p-4 rounded text-sm font-mono text-slate-300">
               {currentStep.details}
             </pre>
        </div>
       );
    }

    // 3. Sub Nibbles (Animation)
    if (previousStep && (
        currentStep.id === SAESStep.ROUND_1_SUB_NIBBLES || 
        currentStep.id === SAESStep.ROUND_2_SUB_NIBBLES ||
        currentStep.id === SAESStep.DEC_ROUND_1_INV_SUB_NIBBLES ||
        currentStep.id === SAESStep.DEC_ROUND_2_INV_SUB_NIBBLES
    )) {
      const isInv = currentStep.id.includes("Inv");
      return (
        <SubNibblesVisualizer 
          inputMatrix={previousStep.state.matrix} 
          outputMatrix={currentStep.state.matrix} 
          isInverse={isInv} 
        />
      );
    }

    // 4. Shift Row (Animation)
    if (previousStep && (
        currentStep.id === SAESStep.ROUND_1_SHIFT_ROW ||
        currentStep.id === SAESStep.ROUND_2_SHIFT_ROW ||
        currentStep.id === SAESStep.DEC_ROUND_1_SHIFT_ROW ||
        currentStep.id === SAESStep.DEC_ROUND_2_SHIFT_ROW
    )) {
       return (
         <ShiftRowVisualizer 
           inputMatrix={previousStep.state.matrix} 
           isInverse={currentStep.id.includes("Inv")} // Actually ShiftRow is its own inverse for 2 cols, but label might matter
         />
       );
    }

    // 5. Mix Columns (Animation)
    if (previousStep && (
      currentStep.id === SAESStep.ROUND_1_MIX_COLUMNS ||
      currentStep.id === SAESStep.DEC_ROUND_1_INV_MIX_COLUMNS
    )) {
      const isInv = currentStep.id.includes("Inv");
      return (
        <MixColumnsVisualizer
          inputMatrix={previousStep.state.matrix}
          outputMatrix={currentStep.state.matrix}
          isInverse={isInv}
        />
      );
    }

    // 6. Add Round Key (Animation & Detail)
    if (previousStep && currentStep.id.includes("Add Round Key") && currentStep.key !== undefined) {
      return (
        <AddRoundKeyVisualizer 
          inputMatrix={previousStep.state.matrix} 
          roundKey={currentStep.key}
          outputMatrix={currentStep.state.matrix}
        />
      );
    }

    // 7. Output / Fallback
    return (
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
        {previousStep && (
           <StateMatrix matrix={previousStep.state.matrix} label="Previous State" color="blue" />
        )}
        
        {previousStep && (
          <div className="flex flex-col items-center text-slate-500">
            <ChevronRight size={32} />
          </div>
        )}

        <StateMatrix matrix={currentStep.state.matrix} label="Current State" highlight color="green" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Header */}
        <div className="lg:col-span-12 flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg transition-colors ${mode === SAESMode.ENCRYPTION ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                {mode === SAESMode.ENCRYPTION ? <Lock className="text-white" size={24} /> : <Unlock className="text-white" size={24} />}
             </div>
             <div>
               <h1 className="text-2xl font-bold text-white tracking-tight">S-AES Visualizer</h1>
               <div className="flex items-center gap-2">
                 <p className="text-sm text-slate-400">Simplified Advanced Encryption Standard</p>
                 <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${mode === SAESMode.ENCRYPTION ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                   {mode}
                 </span>
               </div>
             </div>
          </div>
          <div className="flex gap-4 items-center">
             <button 
               onClick={toggleMode}
               className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium transition-all"
             >
               <ArrowRightLeft size={14} />
               Switch to {mode === SAESMode.ENCRYPTION ? 'Decryption' : 'Encryption'}
             </button>
             <a href="https://www.rose-hulman.edu/class/ma/holden/Archived_Courses/Math479-0304/lectures/s-aes.pdf" target="_blank" rel="noreferrer" className="hidden sm:flex text-xs text-indigo-400 hover:text-indigo-300 underline items-center gap-1">
               <Info size={14}/> PDF
             </a>
          </div>
        </div>

        {/* Left Column: Controls & Context */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Inputs */}
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Configuration (Hex)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  {mode === SAESMode.ENCRYPTION ? 'Plaintext' : 'Ciphertext'} (16-bit)
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={inputVal}
                    onChange={handleInputChange(setInputVal)}
                    className={`w-full bg-slate-800 border border-slate-700 rounded-lg p-2 font-mono text-center text-lg focus:ring-2 outline-none transition-all ${mode === SAESMode.ENCRYPTION ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'}`}
                    maxLength={4}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Key (16-bit)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={keyInput}
                    onChange={handleInputChange(setKeyInput)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 font-mono text-center text-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    maxLength={4}
                  />
                  <Key size={14} className="absolute top-3 right-3 text-amber-500 opacity-50"/>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 flex-1 min-h-[300px] overflow-hidden flex flex-col">
             <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Algorithm Trace</h2>
             <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {trace.map((step, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                        setIsPlaying(false);
                        setCurrentStepIndex(idx);
                        setAiExplanation(null);
                    }}
                    className={`p-3 rounded-lg cursor-pointer text-sm border transition-all ${
                      idx === currentStepIndex 
                        ? mode === SAESMode.ENCRYPTION 
                           ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-100' 
                           : 'bg-emerald-900/30 border-emerald-500/50 text-emerald-100'
                        : idx < currentStepIndex
                          ? 'bg-slate-800/30 border-slate-800 text-slate-500'
                          : 'bg-transparent border-transparent text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                       <span className="font-mono font-bold text-xs mr-2">{idx.toString().padStart(2,'0')}</span>
                       <span className="flex-1 truncate">{step.id}</span>
                       {idx === currentStepIndex && <div className={`w-2 h-2 rounded-full animate-pulse ${mode === SAESMode.ENCRYPTION ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>}
                    </div>
                  </div>
                ))}
             </div>
          </div>

        </div>

        {/* Right Column: Visualization */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main Visualizer Card */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl relative min-h-[400px] flex flex-col">
            <div className="absolute top-4 right-4 text-slate-600 font-mono text-xs">
               Step {currentStepIndex + 1} / {trace.length}
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">{currentStep.id}</h2>
            <p className="text-slate-400 mb-8 max-w-2xl">{currentStep.description}</p>

            <div className="flex-1 flex items-center justify-center bg-slate-950/50 rounded-xl border border-slate-800/50 p-8 overflow-x-auto">
               {renderFlow()}
            </div>

            <div className="mt-8 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
               <div className="flex items-center gap-2 mb-2">
                 <BrainCircuit size={16} className={mode === SAESMode.ENCRYPTION ? "text-indigo-400" : "text-emerald-400"} />
                 <span className={`text-xs font-bold uppercase ${mode === SAESMode.ENCRYPTION ? "text-indigo-200" : "text-emerald-200"}`}>Technical Detail</span>
               </div>
               <p className="text-sm text-slate-300 font-mono leading-relaxed">
                 {currentStep.details}
               </p>
            </div>
          </div>

          {/* Controls & AI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controls 
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              onNext={handleNext}
              onPrev={handlePrev}
              onReset={handleReset}
              canNext={currentStepIndex < trace.length - 1}
              canPrev={currentStepIndex > 0}
              speed={playbackSpeed}
              setSpeed={setPlaybackSpeed}
            />

            <div className="bg-gradient-to-br from-slate-900 to-indigo-950/30 p-4 rounded-xl border border-indigo-500/20 shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2">
                      <Sparkles className="text-amber-400" size={18} />
                      <span className="font-semibold text-slate-200">AI Tutor</span>
                   </div>
                   {!aiExplanation && (
                     <button 
                       onClick={handleAskAI}
                       disabled={isAiLoading}
                       className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                     >
                       {isAiLoading ? "Thinking..." : "Explain This Step"}
                     </button>
                   )}
                </div>
                
                <div className="flex-1 bg-slate-950/50 rounded-lg p-3 text-sm text-slate-300 min-h-[80px] border border-slate-800/50 overflow-y-auto">
                   {aiExplanation ? (
                     <p className="leading-relaxed animate-in fade-in duration-500">{aiExplanation}</p>
                   ) : (
                     <p className="text-slate-600 italic text-center mt-4">
                       Click "Explain This Step" to get a detailed breakdown powered by Gemini 2.0 Flash.
                     </p>
                   )}
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;
