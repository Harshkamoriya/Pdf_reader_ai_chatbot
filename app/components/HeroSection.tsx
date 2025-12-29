"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import { Button } from "./ui/button";
const Herosection = () => {

   
    
    return (
    <section className="relative w-full min-h-screen flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 lg:px-20 py-4 overflow-hidden bg-gradient-to-b from-amber-50 to-white dark:from-zinc-900 dark:to-black lg:py-4">
      {/* ==== Left Section ==== */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col gap-6 text-center justify-center lg:text-left max-w-xl z-10"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-800 dark:text-white leading-tight">
          Welcome to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
            Intervu.Ai
          </span>
        </h1>

        <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl leading-relaxed">
          Your intelligent virtual interviewer — powered by AI.  
          Practice, prepare, and perfect your interview skills like never before.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-4">
        <Link href="/dashboard">
        
          <Button   className=" cursor-pointer px-8 py-6 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-all">
            Get Started
          </Button>
        </Link>
          <Button
            variant="outline"
            className="px-8 py-6 text-lg font-medium border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            Learn More
          </Button>
        </div>
      </motion.div>

      {/* ==== Right Section (Image/Illustration) ==== */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="relative mt-10 lg:mt-0"
      >
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-pink-400/20 blur-3xl rounded-full animate-pulse" />
        <Image
          src="/unnamed.jpg"
          alt="AI Interview Illustration"
          width={500}
          height={500}
          className="relative z-10 drop-shadow-2xl rounded-2xl"
        />
      </motion.div>
      {/* Background Accent Circles */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-400/10 blur-3xl rounded-full animate-pulse" />
    </section>
  );
};

export default Herosection;
