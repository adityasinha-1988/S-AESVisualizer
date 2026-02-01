import React from 'react';
import { ArrowDown } from 'lucide-react';

interface InputVisualizerProps {
  input: number;
  label: string;
}

export const InputVisualizer: React.FC<InputVisualizerProps> = ({ input, label }) => {
  const binaryStr = input.toString(2).padStart(16, '0');
  const nibbles = [
    (input >> 12) & 0xF,
    (input >> 8) & 0xF,
    (input >> 4) & 0xF,
    input & 0xF
  ];

  const formatBinary = (n: number) => n.toString(2).padStart(4, '0');

  return (
    <div className="flex flex-col items-center gap-8 p-6">
      {/* Linear Representation */}
      <div className="flex flex-col items-center gap-2">
         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label} (16-bit)</span>
         <div className="flex gap-1 md:gap-2 font-mono text-xl md:text-2xl bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-lg">
            <span className="text-indigo-400 font-bold">{binaryStr.slice(0, 4)}</span>
            <span className="text-emerald-400 font-bold">{binaryStr.slice(4, 8)}</span>
            <span className="text-amber-400 font-bold">{binaryStr.slice(8, 12)}</span>
            <span className="text-purple-400 font-bold">{binaryStr.slice(12, 16)}</span>
         </div>
         <div className="flex w-full justify-between px-2 text-[10px] text-slate-500 font-mono">
            <span>nibble 0</span>
            <span>nibble 1</span>
            <span>nibble 2</span>
            <span>nibble 3</span>
         </div>
      </div>

      <div className="flex flex-col items-center text-slate-600 gap-1">
         <span className="text-[10px] uppercase font-bold tracking-widest">Column-Major Order</span>
         <ArrowDown className="animate-bounce" />
      </div>

      {/* Matrix Mapping */}
      <div className="flex flex-col items-center gap-2">
         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">State Matrix (2x2)</span>
         <div className="grid grid-cols-2 gap-4 p-6 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed relative">
            
            {/* Column 0 */}
            <div className="flex flex-col gap-4">
                <NibbleCard val={nibbles[0]} color="indigo" label="0,0 (n0)" />
                <NibbleCard val={nibbles[1]} color="emerald" label="1,0 (n1)" />
            </div>
             {/* Column 1 */}
            <div className="flex flex-col gap-4">
                <NibbleCard val={nibbles[2]} color="amber" label="0,1 (n2)" />
                <NibbleCard val={nibbles[3]} color="purple" label="1,1 (n3)" />
            </div>

            {/* Labels for Rows/Cols */}
            <span className="absolute -top-4 left-1/4 -translate-x-1/2 text-[9px] text-slate-600 font-mono">Col 0</span>
            <span className="absolute -top-4 left-3/4 -translate-x-1/2 text-[9px] text-slate-600 font-mono">Col 1</span>
            
         </div>
      </div>
      
      <p className="text-slate-400 text-sm max-w-md text-center mt-2">
         The input is divided into 4 nibbles and arranged into the State Matrix by filling columns first.
      </p>
    </div>
  );
};

const NibbleCard = ({ val, color, label }: { val: number, color: string, label: string }) => {
  const colors: Record<string, string> = {
    indigo: 'border-indigo-500/50 text-indigo-200 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]',
    emerald: 'border-emerald-500/50 text-emerald-200 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    amber: 'border-amber-500/50 text-amber-200 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    purple: 'border-purple-500/50 text-purple-200 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
  };

  return (
    <div className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-xl border-2 ${colors[color]} transition-transform hover:scale-105`}>
       <span className="text-3xl font-bold font-mono tracking-tighter">{val.toString(16).toUpperCase()}</span>
       <span className="text-xs opacity-60 font-mono mt-1">{val.toString(2).padStart(4,'0')}</span>
       <div className="absolute -bottom-6 text-[10px] text-slate-500 font-mono font-bold whitespace-nowrap">{label}</div>
    </div>
  );
};
