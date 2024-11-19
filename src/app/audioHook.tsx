import { useCallback, useRef, useEffect } from "react";
import { useAudioControl } from "@/library/audioControlUtility";

interface GameAudioState {
  soundEnabled: boolean;
  isBgmPlaying: boolean;
}

export const useGameAudio = (gameAudioState: GameAudioState) => {
  const { playAudio, playBackgroundMusic, stopBackgroundMusic } =
    useAudioControl();

  const audioRefs = useRef({
    correct: new Audio("/sounds/correct.mp3"),
    wrong: new Audio("/sounds/wrong.mp3"),
    bgm: new Audio("/sounds/bgm2.mp3"),
    gameover: new Audio("/sounds/wrong.mp3"),
  });

  const playCorrectSound = useCallback(() => {
    if (!gameAudioState.soundEnabled) return;
    playAudio(audioRefs.current.correct, { volume: 1, priority: true });
  }, [gameAudioState.soundEnabled, playAudio]);

  const playWrongSound = useCallback(() => {
    if (!gameAudioState.soundEnabled) return;
    playAudio(audioRefs.current.wrong, { volume: 1, priority: true });
  }, [gameAudioState.soundEnabled, playAudio]);

  const playGameOverSound = useCallback(() => {
    if (!gameAudioState.soundEnabled) return;
    playAudio(audioRefs.current.gameover, { volume: 1, priority: true });
  }, [gameAudioState.soundEnabled, playAudio]);

  const toggleBackgroundMusic = useCallback(() => {
    if (!gameAudioState.soundEnabled) {
      stopBackgroundMusic();
      return false;
    }

    if (!gameAudioState.isBgmPlaying) {
      playBackgroundMusic(audioRefs.current.bgm, 0.5, true);
      return true;
    } else {
      stopBackgroundMusic();
      return false;
    }
  }, [
    gameAudioState.soundEnabled,
    gameAudioState.isBgmPlaying,
    playBackgroundMusic,
    stopBackgroundMusic,
  ]);

  const startBackgroundMusic = useCallback(() => {
    if (gameAudioState.soundEnabled && !gameAudioState.isBgmPlaying) {
      playBackgroundMusic(audioRefs.current.bgm, 0.5, true);
      return true;
    }
    return false;
  }, [
    gameAudioState.soundEnabled,
    gameAudioState.isBgmPlaying,
    playBackgroundMusic,
  ]);

  useEffect(() => {
    return () => {
      stopBackgroundMusic();
    };
  }, [stopBackgroundMusic]);

  return {
    playCorrectSound,
    playWrongSound,
    playGameOverSound,
    toggleBackgroundMusic,
    startBackgroundMusic,
    stopBackgroundMusic,
  };
};
