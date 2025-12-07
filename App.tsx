import React, { useState, useEffect } from 'react';
import { AppState, HypothesisArtifact, MintingStatus, SourcePaper } from './types';
import { generateHypothesis, generateScientificIllustration } from './services/geminiService';
import { processWithBackend, checkBackendHealth } from './services/traceApiService';
import { PaperInput } from './components/PaperInput';
import { HypothesisCard } from './components/HypothesisCard';
import { AnalysisVisualization } from './components/AnalysisVisualization';
import { IsometricAssembly } from './components/IsometricAssembly';
import { MintCelebration } from './components/MintCelebration';
import { BrainCircuit, Hexagon, ArrowLeft, Server, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [mintingStatus, setMintingStatus] = useState<MintingStatus>('idle');
  const [artifact, setArtifact] = useState<HypothesisArtifact | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Analysis Visualization State
  const [analysisStep, setAnalysisStep] = useState(0);
  // We keep papers in state to pass to visualization
  const [currentPapers, setCurrentPapers] = useState<SourcePaper[]>([]);

  // Backend connection state
  const [useBackend, setUseBackend] = useState(true); // Default to backend
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  // Check backend availability on mount
  useEffect(() => {
    const checkBackend = async () => {
      const available = await checkBackendHealth();
      setBackendAvailable(available);
      if (!available) {
        console.warn("Backend not available, will use Gemini fallback");
      }
    };
    checkBackend();
  }, []);

  const handleAnalyze = async (papers: SourcePaper[]) => {
    try {
      setAppState(AppState.ANALYZING);
      setCurrentPapers(papers);
      setAnalysisStep(0);
      setMintingStatus('idle'); // Reset minting status

      // Determine which backend to use
      const shouldUseBackend = useBackend && backendAvailable;

      // Start the actual API call in the background immediately
      const hypothesisPromise = shouldUseBackend
        ? processWithBackend(papers, { useNeofs: true, useX402: false })
        : generateHypothesis(papers);

      // -- ISOMETRIC ASSEMBLY SEQUENCE START --
      // Step 0: Initialization (0-4s)
      await new Promise(r => setTimeout(r, 4000));

      // Step 1: Foundation (4-8s)
      setAnalysisStep(1);
      await new Promise(r => setTimeout(r, 4000));

      // Step 2: Content Layers (8-12s)
      setAnalysisStep(2);
      await new Promise(r => setTimeout(r, 4000));

      // Step 3: Shared Concepts (12-16s)
      setAnalysisStep(3);
      await new Promise(r => setTimeout(r, 4000));

      // Step 4: Breakthrough (16-20s)
      setAnalysisStep(4);
      await new Promise(r => setTimeout(r, 4000));

      // Step 5: Finalization (20-22s)
      setAnalysisStep(5);
      await new Promise(r => setTimeout(r, 2000));

      // Now wait for the actual API result if it hasn't finished yet
      const result = await hypothesisPromise;

      let newArtifact: HypothesisArtifact;

      if (shouldUseBackend) {
        // Backend returns complete artifact with real blockchain data
        newArtifact = result as HypothesisArtifact;
        newArtifact.sourcePapers = papers;

        // Generate illustration for the backend result
        try {
          const imageUrl = await generateScientificIllustration(newArtifact.summary || newArtifact.statement);
          newArtifact.imageUrl = imageUrl;
        } catch (imgError) {
          console.warn("Image generation failed:", imgError);
        }
      } else {
        // Gemini fallback - construct artifact from partial data
        const hypothesisData = result as Partial<HypothesisArtifact>;
        if (!hypothesisData.statement) throw new Error("Failed to generate hypothesis");

        const imageUrl = await generateScientificIllustration(hypothesisData.summary || hypothesisData.statement);

        newArtifact = {
          id: Math.floor(Math.random() * 1000) + 100,
          timestamp: new Date().toISOString(),
          title: hypothesisData.title || "Untitled Hypothesis",
          statement: hypothesisData.statement,
          summary: hypothesisData.summary || "",
          confidence: hypothesisData.confidence || { overall: 50, novelty: 50, plausibility: 50, testability: 50 },
          evidence: hypothesisData.evidence || [],
          noveltyAssessment: hypothesisData.noveltyAssessment || { isNovel: false, reasoning: "N/A" },
          proposedExperiment: hypothesisData.proposedExperiment || { procedure: [], expectedOutcome: "" },
          sourcePapers: papers,
          imageUrl: imageUrl,
        };
      }

      // Slight delay to let the user see the "Synthesis" state (Step 5)
      await new Promise(r => setTimeout(r, 1000));

      setArtifact(newArtifact);
      setAppState(AppState.GENERATED);
    } catch (error) {
      console.error(error);
      setAppState(AppState.UPLOAD);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Analysis failed: ${errorMessage}`);
    }
  };

  const handleMint = async () => {
    if (!artifact) return;

    // If artifact already has blockchain data (from backend), just show success
    if (artifact.blockchain?.transactionHash) {
      setShowCelebration(true);
      setMintingStatus('minted');
      setTimeout(() => {
        setAppState(AppState.MINT_SUCCESS);
        setTimeout(() => setShowCelebration(false), 3500);
      }, 500);
      return;
    }

    setMintingStatus('minting');

    // Simulate Neo Blockchain transaction (fallback for Gemini mode)
    setTimeout(() => {
      setArtifact(prev => {
        if (!prev) return null;
        return {
          ...prev,
          blockchain: {
            network: "Neo N3",
            transactionHash: "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
            nftId: prev.id,
            blockNumber: 1240592,
            explorerUrl: "#"
          }
        };
      });

      // Trigger success sequence
      setShowCelebration(true);
      setMintingStatus('minted');

      // Transition to final standalone view after celebration start
      setTimeout(() => {
          setAppState(AppState.MINT_SUCCESS);
          // Hide celebration overlay after a few seconds
          setTimeout(() => setShowCelebration(false), 3500);
      }, 500);

    }, 2000);
  };

  const handleReset = () => {
    setArtifact(null);
    setAppState(AppState.UPLOAD);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-purple-500/30 font-sans">
      {/* Celebration Overlay */}
      {showCelebration && <MintCelebration />}

      {/* Background Decor */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header - Hidden in Mint Success State to focus on card */}
        <header className={`flex items-center justify-between mb-12 border-b border-white/5 pb-6 transition-opacity duration-500 ${appState === AppState.MINT_SUCCESS ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg shadow-lg shadow-purple-900/20">
              <BrainCircuit className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight text-white">
                TRACE
              </h1>
              <p className="text-xs text-slate-400">AI-Powered Scientific Discovery on Neo</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${backendAvailable ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
              Neo N3 {backendAvailable ? 'Active' : 'Simulated'}
            </div>
            <div
              className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded ${useBackend && backendAvailable ? 'bg-emerald-900/30 text-emerald-400' : 'hover:bg-slate-800'}`}
              onClick={() => setUseBackend(!useBackend)}
              title={backendAvailable ? "Click to toggle backend" : "Backend not available"}
            >
              <Server size={12} />
              SpoonOS {backendAvailable === null ? '...' : backendAvailable ? (useBackend ? 'ON' : 'OFF') : 'N/A'}
            </div>
            <div className="flex items-center gap-1">
              <Zap size={12} />
              {useBackend && backendAvailable ? 'Groq LLM' : 'Gemini'}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex flex-col items-center justify-center min-h-[60vh] w-full">
          {appState === AppState.UPLOAD && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
              <PaperInput 
                onAnalyze={handleAnalyze} 
                isLoading={false} 
              />
            </div>
          )}

          {appState === AppState.ANALYZING && (
             <div className="w-full max-w-4xl animate-in fade-in duration-700 flex flex-col items-center">
               <IsometricAssembly step={analysisStep} />
             </div>
          )}

          {appState === AppState.GENERATED && artifact && (
            <div className="animate-in zoom-in duration-500 flex flex-col items-center w-full max-w-4xl">
              <div className="text-center mb-4">
                 <h2 className="text-3xl font-display font-bold text-white">Discovery Unlocked</h2>
                 <p className="text-slate-400 text-sm mt-1">
                   Gemini has generated a novel research artifact from your inputs.
                 </p>
              </div>
              
              <HypothesisCard 
                artifact={artifact} 
                mintingStatus={mintingStatus} 
                onMint={handleMint} 
              />
              
              {/* Semantic Analysis Graph Section */}
              <div className="w-full mt-12 mb-8 border-t border-slate-800 pt-8 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
                  <div className="flex items-center justify-center gap-2 mb-6">
                      <BrainCircuit className="text-purple-400" size={20} />
                      <h3 className="text-xl font-display font-semibold text-white">Semantic Knowledge Graph</h3>
                  </div>
                  <AnalysisVisualization papers={currentPapers} step={5} showStatus={false} />
              </div>

              <div className="text-center mt-4 pb-12">
                <button 
                  onClick={handleReset}
                  className="text-slate-500 hover:text-white text-sm transition-colors"
                >
                  Start New Analysis
                </button>
              </div>
            </div>
          )}

          {appState === AppState.MINT_SUCCESS && artifact && (
            <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-1000">
                 
                 <div className="absolute top-8 left-8">
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} /> <span className="text-sm font-bold uppercase tracking-wider">Create New</span>
                    </button>
                 </div>

                 {/* Added mb-28 to clear the scaled card's top bound */}
                 <div className="mb-28 text-center animate-in slide-in-from-top-10 duration-700 delay-500 relative z-50">
                     <h2 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400 drop-shadow-lg">
                        ARTIFACT MINTED
                     </h2>
                     <p className="text-slate-400 text-sm mt-2 font-mono tracking-widest">
                         BLOCK #{artifact.blockchain?.blockNumber} • TX: {artifact.blockchain?.transactionHash.substring(0,8)}...
                     </p>
                 </div>

                 <HypothesisCard 
                    artifact={artifact} 
                    mintingStatus={'minted'} 
                    onMint={() => {}} 
                    isStandalone={true}
                    onCreateAnother={handleReset}
                 />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;