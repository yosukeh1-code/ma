
import React from 'react';
import { GameStatus } from '../types';

interface LoadingOverlayProps {
  status: GameStatus;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ status }) => {
  const getMessage = () => {
    switch (status) {
      case GameStatus.GENERATING_STORY:
        return 'AIが問題を考えています...';
      case GameStatus.GENERATING_IMAGE_1:
        return '1枚目の画像を生成中...';
      case GameStatus.GENERATING_IMAGE_2:
        return '2枚目の画像を生成中（間違いを仕込んでいます）...';
      default:
        return '準備中...';
    }
  };

  const getSubMessage = () => {
    switch (status) {
      case GameStatus.GENERATING_IMAGE_2:
        return 'これには少し時間がかかることがあります。集中力を高めてお待ちください！';
      default:
        return '最高の体験を生成しています。';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <i className="fas fa-magic text-blue-500 text-2xl animate-pulse"></i>
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{getMessage()}</h3>
      <p className="text-gray-500 max-w-xs">{getSubMessage()}</p>
    </div>
  );
};

export default LoadingOverlay;
