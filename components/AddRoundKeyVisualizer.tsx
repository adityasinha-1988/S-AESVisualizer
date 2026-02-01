import React, { useState, useEffect } from 'react';
import { Equal, ScanLine, ArrowBigDown } from 'lucide-react';
import { StateMatrix } from './StateMatrix';

interface AddRoundKeyVisualizerProps {
  inputMatrix: number[][]; // The State before XOR
  roundKey: number;        // The Key integer
  outputMatrix: number[][]; // The State after XOR
}

const toNibbles = (val: number): number[] => [
  (val >> 12) & 0xF,
  (val >> 8) & 0xF,
  (val >> 4) & 0xF,
  val & 0xF
];

// Matrix is col-major: [[n0, n2], [n1, n3]]
// But roundKey integer is usually linear n0,n1,n2,n3
const keyToMatrix = (k: number): number[][] => {
  const n = toNibbles(k);
  return [[n[0], n[2]], [n[1], n[3]]];
};

const formatBinary = (n: number) => n.toString(2).padStart(4, '0');

export const AddRoundKeyVisualizer: React.FC<AddRoundKeyVisualizerProps> = ({ inputMatrix, roundKey, outputMatrix }) => {
  const [activeNibbleIdx, setActiveNibbleIdx] = useState(0);
  const [hoverBitIdx, setHoverBitIdx] = useState<number | null>(null);

  const keyMatrix = keyToMatrix(roundKey);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNibbleIdx(prev => (prev + 1) % 4);
    }, 3000); // Cycle every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Map linear index 0..3 to matrix coords [row, col] (Column Major)
  // 0->(0,0), 1->(1,0), 2->(0,1), 3->(1,1)
  const getCoords = (idx: number) => {
    if (idx === 0) return [0, 0];
    if (idx === 1) return [1, 0];
    if (idx === 2) return [0, 1];
    return [1, 1];
  };

  const [r, c] = getCoords(activeNibbleIdx);
  
  const valState = inputMatrix[r][c];
  const valKey = keyMatrix[r][c];
  const valResult = outputMatrix[r][c];

  // Bit arrays for detailed visualization
  const bitsState = formatBinary(valState).split('').map(Number);
  const bitsKey = formatBinary(valKey).split('').map(Number);
  const bitsResult = formatBinary(valResult).split('').map(Number);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      
      {/* 1. Matrix Equation Level */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
        <div className="flex flex-col items-center gap-2">
           <StateMatrix matrix={inputMatrix} label="Current State" color="blue" highlight={false} />
        </div>
        
        <div className="flex flex-col items-center text-amber-500">
           <div className="w-8 h-8 rounded-full border-2 border-amber-500 flex items-center justify-center font-bold text-xl mb-1">⊕</div>
           <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">XOR</span>
        </div>

        <div className="flex flex-col items-center gap-2">
           <StateMatrix matrix={keyMatrix} label="Round Key" color="amber" highlight={false} />
        </div>

        <Equal className="text-slate-600" size={24} />

        <div className="flex flex-col items-center gap-2">
           <StateMatrix matrix={outputMatrix} label="New State" color="emerald" highlight={true} />
        </div>
      </div>

      {/* 2. Bitwise Deep Dive Level */}
      <div className="w-full max-w-xl relative">
        <div className="absolute inset-0 bg-indigo-500/5 blur-xl"></div>
        
        <div className="relative bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <ScanLine size={18} className="text-indigo-400" />
                    <div>
                        <span className="text-sm font-bold text-slate-200 block">Bitwise XOR Operation</span>
                        <span className="text-[10px] text-slate-400">Processing Nibble {activeNibbleIdx} (Row {r}, Col {c})</span>
                    </div>
                </div>
                <div className="text-[10px] font-mono text-indigo-300 bg-indigo-900/20 px-2 py-1 rounded border border-indigo-500/30 animate-pulse">
                    Autoplaying...
                </div>
            </div>

            <div className="p-6">
                
                {/* Visualization Grid */}
                <div className="grid grid-cols-[80px_1fr] gap-4 mb-4">
                     {/* Labels Column */}
                     <div className="flex flex-col justify-between text-right font-mono text-xs font-bold text-slate-500 py-2 min-h-[160px]">
                        <div className="flex items-center justify-end h-10">State</div>
                        <div className="flex items-center justify-end h-10 text-amber-500/80">Key</div>
                        <div className="flex items-center justify-end h-10 text-emerald-400">Result</div>
                     </div>

                     {/* Bit Columns Container */}
                     <div className="grid grid-cols-4 gap-2">
                        {bitsState.map((bState, i) => {
                            const bKey = bitsKey[i];
                            const bRes = bitsResult[i];
                            const isHovered = hoverBitIdx === i;
                            const willFlip = bKey === 1;

                            return (
                                <div 
                                    key={i}
                                    onMouseEnter={() => setHoverBitIdx(i)}
                                    onMouseLeave={() => setHoverBitIdx(null)}
                                    className={`
                                        relative flex flex-col justify-between p-2 rounded-lg transition-all duration-200 cursor-crosshair min-h-[160px]
                                        ${isHovered ? 'bg-slate-800 ring-1 ring-slate-600' : 'bg-transparent'}
                                    `}
                                >
                                    {/* State Bit */}
                                    <div className={`
                                        h-10 flex items-center justify-center rounded border-2 font-mono font-bold text-lg transition-all
                                        ${willFlip 
                                            ? 'bg-blue-500/10 border-blue-500/50 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                                            : 'bg-slate-900 border-slate-700 text-slate-500'}
                                    `}>
                                        {bState}
                                    </div>

                                    {/* Operator/Arrow visual */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+1.5rem)] z-10">
                                       {willFlip ? (
                                           <div className="bg-slate-900 text-amber-500 rounded-full p-0.5 border border-amber-500/50">
                                              <ArrowBigDown size={12} fill="currentColor" />
                                           </div>
                                       ) : (
                                          <div className="h-6 w-px bg-slate-800"></div>
                                       )}
                                    </div>

                                    {/* Key Bit */}
                                    <div className={`
                                        h-10 flex items-center justify-center rounded border-2 font-mono font-bold text-lg transition-all
                                        ${bKey === 1 
                                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                                            : 'bg-slate-900 border-slate-700 text-slate-700 opacity-50'}
                                    `}>
                                        {bKey}
                                    </div>

                                    {/* Operator/Equal visual */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[calc(50%+1.5rem)] z-10 opacity-30">
                                        <div className="h-6 w-px bg-slate-700"></div>
                                    </div>

                                    {/* Result Bit */}
                                    <div className={`
                                        h-10 flex items-center justify-center rounded border-2 font-mono font-bold text-lg transition-all
                                        ${willFlip 
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105' 
                                            : 'bg-slate-900/50 border-slate-700 text-slate-500'}
                                    `}>
                                        {bRes}
                                    </div>
                                    
                                    {/* Tooltip on Hover */}
                                    {isHovered && (
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-700 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-20 pointer-events-none">
                                            <span className="text-blue-300">{bState}</span> <span className="text-slate-500">⊕</span> <span className="text-amber-300">{bKey}</span> <span className="text-slate-500">=</span> <span className="text-emerald-300 font-bold">{bRes}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                     </div>
                </div>

                {/* Legend/Explanation */}
                <div className="flex gap-4 justify-center text-xs text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-500/20 border border-amber-500 rounded"></div>
                        <span>Key = 1 (Flip)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-slate-800 border border-slate-700 rounded text-slate-600 flex items-center justify-center text-[8px]">0</div>
                        <span>Key = 0 (Keep)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500/20 border border-emerald-500 rounded"></div>
                        <span>Result</span>
                    </div>
                </div>

                <div className="mt-4 text-center">
                   <p className="text-[10px] text-slate-500 italic">
                      Hover over any bit column to see the logic.
                   </p>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};
