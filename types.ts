
export interface Difference {
  id: string;
  description: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  found: boolean;
}

export interface LevelData {
  theme: string;
  basePrompt: string;
  modificationPrompt: string;
  differences: Difference[];
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum GameStatus {
  IDLE = 'IDLE',
  GENERATING_STORY = 'GENERATING_STORY',
  GENERATING_IMAGE_1 = 'GENERATING_IMAGE_1',
  GENERATING_IMAGE_2 = 'GENERATING_IMAGE_2',
  PLAYING = 'PLAYING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface GameState {
  status: GameStatus;
  difficulty: Difficulty;
  level: LevelData | null;
  image1: string | null;
  image2: string | null;
  foundCount: number;
  timeElapsed: number;
  error: string | null;
}
