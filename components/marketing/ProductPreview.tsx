'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Compass, Heart, Users } from 'lucide-react';

export default function ProductPreview() {
  return (
    <div className="relative w-full max-w-xl h-[420px] select-none">
      {/* Ambient gradient glow */}
      <div className="absolute -inset-10 bg-gradient-to-tr from-[#458B9E]/20 via-[#FFC93C]/10 to-transparent rounded-full blur-3xl" />

      {/* Feed card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: [0, -8, 0] }}
        transition={{ opacity: { duration: 0.6 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
        className="absolute left-0 top-6 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#458B9E]" />
          <div className="flex-1">
            <div className="h-2.5 w-24 bg-gray-200 rounded-full mb-1.5" />
            <div className="h-2 w-16 bg-gray-100 rounded-full" />
          </div>
          <span className="text-[10px] font-semibold text-[#458B9E] bg-[#458B9E]/10 px-2 py-0.5 rounded-full">
            Verified
          </span>
        </div>
        <div className="space-y-1.5 mb-3">
          <div className="h-2 w-full bg-gray-100 rounded-full" />
          <div className="h-2 w-5/6 bg-gray-100 rounded-full" />
        </div>
        <div className="flex items-center space-x-4 text-gray-400">
          <div className="flex items-center space-x-1">
            <Heart className="w-3.5 h-3.5" />
            <span className="text-xs">128</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-xs">24</span>
          </div>
        </div>
      </motion.div>

      {/* Chat card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ opacity: { duration: 0.6, delay: 0.15 }, y: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 } }}
        className="absolute right-0 top-32 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
      >
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-[#FFC93C] flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-[#333333]" />
          </div>
          <div className="h-2.5 w-20 bg-gray-200 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="ml-auto w-32 bg-[#458B9E] text-white text-[11px] rounded-2xl rounded-tr-sm px-3 py-2">
            Let&apos;s collaborate
          </div>
          <div className="w-28 bg-gray-100 text-[11px] rounded-2xl rounded-tl-sm px-3 py-2 text-gray-500">
            Sounds great!
          </div>
        </div>
      </motion.div>

      {/* Compass community badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
        transition={{ opacity: { duration: 0.6, delay: 0.3 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
        className="absolute left-16 bottom-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#458B9E] to-[#3a7585] flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="h-2.5 w-28 bg-gray-200 rounded-full mb-1.5" />
            <div className="flex items-center space-x-1 text-gray-400">
              <Users className="w-3 h-3" />
              <span className="text-[10px]">2,340 members</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
