
import React, { useState, useRef, useEffect } from 'react';
import { GameState } from '../types';

interface GamePlayProps {
  gameState: GameState;
  onFound: (id: string) => void;
}

const GamePlay: React.FC<GamePlayProps> = ({ gameState, onFound }) => {
  const { level, image1, image2, foundCount } = gameState;
  
  // Game Logic States
  const [clickMarkers, setClickMarkers] = useState<{x: number, y: number, id: number}[]>([]);
  const [hintLocation, setHintLocation] = useState<{x: number, y: number} | null>(null);
  const [lastFoundDesc, setLastFoundDesc] = useState<{text: string, x: number, y: number} | null>(null);
  
  // View Modes
  const [compareMode, setCompareMode] = useState<'side' | 'flicker' | 'slider'>('side');
  const [activeImage, setActiveImage] = useState<1 | 2>(1);
  const [sliderPos, setSliderPos] = useState(50);
  
  // AI Alignment offsets for Image 2
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const nextMarkerId = useRef(0);
  const hintTimeoutRef = useRef<number | null>(null);
  const descTimeoutRef = useRef<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!level || !image1 || !image2) return null;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Visual feedback (ping)
    const newMarker = { x, y, id: nextMarkerId.current++ };
    setClickMarkers(prev => [...prev, newMarker]);
    setTimeout(() => {
      setClickMarkers(prev => prev.filter(m => m.id !== newMarker.id));
    }, 600);

    // Hit detection
    const RADIUS = 7; // Approximately 7% of image dimensions
    const hit = level.differences.find(diff => {
      if (diff.found) return false;
      const distance = Math.sqrt(Math.pow(diff.x - x, 2) + Math.pow(diff.y - y, 2));
      return distance < RADIUS;
    });

    if (hit) {
      onFound(hit.id);
      setLastFoundDesc({ text: hit.description, x: hit.x, y: hit.y });
      if (descTimeoutRef.current) clearTimeout(descTimeoutRef.current);
      descTimeoutRef.current = window.setTimeout(() => setLastFoundDesc(null), 3500);
      if (hintLocation && Math.sqrt(Math.pow(hit.x - hintLocation.x, 2) + Math.pow(hit.y - hintLocation.y, 2)) < RADIUS) {
        setHintLocation(null);
      }
    }
  };

  const showHint = () => {
    if (!level) return;
    const unfound = level.differences.filter(d => !d.found);
    if (unfound.length === 0) return;
    const randomDiff = unfound[Math.floor(Math.random() * unfound.length)];
    setHintLocation({ x: randomDiff.x, y: randomDiff.y });
    if (hintTimeoutRef.current) window.clearTimeout(hintTimeoutRef.current);
    hintTimeoutRef.current = window.setTimeout(() => setHintLocation(null), 4000);
  };

  const adjustOffset = (dir: 'u' | 'd' | 'l' | 'r') => {
    const step = 0.5;
    if (dir === 'u') setOffsetY(v => v - step);
    if (dir === 'd') setOffsetY(v => v + step);
    if (dir === 'l') setOffsetX(v => v - step);
    if (dir === 'r') setOffsetX(v => v + step);
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, x)));
  };

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      if (descTimeoutRef.current) clearTimeout(descTimeoutRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      <style>{`
        @keyframes hint-pulse {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          70% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.4; box-shadow: 0 0 0 20px rgba(245, 158, 11, 0); }
          100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        .hint-marker {
          position: absolute; width: 80px; height: 80px; border: 4px dashed #f59e0b; border-radius: 50%;
          pointer-events: none; animation: hint-pulse 1.5s infinite ease-in-out; z-index: 10;
        }
        @keyframes ping {
          75%, 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        .diff-marker {
          position: absolute; width: 40px; height: 40px; border: 3px solid #ef4444; border-radius: 50%;
          transform: translate(-50%, -50%); pointer-events: none; animation: ping 0.6s ease-out infinite;
          z-index: 20;
        }
        .success-label {
          position: absolute; transform: translate(-50%, -150%); background: rgba(34, 197, 94, 0.95);
          color: white; padding: 6px 14px; border-radius: 9999px; font-weight: bold; font-size: 0.875rem;
          white-space: nowrap; pointer-events: none; z-index: 50; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          animation: fade-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translate(-50%, -100%); }
          to { opacity: 1; transform: translate(-50%, -150%); }
        }
        .found-check {
          position: absolute; transform: translate(-50%, -50%); width: 48px; height: 48px;
          border: 4px solid #22c55e; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; background: rgba(255,255,255,0.7); z-index: 30;
          animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes pop-in {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>

      {/* Top Info Bar */}
      <div className="w-full bg-white p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4 border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400">間違いを見つける</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-blue-600">{foundCount}</span>
              <span className="text-gray-300">/</span>
              <span className="text-lg font-bold text-gray-500">{level.differences.length}</span>
            </div>
          </div>
          <div className="h-10 w-[1px] bg-gray-100" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-gray-400">経過時間</span>
            <span className="text-lg font-mono font-bold text-gray-700">
              {Math.floor(gameState.timeElapsed / 60)}:{(gameState.timeElapsed % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setCompareMode('side')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${compareMode === 'side' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <i className="fas fa-columns mr-2"></i>並べて表示
          </button>
          <button onClick={() => setCompareMode('flicker')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${compareMode === 'flicker' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <i className="fas fa-layer-group mr-2"></i>重ねる
          </button>
          <button onClick={() => setCompareMode('slider')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${compareMode === 'slider' ? 'bg-purple-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <i className="fas fa-arrows-alt-h mr-2"></i>スライダー
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="w-full">
          <div className="relative group select-none">
            {compareMode === 'side' && (
              <div className="grid grid-cols-2 gap-4 w-full">
                {[image1, image2].map((img, idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <div 
                      className="image-container relative bg-gray-200 cursor-crosshair border-2 border-transparent hover:border-blue-400 transition-colors overflow-hidden" 
                      onClick={handleImageClick}
                    >
                      <div className="w-full h-full relative" style={idx === 1 ? { transform: `translate(${offsetX}%, ${offsetY}%)` } : {}}>
                        <img src={img} alt={`Side ${idx}`} className="w-full h-full object-cover select-none pointer-events-none" draggable={false} />
                        {clickMarkers.map(m => <div key={m.id} className="diff-marker" style={{ left: `${m.x}%`, top: `${m.y}%` }} />)}
                        {hintLocation && <div className="hint-marker" style={{ left: `${hintLocation.x}%`, top: `${hintLocation.y}%` }} />}
                        {level.differences.filter(d => d.found).map(d => (
                          <div key={`found-${d.id}`} className="found-check shadow-lg" style={{ left: `${d.x}%`, top: `${d.y}%` }}>
                            <i className="fas fa-check text-green-500 text-xl drop-shadow-md"></i>
                          </div>
                        ))}
                        {lastFoundDesc && <div className="success-label" style={{ left: `${lastFoundDesc.x}%`, top: `${lastFoundDesc.y}%` }}>{lastFoundDesc.text}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {compareMode === 'flicker' && (
              <div className="flex flex-col gap-4">
                <div 
                  className="image-container relative bg-gray-200 cursor-crosshair border-4 border-indigo-200 overflow-hidden max-w-2xl mx-auto" 
                  onClick={handleImageClick}
                >
                  <div className="w-full h-full relative">
                    <img src={image1} className={`absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-100 ${activeImage === 1 ? 'opacity-100' : 'opacity-0'}`} draggable={false} />
                    <img src={image2} className={`absolute inset-0 w-full h-full object-cover select-none transition-opacity duration-100 ${activeImage === 2 ? 'opacity-100' : 'opacity-0'}`} style={{ transform: `translate(${offsetX}%, ${offsetY}%)` }} draggable={false} />
                    {clickMarkers.map(m => <div key={m.id} className="diff-marker" style={{ left: `${m.x}%`, top: `${m.y}%` }} />)}
                    {hintLocation && <div className="hint-marker" style={{ left: `${hintLocation.x}%`, top: `${hintLocation.y}%` }} />}
                    {level.differences.filter(d => d.found).map(d => (
                      <div key={`found-${d.id}`} className="found-check" style={{ left: `${d.x}%`, top: `${d.y}%` }}>
                        <i className="fas fa-check text-green-500 text-xl drop-shadow-md"></i>
                      </div>
                    ))}
                    {lastFoundDesc && <div className="success-label" style={{ left: `${lastFoundDesc.x}%`, top: `${lastFoundDesc.y}%` }}>{lastFoundDesc.text}</div>}
                  </div>
                </div>
                <button 
                  onMouseDown={() => setActiveImage(2)} onMouseUp={() => setActiveImage(1)} onMouseLeave={() => setActiveImage(1)}
                  onTouchStart={() => setActiveImage(2)} onTouchEnd={() => setActiveImage(1)}
                  className="w-full max-w-2xl mx-auto py-4 bg-indigo-500 text-white font-bold rounded-2xl shadow-lg active:bg-indigo-700 transition-colors select-none"
                >
                  長押し中だけ画像Bを表示
                </button>
              </div>
            )}

            {compareMode === 'slider' && (
              <div className="flex flex-col gap-4">
                <div 
                  ref={sliderRef} className="image-container relative bg-gray-200 cursor-crosshair border-4 border-purple-200 select-none overflow-hidden max-w-2xl mx-auto" 
                  onClick={handleImageClick}
                  onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e)} 
                  onTouchMove={handleSliderMove}
                >
                  <div className="w-full h-full relative">
                    <img src={image1} className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />
                    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ width: `${sliderPos}%` }}>
                      <img src={image2} className="absolute inset-0 h-full object-cover" style={{ width: `${100 / (sliderPos || 1) * 100}%`, transform: `translate(${offsetX}%, ${offsetY}%)` }} draggable={false} />
                    </div>
                    {clickMarkers.map(m => <div key={m.id} className="diff-marker" style={{ left: `${m.x}%`, top: `${m.y}%` }} />)}
                    {hintLocation && <div className="hint-marker" style={{ left: `${hintLocation.x}%`, top: `${hintLocation.y}%` }} />}
                    {level.differences.filter(d => d.found).map(d => (
                      <div key={`found-${d.id}`} className="found-check" style={{ left: `${d.x}%`, top: `${d.y}%` }}>
                        <i className="fas fa-check text-green-500 text-xl drop-shadow-md"></i>
                      </div>
                    ))}
                    {lastFoundDesc && <div className="success-label" style={{ left: `${lastFoundDesc.x}%`, top: `${lastFoundDesc.y}%` }}>{lastFoundDesc.text}</div>}
                  </div>
                  
                  <div className="compare-slider-handle pointer-events-auto" style={{ left: `${sliderPos}%` }} onMouseDown={(e) => e.stopPropagation()}>
                    <div className="compare-slider-circle"><i className="fas fa-arrows-alt-h"></i></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Controls & List */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">見つかった箇所</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {level.differences.map((diff) => (
                <div key={diff.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all border-2 ${diff.found ? 'bg-green-50 border-green-100 shadow-sm' : 'bg-gray-50 border-transparent opacity-60'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs ${diff.found ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'}`}>
                    {diff.found ? <i className="fas fa-check"></i> : <i className="fas fa-question"></i>}
                  </div>
                  <span className={`text-xs ${diff.found ? 'text-green-700 font-bold' : 'text-gray-400 italic'}`}>{diff.found ? diff.description : '???'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full md:w-80 flex flex-col gap-4">
            <button onClick={showHint} disabled={foundCount === level.differences.length || !!hintLocation} className="w-full py-4 px-6 bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50">
              <i className="fas fa-lightbulb"></i>ヒントを表示
            </button>
            
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">画像の微調整</span>
              <div className="flex items-center gap-4">
                <div className="grid grid-cols-3 gap-1">
                  <div />
                  <button onClick={() => adjustOffset('u')} className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-xs hover:bg-blue-50"><i className="fas fa-chevron-up"></i></button>
                  <div />
                  <button onClick={() => adjustOffset('l')} className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-xs hover:bg-blue-50"><i className="fas fa-chevron-left"></i></button>
                  <button onClick={() => {setOffsetX(0); setOffsetY(0);}} className="w-8 h-8 bg-white border border-red-200 rounded-lg flex items-center justify-center text-[10px] hover:bg-red-50 text-red-500 font-bold">R</button>
                  <button onClick={() => adjustOffset('r')} className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-xs hover:bg-blue-50"><i className="fas fa-chevron-right"></i></button>
                  <div />
                  <button onClick={() => adjustOffset('d')} className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-xs hover:bg-blue-50"><i className="fas fa-chevron-down"></i></button>
                  <div />
                </div>
                <p className="text-[9px] text-gray-400 leading-tight">AI生成による位置ズレを補正できます</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlay;
