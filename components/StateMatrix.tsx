import React, { useState } from 'react';
import { Binary, Hash } from 'lucide-react';

interface StateMatrixProps {
  matrix: number[][];
  label: string;
  highlight?: boolean;
  color?: 'blue' | 'purple' | 'green' | 'amber';
}

const formatNibble = (n: number) => n.toString(16).toUpperCase();
const formatBinary = (n: number) => n.toString(2).padStart(4, '0');

export const StateMatrix: React.FC<StateMatrixProps> = ({ matrix, label, highlight = false, color = 'blue' }) => {
  const [showBinary, setShowBinary] = useState(false);

  const colorStyles = {
    blue: 'border-blue-500/30 bg-blue-500/5 text-blue-200',
    purple: 'border-purple-500/30 bg-purple-500/5 text-purple-200',
    green: 'border-green-500/30 bg-green-500/5 text-green-200',
    amber: 'border-amber-500/30 bg-amber-500/5 text-amber-200',
  };

  const activeStyle = colorStyles[color];

  // Reconstruct 16-bit value: n0 n1 n2 n3
  // Matrix is: [[n0, n2], [n1, n3]] (Column Major)
  const n0 = matrix[0][0];
  const n1 = matrix[1][0];
  const n2 = matrix[0][1];
  const n3 = matrix[1][1];
  
  const hexStr = `${formatNibble(n0)}${formatNibble(n1)}${formatNibble(n2)}${formatNibble(n3)}`;

  return (
    <div className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border ${highlight ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-slate-700 bg-slate-800/50'} transition-all duration-300 min-w-[200px]`}>
      <div className="flex items-center justify-between w-full mb-1 px-1">
        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">{label}</span>
        <button 
           onClick={() => setShowBinary(!showBinary)}
           className="text-slate-500 hover:text-indigo-400 transition-colors p-1 rounded hover:bg-slate-700/50 flex items-center gap-1 group"
           title={showBinary ? "Switch to Hex view" : "Switch to Binary view"}
        >
           {showBinary ? <Hash size={14} className="group-hover:scale-110 transition-transform" /> : <Binary size={14} className="group-hover:scale-110 transition-transform" />}
           <span className="text-[9px] font-mono">{showBinary ? 'HEX' : 'BIN'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Column 0 */}
        <div className="flex flex-col gap-2">
           <NibbleBox val={n0} activeStyle={activeStyle} showBinary={showBinary} label="n₀" />
           <NibbleBox val={n1} activeStyle={activeStyle} showBinary={showBinary} label="n₁" />
        </div>
        {/* Column 1 */}
        <div className="flex flex-col gap-2">
           <NibbleBox val={n2} activeStyle={activeStyle} showBinary={showBinary} label="n₂" />
           <NibbleBox val={n3} activeStyle={activeStyle} showBinary={showBinary} label="n₃" />
        </div>
      </div>
      
      {/* Full 16-bit State Footer */}
      <div className="w-full mt-3 pt-3 border-t border-slate-700/50">
        <div className="flex justify-between items-center mb-1 px-1">
           <span className="text-[9px] text-slate-500 uppercase tracking-wider">
             {showBinary ? 'Full State (16-bit)' : 'Full State (Hex)'}
           </span>
        </div>
        <div className="font-mono text-[11px] text-center tracking-wider bg-slate-900/60 p-2 rounded border border-slate-700/50 shadow-inner min-h-[44px] flex flex-col items-center justify-center">
          {showBinary ? (
             <>
               <div className="flex gap-1 mb-1">
                 <span className="text-indigo-400 font-bold bg-indigo-500/10 px-1 rounded border border-indigo-500/20" title="n0">{formatBinary(n0)}</span>
                 <span className="text-indigo-300 bg-indigo-500/5 px-1 rounded border border-indigo-500/10" title="n1">{formatBinary(n1)}</span>
                 <span className="text-indigo-400 font-bold bg-indigo-500/10 px-1 rounded border border-indigo-500/20" title="n2">{formatBinary(n2)}</span>
                 <span className="text-indigo-300 bg-indigo-500/5 px-1 rounded border border-indigo-500/10" title="n3">{formatBinary(n3)}</span>
               </div>
               <div className="flex justify-between w-full px-2 text-[8px] text-slate-500 font-mono opacity-60">
                  <span>n₀</span>
                  <span>n₁</span>
                  <span>n₂</span>
                  <span>n₃</span>
               </div>
             </>
          ) : (
             <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">0x</span>
                <span className="text-lg font-bold text-indigo-300 tracking-[0.2em]">{hexStr}</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NibbleBox = ({ val, activeStyle, showBinary, label }: { val: number, activeStyle: string, showBinary: boolean, label?: string }) => (
  <div className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg border ${activeStyle} font-mono transition-all duration-300 relative overflow-hidden group`}>
    {label && <span className="absolute top-0.5 right-1 text-[8px] text-slate-500/50">{label}</span>}
    {showBinary ? (
       <>
         <span className="text-sm font-bold tracking-widest text-indigo-100">{formatBinary(val)}</span>
         <span className="text-[10px] opacity-40 mt-1 absolute bottom-1">0x{formatNibble(val)}</span>
       </>
    ) : (
       <>
         <span className="text-2xl font-bold">{formatNibble(val)}</span>
         <span className="text-[9px] opacity-40 mt-1 absolute bottom-1 group-hover:opacity-100 transition-opacity">{formatBinary(val)}</span>
       </>
    )}
  </div>
);
