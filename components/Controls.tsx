import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  canNext: boolean;
  canPrev: boolean;
  speed: number;
  setSpeed: (s: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying, onPlayPause, onNext, onPrev, onReset, canNext, canPrev, speed, setSpeed
}) => {
  return (
    <div className="flex flex-col gap-4 bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
      <div className="flex items-center justify-center gap-4">
        <button 
          onClick={onReset}
          className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Reset"
        >
          <RotateCcw size={20} />
        </button>
        <button 
          onClick={onPrev}
          disabled={!canPrev}
          className={`p-2 rounded-full transition-colors ${canPrev ? 'hover:bg-slate-700 text-slate-200' : 'text-slate-600 cursor-not-allowed'}`}
          title="Previous Step"
        >
          <SkipBack size={24} />
        </button>
        <button 
          onClick={onPlayPause}
          className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/50 transition-all active:scale-95"
          title={isPlaying ? "Pause" : "Auto Play"}
        >
          {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </button>
        <button 
          onClick={onNext}
          disabled={!canNext}
          className={`p-2 rounded-full transition-colors ${canNext ? 'hover:bg-slate-700 text-slate-200' : 'text-slate-600 cursor-not-allowed'}`}
          title="Next Step"
        >
          <SkipForward size={24} />
        </button>
      </div>
      
      <div className="flex items-center gap-2 px-2">
        <span className="text-xs font-mono text-slate-400">SPEED</span>
        <input 
          type="range" 
          min="100" 
          max="2000" 
          step="100"
          value={2100 - speed} 
          onChange={(e) => setSpeed(2100 - parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>
    </div>
  );
};
