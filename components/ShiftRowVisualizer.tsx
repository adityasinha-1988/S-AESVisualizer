import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, MoveHorizontal } from 'lucide-react';

interface ShiftRowVisualizerProps {
  inputMatrix: number[][]; // [row][col]
  isInverse: boolean;
}

const formatNibble = (n: number) => n.toString(16).toUpperCase();
const formatBinary = (n: number) => n.toString(2).padStart(4, '0');

const NibbleBox = ({ val, highlight = false, color = 'blue' }: { val: number, highlight?: boolean, color?: string }) => {
  const styles = {
    blue: 'border-blue-500/30 bg-blue-500/5 text-blue-200',
    purple: 'border-purple-500/30 bg-purple-500/5 text-purple-200',
    amber: 'border-amber-500/50 bg-amber-500/10 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
  };
  
  const baseStyle = styles[color as keyof typeof styles] || styles.blue;
  const activeClass = highlight ? 'scale-110 z-10 border-amber-500 bg-amber-500/20' : '';

  return (
    <div className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg border-2 font-mono transition-all duration-500 ${baseStyle} ${activeClass}`}>
      <span className="text-xl font-bold">{formatNibble(val)}</span>
      <span className="text-[10px] opacity-60">{formatBinary(val)}</span>
    </div>
  );
};

export const ShiftRowVisualizer: React.FC<ShiftRowVisualizerProps> = ({ inputMatrix, isInverse }) => {
  const [swapped, setSwapped] = useState(false);

  useEffect(() => {
    // Reset and trigger animation
    setSwapped(false);
    const timer = setTimeout(() => {
      setSwapped(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [inputMatrix]);

  // Extract nibbles
  const n00 = inputMatrix[0][0];
  const n01 = inputMatrix[0][1];
  const n10 = inputMatrix[1][0]; // Bottom-Left
  const n11 = inputMatrix[1][1]; // Bottom-Right

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
      <div className="flex items-center gap-2 mb-2">
         <MoveHorizontal className="text-amber-400" />
         <h3 className="text-lg font-bold text-slate-200">
           {isInverse ? "Inverse Shift Row" : "Shift Row"}
         </h3>
      </div>
      
      <div className="relative p-6 bg-slate-900 rounded-xl border border-slate-700 shadow-xl">
        {/* Grid Container */}
        <div className="flex flex-col gap-2">
          
          {/* Row 0: Static */}
          <div className="flex gap-2 relative">
             <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">Row 0</div>
             <NibbleBox val={n00} color="blue" />
             <NibbleBox val={n01} color="blue" />
             <div className="absolute -right-24 top-1/2 -translate-y-1/2 text-xs text-slate-600 italic">No Change</div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-800 w-full"></div>

          {/* Row 1: Animated */}
          <div className="flex gap-2 relative h-16 w-[8.5rem]"> 
             <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wider">Row 1</div>
             
             {/* Left Slot (Initial n10) */}
             <div className={`absolute top-0 left-0 transition-all duration-1000 ease-in-out ${swapped ? 'translate-x-[4.5rem]' : 'translate-x-0'}`}>
                <NibbleBox val={n10} highlight color="amber" />
                <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-300 ${swapped ? 'opacity-0' : 'opacity-100'}`}>
                   <span className="text-[10px] text-amber-500/50 font-mono">1,0</span>
                </div>
             </div>

             {/* Right Slot (Initial n11) */}
             <div className={`absolute top-0 right-0 transition-all duration-1000 ease-in-out ${swapped ? '-translate-x-[4.5rem]' : 'translate-x-0'}`}>
                <NibbleBox val={n11} highlight color="amber" />
                <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-300 ${swapped ? 'opacity-0' : 'opacity-100'}`}>
                   <span className="text-[10px] text-amber-500/50 font-mono">1,1</span>
                </div>
             </div>
             
             {/* Swap Icon indicating action */}
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 transition-opacity duration-500 ${swapped ? 'opacity-100' : 'opacity-0'}`}>
                 <ArrowLeftRight size={20} className="text-slate-600" />
             </div>

             <div className="absolute -right-24 top-1/2 -translate-y-1/2 text-xs text-amber-500 font-bold flex items-center gap-1 opacity-0 animate-[fadeIn_0.5s_ease-out_1s_forwards]">
                <ArrowLeftRight size={12} /> Swap
             </div>
          </div>

        </div>
      </div>

      <p className="text-slate-400 text-sm max-w-xs text-center">
        The nibbles in the second row are swapped. <br/>
        <span className="text-xs text-slate-500">(In standard AES, this is a cyclic shift, but for 2 columns, it's just a swap)</span>
      </p>
    </div>
  );
};
