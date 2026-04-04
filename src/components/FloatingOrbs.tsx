import { motion } from 'framer-motion';

export const FloatingOrbs = () => {
  const orbs = [
    { size: 300, x: '10%', y: '20%', delay: 0, color: 'hsl(190, 100%, 50%)' },
    { size: 200, x: '70%', y: '60%', delay: 2, color: 'hsl(210, 100%, 60%)' },
    { size: 250, x: '80%', y: '10%', delay: 1, color: 'hsl(270, 80%, 50%)' },
    { size: 180, x: '20%', y: '70%', delay: 3, color: 'hsl(150, 80%, 40%)' },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color}20 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -20, 15, -10, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: orb.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
