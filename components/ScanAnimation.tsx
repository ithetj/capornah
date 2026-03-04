'use client';

import { motion } from 'framer-motion';

export default function ScanAnimation() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Magnifying Glass Animation */}
      <motion.div
        animate={{
          rotate: [0, 10, -10, 10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-9xl mb-8"
      >
        🔍
      </motion.div>

      {/* Text */}
      <h2 className="text-3xl font-bold text-white mb-6">
        Analyzing the vibes...
      </h2>

      {/* Dots Animation */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
          />
        ))}
      </div>
    </div>
  );
}