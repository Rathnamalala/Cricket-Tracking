
import React from 'react';
import { CricketMatch, MatchStatus } from '../types';

interface MatchCardProps {
  match: CricketMatch;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onTrack: (match: CricketMatch) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, isSelected, onToggle, onTrack }) => {
  const getTheme = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.LIVE: return 'border-red-600/50 from-red-950/20 to-transparent text-red-500';
      case MatchStatus.RESULT: return 'border-emerald-600/50 from-emerald-950/20 to-transparent text-emerald-500';
      case MatchStatus.UPCOMING: return 'border-blue-600/50 from-blue-950/20 to-transparent text-blue-500';
      default: return 'border-gray-800 from-gray-900 to-transparent';
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  };

  return (
    <div 
      onClick={() => onToggle(match.id)}
      className={`group relative cursor-pointer transition-all duration-300 overflow-hidden bg-gradient-to-br border-2 rounded-2xl ${
        isSelected ? 'border-indigo-500 ring-4 ring-indigo-500/30 scale-[1.03] bg-indigo-950/30' : getTheme(match.statusType)
      } hover:translate-y-[-4px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}
    >
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

      <div className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-md border border-white/5 flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${match.statusType === MatchStatus.LIVE ? 'bg-red-500 animate-ping' : 'bg-gray-500'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white">
              {match.statusType}
            </span>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">{match.matchType}</div>
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{getTimeAgo(match.publishedAt)}</div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mb-8 px-2">
          <div className="text-center w-5/12">
            <div className="text-2xl font-black text-white tracking-tighter leading-none mb-2 line-clamp-1">{match.teamA}</div>
            <div className="h-1 w-full bg-indigo-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-1/2"></div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center w-2/12">
            <span className="text-xs font-black italic text-gray-500">VS</span>
          </div>
          <div className="text-center w-5/12">
            <div className="text-2xl font-black text-white tracking-tighter leading-none mb-2 line-clamp-1">{match.teamB}</div>
            <div className="h-1 w-full bg-indigo-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 w-1/3 ml-auto"></div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 group-hover:bg-white/10 transition-colors">
             <div className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Intelligence Signal</div>
             <p className="text-sm font-black text-white leading-tight line-clamp-2 italic">
               "{match.newsHeadline}"
             </p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <i className="fas fa-map-marker-alt mr-2 text-indigo-500"></i>
              <span className="truncate max-w-[80px]">{match.venue}</span>
            </div>
            {match.statusType === MatchStatus.LIVE && (
              <button 
                onClick={(e) => { e.stopPropagation(); onTrack(match); }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
              >
                Track Live
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className={`absolute bottom-0 right-0 h-10 w-10 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500' : 'bg-transparent'}`}>
         {isSelected && <i className="fas fa-plus text-white text-xs"></i>}
      </div>
    </div>
  );
};

export default MatchCard;
