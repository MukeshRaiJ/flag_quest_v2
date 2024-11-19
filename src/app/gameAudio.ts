// gameAudio.ts
import { useRef, useEffect } from "react";
import { useAudioControl } from "@/library/audioControlUtility";

export interface GameAudioControls {
  playBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
  playCorrectSound: () => void;
  playWrongSound: () => void;
  cleanup: () => void;
}

export const useGameAudio = (): GameAudioControls => {
  const bgMusicRef = useRef<HTMLAudioElement>(new Audio("/sounds/b.mp3"));
  const correctSoundRef = useRef<HTMLAudioElement>(
    new Audio("/sounds/correct.mp3")
  );
  const wrongSoundRef = useRef<HTMLAudioElement>(
    new Audio("/sounds/wrong.mp3")
  );

  const audioControl = useAudioControl();

  const playBackgroundMusic = () => {
    audioControl.playBackgroundMusic(bgMusicRef.current, 0.6, true);
  };

  const stopBackgroundMusic = () => {
    audioControl.stopBackgroundMusic();
  };

  const playCorrectSound = () => {
    audioControl.playAudio(correctSoundRef.current, {
      volume: 0.7,
      priority: true,
    });
  };

  const playWrongSound = () => {
    audioControl.playAudio(wrongSoundRef.current, {
      volume: 0.7,
      priority: true,
    });
  };

  const cleanup = () => {
    audioControl.cleanup();
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    playBackgroundMusic,
    stopBackgroundMusic,
    playCorrectSound,
    playWrongSound,
    cleanup,
  };
};
