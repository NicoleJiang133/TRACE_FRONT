
import React, { useEffect, useState } from 'react';
import { HypothesisArtifact } from '../types';
import { HypothesisCard } from './HypothesisCard';
import { Search, Filter, Sparkles, BrainCircuit } from 'lucide-react';

interface ArtifactFeedProps {
  newArtifact: HypothesisArtifact;
}

// Generate some mock artifacts for the feed
const generateMockArtifacts = (): HypothesisArtifact[] => {
  return Array(6).fill(null).map((_, i) => ({
    id: 8000 + i,
    timestamp: new Date().toISOString(),
    title: [
      "Quantum Entanglement in Biological Neural Networks",
      "CRISPR-Cas9 Off-Target Effects via Graph Theory",
      "Dark Matter Interactions with Lattice Structures",
      "Mycelial Network Communication Protocols",
      "Photosynthetic Efficiency in Low-G Environments",
      "Blockchain-Verified Clinical Trial Data Streams"
    ][i],
    statement: "A comprehensive analysis suggesting a novel correlation between observed phenomena and theoretical frameworks.",
    summary: "Mock summary for feed item.",
    confidence: {
      overall: 65 + Math.floor(Math.random() * 30),
      novelty: 70,
      plausibility: 60,
      testability: 80
    },
    evidence: [],
    noveltyAssessment: { isNovel: true, reasoning: "Mock reasoning" },
    proposedExperiment: { procedure: [], expectedOutcome: "" },
    sourcePapers: [],
    blockchain: {
        network: "Neo N3",
        transactionHash: "0x...",
        nftId: 8000 + i,
        explorerUrl: "#",
        blockNumber: 1240000 + i
    }
  }));
};

export const ArtifactFeed: React.FC<ArtifactFeedProps> = ({ newArtifact }) => {
  const [feedItems, setFeedItems] = useState<HypothesisArtifact[]>([]);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    // Combine new artifact with mock community items
    const communityItems = generateMockArtifacts();
    setFeedItems([newArtifact, ...communityItems]);
    
    // Trigger entry animation state
    setTimeout(() => {
        setHasEntered(true);
    }, 100);
  }, [newArtifact]);

  return (
    <div className="w-full min-h-screen pb-20">
      
      {/* Feed Header */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 mb-8">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <BrainCircuit className="text-emerald-400" size={24} />
                <h1 className="text-xl font-display font-bold text-white">Global Discovery Feed</h1>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700">
                    <Search size={14} className="text-slate-400 mr-2" />
                    <input type="text" placeholder="Search hypotheses..." className="bg-transparent border-none outline-none text-xs text-white w-40" />
                </div>
                <button className="p-2 bg-slate-800 rounded-lg border border-slate-700 text-slate-400 hover:text-white">
                    <Filter size={16} />
                </button>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {feedItems.map((item, index) => {
                  const isNew = item.id === newArtifact.id;
                  
                  return (
                      <div 
                        key={item.id}
                        className={`
                            relative transition-all duration-1000 ease-out
                            ${isNew && !hasEntered ? 'opacity-0 translate-y-[200px] scale-150 z-50' : 'opacity-100 translate-y-0 scale-100'}
                            ${!isNew ? 'animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300' : ''}
                        `}
                        style={isNew ? { transitionDelay: '0ms' } : { transitionDelay: `${index * 100}ms` }}
                      >
                          {isNew && (
                              <div className="absolute -top-6 left-0 w-full flex justify-center animate-bounce">
                                  <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/50 flex items-center gap-1">
                                      <Sparkles size={10} /> YOUR ARTIFACT
                                  </div>
                              </div>
                          )}
                          
                          {/* We reuse the card but render it in 'minted' state always */}
                          <div className="transform scale-90 origin-top">
                            <HypothesisCard 
                                artifact={item} 
                                mintingStatus="minted" 
                                onMint={() => {}} 
                            />
                          </div>
                      </div>
                  );
              })}
          </div>
          
      </div>

      {/* Background Ambience */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-900/10 to-transparent" />
      </div>

    </div>
  );
};
