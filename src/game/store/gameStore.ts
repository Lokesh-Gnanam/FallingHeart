import { create } from 'zustand';

interface GameState {
  score: number;
  lives: number;
  combo: number;
  heartsCollected: number;
  maxCombo: number;
  gameDuration: number;
  highScore: number;
  isPlaying: boolean;
  isGameOver: boolean;
  startGame: () => void;
  catchHeart: (type: 'normal' | 'golden') => { points: number; isComboBonus: boolean };
  missHeart: () => void;
  incrementDuration: (seconds: number) => void;
  endGame: () => void;
  resetHighScore: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  lives: 3,
  combo: 0,
  heartsCollected: 0,
  maxCombo: 0,
  gameDuration: 0,
  highScore: 0,
  isPlaying: false,
  isGameOver: false,

  startGame: () => {
    set({
      score: 0,
      lives: 3,
      combo: 0,
      heartsCollected: 0,
      maxCombo: 0,
      gameDuration: 0,
      isPlaying: true,
      isGameOver: false,
    });
  },

  catchHeart: (type) => {
    const state = get();
    const basePoints = type === 'golden' ? 50 : 10;
    const currentCombo = state.combo + 1;
    
    // Combo multiplier: x2 if combo >= 5
    const isComboBonus = currentCombo >= 5;
    const multiplier = isComboBonus ? 2 : 1;
    const points = basePoints * multiplier;

    const newScore = state.score + points;
    const newMaxCombo = Math.max(state.maxCombo, currentCombo);
    const newHighScore = Math.max(state.highScore, newScore);

    set({
      score: newScore,
      combo: currentCombo,
      heartsCollected: state.heartsCollected + 1,
      maxCombo: newMaxCombo,
      highScore: newHighScore,
    });

    return { points, isComboBonus };
  },

  missHeart: () => {
    const state = get();
    const nextLives = Math.max(0, state.lives - 1);
    
    set({
      combo: 0,
      lives: nextLives,
      isGameOver: nextLives === 0,
      isPlaying: nextLives > 0,
    });
  },

  incrementDuration: (seconds) => {
    set((state) => ({ gameDuration: state.gameDuration + seconds }));
  },

  endGame: () => {
    set({
      isPlaying: false,
      isGameOver: true,
    });
  },

  resetHighScore: () => {
    set({ highScore: 0 });
  },
}));
