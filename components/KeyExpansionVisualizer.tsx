import React from 'react';
import { rotNib, subByte, RCON1, RCON2 } from '../services/saes';
import { ArrowDown, ArrowRight, Zap, RefreshCw, TableProperties, Key } from 'lucide-react';

interface KeyExpansionVisualizerProps {
  words: number[]; // Array of 6 bytes [w0...w5]
}

const formatByte = (b: number) => b.toString(16).toUpperCase().padStart(2, '0');
const formatBinary = (b: number) => b.toString(2).padStart(8, '0');

const WordBox: React.FC<{ 
  val: number, 
  label: string, 
  color: 'blue' | 'purple' | 'amber' | 'slate',
  isResult?: boolean
}> = ({ val, label, color, isResult }) => {
  const colors = {
    blue: 'border-blue-500/50 bg-blue-500/10 text-blue-200',
    purple: 'border-purple-500/50 bg-purple-500/10 text-purple-200',
    amber: 'border-amber-500/50 bg-amber-500/10 text-amber-200',
    slate: 'border-slate-600 bg-slate-800 text-slate-300'
  };

  return (
    <div className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 ${colors[color]} ${isResult ? 'shadow-[0_0_15px_rgba(255,255,255,0.1)]' : ''} min-w-[80px] transition-all`}>
      <span className="text-xs font-bold opacity-70 mb-1">{label}</span>
      <span className="text-lg font-mono font-bold">{formatByte(val)}</span>
      <span className="text-[9px] font-mono opacity-50">{formatBinary(val)}</span>
    </div>
  );
};

const KeyResult: React.FC<{ k: number, label: string, color: 'blue' | 'purple' | 'amber' }> = ({ k, label, color }) => {
    const hex = k.toString(16).toUpperCase().padStart(4, '0');
    const bin = k.toString(2).padStart(16, '0');
    const binPretty = `${bin.slice(0, 8)} ${bin.slice(8)}`;

    const styles = {
        blue: 'text-blue-200 bg-blue-950/40 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
        purple: 'text-purple-200 bg-purple-950/40 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
        amber: 'text-amber-200 bg-amber-950/40 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
    };
    
    const iconColors = {
        blue: 'text-blue-400',
        purple: 'text-purple-400',
        amber: 'text-amber-400'
    };

    return (
        <div className={`mt-6 mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-lg border ${styles[color]} max-w-md transition-all hover:scale-105 cursor-default`}>
             <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-full bg-slate-900/50 ${iconColors[color]}`}>
                    <Key size={14} />
                </div>
                <span className="font-bold text-xs tracking-wider uppercase">{label}</span>
             </div>
             <div className="flex items-baseline gap-3 font-mono">
                <span className="text-xl font-bold">0x{hex}</span>
                <div className="hidden sm:block h-4 w-px bg-current opacity-20"></div>
                <span className="text-[10px] sm:text-xs opacity-70 tracking-widest">{binPretty}</span>
             </div>
        </div>
    )
}

const GFunction: React.FC<{ 
  input: number, 
  rcon: number, 
  result: number, 
  label: string 
}> = ({ input, rcon, result, label }) => {
  const rotated = rotNib(input);
  const subbed = subByte(rotated);
  
  return (
    <div className="flex flex-col bg-slate-900 border border-slate-700 rounded-lg p-3 relative shadow-xl min-w-[180px] z-10 group hover:border-indigo-500/50 transition-colors">
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] px-2 py-0.5 rounded border border-slate-700 text-indigo-400 font-bold flex items-center gap-1 whitespace-nowrap shadow-sm">
         <Zap size={10} className="fill-indigo-400/20" />
         {label}
      </div>
      
      <div className="mt-2 space-y-3">
         
         {/* Step 1: Input & RotNib */}
         <div className="flex flex-col gap-1">
             <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                 <span>Input</span>
                 <div className="flex items-center gap-1 text-orange-400">
                    <RefreshCw size={8} /> <span>RotNib</span>
                 </div>
             </div>
             <div className="flex items-center justify-between bg-slate-950/50 p-1.5 rounded border border-slate-800">
                 <span className="font-mono text-slate-300 text-xs">{formatByte(input)}</span>
                 <div className="flex flex-col items-center px-2">
                    <ArrowRight size={10} className="text-slate-600" />
                 </div>
                 <span className="font-mono text-orange-300 text-xs">{formatByte(rotated)}</span>
             </div>
         </div>

         {/* Step 2: SubNib */}
         <div className="flex flex-col gap-1">
             <div className="flex justify-end items-center text-[9px] text-emerald-400 uppercase font-bold tracking-wider">
                 <div className="flex items-center gap-1">
                    <TableProperties size={8} /> <span>SubNib</span>
                 </div>
             </div>
             <div className="flex items-center justify-between bg-slate-950/50 p-1.5 rounded border border-slate-800">
                 <span className="font-mono text-orange-300 text-xs">{formatByte(rotated)}</span>
                 <ArrowRight size={10} className="text-slate-600" />
                 <span className="font-mono text-emerald-300 text-xs">{formatByte(subbed)}</span>
             </div>
         </div>

         {/* Step 3: XOR RCON */}
         <div className="flex flex-col gap-1">
             <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                 <span>⊕ RCON</span>
                 <span className="text-amber-500 font-mono">{formatByte(rcon)}</span>
             </div>
             <div className="flex items-center justify-between bg-indigo-900/10 p-1.5 rounded border border-indigo-500/20">
                 <span className="font-mono text-emerald-300 text-xs">{formatByte(subbed)}</span>
                 <span className="text-slate-500 text-[10px]">XOR</span>
                 <span className="font-mono text-indigo-300 font-bold text-sm">{formatByte(result)}</span>
             </div>
         </div>

      </div>
    </div>
  );
};

export const KeyExpansionVisualizer: React.FC<KeyExpansionVisualizerProps> = ({ words }) => {
  const [w0, w1, w2, w3, w4, w5] = words;
  
  // Calculate keys
  const k0 = (w0 << 8) | w1;
  const k1 = (w2 << 8) | w3;
  const k2 = (w4 << 8) | w5;
  
  // Calculate intermediate 'g' outputs for visualization
  const g1 = subByte(rotNib(w1)) ^ RCON1;
  const g3 = subByte(rotNib(w3)) ^ RCON2;

  const XOR = () => <div className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-600 bg-slate-900 text-slate-400 text-xs font-bold z-10 shadow-sm">⊕</div>;

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto p-2">
      
      {/* ROUND 0 (Initial Key) */}
      <div className="relative p-4 rounded-xl border border-blue-900/30 bg-blue-950/10">
        <h3 className="absolute -top-3 left-4 px-2 bg-slate-950 text-blue-400 text-xs font-bold tracking-wider border border-blue-900/30 rounded">ROUND 0 (Initial Key)</h3>
        <div className="flex justify-center items-center gap-12">
          <WordBox val={w0} label="w0" color="blue" />
          <WordBox val={w1} label="w1" color="blue" />
        </div>
        
        <KeyResult k={k0} label="Round Key 0" color="blue" />
      </div>

      <div className="flex justify-center -my-4 z-0">
         <ArrowDown className="text-slate-700/50" />
      </div>

      {/* ROUND 1 Generation */}
      <div className="relative p-6 rounded-xl border border-purple-900/30 bg-purple-950/10">
        <h3 className="absolute -top-3 left-4 px-2 bg-slate-950 text-purple-400 text-xs font-bold tracking-wider border border-purple-900/30 rounded">ROUND 1 EXPANSION</h3>
        
        <div className="flex flex-col md:flex-row items-start justify-center gap-8">
            {/* Logic for w2 */}
            <div className="flex flex-col items-center gap-2">
                 <div className="flex items-start gap-4">
                    {/* W0 Input path */}
                    <div className="flex flex-col items-center pt-8">
                        <span className="text-[10px] text-blue-400 mb-1">w0</span>
                        <div className="h-16 w-px bg-gradient-to-b from-blue-500/50 to-slate-700"></div>
                        <ArrowDown size={12} className="text-slate-700 -mt-1 mb-1"/>
                    </div>
                    
                    <div className="mt-[4.5rem]"><XOR /></div>

                    {/* g(w1) Input path */}
                    <div className="flex flex-col items-center">
                         <span className="text-[10px] text-blue-400 mb-1">w1</span>
                         <GFunction input={w1} rcon={RCON1} result={g1} label="g(w1)" />
                         <ArrowDown size={12} className="text-slate-700 mt-1"/>
                    </div>
                 </div>
                 
                 <ArrowDown size={16} className="text-purple-500/50" />
                 <WordBox val={w2} label="w2" color="purple" isResult />
            </div>

            {/* Logic for w3 */}
            <div className="flex flex-col items-center gap-2 mt-4 md:mt-0">
                 <div className="flex items-start gap-4 h-full">
                    {/* w2 Input path */}
                    <div className="flex flex-col items-center pt-8">
                        <span className="text-[10px] text-purple-400 mb-1">w2</span>
                        <div className="h-32 w-px border-l border-dashed border-purple-500/30"></div>
                        <ArrowDown size={12} className="text-slate-700 -mt-1 mb-1"/>
                    </div>
                    
                    <div className="mt-[8.5rem]"><XOR /></div>

                    {/* w1 Input path */}
                    <div className="flex flex-col items-center pt-8">
                         <span className="text-[10px] text-blue-400 mb-1">w1</span>
                         <div className="h-32 w-px border-l border-dashed border-blue-500/30"></div>
                         <ArrowDown size={12} className="text-slate-700 -mt-1 mb-1"/>
                    </div>
                 </div>
                 
                 <ArrowDown size={16} className="text-purple-500/50" />
                 <WordBox val={w3} label="w3" color="purple" isResult />
            </div>
        </div>
        
        <KeyResult k={k1} label="Round Key 1" color="purple" />
      </div>

      <div className="flex justify-center -my-4 z-0">
         <ArrowDown className="text-slate-700/50" />
      </div>

      {/* ROUND 2 Generation */}
      <div className="relative p-6 rounded-xl border border-amber-900/30 bg-amber-950/10">
        <h3 className="absolute -top-3 left-4 px-2 bg-slate-950 text-amber-400 text-xs font-bold tracking-wider border border-amber-900/30 rounded">ROUND 2 EXPANSION</h3>
        
        <div className="flex flex-col md:flex-row items-start justify-center gap-8">
            {/* Logic for w4 */}
            <div className="flex flex-col items-center gap-2">
                 <div className="flex items-start gap-4">
                    {/* w2 Input path */}
                    <div className="flex flex-col items-center pt-8">
                        <span className="text-[10px] text-purple-400 mb-1">w2</span>
                        <div className="h-16 w-px bg-gradient-to-b from-purple-500/50 to-slate-700"></div>
                        <ArrowDown size={12} className="text-slate-700 -mt-1 mb-1"/>
                    </div>
                    
                    <div className="mt-[4.5rem]"><XOR /></div>

                    {/* g(w3) Input path */}
                    <div className="flex flex-col items-center">
                         <span className="text-[10px] text-purple-400 mb-1">w3</span>
                         <GFunction input={w3} rcon={RCON2} result={g3} label="g(w3)" />
                         <ArrowDown size={12} className="text-slate-700 mt-1"/>
                    </div>
                 </div>
                 
                 <ArrowDown size={16} className="text-amber-500/50" />
                 <WordBox val={w4} label="w4" color="amber" isResult />
            </div>

            {/* Logic for w5 */}
            <div className="flex flex-col items-center gap-2 mt-4 md:mt-0">
                 <div className="flex items-start gap-4">
                    {/* w4 Input path */}
                    <div className="flex flex-col items-center pt-8">
                        <span className="text-[10px] text-amber-400 mb-1">w4</span>
                        <div className="h-32 w-px border-l border-dashed border-amber-500/30"></div>
                        <ArrowDown size={12} className="text-slate-700 -mt-1 mb-1"/>
                    </div>
                    
                    <div className="mt-[8.5rem]"><XOR /></div>

                    {/* w3 Input path */}
                    <div className="flex flex-col items-center pt-8">
                         <span className="text-[10px] text-purple-400 mb-1">w3</span>
                         <div className="h-32 w-px border-l border-dashed border-purple-500/30"></div>
                         <ArrowDown size={12} className="text-slate-700 -mt-1 mb-1"/>
                    </div>
                 </div>
                 
                 <ArrowDown size={16} className="text-amber-500/50" />
                 <WordBox val={w5} label="w5" color="amber" isResult />
            </div>
        </div>
        
        <KeyResult k={k2} label="Round Key 2" color="amber" />
      </div>

    </div>
  );
};
