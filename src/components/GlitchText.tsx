import { motion } from 'framer-motion';

interface GlitchTextProps {
  text: string;
  className?: string;
}

export const GlitchText = ({ text, className = '' }: GlitchTextProps) => {
  return (
    <motion.div
      className={`relative inline-block ${className}`}
      whileHover="glitch"
    >
      <span className="relative z-10">{text}</span>
      <motion.span
        className="absolute inset-0 text-primary opacity-0"
        style={{ clipPath: 'inset(20% 0 30% 0)' }}
        variants={{
          glitch: {
            opacity: [0, 0.8, 0, 0.6, 0],
            x: [-2, 3, -1, 2, 0],
            transition: { duration: 0.3, repeat: Infinity },
          },
        }}
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute inset-0 text-[hsl(var(--success))] opacity-0"
        style={{ clipPath: 'inset(60% 0 10% 0)' }}
        variants={{
          glitch: {
            opacity: [0, 0.6, 0, 0.8, 0],
            x: [2, -3, 1, -2, 0],
            transition: { duration: 0.3, repeat: Infinity, delay: 0.05 },
          },
        }}
      >
        {text}
      </motion.span>
    </motion.div>
  );
};
