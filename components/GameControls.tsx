
import React, { useState } from 'react';
import { GAME_THEMES, DIFFICULTY_CONFIG } from '../constants';
import { GameStatus, Difficulty } from '../types';

interface GameControlsProps {
  status: GameStatus;
  currentDifficulty: Difficulty;
  onDifficultyChange: (diff: Difficulty) => void;
  onStart: (theme: string) => void;
  onReset: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ 
  status, 
  currentDifficulty, 
  onDifficultyChange, 
  onStart, 
  onReset 
}) => {
  const isIdle = status === GameStatus.IDLE || status === GameStatus.COMPLETED || status === GameStatus.ERROR;
  const isGenerating = [
    GameStatus.GENERATING_STORY,
    GameStatus.GENERATING_IMAGE_1,
    GameStatus.GENERATING_IMAGE_2
  ].includes(status);

  if (!isIdle && !isGenerating) return null;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
        {status === GameStatus.COMPLETED ? '🎉 クリアおめでとう！' : '難易度とテーマを選んでスタート！'}
      </h2>
      
      {/* Difficulty Selection */}
      <div className="flex justify-center gap-3 mb-8">
        {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, any][]).map(([key, config]) => (
          <button
            key={key}
            disabled={isGenerating}
            onClick={() => onDifficultyChange(key)}
            className={`
              flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm
              ${currentDifficulty === key 
                ? `${config.bgColor} ${config.borderColor} ${config.color} scale-105 shadow-md` 
                : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
              }
              ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex flex-col items-center">
              <span>{config.label}</span>
              <span className="text-[10px] opacity-70">間違い: {config.count}個</span>
            </div>
          </button>
        ))}
      </div>

      {/* Theme Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {GAME_THEMES.map((theme) => (
          <button
            key={theme.id}
            disabled={isGenerating}
            onClick={() => onStart(theme.name)}
            className={`
              flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200
              ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
              border-2 border-transparent hover:border-blue-300 hover:bg-blue-50 bg-gray-50
            `}
          >
            <span className="text-3xl mb-2">{theme.icon}</span>
            <span className="text-xs font-bold text-gray-700 text-center">{theme.name}</span>
          </button>
        ))}
      </div>

      {status === GameStatus.COMPLETED && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={onReset}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all"
          >
            もう一度遊ぶ
          </button>
        </div>
      )}
    </div>
  );
};

export default GameControls;
