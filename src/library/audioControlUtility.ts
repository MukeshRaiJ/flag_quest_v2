import { useRef, useCallback, useEffect } from "react";

/**
 * Configuration options for audio playback controll
 */
interface AudioControlOptions {
  stopPrevious?: boolean; // Whether to stop previously playing audio
  volume?: number; // Volume level (0-1)
  loop?: boolean; // Whether to loop the audio
  onEnd?: () => void; // Callback function when audio ends
  priority?: boolean; // Whether this audio should take priority over others
  ignorePriority?: boolean; // Whether to ignore priority system
  queueIfBlocked?: boolean; // Whether to queue if blocked by priority audio
  preload?: "auto" | "metadata" | "none"; // Audio preload strategy
  playbackRate?: number; // Playback speed multiplier
}

/**
 * Metadata about current audio playback state
 */
interface AudioMetadata {
  duration?: number; // Total duration of current audio
  currentTime: number; // Current playback position
  isPlaying: boolean; // Whether audio is currently playing
}

/**
 * State management for background music
 */
interface BackgroundMusicState {
  audioRef: HTMLAudioElement | null; // Reference to background music audio element
  volume: number; // Current volume level
  isPlaying: boolean; // Whether background music is playing
  originalVolume: number; // Original volume before ducking
  enableDucking: boolean; // Whether to enable auto-ducking
}

/**
 * Custom hook for comprehensive audio control in React applications
 * Provides functionality for managing multiple audio streams, background music,
 * and priority-based audio playback
 */
export const useAudioControl = () => {
  // Refs to track various audio states
  const previousAudioRef = useRef<HTMLAudioElement | null>(null); // Tracks last played non-priority audio
  const priorityAudioRef = useRef<HTMLAudioElement | null>(null); // Tracks currently playing priority audio
  const bgMusicRef = useRef<BackgroundMusicState>({
    // Manages background music state
    audioRef: null,
    volume: 1,
    isPlaying: false,
    originalVolume: 1,
    enableDucking: true, // Default ducking behavior
  });
  const audioMetadataRef = useRef<AudioMetadata>({
    // Tracks current audio metadata
    currentTime: 0,
    isPlaying: false,
  });
  const priorityQueueRef = useRef<
    // Queue for priority audio playback
    Array<{
      audioRef: HTMLAudioElement;
      options: AudioControlOptions;
    }>
  >([]);

  /**
   * Removes all event listeners from an audio element
   */
  const cleanupEventListeners = useCallback((audioRef: HTMLAudioElement) => {
    const events = [
      "loadedmetadata",
      "timeupdate",
      "play",
      "pause",
      "ended",
      "error",
    ];
    events.forEach((event) => {
      audioRef.removeEventListener(event, () => {});
    });
  }, []);

  /**
   * Checks if there's currently priority audio playing
   */
  const hasPriorityAudio = useCallback(() => {
    return (
      priorityAudioRef.current !== null &&
      !priorityAudioRef.current.paused &&
      priorityAudioRef.current.currentTime < priorityAudioRef.current.duration
    );
  }, []);

  /**
   * Stops audio playback and resets its state
   */
  const stopAudio = useCallback(
    (audioRef: HTMLAudioElement) => {
      if (!audioRef) return;

      try {
        audioRef.pause();
        audioRef.currentTime = 0;
        cleanupEventListeners(audioRef);
      } catch (error) {
        console.error("Error stopping audio:", error);
      }
    },
    [cleanupEventListeners]
  );

  /**
   * Sets volume for an audio element with safety bounds
   */
  const setVolume = useCallback(
    (audioRef: HTMLAudioElement, volume: number) => {
      if (!audioRef) return;
      audioRef.volume = Math.max(0, Math.min(1, volume));
    },
    []
  );

  /**
   * Reduces background music volume when priority audio plays
   */
  const duckBackgroundMusic = useCallback(() => {
    if (
      bgMusicRef.current.audioRef &&
      bgMusicRef.current.isPlaying &&
      bgMusicRef.current.enableDucking
    ) {
      bgMusicRef.current.originalVolume = bgMusicRef.current.volume;
      bgMusicRef.current.audioRef.volume =
        bgMusicRef.current.originalVolume * 0.2; // Reduce to 20% of original volume
    }
  }, []);

  /**
   * Restores background music volume after priority audio ends
   */
  const restoreBackgroundMusic = useCallback(() => {
    if (
      bgMusicRef.current.audioRef &&
      bgMusicRef.current.isPlaying &&
      bgMusicRef.current.enableDucking
    ) {
      bgMusicRef.current.audioRef.volume = bgMusicRef.current.originalVolume;
    }
  }, []);

  /**
   * Starts background music playback with specified volume
   */
  const playBackgroundMusic = useCallback(
    async (
      audioRef: HTMLAudioElement,
      volume: number = 1,
      enableDucking: boolean = true
    ) => {
      if (!audioRef) return;

      try {
        // Stop existing background music if any
        if (bgMusicRef.current.audioRef) {
          stopAudio(bgMusicRef.current.audioRef);
        }

        audioRef.loop = true;
        const normalizedVolume = Math.max(0, Math.min(1, volume));

        // Duck volume if priority audio is playing and ducking is enabled
        const shouldDuck = hasPriorityAudio() && enableDucking;
        const initialVolume = shouldDuck
          ? normalizedVolume * 0.2
          : normalizedVolume;
        audioRef.volume = initialVolume;

        // Handle mobile devices differently
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        audioRef.preload = isMobile ? "metadata" : "auto";

        const playPromise = audioRef.play();
        if (playPromise) {
          await playPromise;
        }

        // Update background music state
        bgMusicRef.current = {
          audioRef,
          volume: initialVolume,
          isPlaying: true,
          originalVolume: normalizedVolume,
          enableDucking,
        };
      } catch (error) {
        console.error("Error playing background music:", error);
      }
    },
    [stopAudio, hasPriorityAudio]
  );

  /**
   * Stops background music playback
   */
  const stopBackgroundMusic = useCallback(() => {
    if (bgMusicRef.current.audioRef) {
      stopAudio(bgMusicRef.current.audioRef);
      bgMusicRef.current.isPlaying = false;
    }
  }, [stopAudio]);

  /**
   * Adjusts background music volume with ducking consideration
   */
  const setBackgroundMusicVolume = useCallback(
    (volume: number) => {
      if (bgMusicRef.current.audioRef) {
        const normalizedVolume = Math.max(0, Math.min(1, volume));
        bgMusicRef.current.originalVolume = normalizedVolume;

        // Apply ducking if priority audio is playing and ducking is enabled
        const finalVolume =
          hasPriorityAudio() && bgMusicRef.current.enableDucking
            ? normalizedVolume * 0.2
            : normalizedVolume;
        bgMusicRef.current.volume = finalVolume;
        bgMusicRef.current.audioRef.volume = finalVolume;
      }
    },
    [hasPriorityAudio]
  );

  /**
   * Sets whether background music should duck when priority audio plays
   */
  const setBackgroundMusicDucking = useCallback(
    (enableDucking: boolean) => {
      if (bgMusicRef.current.audioRef) {
        bgMusicRef.current.enableDucking = enableDucking;

        // If disabling ducking while ducked, restore volume
        if (!enableDucking && hasPriorityAudio()) {
          bgMusicRef.current.audioRef.volume =
            bgMusicRef.current.originalVolume;
        }
        // If enabling ducking while priority audio is playing, duck volume
        else if (enableDucking && hasPriorityAudio()) {
          bgMusicRef.current.audioRef.volume =
            bgMusicRef.current.originalVolume * 0.2;
        }
      }
    },
    [hasPriorityAudio]
  );

  /**
   * Sets up audio element with event listeners and configuration
   */
  const configureAudio = useCallback(
    (audioRef: HTMLAudioElement, options: AudioControlOptions) => {
      if (!audioRef) return;

      cleanupEventListeners(audioRef);

      // Configure mobile-specific settings
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      audioRef.preload = isMobile ? "metadata" : options.preload || "auto";

      if (options.playbackRate) {
        audioRef.playbackRate = options.playbackRate;
      }

      // Set up event listeners for tracking audio state
      const onLoadedMetadata = () => {
        audioMetadataRef.current.duration = audioRef.duration;
      };

      const onTimeUpdate = () => {
        audioMetadataRef.current.currentTime = audioRef.currentTime;
      };

      const onPlay = () => {
        audioMetadataRef.current.isPlaying = true;
      };

      const onPause = () => {
        audioMetadataRef.current.isPlaying = false;
      };

      // Attach event listeners
      audioRef.addEventListener("loadedmetadata", onLoadedMetadata);
      audioRef.addEventListener("timeupdate", onTimeUpdate);
      audioRef.addEventListener("play", onPlay);
      audioRef.addEventListener("pause", onPause);

      // Store event listeners for cleanup
      audioRef.dataset.eventListeners = JSON.stringify({
        loadedmetadata: onLoadedMetadata,
        timeupdate: onTimeUpdate,
        play: onPlay,
        pause: onPause,
      });
    },
    [cleanupEventListeners]
  );

  /**
   * Main function for playing audio with priority system and queuing
   */
  const playAudio = useCallback(
    async (
      newAudioRef: HTMLAudioElement,
      options: AudioControlOptions = {}
    ) => {
      if (!newAudioRef) return false;

      const {
        stopPrevious = true,
        volume = 1,
        loop = false,
        onEnd = null,
        priority = false,
        ignorePriority = false,
        queueIfBlocked = false,
      } = options;

      // Handle priority system
      if (!ignorePriority && hasPriorityAudio() && !priority) {
        if (queueIfBlocked) {
          priorityQueueRef.current.push({ audioRef: newAudioRef, options });
        }
        return false;
      }

      try {
        // Initialize audio context for web audio API
        if (window.AudioContext || (window as any).webkitAudioContext) {
          const AudioContext =
            window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContext();
          await audioContext.resume();
        }

        // Handle priority audio
        if (priority) {
          if (priorityAudioRef.current) {
            stopAudio(priorityAudioRef.current);
          }
          priorityAudioRef.current = newAudioRef;
          duckBackgroundMusic();
        }

        // Stop previous audio if required
        if (stopPrevious && previousAudioRef.current) {
          stopAudio(previousAudioRef.current);
        }

        configureAudio(newAudioRef, options);

        newAudioRef.volume = volume;
        newAudioRef.loop = loop;

        // Handle visibility change (page hidden)
        const handleVisibilityChange = () => {
          if (document.hidden && !options.priority) {
            stopAudio(newAudioRef);
          }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Enhanced onEnd handler for priority system
        const enhancedOnEnd = () => {
          if (onEnd) onEnd();
          if (priority) {
            priorityAudioRef.current = null;
            restoreBackgroundMusic();
            if (priorityQueueRef.current.length > 0) {
              const nextAudio = priorityQueueRef.current.shift();
              if (nextAudio) {
                playAudio(nextAudio.audioRef, {
                  ...nextAudio.options,
                  ignorePriority: true,
                });
              }
            }
          }
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange
          );
        };

        newAudioRef.onended = enhancedOnEnd;
        previousAudioRef.current = newAudioRef;

        const playPromise = newAudioRef.play();
        if (playPromise) {
          await playPromise;
        }

        return true;
      } catch (error) {
        console.error("Error playing audio:", error);
        return false;
      }
    },
    [
      hasPriorityAudio,
      stopAudio,
      configureAudio,
      duckBackgroundMusic,
      restoreBackgroundMusic,
    ]
  );

  /**
   * Cleans up all audio states and references
   */
  const cleanup = useCallback(() => {
    if (previousAudioRef.current) {
      stopAudio(previousAudioRef.current);
    }
    if (priorityAudioRef.current) {
      stopAudio(priorityAudioRef.current);
    }
    if (bgMusicRef.current.audioRef) {
      stopAudio(bgMusicRef.current.audioRef);
    }

    priorityQueueRef.current.forEach(({ audioRef }) => {
      cleanupEventListeners(audioRef);
    });

    // Reset all states
    previousAudioRef.current = null;
    priorityAudioRef.current = null;
    bgMusicRef.current = {
      audioRef: null,
      volume: 1,
      isPlaying: false,
      originalVolume: 1,
      enableDucking: true,
    };
    priorityQueueRef.current = [];

    audioMetadataRef.current = {
      currentTime: 0,
      isPlaying: false,
    };
  }, [stopAudio, cleanupEventListeners]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  /**
   * Returns current audio metadata
   */
  const getAudioMetadata = useCallback(() => {
    return audioMetadataRef.current;
  }, []);

  /**
   * Returns current background music state
   */
  const getBackgroundMusicState = useCallback(() => {
    return {
      isPlaying: bgMusicRef.current.isPlaying,
      volume: bgMusicRef.current.volume,
      originalVolume: bgMusicRef.current.originalVolume,
      enableDucking: bgMusicRef.current.enableDucking,
    };
  }, []);

  // Export all audio control functions
  return {
    playAudio,
    stopAudio,
    setVolume,
    cleanup,
    previousAudioRef,
    hasPriorityAudio,
    getAudioMetadata,
    playBackgroundMusic,
    stopBackgroundMusic,
    setBackgroundMusicVolume,
    getBackgroundMusicState,
  };
};

export default useAudioControl;
