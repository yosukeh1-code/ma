
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameStatus, Difficulty } from './types';
import { generateLevelMetadata, generateBaseImage, generateModifiedImage } from './services/geminiService';
import Header from './components/Header';
import GameControls from './components/GameControls';
import GamePlay from './components/GamePlay';
import LoadingOverlay from './components/LoadingOverlay';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.IDLE,
    difficulty: Difficulty.MEDIUM,
    level: null,
    image1: null,
    image2: null,
    foundCount: 0,
    timeElapsed: 0,
    error: null,
  });

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING) {
      timerRef.current = window.setInterval(() => {
        setGameState(prev => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.status]);

  const handleDifficultyChange = (difficulty: Difficulty) => {
    setGameState(prev => ({ ...prev, difficulty }));
  };

  const handleStartGame = async (theme: string) => {
    const currentDifficulty = gameState.difficulty;
    
    setGameState(prev => ({
      ...prev,
      status: GameStatus.GENERATING_STORY,
      level: null,
      image1: null,
      image2: null,
      foundCount: 0,
      timeElapsed: 0,
      error: null,
    }));

    try {
      // 1. Generate Metadata with difficulty context
      const level = await generateLevelMetadata(theme, currentDifficulty);
      setGameState(prev => ({ ...prev, level, status: GameStatus.GENERATING_IMAGE_1 }));

      // 2. Generate Base Image
      const img1 = await generateBaseImage(level.basePrompt);
      setGameState(prev => ({ ...prev, image1: img1, status: GameStatus.GENERATING_IMAGE_2 }));

      // 3. Generate Modified Image
      const img2 = await generateModifiedImage(img1, level.modificationPrompt);
      setGameState(prev => ({ ...prev, image2: img2, status: GameStatus.PLAYING }));

    } catch (err: any) {
      console.error(err);
      setGameState(prev => ({
        ...prev,
        status: GameStatus.ERROR,
        error: "画像の生成中にエラーが発生しました。別のテーマを試すか、リロードしてください。"
      }));
    }
  };

  const handleDifferenceFound = useCallback((id: string) => {
    setGameState(prev => {
      if (!prev.level) return prev;
      
      const updatedDifferences = prev.level.differences.map(d => 
        d.id === id ? { ...d, found: true } : d
      );
      
      const newFoundCount = updatedDifferences.filter(d => d.found).length;
      const isCompleted = newFoundCount === prev.level.differences.length;

      return {
        ...prev,
        level: { ...prev.level, differences: updatedDifferences },
        foundCount: newFoundCount,
        status: isCompleted ? GameStatus.COMPLETED : prev.status
      };
    });
  }, []);

  const handleReset = () => {
    setGameState(prev => ({
      ...prev,
      status: GameStatus.IDLE,
      level: null,
      image1: null,
      image2: null,
      foundCount: 0,
      timeElapsed: 0,
      error: null,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Game Status Messages */}
        <div className="max-w-4xl mx-auto px-4 pt-8">
          {gameState.error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-sm">
              <div className="flex items-center">
                <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
                <p className="text-red-700 font-medium">{gameState.error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Content */}
        {gameState.status === GameStatus.IDLE || gameState.status === GameStatus.COMPLETED || gameState.status === GameStatus.ERROR ? (
          <GameControls 
            status={gameState.status}
            currentDifficulty={gameState.difficulty}
            onDifficultyChange={handleDifficultyChange}
            onStart={handleStartGame} 
            onReset={handleReset} 
          />
        ) : null}

        {[GameStatus.GENERATING_STORY, GameStatus.GENERATING_IMAGE_1, GameStatus.GENERATING_IMAGE_2].includes(gameState.status) && (
          <LoadingOverlay status={gameState.status} />
        )}

        {(gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.COMPLETED) && (
          <GamePlay gameState={gameState} onFound={handleDifferenceFound} />
        )}
      </main>

      <footer className="py-6 text-center text-gray-400 text-sm border-t border-gray-100 bg-white">
        &copy; 2024 AI 違い探しマスター - Create your own puzzle in seconds.
      </footer>
    </div>
  );
};

export default App;
