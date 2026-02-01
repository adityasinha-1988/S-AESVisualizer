import React, { useState, useEffect } from 'react';
import { ArrowRight, TableProperties, Search } from 'lucide-react';
import { SBOX, ISBOX } from '../services/saes';

interface SubNibblesVisualizerProps {
  inputMatrix: number[][];
  outputMatrix: number[][];
  isInverse: boolean;
}

export const SubNibblesVisualizer: React.FC<SubNibblesVisualizerProps> = ({ inputMatrix, outputMatrix, isInverse }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 4);
    }, 2500); // Cycle every 2.5s
    return () => clearInterval(interval);
  }, []);

  // Map linear index 0..3 to matrix coords [row, col]
  // n0=(0,0), n1=(1,0), n2=(0,1), n3=(1,1)
  const getCoords = (idx: number) => {
    if (idx === 0) return [0, 0];
    if (idx === 1) return [1, 0];
    if (idx === 2) return [0, 1];
    return [1, 1];
  };

  const [r, c] = getCoords(activeIndex);
  const inVal = inputMatrix[r][c];
  const outVal = outputMatrix[r][c];
  
  const currentSBox = isInverse ? ISBOX : SBOX;

  // Helper to render a matrix with highlight capability
  const renderMatrix = (matrix: number[][], title: string, isInput: boolean) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900 rounded-xl border border-slate-700 shadow-inner">
        {[0, 1].map(col => (
          <div key={col} className="flex flex-col gap-2">
            {[0, 1].map(row => {
               const isActive = row === r && col === c;
               const cellIdx = col * 2 + row; 
               const isDone = cellIdx < activeIndex; 
               
               let styleClass = '';
               if (isInput) {
                 styleClass = isActive 
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-100 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.4)] z-10'
                    : 'border-slate-700 bg-slate-800/50 text-slate-500 opacity-50';
               } else {
                 if (isActive) {
                    styleClass = 'border-emerald-500 bg-emerald-500/20 text-emerald-100 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.4)] z-10';
                 } else if (isDone) {
                    styleClass = 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200/70';
                 } else {
                    styleClass = 'border-slate-800 bg-slate-900/50 text-transparent border-dashed opacity-30';
                 }
               }

               return (
                 <div key={`${row}-${col}`} className={`
                   w-14 h-14 flex items-center justify-center rounded-lg border-2 font-mono text-lg font-bold transition-all duration-300
                   ${styleClass}
                 `}>
                   {matrix[row][col].toString(16).toUpperCase()}
                 </div>
               );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 py-4 w-full">
       {/* INPUT */}
       {renderMatrix(inputMatrix, isInverse ? "Ciphertext State" : "State Input", true)}
       
       {/* S-BOX LOOKUP ANIMATION */}
       <div className="flex flex-col items-center gap-4 relative">
          
          {/* Connecting Lines (Visual decoration for Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10"></div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 shadow-2xl relative z-0">
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-2 text-[10px] uppercase font-bold text-slate-500 border border-slate-700 rounded-full flex items-center gap-1 whitespace-nowrap shadow-sm">
                <TableProperties size={12} className="text-amber-500"/>
                {isInverse ? 'Inverse S-Box' : 'S-Box'} Lookup
             </div>

             <div className="grid grid-cols-4 gap-1.5 mt-2">
                {currentSBox.map((val, idx) => {
                   const isActive = idx === inVal;
                   return (
                     <div key={idx} className={`
                        w-8 h-8 flex items-center justify-center rounded text-xs font-mono font-bold border transition-all duration-500 relative
                        ${isActive 
                           ? 'bg-amber-500 text-slate-950 border-amber-400 scale-125 z-10 shadow-[0_0_15px_rgba(245,158,11,0.6)]' 
                           : 'bg-slate-900 text-slate-600 border-slate-800'}
                     `}>
                        {val.toString(16).toUpperCase()}
                     </div>
                   );
                })}
             </div>
             
             {/* Dynamic Explanation */}
             <div className="mt-4 flex items-center justify-center gap-3 text-sm font-mono bg-slate-900/50 p-2 rounded border border-slate-800">
                <div className="flex flex-col items-center">
                   <span className="text-[9px] text-slate-500 uppercase">Input</span>
                   <span className="text-indigo-400 font-bold">{inVal.toString(16).toUpperCase()}</span>
                </div>
                <ArrowRight size={14} className="text-slate-600" />
                <div className="flex flex-col items-center">
                    <span className="text-[9px] text-slate-500 uppercase">Index</span>
                    <Search size={14} className="text-amber-500" />
                </div>
                <ArrowRight size={14} className="text-slate-600" />
                <div className="flex flex-col items-center">
                   <span className="text-[9px] text-slate-500 uppercase">Output</span>
                   <span className="text-emerald-400 font-bold">{outVal.toString(16).toUpperCase()}</span>
                </div>
             </div>
          </div>

       </div>

       {/* OUTPUT */}
       {renderMatrix(outputMatrix, isInverse ? "Decrypted State" : "Subbed State", false)}
    </div>
  );
};
