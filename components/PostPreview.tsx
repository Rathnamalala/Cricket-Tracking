
import React, { useState } from 'react';
import { GeneratedPost, CricketMatch } from '../types';

interface PostPreviewProps {
  post: GeneratedPost;
  match: CricketMatch;
  onRemove: (id: string) => void;
  isAuto?: boolean;
}

const PostPreview: React.FC<PostPreviewProps> = ({ post, match, onRemove, isAuto = false }) => {
  const [copied, setCopied] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [posted, setPosted] = useState(isAuto);

  const fullPostText = `${post.headline}\n\n${post.description}\n\n${post.hashtags}`;

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(fullPostText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectPost = () => {
    setIsPosting(true);
    setTimeout(() => {
      setIsPosting(false);
      setPosted(true);
      const text = encodeURIComponent(fullPostText);
      window.open(`https://www.facebook.com/sharer/sharer.php?quote=${text}`, '_blank');
    }, 1500);
  };

  return (
    <div className={`bg-gray-900 border ${posted ? 'border-emerald-500/40' : 'border-white/10'} rounded-[2rem] shadow-2xl overflow-hidden animate-fadeIn relative transition-all duration-500`}>
      {/* Sporty Mesh Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
      
      {/* Auto-Dispatch Status */}
      {posted && (
        <div className="bg-emerald-600/90 backdrop-blur-md py-2 px-8 flex justify-center items-center space-x-3 border-b border-emerald-500/30">
          <i className="fas fa-satellite-dish text-white text-[10px] animate-pulse"></i>
          <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Broadcast Asset Synchronized & Dispatched</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="px-8 py-5 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 ${posted ? 'bg-emerald-500' : 'bg-indigo-600'} rounded-xl flex items-center justify-center rotate-3 shadow-xl transition-colors`}>
            <i className={`fas ${posted ? 'fa-check' : 'fa-bolt'} text-white text-sm`}></i>
          </div>
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Media Master <span className="text-indigo-500 ml-1">v4.2</span></h3>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.4em]">Signal: {match.teamA} VS {match.teamB}</p>
          </div>
        </div>
        <button onClick={() => onRemove(match.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-500 transition-all border border-white/5">
          <i className="fas fa-times text-xs"></i>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left: The Visual Asset */}
        <div className="lg:w-1/2 p-6 bg-black/40 flex flex-col justify-center border-r border-white/5">
           <div className="relative rounded-2xl overflow-hidden shadow-2xl group border border-white/10">
             <img src={post.imageUrl} alt="AI Broadcast" className="w-full h-auto transition-transform duration-1000 group-hover:scale-105" />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <button 
                   onClick={() => {
                     const link = document.createElement('a');
                     link.href = post.imageUrl;
                     link.download = `CRICKMIC_${match.teamA}_${Date.now()}.png`;
                     link.click();
                   }}
                   className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-2xl"
                >
                  <i className="fas fa-file-download mr-2"></i> Download 4K Asset
                </button>
             </div>
           </div>
           <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-[7px] font-black text-gray-500 uppercase mb-0.5">Graphics</div>
                <div className="text-[9px] font-black text-white italic truncate uppercase">Sporty / {match.matchType}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-[7px] font-black text-gray-500 uppercase mb-0.5">Colors</div>
                <div className="text-[9px] font-black text-white italic truncate uppercase">National Mix</div>
              </div>
           </div>
        </div>

        {/* Right: The Organized Text Block */}
        <div className="lg:w-1/2 p-8 flex flex-col justify-between bg-gray-900/20">
           <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic flex items-center">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span> Organized Social Kit
                </label>
                <button 
                  onClick={handleCopyAll}
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white'}`}
                >
                  {copied ? <><i className="fas fa-check mr-2"></i> Copied!</> : <><i className="fas fa-copy mr-2"></i> Copy Unified Kit</>}
                </button>
              </div>

              {/* The "One Text" Organized Block */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-6 shadow-inner relative group">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <i className="fas fa-align-left text-gray-700"></i>
                </div>
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                  <h4 className="text-2xl font-black text-white italic tracking-tighter leading-tight border-b border-white/5 pb-4">
                    {post.headline}
                  </h4>
                  <p className="text-sm text-gray-300 font-bold leading-relaxed italic whitespace-pre-line">
                    {post.description}
                  </p>
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-mono text-indigo-400 leading-relaxed italic">
                      {post.hashtags}
                    </p>
                  </div>
                </div>
              </div>
           </div>

           <div className="mt-10">
              <button 
                onClick={handleDirectPost}
                disabled={isPosting}
                className={`w-full group ${posted ? 'bg-emerald-600 text-white' : 'bg-white text-black hover:bg-indigo-600 hover:text-white'} py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center shadow-2xl transition-all active:scale-[0.97]`}
              >
                {isPosting ? (
                  <><i className="fas fa-satellite-dish animate-pulse mr-4 text-lg"></i> Dispatching...</>
                ) : posted ? (
                  <><i className="fas fa-check-double mr-4"></i> Asset Dispatched</>
                ) : (
                  <><i className="fab fa-facebook-f mr-4 text-xl transition-transform group-hover:scale-125"></i> Post to Facebook</>
                )}
              </button>
              <p className="text-[7px] font-black text-gray-600 text-center mt-4 tracking-[0.4em] uppercase">Unified content architecture powered by CrickMic Engine</p>
           </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default PostPreview;
