
import { Difficulty } from './types';

export const GAME_THEMES = [
  { id: 'kitchen', name: '賑やかなキッチン', icon: '🍳' },
  { id: 'forest', name: '魔法の森', icon: '🌲' },
  { id: 'city', name: '未来の都市', icon: '🏙️' },
  { id: 'ocean', name: '海底都市', icon: '🌊' },
  { id: 'space', name: '宇宙ステーション', icon: '🚀' },
  { id: 'toy_store', name: 'おもちゃ屋さん', icon: '🧸' },
];

export const DIFFICULTY_CONFIG = {
  [Difficulty.EASY]: {
    label: 'かんたん',
    count: 3,
    subtleHint: 'Make the changes very obvious, large, and high-contrast.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  [Difficulty.MEDIUM]: {
    label: 'ふつう',
    count: 5,
    subtleHint: 'Make the changes clear but requiring some observation.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  [Difficulty.HARD]: {
    label: 'むずかしい',
    count: 7,
    subtleHint: 'Make the changes extremely subtle, tiny, and well-integrated into the scene.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
};
