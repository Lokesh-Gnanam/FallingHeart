import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

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
  isPaused: boolean;
  startGame: () => void;
  catchHeart: (type: 'normal' | 'golden') => { points: number; isComboBonus: boolean };
  missHeart: () => void;
  incrementDuration: (seconds: number) => void;
  endGame: () => void;
  resetHighScore: () => void;
  fetchHighScore: () => Promise<number>;
  updateGameStats: (finalScore: number, hearts: number, combo: number) => Promise<void>;
  pauseGame: () => void;
  resumeGame: () => void;
  clearPausedGame: () => void;
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
  isPaused: false,

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
      isPaused: false,
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
      isPaused: false,
    });
  },

  incrementDuration: (seconds) => {
    set((state) => ({ gameDuration: state.gameDuration + seconds }));
  },

  endGame: () => {
    set({
      isPlaying: false,
      isGameOver: true,
      isPaused: false,
    });
  },

  resetHighScore: () => {
    set({ highScore: 0 });
  },

  fetchHighScore: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return 0;
    try {
      const { data, error } = await supabase
        .from('game_stats')
        .select('highest_score')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      const score = data?.highest_score || 0;
      set({ highScore: score });
      return score;
    } catch (e) {
      console.error('Error fetching high score:', e);
      return 0;
    }
  },

  updateGameStats: async (finalScore, hearts, combo) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    try {
      // Fetch current stats
      const { data, error } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Row exists, update it if high score or just sum general stats
        const newHighScore = Math.max(data.highest_score || 0, finalScore);
        const newMaxCombo = Math.max(data.max_combo || 0, combo);
        const newTotalGames = (data.total_games || 0) + 1;
        const newTotalHearts = (data.total_hearts || 0) + hearts;

        const { error: updateError } = await supabase
          .from('game_stats')
          .update({
            highest_score: newHighScore,
            max_combo: newMaxCombo,
            total_games: newTotalGames,
            total_hearts: newTotalHearts,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;
        set({ highScore: newHighScore });
      } else {
        // Row does not exist, insert it
        const { error: insertError } = await supabase
          .from('game_stats')
          .insert({
            user_id: userId,
            highest_score: finalScore,
            max_combo: combo,
            total_games: 1,
            total_hearts: hearts,
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
        set({ highScore: finalScore });
      }
    } catch (e) {
      console.error('Error updating game stats:', e);
    }
  },

  pauseGame: () => {
    set({
      isPlaying: false,
      isPaused: true,
    });
  },

  resumeGame: () => {
    set({
      isPlaying: true,
      isPaused: false,
    });
  },

  clearPausedGame: () => {
    set({
      isPaused: false,
      score: 0,
      lives: 3,
      combo: 0,
      heartsCollected: 0,
      maxCombo: 0,
      gameDuration: 0,
    });
  },
}));
