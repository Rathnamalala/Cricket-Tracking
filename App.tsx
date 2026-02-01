
import React, { useState, useEffect, useRef } from 'react';
import { fetchLiveMatches, generatePostContent, generateMatchImage } from './services/geminiService';
import { CricketMatch, GeneratedPost } from './types';
import MatchCard from './components/MatchCard';
import PostPreview from './components/PostPreview';
import LiveMonitor from './components/LiveMonitor';

const App: React.FC = () => {
  const [matches, setMatches] = useState<CricketMatch[]>([]);
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set());
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');
  
  // Tracked Match State
  const [trackedMatch, setTrackedMatch] = useState<CricketMatch | null>(null);

  // Autopilot Engine
  const [isAutopilot, setIsAutopilot] = useState(false);
  const [processedMatchIds, setProcessedMatchIds] = useState<Set<string>>(new Set());
  const [countdown, setCountdown] = useState(300); // 5 mins
  const timerRef = useRef<number | null>(null);

  const fetchMatches = async (isAuto = false) => {
    if (!isAuto) setLoading(true);
    try {
      const data = await fetchLiveMatches();
      const sortedData = data.sort((a, b) => b.publishedAt - a.publishedAt);
      setMatches(sortedData);

      if (isAutopilot) {
        const newMatches = sortedData.filter(m => !processedMatchIds.has(m.id));
        if (newMatches.length > 0) {
          autoProcess(newMatches);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isAuto) setLoading(false);
    }
  };

  const autoProcess = async (toProcess: CricketMatch[]) => {
    setGenerating(true);
    const newPosts: GeneratedPost[] = [];
    const updatedIds = new Set(processedMatchIds);

    for (const match of toProcess) {
      try {
        const [content, imageUrl] = await Promise.all([
          generatePostContent(match),
          generateMatchImage(match)
        ]);
        newPosts.push({
          matchId: match.id,
          headline: content.headline,
          description: content.description,
          hashtags: content.hashtags,
          imageUrl,
          generatedAt: Date.now()
        });
        updatedIds.add(match.id);
      } catch (e) { console.error("Generation failed for", match.id); }
    }
    
    setGeneratedPosts(prev => [...newPosts, ...prev]);
    setProcessedMatchIds(updatedIds);
    setGenerating(false);
  };

  useEffect(() => {
    if (isAutopilot) {
      timerRef.current = window.setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            fetchMatches(true);
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCountdown(300);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isAutopilot, processedMatchIds]);

  useEffect(() => { fetchMatches(); }, []);

  const handleManualGenerate = async () => {
    if (selectedMatchIds.size === 0) return;
    setGenerating(true);
    const selected = matches.filter(m => selectedMatchIds.has(m.id));
    await autoProcess(selected);
    setSelectedMatchIds(new Set());
    setView('history');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500">
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/30 blur-[150px] rounded-full"></div>
      </div>

      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/5 py-6 px-12 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center rotate-3 border-2 border-indigo-600">
             <span className="text-black font-black text-xl">CM</span>
          </div>
          <div>
             <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Crick<span className="text-indigo-500">Mic</span></h1>
             <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.4em] mt-1">Autonomous Media Unit</p>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <nav className="flex items-center bg-gray-900/50 rounded-xl p-1 border border-white/10">
            <button onClick={() => setView('dashboard')} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${view === 'dashboard' ? 'bg-white text-black shadow-lg' : 'text-gray-500'}`}>Signals</button>
            <button onClick={() => setView('history')} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${view === 'history' ? 'bg-white text-black shadow-lg' : 'text-gray-500'}`}>Queue ({generatedPosts.length})</button>
          </nav>

          <div className="flex items-center space-x-6">
            <div className={`text-right ${isAutopilot ? 'opacity-100' : 'opacity-20'}`}>
               <div className="text-[7px] font-black text-indigo-400 uppercase tracking-widest flex items-center justify-end">
                 <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 animate-ping"></span> Scanning
               </div>
               <div className="text-sm font-black font-mono">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</div>
            </div>
            <button 
              onClick={() => setIsAutopilot(!isAutopilot)}
              className={`flex items-center px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isAutopilot ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-500 border border-white/10'}`}
            >
              <i className={`fas fa-robot mr-3 ${isAutopilot ? 'animate-bounce' : ''}`}></i>
              {isAutopilot ? 'Autopilot On' : 'Autopilot Off'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-12 py-12 relative z-10">
        {view === 'dashboard' ? (
          <div className="space-y-12 animate-fadeIn">
            <div className="border-b border-white/5 pb-10 flex justify-between items-end">
              <h2 className="text-6xl font-black italic tracking-tighter uppercase">Signal Feed</h2>
              <button onClick={() => fetchMatches()} className="text-[10px] font-black uppercase text-indigo-400"><i className={`fas fa-sync-alt mr-2 ${loading ? 'animate-spin' : ''}`}></i> Force Sync</button>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{[1,2,3].map(i => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>)}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {matches.map(m => (
                  <MatchCard 
                    key={m.id} 
                    match={m} 
                    isSelected={selectedMatchIds.has(m.id)} 
                    onToggle={id => setSelectedMatchIds(prev => {
                      const s = new Set(prev);
                      if (s.has(id)) s.delete(id); else s.add(id);
                      return s;
                    })}
                    onTrack={match => setTrackedMatch(match)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-12 animate-fadeIn">
            <h2 className="text-6xl font-black italic tracking-tighter uppercase border-b border-white/5 pb-10">Media Dispatch</h2>
            <div className="space-y-10">
              {generatedPosts.length > 0 ? (
                generatedPosts.map((p, idx) => (
                  <PostPreview 
                    key={`${p.matchId}-${idx}`} 
                    post={p} 
                    match={matches.find(m => m.id === p.matchId) || { teamA: 'Unknown', teamB: 'Unknown' } as any} 
                    onRemove={id => setGeneratedPosts(prev => prev.filter(x => x.matchId !== id))} 
                    isAuto={isAutopilot} 
                  />
                ))
              ) : (
                <div className="py-20 text-center text-gray-600 font-black uppercase tracking-widest italic">No assets generated yet.</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Live War Room Overlay */}
      {trackedMatch && (
        <LiveMonitor 
          match={trackedMatch} 
          onClose={() => setTrackedMatch(null)}
          onPostGenerated={post => {
            setGeneratedPosts(prev => [post, ...prev]);
          }}
        />
      )}

      {view === 'dashboard' && selectedMatchIds.size > 0 && (
        <div className="fixed bottom-10 inset-x-0 flex justify-center z-50">
          <button onClick={handleManualGenerate} className="bg-white text-black px-12 py-6 rounded-2xl font-black text-lg uppercase tracking-widest shadow-2xl transition-transform hover:scale-105 active:scale-95">
            <i className="fas fa-magic mr-4 text-indigo-600"></i> Master {selectedMatchIds.size} Assets
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
