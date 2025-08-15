"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface WordRotateProps {
  words: string[];
  duration?: number;
  framerProps?: any;
  className?: string;
}

export function WordRotate({
  words,
  duration = 2500,
  framerProps = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
  },
  className,
}: WordRotateProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [words, duration]);

  return (
    <div className="overflow-hidden py-2">
      <AnimatePresence mode="wait">
        <motion.h1
          key={words[index]}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={framerProps}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(className)}
        >
          {words[index]}
        </motion.h1>
      </AnimatePresence>
    </div>
  );
}