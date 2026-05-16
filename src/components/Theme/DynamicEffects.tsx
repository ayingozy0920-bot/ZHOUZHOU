import React from 'react';
import { motion } from 'motion/react';

export function DynamicEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Starlight */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-1 h-1 bg-white rounded-full"
          initial={{ 
            top: -10, 
            left: `${Math.random() * 100}%`,
            opacity: 0 
          }}
          animate={{ 
            top: '110%', 
            opacity: [0, 0.5, 0] 
          }}
          transition={{ 
            duration: 10 + Math.random() * 10, 
            repeat: Infinity, 
            delay: Math.random() * 10 
          }}
        />
      ))}
      {/* Fireflies */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`firefly-${i}`}
          className="absolute w-1.5 h-1.5 bg-yellow-200 rounded-full blur-[1px]"
          initial={{ 
            top: `${Math.random() * 100}%`, 
            left: `${Math.random() * 100}%`,
            opacity: 0 
          }}
          animate={{ 
            opacity: [0, 0.8, 0],
            x: [0, Math.random() * 50 - 25, 0],
            y: [0, Math.random() * 50 - 25, 0]
          }}
          transition={{ 
            duration: 5 + Math.random() * 5, 
            repeat: Infinity, 
            delay: Math.random() * 5 
          }}
        />
      ))}
    </div>
  );
}
