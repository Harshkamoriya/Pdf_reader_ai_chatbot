"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "./ui/button";
import { cn } from "@/lib/utils"; // assuming you have shadcn cn helper

const HeroSection = () => {
  return (
    <section className="relative w-full min-h-screen flex flex-col lg:flex-row items-center justify-between overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-indigo-950/40 dark:to-purple-950/30 px-5 sm:px-8 md:px-12 lg:px-16 xl:px-24 py-12 lg:py-0">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-400/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-blue-400/15 to-indigo-400/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-r from-amber-300/10 to-rose-300/10 rounded-full blur-2xl animate-pulse-slow delay-2000" />
      </div>

      {/* Left – Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl gap-7 lg:gap-9"
      >
        {/* Optional small badge / tag */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40 shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
          AI-Powered • Real-Time Feedback
        </motion.div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
          <span className="text-gray-900 dark:text-white block">Master Your Next</span>
          <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Interview
          </span>
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-xl leading-relaxed font-light">
          Practice realistic AI interviews, get instant personalized feedback, and land your dream job — faster than ever.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-5 mt-4 sm:mt-8">
          <Link href="/dashboard">
            <Button
              size="lg"
              className={cn(
                "group relative overflow-hidden px-10 py-7 text-lg font-semibold rounded-xl",
                "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
                "shadow-lg shadow-indigo-500/30 hover:shadow-indigo-600/40 transition-all duration-300"
              )}
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Practicing Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-30 transition-opacity" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="lg"
            className="px-10 py-7 text-lg font-medium border-2 border-gray-300/70 dark:border-gray-700/70 hover:bg-gray-100/70 dark:hover:bg-gray-800/50 backdrop-blur-sm transition-all duration-300 rounded-xl"
          >
            Watch Demo
          </Button>
        </div>

        {/* Mini social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-600 dark:text-gray-400"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 border-2 border-white dark:border-gray-900" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white dark:border-gray-900" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 border-2 border-white dark:border-gray-900" />
            </div>
            <span><strong>2,400+</strong> interviews completed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★★★★★</span>
            <span>4.9 from 380+ users</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Right – Visual / Illustration */}
      <motion.div
        initial={{ opacity: 0, x: 80, scale: 0.92 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }}
        className="relative z-10 mt-12 lg:mt-0 lg:ml-8 xl:ml-16 max-w-md xl:max-w-lg"
      >
        {/* Glassmorphism card wrapper */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-white/20 dark:border-gray-700/30 backdrop-blur-sm bg-white/10 dark:bg-black/20">
          <Image
            src="/unnamed.jpg" // ← replace with better mockup / illustration if possible
            alt="AI Interview Simulation"
            width={600}
            height={600}
            priority
            className="w-full h-auto object-cover rounded-3xl"
          />

          {/* Overlay shine / gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Floating accent blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-purple-500/30 to-pink-500/20 rounded-full blur-2xl animate-pulse-slow" />
        <div className="absolute -bottom-10 -left-16 w-64 h-64 bg-gradient-to-tr from-indigo-500/25 to-blue-500/15 rounded-full blur-3xl animate-pulse-slow delay-1500" />
      </motion.div>
    </section>
  );
};

export default HeroSection;