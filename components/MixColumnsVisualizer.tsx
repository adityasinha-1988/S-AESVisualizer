import React, { useState, useEffect } from 'react';
import { X, Equal, Calculator, ChevronDown, ChevronUp, BookOpen, MousePointerClick, Info } from 'lucide-react';

interface MixColumnsVisualizerProps {
  inputMatrix: number[][];
  outputMatrix: number[][];
  isInverse: boolean;
}

const formatNibble = (n: number) => n.toString(16).toUpperCase();
const formatBinary = (n: number) => n.toString(2).padStart(4, '0');

// Convert number to polynomial string (e.g. 11 -> x^3 + x + 1)
const toPoly = (n: number) => {
  if (n === 0) return '0';
  const parts = [];
  if ((n >> 3) & 1) parts.push('x³');
  if ((n >> 2) & 1) parts.push('x²');
  if ((n >> 1) & 1) parts.push('x');
  if (n & 1) parts.push('1');
  return parts.join(' + ');
};

// Local GF(2^4) multiplication helper for visualization
const gfMult = (a: number, b: number): number => {
  let p = 0;
  for (let i = 0; i < 4; i++) {
    if ((b & 1) !== 0) p ^= a;
    const hiBitSet = (a & 0x8) !== 0;
    a = (a << 1) & 0xF;
    if (hiBitSet) a ^= 0x3; // x^4 + x + 1 => 0x13
    b >>= 1;
  }
  return p;
};

export const MixColumnsVisualizer: React.FC<MixColumnsVisualizerProps> = ({ inputMatrix, outputMatrix, isInverse }) => {
  const [activeCol, setActiveCol] = useState(0);
  const [showMathDetails, setShowMathDetails] = useState(false);
  const [hoverBitIdx, setHoverBitIdx] = useState<number | null>(null);
  
  // Track selected operation for the deep dive
  const [selectedOp, setSelectedOp] = useState<{c: number, s: number} | null>(null);

  // Constants
  const constantMatrix = isInverse
    ? [[9, 2], [2, 9]]
    : [[1, 4], [4, 1]];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCol((prev) => (prev === 0 ? 1 : 0));
    }, 4000); // Switch column every 4 seconds
    return () => clearInterval(interval);
  }, []);

  // Default selection to the first term of the active column whenever it changes
  useEffect(() => {
      setSelectedOp({
          c: constantMatrix[0][0],
          s: inputMatrix[0][activeCol]
      });
  }, [activeCol, isInverse, inputMatrix]);

  const colLabel = activeCol === 0 ? "Column 0" : "Column 1";

  // Helper to render a 2x2 matrix
  const Matrix = ({ 
    data, 
    label, 
    highlightCol = -1, 
    color = "slate",
    isConstant = false
  }: { 
    data: number[][], 
    label: string, 
    highlightCol?: number, 
    color?: string,
    isConstant?: boolean
  }) => {
    
    const baseColors: Record<string, string> = {
      slate: 'border-slate-600 bg-slate-800 text-slate-300',
      blue: 'border-blue-500/50 bg-blue-500/10 text-blue-200',
      emerald: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
      amber: 'border-amber-500/50 bg-amber-500/10 text-amber-200'
    };
    
    const style = baseColors[color] || baseColors.slate;

    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <div className={`grid grid-cols-2 gap-1 p-2 rounded-lg border ${style} ${isConstant ? 'shadow-lg' : ''}`}>
          {[0, 1].map(c => (
             <div key={c} className={`flex flex-col gap-1 ${highlightCol === c ? 'bg-white/10 rounded' : ''} p-1 transition-colors duration-500`}>
                {[0, 1].map(r => (
                  <div key={`${r}-${c}`} className={`
                    w-10 h-10 flex items-center justify-center font-mono font-bold text-lg rounded
                    ${highlightCol === c ? 'scale-110 font-black' : 'opacity-70'}
                    transition-all duration-300
                  `}>
                    {formatNibble(data[r][c])}
                  </div>
                ))}
             </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMathTerm = (c: number, s: number) => {
      const isSelected = selectedOp?.c === c && selectedOp?.s === s;
      return (
          <button 
            onClick={() => {
                setSelectedOp({ c, s });
                setShowMathDetails(true);
            }}
            className={`
               flex items-center bg-slate-900/50 rounded px-2 py-0.5 border transition-all duration-200 cursor-pointer group
               ${isSelected 
                  ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.3)]' 
                  : 'border-slate-800/50 hover:border-slate-600 hover:bg-slate-800'}
            `}
          >
            <span className={`text-amber-200 transition-colors ${isSelected ? 'font-black' : ''}`}>{formatNibble(c)}</span>
            <span className="text-slate-500 mx-1">•</span>
            <span className={`text-blue-200 transition-colors ${isSelected ? 'font-black' : ''}`}>{formatNibble(s)}</span>
            {isSelected && <MousePointerClick size={10} className="ml-2 text-indigo-400 animate-pulse" />}
          </button>
      )
  };

  const renderAdditionExplainer = () => {
    // Use Row 0 calculation of the current active column for the example
    const term1 = gfMult(constantMatrix[0][0], inputMatrix[0][activeCol]);
    const term2 = gfMult(constantMatrix[0][1], inputMatrix[1][activeCol]);
    const result = term1 ^ term2;

    const t1Bits = formatBinary(term1).split('').map(Number);
    const t2Bits = formatBinary(term2).split('').map(Number);
    const resBits = formatBinary(result).split('').map(Number);

    return (
        <div className="mt-3 bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-inner">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bitwise XOR Visualization</span>
                 <div className="text-[10px] text-slate-500 font-mono">
                    {toPoly(term1)} + {toPoly(term2)}
                 </div>
            </div>
            
            <div className="flex flex-col items-center gap-4">
                {/* Interactive Bit Grid */}
                <div className="flex items-start gap-3">
                    {/* Label Col */}
                    <div className="flex flex-col gap-1 pt-1.5 text-[10px] font-mono text-slate-500 text-right">
                        <div className="h-8 flex items-center justify-end">Term 1</div>
                        <div className="h-4"></div>
                        <div className="h-8 flex items-center justify-end">Term 2</div>
                        <div className="h-4"></div>
                        <div className="h-8 flex items-center justify-end font-bold text-emerald-500">Result</div>
                    </div>

                    {/* Bits Cols */}
                    <div className="flex gap-2">
                        {t1Bits.map((b1, i) => {
                            const b2 = t2Bits[i];
                            const r = resBits[i];
                            const isHovered = hoverBitIdx === i;
                            
                            return (
                                <div 
                                    key={i}
                                    onMouseEnter={() => setHoverBitIdx(i)}
                                    onMouseLeave={() => setHoverBitIdx(null)}
                                    className={`relative flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all duration-200 cursor-crosshair ${isHovered ? 'bg-slate-800 ring-1 ring-indigo-500/50 scale-110 z-10' : ''}`}
                                >
                                    {/* Term 1 */}
                                    <div className={`w-8 h-8 flex items-center justify-center rounded border font-mono font-bold transition-colors ${
                                        b1 ? 'bg-amber-500/20 border-amber-500/50 text-amber-200' : 'bg-slate-900 border-slate-700 text-slate-600'
                                    }`}>
                                        {b1}
                                    </div>
                                    
                                    <span className="text-[10px] text-slate-600 font-mono">⊕</span>

                                    {/* Term 2 */}
                                    <div className={`w-8 h-8 flex items-center justify-center rounded border font-mono font-bold transition-colors ${
                                        b2 ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-slate-900 border-slate-700 text-slate-600'
                                    }`}>
                                        {b2}
                                    </div>

                                    <span className="text-[10px] text-slate-600 font-mono">=</span>

                                    {/* Result */}
                                    <div className={`w-8 h-8 flex items-center justify-center rounded border-2 font-mono font-bold transition-colors ${
                                        r ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-slate-700 text-slate-600'
                                    }`}>
                                        {r}
                                    </div>
                                    
                                    {/* Hover Logic Tooltip */}
                                    {isHovered && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded border border-slate-600 whitespace-nowrap shadow-xl z-50">
                                            <span className="text-amber-300">{b1}</span> ^ <span className="text-blue-300">{b2}</span> = <span className="text-emerald-300 font-bold">{r}</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Explanation Text */}
                <div className="text-xs text-slate-400 text-center max-w-sm">
                   Addition in GF(2⁴) is <strong>bitwise XOR</strong> (no carry). 
                   <br/>
                   <span className="text-[10px] text-slate-500 italic">Hover over the columns above to check the bit logic.</span>
                </div>
            </div>
        </div>
    );
  };

  const renderDynamicMathExample = () => {
    if (!selectedOp) return null;
    const { c, s } = selectedOp;
    const result = gfMult(c, s);

    return (
        <div className="bg-slate-950 p-4 rounded-lg border border-indigo-500/30 font-mono text-xs leading-relaxed space-y-3 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50"></div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
             <div className="flex items-center gap-2">
                <Calculator size={12} className="text-indigo-400"/>
                <span className="font-bold text-slate-200">
                    Breakdown: <span className="text-amber-400">{formatNibble(c)}</span> • <span className="text-blue-400">{formatNibble(s)}</span>
                </span>
             </div>
             <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
               Click terms above to switch
             </span>
          </div>
          
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
             
             {/* Constant */}
             <span className="text-amber-400 text-right font-bold">Constant ({c}):</span>
             <div className="flex items-center gap-3 text-slate-400">
                <span className="bg-amber-500/10 text-amber-200 px-1.5 rounded border border-amber-500/20">{formatBinary(c)}</span>
                <span className="text-slate-600">→</span>
                <span className="text-amber-300 italic">{toPoly(c)}</span>
             </div>

             {/* Input */}
             <span className="text-blue-400 text-right font-bold">Input ({formatNibble(s)}):</span>
             <div className="flex items-center gap-3 text-slate-400">
                <span className="bg-blue-500/10 text-blue-200 px-1.5 rounded border border-blue-500/20">{formatBinary(s)}</span>
                <span className="text-slate-600">→</span>
                <span className="text-blue-300 italic">{toPoly(s)}</span>
             </div>

             <div className="col-span-2 h-px bg-slate-800 my-1"></div>
             
             {/* Multiplication Step */}
             <span className="text-indigo-400 text-right font-bold">Multiply:</span>
             <div className="text-indigo-200 italic opacity-80">
                ({toPoly(c)}) • ({toPoly(s)})
             </div>

             {/* Modulo Step */}
             <span className="text-slate-500 text-right text-[10px] uppercase tracking-wider">Modulo:</span>
             <div className="flex items-center gap-2">
                <span className="text-slate-400">m(x) = x⁴ + x + 1</span>
                <span className="text-[9px] text-slate-600">(Irreducible)</span>
             </div>

             {/* Result */}
             <span className="text-emerald-400 text-right font-bold mt-1">Result:</span>
             <div className="flex gap-2 text-white font-bold mt-1 bg-slate-900 border border-slate-700 p-1.5 rounded w-max shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <span className="text-emerald-400">{formatNibble(result)}</span>
                <span className="text-slate-600">|</span>
                <span>{formatBinary(result)}</span>
                <span className="text-slate-600">|</span>
                <span className="italic font-normal text-emerald-200">{toPoly(result)}</span>
             </div>
          </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full">
      
      {/* Matrix Equation Visual */}
      <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
        <Matrix 
          data={constantMatrix} 
          label={isInverse ? "Inv Constant (C)" : "Constant (C)"} 
          color="amber"
          isConstant
        />
        <X className="text-slate-600" size={20} />
        <Matrix 
          data={inputMatrix} 
          label="State (S)" 
          highlightCol={activeCol} 
          color="blue"
        />
        <Equal className="text-slate-600" size={20} />
        <Matrix 
          data={outputMatrix} 
          label="New State (S')" 
          highlightCol={activeCol} 
          color="emerald"
        />
      </div>

      {/* Calculation Card */}
      <div className="w-full max-w-lg bg-slate-900/80 rounded-xl border border-slate-700 overflow-hidden relative shadow-xl">
         <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
         
         <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-indigo-400" />
              <span className="text-sm font-bold text-slate-200">GF(2⁴) Matrix Multiplication</span>
            </div>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
              Active: {colLabel}
            </span>
         </div>

         <div className="p-5 space-y-6 text-sm font-mono">
            {/* Row 0 Calculation */}
            <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2 text-slate-400 text-xs">
                 <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px]">0</span>
                 <span className="uppercase tracking-wider font-bold text-[10px]">Row 0 Dot Product</span>
               </div>
               <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-wrap items-center gap-x-2 gap-y-2 shadow-inner">
                  <span className="text-emerald-300 font-bold">S'0,{activeCol}</span>
                  <span className="text-slate-600">=</span>
                  {renderMathTerm(constantMatrix[0][0], inputMatrix[0][activeCol])}
                  <span className="text-indigo-500 font-bold">⊕</span>
                  {renderMathTerm(constantMatrix[0][1], inputMatrix[1][activeCol])}
                  <span className="text-slate-600">=</span>
                  <span className="text-emerald-400 font-bold text-lg border-b-2 border-emerald-500/30 px-1">{formatNibble(outputMatrix[0][activeCol])}</span>
               </div>
            </div>

            {/* Row 1 Calculation */}
            <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2 text-slate-400 text-xs">
                 <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px]">1</span>
                 <span className="uppercase tracking-wider font-bold text-[10px]">Row 1 Dot Product</span>
               </div>
               <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-wrap items-center gap-x-2 gap-y-2 shadow-inner">
                  <span className="text-emerald-300 font-bold">S'1,{activeCol}</span>
                  <span className="text-slate-600">=</span>
                  {renderMathTerm(constantMatrix[1][0], inputMatrix[0][activeCol])}
                  <span className="text-indigo-500 font-bold">⊕</span>
                  {renderMathTerm(constantMatrix[1][1], inputMatrix[1][activeCol])}
                  <span className="text-slate-600">=</span>
                  <span className="text-emerald-400 font-bold text-lg border-b-2 border-emerald-500/30 px-1">{formatNibble(outputMatrix[1][activeCol])}</span>
               </div>
            </div>
         </div>
         
         <div className="bg-indigo-900/10 text-indigo-300 text-[10px] p-2 text-center border-t border-indigo-500/10">
            <Info size={10} className="inline mr-1"/>
            Click on any multiplication term (e.g., <span className="font-bold text-amber-200">1</span>•<span className="font-bold text-blue-200">A</span>) above to view step-by-step logic.
         </div>
      </div>

      {/* Math Deep Dive Expandable */}
      <div className="w-full max-w-lg bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden transition-all duration-300">
        <button 
            onClick={() => setShowMathDetails(!showMathDetails)}
            className="w-full flex items-center justify-between p-4 bg-slate-800/40 hover:bg-slate-800/60 transition-colors text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-transparent hover:border-slate-700"
        >
            <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-400"/>
                Math Deep Dive: GF(2⁴) Operations
            </div>
            {showMathDetails ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
        
        {showMathDetails && (
            <div className="p-5 text-sm text-slate-300 space-y-6 border-t border-slate-700 bg-slate-900/20 animate-in slide-in-from-top-2">
                
                {/* Addition Section */}
                <div>
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-serif font-black">⊕</span>
                        Addition
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed mb-2 pl-8">
                        Addition corresponds to adding polynomial coefficients modulo 2. 
                        This is identical to <strong>bitwise XOR</strong>.
                    </p>
                    
                    <div className="pl-8">
                       {renderAdditionExplainer()}
                    </div>
                </div>

                {/* Multiplication Section */}
                <div>
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-amber-400 font-serif font-black text-[10px]">●</span>
                        Multiplication
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed mb-3 pl-8">
                        Multiplication is polynomial multiplication modulo the irreducible polynomial <span className="text-amber-400 font-mono">m(x) = x⁴ + x + 1</span>.
                        The constants used differ between Encryption and Decryption.
                    </p>
                    
                    {/* Constant Specifics */}
                    <div className="pl-8 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                       {isInverse ? (
                         <>
                           <div className="bg-slate-950/50 p-2 rounded border border-slate-800/50">
                             <div className="text-xs font-bold text-amber-200 mb-1">Constant 9 (1001)</div>
                             <div className="text-[10px] text-slate-400 leading-tight">
                               Polynomial: $x^3 + 1$. Equivalent to multiplying by $x^3$ and adding (XOR) the original value.
                             </div>
                           </div>
                           <div className="bg-slate-950/50 p-2 rounded border border-slate-800/50">
                             <div className="text-xs font-bold text-amber-200 mb-1">Constant 2 (0010)</div>
                             <div className="text-[10px] text-slate-400 leading-tight">
                               Polynomial: $x$. Equivalent to a left shift by 1. If MSB is 1, XOR with 0x3 (reduction).
                             </div>
                           </div>
                         </>
                       ) : (
                         <>
                           <div className="bg-slate-950/50 p-2 rounded border border-slate-800/50">
                             <div className="text-xs font-bold text-amber-200 mb-1">Constant 1 (0001)</div>
                             <div className="text-[10px] text-slate-400 leading-tight">
                               Polynomial: $1$. The identity element. The value remains unchanged.
                             </div>
                           </div>
                           <div className="bg-slate-950/50 p-2 rounded border border-slate-800/50">
                             <div className="text-xs font-bold text-amber-200 mb-1">Constant 4 (0100)</div>
                             <div className="text-[10px] text-slate-400 leading-tight">
                               Polynomial: $x^2$. Equivalent to multiplying by $x$ (2) twice. (Shift left, reduce, repeat).
                             </div>
                           </div>
                         </>
                       )}
                    </div>

                    <div className="pl-8">
                       {renderDynamicMathExample()}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
