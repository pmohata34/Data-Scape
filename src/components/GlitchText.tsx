import { useState } from 'react';
import { motion } from 'framer-motion';

interface GlitchTextProps {
  text: string;
  className?: string;
}

export const GlitchText = ({ text, className = '' }: GlitchTextProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <span className={`relative z-10 block ${isHovered ? '' : 'text-primary'}`}>{text}</span>

      {isHovered && (
        <>
          <motion.span
            className="absolute inset-0 pointer-events-none text-primary"
            style={{ clipPath: 'inset(20% 0 30% 0)' }}
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: [0, 0.8, 0, 0.6, 0], x: [-2, 3, -1, 2, 0] }}
            transition={{ duration: 0.3, repeat: Infinity }}
            aria-hidden="true"
          >
            {text}
          </motion.span>
          <motion.span
            className="absolute inset-0 pointer-events-none text-[hsl(var(--success))]"
            style={{ clipPath: 'inset(60% 0 10% 0)' }}
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: [0, 0.6, 0, 0.8, 0], x: [2, -3, 1, -2, 0] }}
            transition={{ duration: 0.3, repeat: Infinity, delay: 0.05 }}
            aria-hidden="true"
          >
            {text}
          </motion.span>
        </>
      )}
    </motion.div>
  );
};
