
import React, { useState, useEffect } from 'react';
import { CricketMatch, LiveUpdate, GeneratedPost, PlayerStat } from '../types';
import { fetchSpecificMatchUpdate, generatePostContent, generateMatchImage } from '../services/geminiService';
import PostPreview from './PostPreview';

interface LiveMonitorProps {
  match: CricketMatch;
  onClose: () => void;
  onPostGenerated: (post: GeneratedPost) => void;
}

const LiveMonitor: React.FC<LiveMonitorProps> = ({ match, onClose, onPostGenerated }) => {
  const [update, setUpdate] = useState<LiveUpdate | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [nextRefresh, setNextRefresh] = useState(60);
  const [showToast, setShowToast] = useState(false);
  
  // State for the preview popup
  const [previewPost, setPreviewPost] = useState<GeneratedPost | null>(null);

  const refreshData = async () => {
    try {
      const data = await fetchSpecificMatchUpdate(match);
      setUpdate(data);
      setNextRefresh(60);
    } catch (e) {
      console.error("War Room Sync Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      setNextRefresh(prev => {
        if (prev <= 1) {
          refreshData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [match]);

  const handleDispatch = async (type: 'UPDATE' | 'SUMMARY' | 'PLAYER', player?: PlayerStat) => {
    const id = player ? player.name : type;
    setDispatchingId(id);
    try {
      let context = "";
      if (type === 'UPDATE') {
        context = `LIVE STATUS UPDATE: Current score is ${update?.score}. Match situation: ${update?.summary}. Key moment: ${update?.keyMoment}`;
      } else if (type === 'SUMMARY') {
        context = `FULL MATCH SUMMARY & TACTICAL ANALYSIS: ${update?.summary}. Key performances: ${update?.topBatters.map(b => b.name).join(', ')} and ${update?.topBowlers.map(b => b.name).join(', ')}`;
      } else if (type === 'PLAYER' && player) {
        // Find which team the player belongs to based on the scoreboard summary if possible, 
        // or just use the match teams. We'll pass both to help the AI.
        // For simplicity, we assume the AI can grounding which player belongs to which team from the match.
        // We add the team name to the context.
        context = `PLAYER FOCUS: Heroic performance by ${player.name}. Team: ${match.teamA} or ${match.teamB}. Stats: ${player.score} - ${player.details}. Impact on ${match.teamA} vs ${match.teamB}`;
      }

      const [content, imageUrl] = await Promise.all([
        generatePostContent(match, context),
        generateMatchImage(match, context)
      ]);

      const newPost: GeneratedPost = {
        matchId: match.id,
        headline: content.headline,
        description: content.description,
        hashtags: content.hashtags,
        imageUrl,
        generatedAt: Date.now()
      };

      onPostGenerated(newPost);
      
      // Show the generated kit in a popup immediately
      setPreviewPost(newPost);

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      console.error("Dispatch Failed:", e);
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl animate-fadeIn overflow-y-auto">
      {/* Cinematic HUD Overlays */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_#4f46e522_0%,_transparent_70%)]"></div>
        <div className="grid grid-cols-6 h-full border-x border-white/5 mx-12">
          {[...Array(6)].map((_, i) => <div key={i} className="border-r border-white/5 h-full"></div>)}
        </div>
      </div>

      {/* Success Notification */}
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[110] bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_0_80px_rgba(16,185,129,0.5)] animate-bounce flex items-center space-x-4 border border-emerald-400/30">
          <i className="fas fa-satellite-dish text-lg"></i>
          <span>Asset Sychronized & Dispatched</span>
        </div>
      )}

      {/* KIT PREVIEW POPUP MODAL */}
      {previewPost && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-12 bg-black/90 backdrop-blur-2xl animate-fadeIn">
          <div className="max-w-6xl w-full relative">
            <button 
              onClick={() => setPreviewPost(null)}
              className="absolute -top-16 right-0 text-white/50 hover:text-white text-xs font-black uppercase tracking-[0.3em] flex items-center transition-colors bg-white/5 px-6 py-3 rounded-xl border border-white/10"
            >
              Close Asset Preview <i className="fas fa-times ml-3"></i>
            </button>
            <div className="scale-90 md:scale-100 origin-center">
               <PostPreview 
                post={previewPost} 
                match={match} 
                onRemove={() => setPreviewPost(null)} 
              />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-12 py-12 relative z-10">
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-8">
            <button onClick={onClose} className="group w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-indigo-600 transition-all text-white hover:scale-110 active:scale-95">
              <i className="fas fa-chevron-left text-xl transition-transform group-hover:-translate-x-1"></i>
            </button>
            <div>
              <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">Intelligence <span className="text-indigo-500">War Room</span></h2>
              <div className="flex items-center mt-3 space-x-4">
                <div className="flex items-center space-x-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                   <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                   <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Grounding</span>
                </div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Next Sync in {nextRefresh}s</span>
              </div>
            </div>
          </div>
          <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex items-center space-x-8 shadow-2xl">
             <div className="text-right">
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Involved Teams</div>
                <div className="text-2xl font-black italic text-white">{match.teamA} vs {match.teamB}</div>
             </div>
             <div className="w-px h-10 bg-white/10"></div>
             <i className="fas fa-shield-halved text-3xl text-indigo-500/50"></i>
          </div>
        </div>

        {loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-8">
            <div className="relative">
               <i className="fas fa-radar text-7xl text-indigo-500 animate-spin-slow"></i>
               <i className="fas fa-bolt absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl text-white"></i>
            </div>
            <p className="text-2xl font-black italic text-white uppercase tracking-[0.5em] animate-pulse">Syncing Signal Grids</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT COLUMN: Data HUD (8 Cols) */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* Massive Scoreboard Display */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-black to-black border-2 border-indigo-500/30 rounded-[4rem] p-16 relative overflow-hidden group shadow-[0_0_150px_rgba(79,70,229,0.1)]">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <i className="fas fa-satellite text-[12rem] text-indigo-400 rotate-12"></i>
                </div>
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-10">
                      <div>
                        <div className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.6em] mb-4">Real-Time Scorecard</div>
                        <div className="text-9xl font-black italic tracking-tighter text-white drop-shadow-[0_10px_50px_rgba(255,255,255,0.1)]">
                          {update?.score || "0/0 (0.0)"}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                         <div className="flex space-x-3 mb-4">
                            {update?.recentBalls.map((ball, i) => (
                              <div key={i} className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 transition-all ${ball.includes('W') ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-500/40' : ball.includes('4') || ball.includes('6') ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/40' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                {ball}
                              </div>
                            ))}
                         </div>
                         <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Last 6 Balls Spectrum</div>
                      </div>
                   </div>
                   
                   <div className="bg-white/5 rounded-3xl p-8 border border-white/5 backdrop-blur-md group-hover:bg-white/10 transition-all">
                      <div className="flex justify-between items-center mb-4">
                         <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Grounding Intelligence Summary</div>
                         <button 
                            onClick={() => handleDispatch('SUMMARY')}
                            disabled={dispatchingId !== null}
                            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center transition-all disabled:opacity-50"
                          >
                           {dispatchingId === 'SUMMARY' ? <i className="fas fa-spinner animate-spin mr-2"></i> : <i className="fas fa-scroll mr-2"></i>}
                           Generate Narrative Summary
                         </button>
                      </div>
                      <p className="text-xl font-black italic text-white leading-tight">"{update?.summary}"</p>
                   </div>
                </div>
              </div>

              {/* Scorecard Tables: Cricbuzz Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Batters Table */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
                   <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                      <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center">
                        <i className="fas fa-bat-ball mr-3 text-lg"></i> Leading Batters
                      </h4>
                   </div>
                   <div className="space-y-6">
                     {update?.topBatters.map((b, i) => (
                       <div key={i} className="flex justify-between items-center group/row">
                         <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => handleDispatch('PLAYER', b)}
                              disabled={dispatchingId !== null}
                              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-indigo-600 transition-all opacity-0 group-hover/row:opacity-100 disabled:opacity-50"
                              title="Generate Player Focus Kit"
                            >
                              {dispatchingId === b.name ? <i className="fas fa-spinner animate-spin text-[10px]"></i> : <i className="fas fa-magic text-[10px]"></i>}
                            </button>
                            <div>
                               <div className="text-base font-black text-white group-hover/row:text-indigo-400 transition-colors">{b.name}</div>
                               <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{b.details}</div>
                            </div>
                         </div>
                         <div className="text-2xl font-black italic text-white font-mono">{b.score}</div>
                       </div>
                     ))}
                   </div>
                </div>

                {/* Bowlers Table */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
                   <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
                      <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center">
                        <i className="fas fa-baseball mr-3 text-lg"></i> Strike Bowlers
                      </h4>
                   </div>
                   <div className="space-y-6">
                     {update?.topBowlers.map((b, i) => (
                       <div key={i} className="flex justify-between items-center group/row">
                         <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => handleDispatch('PLAYER', b)}
                              disabled={dispatchingId !== null}
                              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-emerald-600 transition-all opacity-0 group-hover/row:opacity-100 disabled:opacity-50"
                              title="Generate Player Focus Kit"
                            >
                              {dispatchingId === b.name ? <i className="fas fa-spinner animate-spin text-[10px]"></i> : <i className="fas fa-magic text-[10px]"></i>}
                            </button>
                            <div>
                               <div className="text-base font-black text-white group-hover/row:text-emerald-400 transition-colors">{b.name}</div>
                               <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{b.details}</div>
                            </div>
                         </div>
                         <div className="text-2xl font-black italic text-white font-mono">{b.score}</div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Dispatch Center (4 Cols) */}
            <div className="lg:col-span-4 space-y-10">
              <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-[4rem] p-12 h-full shadow-2xl flex flex-col">
                <div className="mb-10 text-center">
                  <i className="fas fa-broadcast-tower text-4xl text-indigo-500 mb-6 block opacity-50"></i>
                  <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter">Media Dispatch Hub</h3>
                  <div className="w-16 h-1 bg-indigo-600 mx-auto mt-4 rounded-full"></div>
                </div>

                <div className="space-y-6 flex-grow">
                  {/* Primary: Quick Live Snapshot */}
                  <button 
                    onClick={() => handleDispatch('UPDATE')}
                    disabled={dispatchingId !== null}
                    className="w-full bg-white text-black py-10 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 transition-all hover:bg-indigo-600 hover:text-white active:scale-95 disabled:opacity-50 group shadow-2xl"
                  >
                    <div className="flex items-center space-x-4">
                      {dispatchingId === 'UPDATE' ? <i className="fas fa-sync-alt animate-spin text-2xl"></i> : <i className="fas fa-bolt text-2xl group-hover:scale-125 transition-transform"></i>}
                      <span className="font-black uppercase tracking-[0.3em] text-sm">Live Snapshot</span>
                    </div>
                    <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Instant Score Update Post</span>
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { type: 'WICKET', icon: 'fa-skull', color: 'bg-red-600 hover:bg-red-500 shadow-red-900/40' },
                      { type: 'SIXER', icon: 'fa-fire', color: 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/40' },
                      { type: 'BOUNDARY', icon: 'fa-bolt', color: 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40' },
                      { type: 'MILESTONE', icon: 'fa-trophy', color: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40' }
                    ].map(btn => (
                      <button 
                        key={btn.type}
                        onClick={() => handleDispatch('UPDATE')}
                        disabled={dispatchingId !== null}
                        className={`w-full ${btn.color} py-6 rounded-3xl flex flex-col items-center justify-center space-y-2 transition-all active:scale-90 disabled:opacity-50 shadow-xl border-t border-white/10`}
                      >
                        <i className={`fas ${btn.icon} text-xl`}></i>
                        <span className="font-black uppercase tracking-widest text-[10px]">{btn.type}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 p-8 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] text-center">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-3">AI Engine Status</div>
                    <p className="text-[11px] font-black text-indigo-300 italic uppercase leading-relaxed">
                      "Each generation creates a high-impact broadcast graphic + journalistic social description."
                    </p>
                  </div>
                </div>

                <div className="mt-12 text-center text-gray-700 font-black text-[9px] uppercase tracking-[0.5em]">
                  Grounding: Google Search (2.5 Series)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
      `}</style>
    </div>
  );
};

export default LiveMonitor;
