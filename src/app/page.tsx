"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Globe, Info, Sun, Moon } from "lucide-react";
import Image from "next/image";

const FlagQuest = () => {
  const [gameSettings, setGameSettings] = useState({
    timeLimit: 120,
    selectedRegion: null,
    isDarkMode: false,
  });

  const [gameState, setGameState] = useState({
    phase: "setup",
    score: 0,
    timeRemaining: 120,
    showHint: false,
    isCorrect: null,
    selectedAnswer: null,
  });

  const [countryData, setCountryData] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);

  const regions = {
    World: null,
    Africa: "Africa",
    Asia: "Asia",
    Europe: "Europe",
    "North America": "North America",
    "South America": "South America",
    Oceania: "Oceania",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/countries.json");
        const data = await response.json();
        setCountryData(data);
      } catch (error) {
        console.error("Error loading country data:", error);
      }
    };
    fetchData();
  }, []);

  const getRandomCountries = useCallback(
    (region, count) => {
      const filteredCountries = region
        ? countryData.filter((c) => c.continent === region)
        : countryData;
      return [...filteredCountries]
        .sort(() => Math.random() - 0.5)
        .slice(0, count);
    },
    [countryData]
  );

  const setupQuestion = useCallback(() => {
    const questionCountries = getRandomCountries(
      gameSettings.selectedRegion,
      4
    );
    const correctAnswer = questionCountries[0];
    setCurrentQuestion(correctAnswer);
    setOptions(questionCountries.sort(() => Math.random() - 0.5));
    setGameState((prev) => ({
      ...prev,
      showHint: false,
      isCorrect: null,
      selectedAnswer: null,
    }));
  }, [gameSettings.selectedRegion, getRandomCountries]);

  const startGame = useCallback(
    (region, time) => {
      setGameSettings((prev) => ({
        ...prev,
        selectedRegion: region,
        timeLimit: time,
      }));
      setGameState((prev) => ({
        ...prev,
        phase: "playing",
        score: 0,
        timeRemaining: time,
      }));
      setupQuestion();
    },
    [setupQuestion]
  );

  const handleAnswer = useCallback(
    (country) => {
      if (gameState.selectedAnswer !== null) return;

      const correct = country.name === currentQuestion.name;
      setGameState((prev) => ({
        ...prev,
        selectedAnswer: country,
        isCorrect: correct,
        score: correct ? prev.score + 1 : prev.score,
      }));
      setTimeout(setupQuestion, 1500);
    },
    [currentQuestion, gameState.selectedAnswer, setupQuestion]
  );

  useEffect(() => {
    if (gameState.phase !== "playing") return;
    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeRemaining <= 1) {
          return { ...prev, phase: "gameover", timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState.phase]);

  const toggleDarkMode = () => {
    setGameSettings((prev) => ({
      ...prev,
      isDarkMode: !prev.isDarkMode,
    }));
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
        FlagQuest
      </h1>
      <Button variant="ghost" onClick={toggleDarkMode} size="icon">
        {gameSettings.isDarkMode ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>
    </div>
  );

  const renderGameMetrics = () => (
    <div className="space-y-2 mb-6">
      <div className="flex justify-between items-center">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            gameSettings.isDarkMode ? "bg-gray-700" : "bg-green-50"
          }`}
        >
          <Globe
            className={
              gameSettings.isDarkMode ? "text-green-400" : "text-green-600"
            }
          />
          <span className="font-medium">Score: {gameState.score}</span>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            gameSettings.isDarkMode ? "bg-gray-700" : "bg-blue-50"
          }`}
        >
          <Clock
            className={
              gameSettings.isDarkMode ? "text-blue-400" : "text-blue-600"
            }
          />
          <span className="font-medium">
            {Math.floor(gameState.timeRemaining / 60)}:
            {(gameState.timeRemaining % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>
      <Progress
        value={(gameState.timeRemaining / gameSettings.timeLimit) * 100}
        className="h-2"
      />
    </div>
  );

  const mainCardClass = `p-6 shadow-lg ${
    gameSettings.isDarkMode
      ? "bg-gray-800 text-white"
      : "bg-gradient-to-br from-white to-gray-50"
  }`;

  const renderGameContent = () => {
    switch (gameState.phase) {
      case "setup":
        return (
          <Card className={mainCardClass}>
            {renderHeader()}
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
                        onClick={() => startGame(value, gameSettings.timeLimit)}
                      >
                        {name}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Select Time Limit
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { time: 120, label: "2 Minutes" },
                    { time: 300, label: "5 Minutes" },
                  ].map(({ time, label }) => (
                    <motion.div
                      key={time}
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
                          setGameSettings((prev) => ({
                            ...prev,
                            timeLimit: time,
                          }))
                        }
                      >
                        {label}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        );

      case "playing":
        return (
          <Card className={mainCardClass}>
            {renderHeader()}
            {renderGameMetrics()}

            <div className="text-center mb-8">
              <h2
                className={`text-xl ${
                  gameSettings.isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Which flag belongs to
              </h2>
              <p className="text-2xl font-bold mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {currentQuestion?.name}?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {options.map((country) => (
                <motion.div
                  key={country.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={
                    gameState.selectedAnswer === country
                      ? { scale: [1, 1.05, 1], transition: { duration: 0.3 } }
                      : {}
                  }
                >
                  <motion.button
                    className={`w-full aspect-[3/2] p-2 rounded-lg border-2 transition-colors duration-300 overflow-hidden ${
                      gameState.selectedAnswer === country
                        ? country === currentQuestion
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"
                        : gameSettings.isDarkMode
                        ? "border-gray-600 hover:border-blue-400"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => handleAnswer(country)}
                    animate={
                      gameState.selectedAnswer === country &&
                      country !== currentQuestion
                        ? {
                            x: [-15, 15, -15, 15, -15, 15, -15, 15, -15, 15, 0],
                          }
                        : {}
                    }
                    transition={{ duration: 1.2, ease: "linear" }}
                  >
                    <Image
                      src={country.flag}
                      alt={`Flag of ${country.name}`}
                      className="w-full h-full object-cover rounded"
                      width={500} // Set appropriate width
                      height={300} // Set appropriate height
                    />
                  </motion.button>
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {gameState.showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mt-4 p-3 rounded-lg ${
                    gameSettings.isDarkMode ? "bg-gray-700" : "bg-blue-50"
                  }`}
                >
                  <p
                    className={
                      gameSettings.isDarkMode
                        ? "text-blue-300"
                        : "text-blue-800"
                    }
                  >
                    Capital: {currentQuestion?.capital}
                  </p>
                  <p
                    className={
                      gameSettings.isDarkMode
                        ? "text-blue-300"
                        : "text-blue-800"
                    }
                  >
                    Continent: {currentQuestion?.continent}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center mt-4">
              <Button
                variant="ghost"
                size="sm"
                className={
                  gameSettings.isDarkMode
                    ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                    : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                }
                onClick={() =>
                  setGameState((prev) => ({ ...prev, showHint: true }))
                }
              >
                <Info className="w-4 h-4 mr-2" />
                Show Hint
              </Button>
            </div>
          </Card>
        );

      case "gameover":
        return (
          <Card className={mainCardClass}>
            {renderHeader()}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                Game Over!
              </h2>
              <p className="text-xl mb-6">Final Score: {gameState.score}</p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex justify-center"
              >
                <Button
                  onClick={() =>
                    setGameState((prev) => ({ ...prev, phase: "setup" }))
                  }
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  Play Again
                </Button>
              </motion.div>
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
        gameSettings.isDarkMode ? "bg-gray-900" : "bg-white"
      }`}
    >
      {renderGameContent()}
    </motion.div>
  );
};

export default FlagQuest;
