import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedAppearProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
}

// Map direction to initial state
const directionMap = {
  up: { y: 20, x: 0 },
  down: { y: -20, x: 0 },
  left: { x: 20, y: 0 },
  right: { x: -20, y: 0 },
  none: { x: 0, y: 0 },
};

export function AnimatedAppear({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 0.5,
}: AnimatedAppearProps) {
  const initialProps = directionMap[direction];

  return (
    <motion.div
      initial={{ 
        opacity: 0,
        ...initialProps
      }}
      animate={{ 
        opacity: 1,
        x: 0,
        y: 0
      }}
      transition={{ 
        duration: duration,
        delay: delay, 
        ease: "easeOut"
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}