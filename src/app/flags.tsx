import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import confetti from "canvas-confetti";

interface Country {
  name: string;
  flag: string;
  capital: string;
  continent: string;
  subregion: string;
}

interface FlagSelectionProps {
  options: Country[];
  currentQuestion: Country;
  onAnswer: (country: Country) => void;
  selectedAnswer: Country | null;
  isDarkMode: boolean;
  showHint: boolean;
  onShowHint: () => void;
}

const FlagSelection: React.FC<FlagSelectionProps> = ({
  options,
  currentQuestion,
  onAnswer,
  selectedAnswer,
  isDarkMode,
  showHint,
  onShowHint,
}) => {
  const handleCorrectAnswer = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <>
      <div className="text-center mb-8">
        <h2
          className={`text-xl ${
            isDarkMode ? "text-gray-200" : "text-gray-700"
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
          >
            <motion.button
              className={`w-full aspect-[3/2] p-2 rounded-lg border-2 transition-colors duration-300 overflow-hidden ${
                selectedAnswer === country
                  ? country === currentQuestion
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                  : isDarkMode
                  ? "border-gray-600 hover:border-blue-400"
                  : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => {
                onAnswer(country);
                if (country === currentQuestion) {
                  handleCorrectAnswer();
                }
              }}
              animate={
                selectedAnswer === country && country !== currentQuestion
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
                width={500}
                height={300}
              />
            </motion.button>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-4 p-3 rounded-lg ${
              isDarkMode ? "bg-gray-700" : "bg-blue-50"
            }`}
          >
            <p className={isDarkMode ? "text-blue-300" : "text-blue-800"}>
              Capital: {currentQuestion?.capital}
            </p>
            <p className={isDarkMode ? "text-blue-300" : "text-blue-800"}>
              Continent: {currentQuestion?.continent}
            </p>
            <p className={isDarkMode ? "text-blue-300" : "text-blue-800"}>
              Subregion: {currentQuestion?.subregion}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex justify-center mt-4">
        <Button
          variant="ghost"
          size="sm"
          className={
            isDarkMode
              ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
              : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          }
          onClick={onShowHint}
        >
          <Info className="w-4 h-4 mr-2" />
          Show Hint
        </Button>
      </div>
    </>
  );
};

export default FlagSelection;
