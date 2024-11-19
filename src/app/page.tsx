"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  Clock,
  Globe,
  Sun,
  Moon,
  ArrowLeft,
  Trophy,
  Star,
  Heart,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import confetti from "canvas-confetti";
import FlagSelection from "./flags";
import { useAudioControl } from "@/library/audioControlUtility";

interface Country {
  name: string;
  capital: string;
  continent: string;
  subregion: string;
  flag: string;
}

interface GameSettings {
  timeLimit: number;
  selectedRegion: string | null;
  selectedSubregion: string | null;
  isDarkMode: boolean;
  soundEnabled: boolean;
}

interface GameState {
  phase: "setup" | "playing" | "gameover" | "paused";
  setupStep: "region" | "subregion";
  score: number;
  timeRemaining: number;
  showHint: boolean;
  isCorrect: boolean | null;
  selectedAnswer: Country | null;
  askedQuestions: Set<string>;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

const FlagQuest: React.FC = () => {
  const { playAudio, playBackgroundMusic, stopBackgroundMusic } =
    useAudioControl();

  const correctAudioRef = React.useRef(new Audio("/sounds/correct.mp3"));
  const wrongAudioRef = React.useRef(new Audio("/sounds/wrong.mp3"));
  const backgroundMusicRef = React.useRef(new Audio("/sounds/bgm2.mp3"));
  const gameoverAudioRef = React.useRef(new Audio("/sounds/wrong.mp3"));

  const [isBgmPlaying, setIsBgmPlaying] = React.useState(false);

  const [gameSettings, setGameSettings] = React.useState<GameSettings>({
    timeLimit: 180,
    selectedRegion: null,
    selectedSubregion: null,
    isDarkMode: false,
    soundEnabled: true,
  });

  const [gameState, setGameState] = React.useState<GameState>({
    phase: "setup",
    setupStep: "region",
    score: 0,
    timeRemaining: 180,
    showHint: false,
    isCorrect: null,
    selectedAnswer: null,
    askedQuestions: new Set<string>(),
  });

  const [countryData, setCountryData] = React.useState<Country[]>([]);
  const [currentQuestion, setCurrentQuestion] = React.useState<Country | null>(
    null
  );
  const [options, setOptions] = React.useState<Country[]>([]);
  const [highScore, setHighScore] = React.useState<number>(0);
  const [streak, setStreak] = React.useState<number>(0);
  const [lives, setLives] = React.useState<number>(3);
  const [showLeaderboard, setShowLeaderboard] = React.useState<boolean>(false);
  const [showAchievements, setShowAchievements] =
    React.useState<boolean>(false);

  const [achievements, setAchievements] = React.useState<Achievement[]>([
    {
      id: "first_win",
      name: "First Victory",
      description: "Complete your first game",
      unlocked: false,
    },
    {
      id: "perfect_streak",
      name: "Perfect Streak",
      description: "Get 10 correct answers in a row",
      unlocked: false,
    },
    {
      id: "speed_demon",
      name: "Speed Demon",
      description: "Answer correctly in under 2 seconds",
      unlocked: false,
    },
  ]);

  const [leaderboard, setLeaderboard] = React.useState<
    Array<{ name: string; score: number }>
  >([
    { name: "Player 1", score: 120 },
    { name: "Player 2", score: 100 },
    { name: "Player 3", score: 80 },
  ]);

  const regions: Record<string, string | null> = {
    World: null,
    Africa: "Africa",
    Asia: "Asia",
    Europe: "Europe",
    "North America": "North America",
    "South America": "South America",
    Oceania: "Oceania",
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/countries.json");
        const data = await response.json();
        setCountryData(data);
      } catch (error) {
        console.error("Error loading country data:", error);
        toast.error("Failed to load country data");
      }
    };
    fetchData();

    const savedHighScore = localStorage.getItem("flagquest-highscore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }

    const savedAchievements = localStorage.getItem("flagquest-achievements");
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    }

    return () => {
      stopBackgroundMusic();
      setIsBgmPlaying(false);
    };
  }, [stopBackgroundMusic]);

  React.useEffect(() => {
    if (gameState.phase !== "playing") return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeRemaining <= 1) {
          handleGameOver();
          return { ...prev, phase: "gameover", timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.phase]);

  const getSubregions = React.useCallback(
    (selectedRegion: string | null): string[] => {
      if (!selectedRegion) return ["All Regions"];

      const subregions = [
        ...new Set(
          countryData
            .filter(
              (country) =>
                !selectedRegion || country.continent === selectedRegion
            )
            .map((country) => country.subregion)
        ),
      ].filter(Boolean) as string[];

      return ["All Regions", ...subregions].sort();
    },
    [countryData]
  );

  const getRemainingCountries = React.useCallback(
    (region: string | null, subregion: string | null): Country[] => {
      let filteredCountries = countryData.filter(
        (country) => !gameState.askedQuestions.has(country.name)
      );

      if (region) {
        filteredCountries = filteredCountries.filter(
          (c) => c.continent === region
        );
      }

      if (subregion && subregion !== "All Regions") {
        filteredCountries = filteredCountries.filter(
          (c) => c.subregion === subregion
        );
      }

      return filteredCountries;
    },
    [countryData, gameState.askedQuestions]
  );

  const getRandomOptions = React.useCallback(
    (correctAnswer: Country, count: number): Country[] => {
      const options: Country[] = [correctAnswer];
      const usedNames = new Set<string>([correctAnswer.name]);

      const sameRegionOptions = countryData
        .filter(
          (c) =>
            c.continent === correctAnswer.continent && !usedNames.has(c.name)
        )
        .sort(() => Math.random() - 0.5);

      const otherRegionOptions = countryData
        .filter(
          (c) =>
            c.continent !== correctAnswer.continent && !usedNames.has(c.name)
        )
        .sort(() => Math.random() - 0.5);

      const allOptions = [...sameRegionOptions, ...otherRegionOptions];

      while (options.length < count && allOptions.length > 0) {
        const nextOption = allOptions.pop()!;
        if (!usedNames.has(nextOption.name)) {
          options.push(nextOption);
          usedNames.add(nextOption.name);
        }
      }

      return options.sort(() => Math.random() - 0.5);
    },
    [countryData]
  );

  const setupQuestion = React.useCallback(() => {
    const remainingCountries = getRemainingCountries(
      gameSettings.selectedRegion,
      gameSettings.selectedSubregion
    );

    if (remainingCountries.length === 0) {
      handleGameOver();
      return;
    }

    const correctAnswer =
      remainingCountries[Math.floor(Math.random() * remainingCountries.length)];

    const questionOptions = getRandomOptions(correctAnswer, 4);

    setCurrentQuestion(correctAnswer);
    setOptions(questionOptions);
    setGameState((prev) => ({
      ...prev,
      showHint: false,
      isCorrect: null,
      selectedAnswer: null,
    }));
  }, [
    gameSettings.selectedRegion,
    gameSettings.selectedSubregion,
    getRemainingCountries,
    getRandomOptions,
  ]);

  const handleAnswer = React.useCallback(
    (country: Country) => {
      if (gameState.selectedAnswer !== null || !currentQuestion) return;

      const correct = country.name === currentQuestion.name;

      if (correct && gameSettings.soundEnabled) {
        playAudio(correctAudioRef.current, { volume: 1, priority: true });
        setStreak((prev) => prev + 1);
        if (
          streak + 1 >= 10 &&
          !achievements.find((a) => a.id === "perfect_streak")?.unlocked
        ) {
          unlockAchievement("perfect_streak");
        }
        if (streak > 0 && streak % 5 === 0) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
          toast.success("🔥 Hot Streak!");
        }
      } else if (!correct && gameSettings.soundEnabled) {
        playAudio(wrongAudioRef.current, { volume: 1, priority: true });
        setStreak(0);
        setLives((prev) => {
          const newLives = prev - 1;
          if (newLives === 0) {
            handleGameOver();
          }
          return newLives;
        });
      }

      setGameState((prev) => ({
        ...prev,
        selectedAnswer: country,
        isCorrect: correct,
        score: correct ? prev.score + calculateScore(streak) : prev.score,
        askedQuestions: new Set([...prev.askedQuestions, currentQuestion.name]),
      }));

      setTimeout(() => {
        if (lives > 1 || correct) {
          setupQuestion();
        }
      }, 1500);
    },
    [
      currentQuestion,
      gameState.selectedAnswer,
      streak,
      lives,
      playAudio,
      achievements,
      setupQuestion,
      gameSettings.soundEnabled,
    ]
  );

  const calculateScore = (currentStreak: number): number => {
    const baseScore = 1;
    const streakBonus = Math.floor(currentStreak / 3);
    return baseScore + streakBonus;
  };

  const unlockAchievement = (achievementId: string) => {
    setAchievements((prev) => {
      const updated = prev.map((a) =>
        a.id === achievementId ? { ...a, unlocked: true } : a
      );
      localStorage.setItem("flagquest-achievements", JSON.stringify(updated));
      return updated;
    });
    toast.success("🏆 New Achievement Unlocked!");
  };

  const handleGameOver = React.useCallback(() => {
    if (gameSettings.soundEnabled) {
      playAudio(gameoverAudioRef.current, { volume: 1, priority: true });
    }
    stopBackgroundMusic();
    setIsBgmPlaying(false);

    if (!achievements.find((a) => a.id === "first_win")?.unlocked) {
      unlockAchievement("first_win");
    }
    if (gameState.score > highScore) {
      setHighScore(gameState.score);
      localStorage.setItem("flagquest-highscore", gameState.score.toString());
      toast.success("🏆 New High Score!");
    }
    setGameState((prev) => ({ ...prev, phase: "gameover" }));
  }, [
    playAudio,
    stopBackgroundMusic,
    achievements,
    gameState.score,
    highScore,
    gameSettings.soundEnabled,
  ]);

  const startGame = React.useCallback(
    (region: string | null, subregion: string | null, time: number) => {
      setGameSettings((prev) => ({
        ...prev,
        selectedRegion: region,
        selectedSubregion: subregion,
        timeLimit: time,
      }));
      setGameState((prev) => ({
        ...prev,
        phase: "playing",
        score: 0,
        timeRemaining: time,
        askedQuestions: new Set<string>(),
      }));

      if (gameSettings.soundEnabled && !isBgmPlaying) {
        playBackgroundMusic(backgroundMusicRef.current, 0.5, true);
        setIsBgmPlaying(true);
      }
      setupQuestion();
    },
    [
      setupQuestion,
      playBackgroundMusic,
      gameSettings.soundEnabled,
      isBgmPlaying,
    ]
  );

  const toggleSound = React.useCallback(() => {
    setGameSettings((prev) => {
      const newSettings = { ...prev, soundEnabled: !prev.soundEnabled };
      if (
        newSettings.soundEnabled &&
        gameState.phase === "playing" &&
        !isBgmPlaying
      ) {
        playBackgroundMusic(backgroundMusicRef.current, 0.5, true);
        setIsBgmPlaying(true);
      } else if (!newSettings.soundEnabled) {
        stopBackgroundMusic();
        setIsBgmPlaying(false);
      }
      return newSettings;
    });
  }, [playBackgroundMusic, stopBackgroundMusic, gameState.phase, isBgmPlaying]);

  const handleRegionSelect = (region: string | null) => {
    setGameSettings((prev) => ({
      ...prev,
      selectedRegion: region,
      selectedSubregion: null,
    }));
    setGameState((prev) => ({
      ...prev,
      setupStep: "subregion",
    }));
  };

  const handleBackToRegions = () => {
    setGameSettings((prev) => ({
      ...prev,
      selectedRegion: null,
      selectedSubregion: null,
    }));
    setGameState((prev) => ({
      ...prev,
      setupStep: "region",
    }));
  };

  const MetricCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color: string;
  }> = ({ icon, label, value, color }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`flex flex-col items-center p-2 rounded-lg ${
        gameSettings.isDarkMode ? "bg-gray-700" : `bg-${color}-50`
      }`}
    >
      <div className={`text-${color}-500`}>{icon}</div>
      <div className="text-sm font-medium">{value}</div>
      <div className="text-xs opacity-75">{label}</div>
    </motion.div>
  );

  const renderGameMetrics = () => (
    <div className="space-y-2 mb-6">
      <div className="grid grid-cols-4 gap-2">
        <MetricCard
          icon={<Globe />}
          label="Score"
          value={gameState.score}
          color="green"
        />
        <MetricCard
          icon={<Clock />}
          label="Time"
          value={`${Math.floor(gameState.timeRemaining / 60)}:${(
            gameState.timeRemaining % 60
          )
            .toString()
            .padStart(2, "0")}`}
          color="blue"
        />
        <MetricCard
          icon={<Star />}
          label="Streak"
          value={streak}
          color="yellow"
        />
        <MetricCard icon={<Heart />} label="Lives" value={lives} color="red" />
      </div>
      <Progress
        value={(gameState.timeRemaining / gameSettings.timeLimit) * 100}
        className="h-2"
      />
    </div>
  );

  const renderGameControls = () => (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
        FlagQuest
      </h1>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowLeaderboard(true)}
        >
          <Trophy className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSound}
          disabled={gameState.phase !== "playing"}
        >
          {gameSettings.soundEnabled && isBgmPlaying ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setGameSettings((prev) => ({
              ...prev,
              isDarkMode: !prev.isDarkMode,
            }))
          }
        >
          {gameSettings.isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );

  const renderRegionSelection = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Select Region</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(regions).map(([name, value]) => (
            <motion.div
              key={name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                className={`w-full h-12 ${
                  gameSettings.isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200"
                }`}
                onClick={() => handleRegionSelect(value)}
              >
                <Globe className="w-4 h-4 mr-2" />
                {name}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSubregionSelection = () => {
    const subregions = getSubregions(gameSettings.selectedRegion);
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToRegions}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">Select Subregion</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {subregions.map((subregion) => (
              <motion.div
                key={subregion}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  className={`w-full h-12 ${
                    gameSettings.isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200"
                  }`}
                  onClick={() =>
                    startGame(
                      gameSettings.selectedRegion,
                      subregion,
                      gameSettings.timeLimit
                    )
                  }
                >
                  {subregion}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const mainCardClass = `p-6 shadow-lg rounded-xl ${
    gameSettings.isDarkMode
      ? "bg-gray-800 text-white"
      : "bg-white/90 backdrop-blur-sm"
  }`;

  const renderContent = () => {
    switch (gameState.phase) {
      case "setup":
        return (
          <Card className={mainCardClass}>
            {renderGameControls()}
            {gameState.setupStep === "region"
              ? renderRegionSelection()
              : renderSubregionSelection()}
          </Card>
        );
      case "playing":
        return (
          <Card className={mainCardClass}>
            {renderGameControls()}
            {renderGameMetrics()}
            {currentQuestion && (
              <FlagSelection
                options={options}
                currentQuestion={currentQuestion}
                onAnswer={handleAnswer}
                selectedAnswer={gameState.selectedAnswer}
                isDarkMode={gameSettings.isDarkMode}
                showHint={gameState.showHint}
                onShowHint={() =>
                  setGameState((prev) => ({ ...prev, showHint: true }))
                }
              />
            )}
          </Card>
        );
      case "gameover":
        return (
          <Card className={mainCardClass}>
            {renderGameControls()}
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  Game Over!
                </h2>
                <div className="mt-4 space-y-2">
                  <p className="text-2xl font-semibold">
                    Final Score: {gameState.score}
                  </p>
                  <p className="text-lg">High Score: {highScore}</p>
                  <p className="text-lg">
                    Countries Completed: {gameState.askedQuestions.size}
                  </p>
                  <p className="text-lg">Best Streak: {streak}</p>
                </div>
              </motion.div>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => {
                    setGameState({
                      phase: "setup",
                      setupStep: "region",
                      score: 0,
                      timeRemaining: gameSettings.timeLimit,
                      showHint: false,
                      isCorrect: null,
                      selectedAnswer: null,
                      askedQuestions: new Set<string>(),
                    });
                    setLives(3);
                    setStreak(0);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  Play Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowLeaderboard(true)}
                >
                  View Leaderboard
                </Button>
              </div>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-md mx-auto p-4 min-h-screen ${
        gameSettings.isDarkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
      }`}
    >
      {renderContent()}
      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leaderboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {leaderboard.map((entry, index) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                key={index}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  gameSettings.isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {index < 3 && (
                    <div className="text-yellow-500">
                      <Trophy className="w-5 h-5" />
                    </div>
                  )}
                  <span className="font-medium">{entry.name}</span>
                </div>
                <span className="font-bold">{entry.score}</span>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Achievements</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {achievements.map((achievement, index) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                key={achievement.id}
                className={`p-3 rounded-lg ${
                  achievement.unlocked
                    ? gameSettings.isDarkMode
                      ? "bg-green-900/20"
                      : "bg-green-50"
                    : gameSettings.isDarkMode
                    ? "bg-gray-700"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{achievement.name}</h3>
                    <p className="text-sm opacity-75">
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.unlocked && (
                    <div className="text-green-500">
                      <Trophy className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowAchievements(true)}
        className="fixed bottom-4 right-4"
      >
        <Trophy className="w-5 h-5 mr-2" />
        Achievements
      </Button>

      <Toaster
        position="top-center"
        toastOptions={{
          className: gameSettings.isDarkMode ? "!bg-gray-800 !text-white" : "",
          duration: 2000,
        }}
      />
    </motion.div>
  );
};

export default FlagQuest;
