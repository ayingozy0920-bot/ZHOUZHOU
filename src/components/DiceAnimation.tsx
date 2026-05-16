import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export const DiceAnimation = ({ value, onComplete }: { value: number, onComplete: () => void }) => {
  const [displayValue, setDisplayValue] = useState(1);
  const [isRolling, setIsRolling] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRolling) {
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 100);
      setTimeout(() => {
        setIsRolling(false);
        setDisplayValue(value);
        onComplete();
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isRolling, value, onComplete]);

  const dots = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      className="w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-200 grid grid-cols-3 gap-1 p-1.5"
    >
      {[...Array(9)].map((_, i) => (
        <div key={i} className={`rounded-full ${dots[displayValue as keyof typeof dots]?.includes(i) ? 'bg-slate-800' : 'bg-transparent'}`} />
      ))}
    </motion.div>
  );
};
