'use client';

import { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({ children, hover = false, padding = 'md', className = '', ...props }: CardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <motion.div
      className={`
        bg-white rounded-xl border border-gray-200 shadow-sm
        ${paddingClasses[padding]}
        ${hover ? 'cursor-pointer transition-shadow duration-200 hover:shadow-lg' : ''}
        ${className}
      `}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      {...(props as import('framer-motion').HTMLMotionProps<'div'>)}
    >
      {children}
    </motion.div>
  );
}

